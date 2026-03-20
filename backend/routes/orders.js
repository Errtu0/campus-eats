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

// Get all menu items from database
router.get('/menu-items', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;