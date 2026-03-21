const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/dashboard-data', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({ orderBy: { id: 'asc' } });
    const pendingOrders = await prisma.orderItem.findMany({
      where: {
        paid_by_user_id: { not: null },
        status: { not: 'SERVED' }
      },
      include: {
        item: true,
        order: { include: { session: { select: { table_id: true } } } }
      },
      orderBy: { id: 'asc' }
    });
    res.json({ tables, pendingOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/table-details/:tableId', async (req, res) => {
  try {
    const tableId = parseInt(req.params.tableId);
    
    // 1. Find the active session
    const session = await prisma.session.findFirst({
      where: { table_id: tableId, is_active: true },
    });

    if (!session) {
      return res.json({ active: false, message: "No active session." });
    }

    // 2. Fetch EVERY item belonging to this session's orders
    const allItems = await prisma.orderItem.findMany({
      where: {
        order: {
          session_id: session.id
        }
      },
      include: {
        item: true,
        paid_by: { select: { username: true } }
      },
      orderBy: { id: 'asc' }
    });

    // 3. Logic for "Can we Clear?"
    // Table can be cleared ONLY if there are items AND all are paid.
    const unpaidItems = allItems.filter(i => !i.paid_by_user_id);
    const canClear = allItems.length > 0 && unpaidItems.length === 0;

    res.json({
      active: true,
      sessionCode: session.join_code,
      items: allItems, // This will now include SERVED, READY, etc.
      canClear: canClear,
      unpaidCount: unpaidItems.length
    });
  } catch (error) {
    console.error("Table Details Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/table-status', async (req, res) => {
  const { tableId, status } = req.body;
  try {
    await prisma.table.update({
      where: { id: parseInt(tableId) },
      data: { status: status }
    });

    if (status === 'CLEANING' || status === 'EMPTY') {
      await prisma.session.updateMany({
        where: { table_id: parseInt(tableId), is_active: true },
        data: { is_active: false, end_time: new Date() }
      });
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Update Order Status
router.patch('/order-ready', async (req, res) => {
  const { orderItemId } = req.body;
  try {
    const item = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: 'READY' }
    });
    res.json(item);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/order-served', async (req, res) => {
  const { orderItemId } = req.body;
  try {
    const item = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: 'SERVED' }
    });
    res.json(item);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;