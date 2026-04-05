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
    const session = await prisma.session.findFirst({
      where: { table_id: tableId, is_active: true },
    });

    if (!session) return res.json({ active: false, message: "No active session." });

    const allItems = await prisma.orderItem.findMany({
      where: { order: { session_id: session.id } },
      include: { item: true, paid_by: { select: { username: true } } },
      orderBy: { id: 'asc' }
    });

    const unpaidItems = allItems.filter(i => !i.paid_by_user_id);
    const canClear = allItems.length > 0 && unpaidItems.length === 0;

    res.json({
      active: true,
      sessionCode: session.join_code,
      items: allItems,
      canClear: canClear,
      unpaidCount: unpaidItems.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRITICAL UPDATE: Table Clearing + Density Logging
router.patch('/table-status', async (req, res) => {
  const { tableId, status } = req.body;
  try {
    const tId = parseInt(tableId);

    // 1. If we are clearing a table, handle Density Logs and Occupancy
    if (status === 'EMPTY' || status === 'CLEANING') {
      const activeSession = await prisma.session.findFirst({
        where: { table_id: tId, is_active: true },
        include: { table: true }
      });

      if (activeSession) {
        // Fetch current occupancy for the snapshot
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: activeSession.table.restaurant_id }
        });

        // Create Density Log Snapshot
        await prisma.densityLog.create({
          data: {
            restaurant_id: activeSession.table.restaurant_id,
            peak_occupancy: restaurant.current_occupancy,
          }
        });

        // Decrement building occupancy (assuming 1 session = 1 or more people)
        // You can fine-tune this to decrement by the specific number of users in that session
        await prisma.restaurant.update({
          where: { id: activeSession.table.restaurant_id },
          data: { current_occupancy: { decrement: 1 } } 
        });

        // Close Session
        await prisma.session.updateMany({
          where: { table_id: tId, is_active: true },
          data: { is_active: false, end_time: new Date() }
        });
      }
    }

    // 2. Update the Table Status
    await prisma.table.update({
      where: { id: tId },
      data: { status: status }
    });

    res.json({ success: true });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

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