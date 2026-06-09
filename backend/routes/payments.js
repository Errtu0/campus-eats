const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middleware/authMiddleware');

require('dotenv').config(); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.use(verifyToken);

// 1. Create Payment Intent
router.post('/create-payment-intent', async (req, res) => {
  const { selectedItemIds, couponId } = req.body; 
  
  if (!selectedItemIds || !Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
    return res.status(400).json({ error: "No items selected for split calculation." });
  }
  
  try {
    // Count exact occurrences of each unique OrderItem ID in the selection request array
    const idCounts = {};
    selectedItemIds.forEach(id => {
      idCounts[id] = (idCounts[id] || 0) + 1;
    });

    const uniqueIds = Object.keys(idCounts).map(id => parseInt(id));

    const orderItems = await prisma.orderItem.findMany({
      where: { id: { in: uniqueIds } },
      include: { item: true }
    });

    // Calculate total based strictly on the split unit multipliers selected
    let totalAmount = 0;
    orderItems.forEach(oi => {
      const selectedQty = idCounts[oi.id];
      totalAmount += (oi.item.price * selectedQty);
    });

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: parseInt(couponId) } });
      if (coupon && coupon.is_active) {
        // 🚀 CRITICAL CHECK: Block generation if usage limit cap has already been reached
        if (coupon.current_usage >= coupon.usage_limit) {
          return res.status(400).json({ error: "This promo code cap has reached its use limit boundary." });
        }
        totalAmount = totalAmount * (1 - (coupon.discount_value / 100));
      }
    }

    const potentialPoints = Math.floor(totalAmount * 10);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), 
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { 
        userId: req.user.id.toString(),
        pointsToEarn: potentialPoints.toString() 
      }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      total: Number(totalAmount.toFixed(2)),
      pointsToEarn: potentialPoints 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Confirm Payment, Structural Quantity Splitting, Inventory Sync, & Loyalty Points
router.post('/confirm-payment', async (req, res) => {
  const { orderId, selectedItemIds, couponId } = req.body;
  const userId = req.user.id; 

  if (!selectedItemIds || !Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
    return res.status(400).json({ error: "No items selected." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Group incoming selection array records to catch unit count occurrences
      const idCounts = {};
      selectedItemIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });

      const uniqueIds = Object.keys(idCounts).map(id => parseInt(id));
      const orderItems = await tx.orderItem.findMany({
        where: { id: { in: uniqueIds } },
        include: { item: { include: { ingredients: true } } }
      });

      let finalAmount = 0;
      
      // CRITICAL QUANTITY ISOLATION & ROW SPLITTING ALGORITHM
      for (const oi of orderItems) {
        const selectedQty = idCounts[oi.id];
        finalAmount += (oi.item.price * selectedQty);

        if (selectedQty < oi.quantity) {
          // A: PARTIAL SPLIT ACTION - Clone a clean unpaid mirror record row for unselected units
          const remainingQty = oi.quantity - selectedQty;
          
          await tx.orderItem.create({
            data: {
              order_id: oi.order_id,
              item_id: oi.item_id, // Preserves matching schema relation keys completely
              quantity: remainingQty,
              customization: oi.customization,
              status: 'PENDING'
            }
          });

          // Downsize the original record row row to match the exact units covered right now
          await tx.orderItem.update({
            where: { id: oi.id },
            data: {
              quantity: selectedQty,
              paid_by_user_id: userId,
              status: 'PAID'
            }
          });
        } else {
          // B: FULL BATCH COVERAGE ACTION - Mark whole record row row as fully paid out
          await tx.orderItem.update({
            where: { id: oi.id },
            data: { 
              paid_by_user_id: userId,
              status: 'PAID'
            }
          });
        }

        // C: DEDUCT KITCHEN INVENTORY FOR UNITS COVERED ONLY
        for (const recipeLine of oi.item.ingredients) {
          const amountToSubtract = recipeLine.quantityUsed * selectedQty;
          await tx.inventoryItem.update({
            where: { id: recipeLine.inventoryId },
            data: { amount: { decrement: amountToSubtract } }
          });
        }
      }

      if (couponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: parseInt(couponId) } });
        if (coupon && coupon.is_active) {
          // 🚀 DOUBLE-CHECK INSIDE TRANSACTION BOUNDARY TO PREVENT TIMING VULNERABILITY CONCURRENCY TRICKS
          if (coupon.current_usage >= coupon.usage_limit) {
            throw new Error("This coupon usage limit has run out during transaction processing.");
          }

          finalAmount = finalAmount * (1 - (coupon.discount_value / 100));
          await tx.order.update({
            where: { id: parseInt(orderId) },
            data: { coupon_id: parseInt(couponId) }
          });

          // 🚀 FIX: INCREMENT CURRENT USAGE BY 1 UPON SECURE PAYOUT CONFIRMATION SUCCESS
          await tx.coupon.update({
            where: { id: parseInt(couponId) },
            data: { current_usage: { increment: 1 } }
          });
        }
      }

      const pointsEarned = Math.floor(finalAmount * 10);

      // Award matching loyalty points directly to the active user
      await tx.user.update({
        where: { id: userId },
        data: { membership_points: { increment: pointsEarned } }
      });
    });

    if (req.io) {
      req.io.emit('NEW_PAID_ORDER', {
        message: `Table Order Split-Paid!`,
        orderId: orderId
      });
    }

    res.json({ success: true, message: "Portion checkout processed. Remaining units split for table friends." });
  } catch (error) {
    console.error("Payment Confirmation Error:", error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

module.exports = router;