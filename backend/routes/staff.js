const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isStaff } = require('../middleware/roleMiddleware'); 
const verifyToken = require('../middleware/authMiddleware'); 

// --- 1. DASHBOARD DATA (Tables & Kitchen Queue) ---
router.get('/dashboard-data', verifyToken, isStaff, async (req, res) => {
  try {
    const staffRestaurantId = req.user.restaurant_id;

    const [tables, pendingOrders] = await Promise.all([
      prisma.table.findMany({
        where: { restaurant_id: staffRestaurantId },
        orderBy: { table_number: 'asc' }
      }),
      prisma.orderItem.findMany({
        where: {
          status: { in: ['PAID', 'READY'] },
          order: { restaurant_id: staffRestaurantId }
        },
        include: {
          item: true,
          // 🚀 FIX: Include creator metrics for kitchen staff line feeds
          created_by: { select: { username: true } },
          order: { include: { session: { include: { table: true } } } }
        },
        orderBy: { order: { created_at: 'asc' } }
      })
    ]);

    res.json({ tables, pendingOrders });
  } catch (error) {
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
});

// --- 2. TABLE DETAILS ---
router.get('/table-details/:id', verifyToken, isStaff, async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const staffRestaurantId = req.user.restaurant_id;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.restaurant_id !== staffRestaurantId) {
      return res.status(403).json({ error: "Unauthorized access to this table." });
    }

    const session = await prisma.session.findFirst({
      where: { table_id: tableId, is_active: true },
      include: {
        orders: { 
          include: { 
            items: { 
              include: { 
                item: true,
                // 🚀 FIX: Make creator name fields pull through during individual table queries
                created_by: { select: { username: true } }
              } 
            } 
          } 
        }
      }
    });

    if (!session) return res.json({ active: false });

    const allItems = session.orders.flatMap(order => order.items);
    const unpaidItems = allItems.filter(item => !item.paid_by_user_id);
    const unservedItems = allItems.filter(item => item.status !== 'SERVED');
    
    const canClear = allItems.length === 0 || (unpaidItems.length === 0 && unservedItems.length === 0);

    res.json({
      active: true,
      items: allItems,
      canClear,
      unpaidCount: unpaidItems.length,
      unservedCount: unservedItems.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 2. TABLE DETAILS ---
router.get('/table-details/:id', verifyToken, isStaff, async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const staffRestaurantId = req.user.restaurant_id;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.restaurant_id !== staffRestaurantId) {
      return res.status(403).json({ error: "Unauthorized access to this table." });
    }

    const session = await prisma.session.findFirst({
      where: { table_id: tableId, is_active: true },
      include: {
        orders: { include: { items: { include: { item: true } } } }
      }
    });

    if (!session) return res.json({ active: false });

    const allItems = session.orders.flatMap(order => order.items);
    const unpaidItems = allItems.filter(item => !item.paid_by_user_id);
    const unservedItems = allItems.filter(item => item.status !== 'SERVED');
    
    const canClear = allItems.length === 0 || (unpaidItems.length === 0 && unservedItems.length === 0);

    res.json({
      active: true,
      items: allItems,
      canClear,
      unpaidCount: unpaidItems.length,
      unservedCount: unservedItems.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. UPDATE TABLE STATUS ---
router.patch('/table-status', verifyToken, isStaff, async (req, res) => {
  const { tableId, status } = req.body;
  const staffRestaurantId = req.user.restaurant_id;

  try {
    const tId = parseInt(tableId);
    const table = await prisma.table.findUnique({ where: { id: tId } });

    if (!table || table.restaurant_id !== staffRestaurantId) {
      return res.status(403).json({ error: "Unauthorized table update" });
    }

    if (status === 'EMPTY' || status === 'CLEANING') {
      const activeSession = await prisma.session.findFirst({
        where: { table_id: tId, is_active: true }
      });

      if (activeSession) {
        await prisma.$transaction([
          prisma.restaurant.update({
            where: { id: staffRestaurantId },
            data: { current_occupancy: { decrement: 1 } }
          }),
          prisma.session.updateMany({
            where: { table_id: tId, is_active: true },
            data: { is_active: false, end_time: new Date() }
          })
        ]);
      }
    }

    await prisma.table.update({ where: { id: tId }, data: { status } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 4. ORDER READY (UPGRADED WITH LOCAL LIVE WEBSOCKET BROADCAST TRIGGERS) ---
router.patch('/order-ready', verifyToken, isStaff, async (req, res) => {
  const { orderItemId } = req.body;
  const staffRestaurantId = req.user.restaurant_id;

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: parseInt(orderItemId) },
      include: { order: true }
    });

    if (!item || item.order.restaurant_id !== staffRestaurantId) {
      return res.status(403).json({ error: "Unauthorized order update" });
    }

    const updated = await prisma.orderItem.update({
      where: { id: parseInt(orderItemId) },
      data: { status: 'READY' },
      include: { item: true } // Include item metadata to grab product name
    });

    // 🚀 WEBSOCKET DISPATCH: Trigger a local notification pulse if the Socket layer is initialized
    if (req.io && updated.created_by_user_id) {
      req.io.emit(`NOTIFY_USER_${updated.created_by_user_id}`, {
        title: "ORDER READY FOR PICKUP! ☕",
        body: `Your ${updated.item?.name || 'order item'} is hot and ready at the counter!`,
        orderItemId: updated.id
      });
      console.log(`[Socket Notify] Sent local live signal block to User #${updated.created_by_user_id}`);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. ORDER SERVED ---
router.patch('/order-served', verifyToken, isStaff, async (req, res) => {
  const { orderItemId } = req.body;
  const staffRestaurantId = req.user.restaurant_id;

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: parseInt(orderItemId) },
      include: { order: true }
    });

    if (!item || item.order.restaurant_id !== staffRestaurantId) {
      return res.status(403).json({ error: "Unauthorized order update" });
    }

    const updated = await prisma.orderItem.update({
      where: { id: parseInt(orderItemId) },
      data: { status: 'SERVED' }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;