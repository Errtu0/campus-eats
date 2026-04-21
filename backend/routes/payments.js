const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config(); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
 try {
  const { amount } = req.body; 
  const paymentIntent = await stripe.paymentIntents.create({
   amount: Math.round(amount * 100), 
   currency: 'usd',
   automatic_payment_methods: { enabled: true },
  });
  res.json({ clientSecret: paymentIntent.client_secret });
 } catch (e) {
  res.status(500).json({ error: e.message });
 }
});

router.post('/confirm-payment', async (req, res) => {
  // Added couponId to destructuring
 const { orderId, userId, selectedItemIds, couponId } = req.body;
 
 console.log("Incoming Data:", { orderId, userId, selectedItemIds, couponId });

 if (!selectedItemIds || !Array.isArray(selectedItemIds)) {
  return res.status(400).json({ error: "No items selected for payment confirmation." });
 }

 try {
    // 0. Update the Order with the Coupon ID if provided
    if (couponId) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { coupon_id: parseInt(couponId) }
      });
    }

  // 1. Update ONLY the selected items to be marked as PAID
  await prisma.orderItem.updateMany({
   where: {
    id: { in: selectedItemIds.map(id => parseInt(id)) }
   },
   data: {
    paid_by_user_id: userId,
    status: 'PAID'
   }
  });

  // 2. Fetch only the items that were just paid to calculate deduction
  const paidItems = await prisma.orderItem.findMany({
   where: {
    id: { in: selectedItemIds.map(id => parseInt(id)) }
   },
   include: {
    item: {
     include: { ingredients: true }
    }
   }
  });

  // 3. Deduction Loop
  for (const orderItem of paidItems) {
   for (const recipeLine of orderItem.item.ingredients) {
    const amountToSubtract = recipeLine.quantityUsed * orderItem.quantity;
    
    await prisma.inventoryItem.update({
     where: { id: recipeLine.inventoryId },
     data: {
      amount: { decrement: amountToSubtract }
     }
    });
   }
  }

  if (req.io) {
   req.io.emit('NEW_PAID_ORDER', {
    message: `New payment for Order #${orderId}`,
    orderId: orderId
   });
  }

  res.json({ success: true, message: "Inventory updated and staff notified." });
 } catch (error) {
  console.error("❌ Brain Error:", error.message);
  res.status(500).json({ error: error.message });
 }
});

router.get('/test-ping', (req, res) => {
 if (req.io) {
  req.io.emit('NEW_PAID_ORDER', {
   message: "🔥 TEST NOTIFICATION: Someone paid!",
   orderId: 999
  });
  return res.json({ success: true, message: "Ping sent to all staff!" });
 }
 res.status(500).json({ error: "Socket not initialized" });
});
module.exports = router;