const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
router.get('/dashboard-data', async (req, res) => {
  const restaurantId = parseInt(req.query.restaurantId);
  
  const tables = await prisma.table.findMany({
    where: { restaurant_id: restaurantId }
  });

  const pendingOrders = await prisma.orderItem.findMany({
    where: {
      // Logic: Show items that are PAID (need cooking) or READY (need serving)
      // Remove 'PENDING' because we only want to cook items after they are paid
      status: { in: ['PAID', 'READY'] }, 
      order: { session: { table: { restaurant_id: restaurantId } } }
    },
    include: {
      item: true,
      order: { include: { session: { include: { table: true } } } }
    }
  });

  res.json({ tables, pendingOrders });
});

router.get('/table-details/:id', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const session = await prisma.session.findFirst({
      where: { table_id: tableId, is_active: true },
      include: {
        orders: {
          include: {
            items: { include: { item: true } }
          }
        }
      }
    });

    if (!session) return res.json({ active: false });

    const allItems = session.orders.flatMap(order => order.items);

    // Validation for "Can we close this table?"
    // MUST be paid AND status must be 'SERVED'
    const unpaidItems = allItems.filter(item => !item.paid_by_user_id);
    const unservedItems = allItems.filter(item => item.status !== 'SERVED');

    const canClear = allItems.length > 0 && unpaidItems.length === 0 && unservedItems.length === 0;

    res.json({
      active: true,
      items: allItems, // Frontend will loop this
      canClear: canClear,
      unpaidCount: unpaidItems.length,
      unservedCount: unservedItems.length
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