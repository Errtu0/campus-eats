const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Staff marks table as 'CLEANING' (Guests have left)
router.patch('/mark-for-cleaning', async (req, res) => {
  const { tableId } = req.body;

  try {
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status: 'CLEANING' }
    });

    // Also deactivate the session so no more items can be added
    await prisma.session.updateMany({
      where: { table_id: tableId, is_active: true },
      data: { is_active: false, end_time: new Date() }
    });

    res.json({ message: "Table is now being cleaned", updatedTable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Staff marks table as 'EMPTY' (Cleaning finished)
router.patch('/set-empty', async (req, res) => {
  const { tableId } = req.body;

  try {
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status: 'EMPTY' }
    });

    res.json({ message: "Table is now free for new guests", updatedTable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Order Status (Preparing -> Ready)
router.patch('/order-ready', async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY' }
    });

    // In a later step, we will trigger the Expo Push Notification here
    console.log(`Notification: Order #${orderId} is ready for pickup!`);
    
    res.json({ message: "Order marked as ready", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Inventory (Add/Remove Stock)
router.patch('/update-stock', async (req, res) => {
  const { menuItemId, newQuantity } = req.body;

  try {
    const item = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { stock_quantity: newQuantity }
    });

    res.json({ message: "Inventory updated", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;