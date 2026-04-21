const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Add Item to Table Order
router.post('/add-item', async (req, res) => {
  const { sessionId, menuItemId, quantity, userId } = req.body;

  try {
    // We check if an 'OPEN' order exists for this session, if not, create one
    let order = await prisma.order.findFirst({
      where: { session_id: sessionId, status: 'PENDING' }
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          session_id: sessionId,
          customer_id: userId, // Initial creator
          restaurant_id: 1,    // This should be dynamic based on the table
          status: 'PENDING'
        }
      });
    }

    // Add the specific item to the order
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: order.id,
        item_id: menuItemId,
        quantity: quantity || 1
      }
    });

    res.json({ message: "Item added to cart", orderItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. The Selection Tool (Claiming an item to pay)
router.patch('/claim-item', async (req, res) => {
  const { orderItemId, userId } = req.body;

  try {
    const updatedItem = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { paid_by_user_id: userId }
    });

    res.json({ message: "Item claimed for payment", updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Active Session Cart (What everyone sees on their phone)
router.get('/session-cart/:sessionId', async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany({
      where: { 
        order: { session_id: parseInt(req.params.sessionId) } 
      },
      include: { 
        item: true,
        paid_by: { select: { username: true } } // See who paid what
      }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/menu-items', async (req, res) => {
  // Extract from query string
  const rId = parseInt(req.query.restaurantId);

  // If rId is not a valid number, stop here!
  if (!rId || isNaN(rId)) {
    return res.status(400).json({ error: "Valid restaurantId is required" });
  }

  try {
    const items = await prisma.menuItem.findMany({
      where: {
        restaurant_id: rId
      }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-history/:userId', async (req, res) => {
  const { userId } = req.params;
  const restaurantId = parseInt(req.query.restaurantId);

  try {
    const history = await prisma.orderItem.findMany({
      where: {
        order: {
          customer_id: parseInt(userId),
          restaurant_id: restaurantId,
        },
        status: { in: ['PAID', 'READY', 'SERVED'] } 
      },
      include: { 
        item: true,
        order: true // Include parent order to access its date if needed
      },
      orderBy: {
        id: 'desc' // Use id since created_at doesn't exist on OrderItem
      }
    });

    const uniqueItems = [];
    const seen = new Set();

    for (const record of history) {
      // Safety check: make sure record.item exists
      if (record.item && !seen.has(record.item_id)) {
        seen.add(record.item_id);
        uniqueItems.push({
          id: record.item.id,
          name: record.item.name,
          price: record.item.price,
          // Use the date from the parent Order
          lastDate: record.order.created_at 
        });
      }
    }

    res.json(uniqueItems);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;