const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middleware/authMiddleware');

// PROTECT ALL ORDER ROUTES
router.use(verifyToken);

// 1. Add Item to Table Order (Securely Tracks Multipliers, Specifications & Creator Identities)
router.post('/add-item', async (req, res) => {
  const { sessionId, menuItemId, quantity, customization } = req.body;
  const userId = req.user.id; 

  try {
    // Check if an 'OPEN' pending order framework exists for this session
    let order = await prisma.order.findFirst({
      where: { session_id: parseInt(sessionId), status: 'PENDING' }
    });

    if (!order) {
      const activeSession = await prisma.session.findUnique({
        where: { id: parseInt(sessionId) },
        include: { table: true }
      });

      if (!activeSession || !activeSession.is_active) {
        return res.status(404).json({ error: "No active session found." });
      }

      order = await prisma.order.create({
        data: {
          session_id: parseInt(sessionId),
          customer_id: userId,
          restaurant_id: activeSession.table.restaurant_id,
          status: 'PENDING'
        }
      });
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: order.id,
        item_id: parseInt(menuItemId),
        quantity: quantity ? parseInt(quantity) : 1,
        customization: customization || null,
        status: 'PENDING',
        // 🚀 FIX: Automatically link the student who is customizing/adding this item
        created_by_user_id: userId
      }
    });

    res.json({ message: "Item added to cart successfully", orderItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Claim an item (Prevents claiming already claimed items)
router.patch('/claim-item', async (req, res) => {
  const { orderItemId } = req.body;
  const userId = req.user.id;

  try {
    const existingItem = await prisma.orderItem.findUnique({
      where: { id: parseInt(orderItemId) }
    });

    if (!existingItem) return res.status(404).json({ error: "Item record missing." });

    if (existingItem.paid_by_user_id && existingItem.paid_by_user_id !== userId) {
      return res.status(400).json({ error: "This item is already being paid for by someone else!" });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: parseInt(orderItemId) },
      data: { paid_by_user_id: userId }
    });

    res.json({ message: "Item claimed", updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Session Cart (Synchronized to read structural item relations & creator details dynamically)
router.get('/session-cart/:sessionId', async (req, res) => {
  try {
    const sId = parseInt(req.params.sessionId);
    
    const items = await prisma.orderItem.findMany({
      where: { 
        order: { session_id: sId } 
      },
      include: { 
        item: true,
        paid_by: { select: { username: true } },
        // 🚀 FIX: Include the creator's username to show "Added by: ..." on user screen layouts
        created_by: { select: { username: true } }
      },
      orderBy: { id: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Scoped Menu Items (Upgraded with Automated Real-Time Availability Screening Checks)
router.get('/menu-items', async (req, res) => {
  const rId = req.query.restaurantId;
  if (!rId) return res.status(400).json({ error: "restaurantId required" });

  try {
    const items = await prisma.menuItem.findMany({
      where: {
        restaurant_id: parseInt(rId)
      },
      include: {
        ingredients: {
          include: {
            inventory: true
          }
        }
      }
    });

    const availableItems = items.filter(menuItem => {
      if (!menuItem.ingredients || menuItem.ingredients.length === 0) return true;

      const isOutOfStock = menuItem.ingredients.some(recipeLine => {
        const activeStock = recipeLine.inventory ? recipeLine.inventory.amount : 0;
        return activeStock < recipeLine.quantityUsed;
      });

      return !isOutOfStock;
    });

    res.json(availableItems);
  } catch (error) {
    console.error("Automated Inventory Shield Processing Exception:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Secure History (Filter by Token User ID)
router.get('/user-history', async (req, res) => {
  const userId = req.user.id; 
  const rId = parseInt(req.query.restaurantId);

  try {
    const history = await prisma.orderItem.findMany({
      where: {
        paid_by_user_id: userId,
        status: { in: ['PAID', 'READY', 'SERVED'] },
        order: rId ? { restaurant_id: rId } : undefined
      },
      include: { item: true, order: true },
      orderBy: { id: 'desc' }
    });

    const uniqueItems = Array.from(new Set(history.map(h => h.item_id)))
      .map(id => {
        const record = history.find(h => h.item_id === id);
        return {
          id: record.item.id,
          name: record.item.name,
          price: record.item.price,
          lastDate: record.order.created_at
        };
      });

    res.json(uniqueItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚀 INJECTED COUPON VERIFICATION PIPELINE FOR ALL ACTIVE TABLE CLIENTS
router.post('/coupons/verify', async (req, res) => {
  const { code, restaurantId, currentSubtotal } = req.body;
  try {
    if (!code || !restaurantId) return res.status(200).json({ valid: false, error: "MISSING_DATA" });

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        restaurant_id: parseInt(restaurantId),
        is_active: true
      }
    });

    if (!coupon) return res.status(200).json({ valid: false, error: "NOT_FOUND" });

    if (coupon.current_usage >= coupon.usage_limit) {
      return res.status(200).json({ valid: false, error: "LIMIT_REACHED" });
    }

    if (currentSubtotal && parseFloat(currentSubtotal) < coupon.min_cart_limit) {
      return res.status(200).json({ 
        valid: false, 
        error: "MIN_LIMIT_NOT_MET", 
        minLimit: coupon.min_cart_limit 
      });
    }

    res.json({ valid: true, coupon });
  } catch (error) {
    console.error("Coupon Verification Error inside Orders Route:", error);
    res.status(200).json({ valid: false, error: "SYSTEM_ERROR" });
  }
});

module.exports = router;