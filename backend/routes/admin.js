const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
const verifyToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Secure all routes in this file
router.use(verifyToken);
router.use(isAdmin);

// --- OVERVIEW & HISTORY (DASHBOARD DATA) ---
  router.get('/dashboard-data', async (req, res) => {
    try {
      const restaurantId = parseInt(req.query.restaurantId);
      if (!restaurantId) return res.status(400).json({ error: "Missing restaurantId" });

      // 0. Ownership Check
      const checkOwnership = await prisma.restaurant.findFirst({
        where: { id: restaurantId, admin_id: req.user.id }
      });

      if (!checkOwnership) {
        return res.status(403).json({ error: "Access Denied: You do not own this restaurant." });
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // 1. Fetch Today's Orders for Revenue
      const dailyOrders = await prisma.order.findMany({
        where: { 
          restaurant_id: restaurantId,
          created_at: { gte: startOfDay } 
        },
        include: {
          items: { include: { item: true } },
          coupon: true
        }
      });

      // 2. Manual Revenue Calculation (Sums up item prices since total_amount column is 0)
      let calculatedRevenue = 0;
      dailyOrders.forEach(order => {
        let orderSubtotal = (order.items || []).reduce((sum, i) => {
          return sum + (Number(i.item?.price || 0) * (i.quantity || 1));
        }, 0);

        if (order.coupon) {
          orderSubtotal = orderSubtotal * (1 - (order.coupon.discount_value / 100));
        }
        calculatedRevenue += orderSubtotal;
      });

      // 3. Parallel fetching of all other sections to prevent 304/Timeout issues
      const [menu, staff, inventory, coupons, tables, densityLogs, history, activeSessions] = await Promise.all([
        prisma.menuItem.findMany({ 
          where: { restaurant_id: restaurantId },
          orderBy: { name: 'asc' } 
        }),
        prisma.user.findMany({ 
          where: { role: 'STAFF', restaurant_id: restaurantId } 
        }),
        prisma.inventoryItem.findMany({ 
          where: { restaurant_id: restaurantId },
          orderBy: { name: 'asc' } 
        }),
        prisma.coupon.findMany({
          where: { restaurant_id: restaurantId }
        }),
        prisma.table.findMany({
          where: { restaurant_id: restaurantId }
        }),
        prisma.densityLog.findMany({
          where: { restaurant_id: restaurantId },
          orderBy: { recorded_at: 'desc' },
          take: 20
        }),
        prisma.order.findMany({
          where: { restaurant_id: restaurantId },
          take: 30,
          orderBy: { created_at: 'desc' },
          include: { 
            customer: { select: { username: true } },
            items: { include: { item: true } },
            coupon: true
          }
        }),
        prisma.session.findMany({
          where: { 
            is_active: true,
            table: {
              restaurant_id: Number(restaurantId) // Force Number type
            }
          },
          include: { 
            table: true, 
            orders: {
              include: {
                items: { 
                  include: { 
                    item: true, 
                    paid_by: { select: { username: true } } 
                  } 
                }
              }
            }
          }
        })
      ]);

      // Return the full payload
      res.json({ 
        menu, 
        staff, 
        inventory, 
        coupons, 
        tables, 
        history, 
        activeSessions, 
        totalRevenue: Number(calculatedRevenue.toFixed(2)), 
        densityLogs 
      });

    } catch (error) {
      console.error("Dashboard Data Error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

// --- PROMOTIONS (COUPONS) ---
router.post('/coupons', async (req, res) => {
  const { code, discount_value, restaurant_id } = req.body;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurant_id) },
      select: { admin_id: true }
    });

    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount_value: parseFloat(discount_value),
        restaurant_id: parseInt(restaurant_id),
        admin_id: restaurant.admin_id,
        is_active: true
      }
    });
    res.json(newCoupon);
  } catch (error) {
    console.error("Coupon Create Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/coupons/:id/status', async (req, res) => {
  const { is_active } = req.body;
  try {
    const updated = await prisma.coupon.update({
      where: { id: parseInt(req.params.id) },
      data: { is_active: Boolean(is_active) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADDED: Fix for the 404 error when deleting coupons
router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete coupon. It may not exist." });
  }
});

// --- STAFF MANAGEMENT ---
router.post('/staff', async (req, res) => {
  const { username, password, phone_number, email, restaurant_id } = req.body;
  try {
    const newStaff = await prisma.user.create({
      data: { 
        username, 
        password_hash: password, 
        phone_number, 
        email,
        role: 'STAFF',
        restaurant_id: parseInt(restaurant_id)
      }
    });
    res.json(newStaff);
  } catch (error) { 
    console.error(error);
    res.status(400).json({ error: "Username or Phone already exists." }); 
  }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff." });
  }
});

router.patch('/staff/:id', async (req, res) => {
  const { username, phone_number, email, password_hash } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        username, 
        phone_number, 
        email,
        password_hash 
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MENU MANAGEMENT ---
router.post('/menu', async (req, res) => {
  const { name, price, restaurant_id } = req.body;
  try {
    const newItem = await prisma.menuItem.create({
      data: { 
        name, 
        price: parseFloat(price), 
        restaurant_id: parseInt(restaurant_id)
      }
    });
    res.json(newItem);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/menu/:id', async (req, res) => {
  const { name, price, stock_quantity } = req.body;
  try {
    const updated = await prisma.menuItem.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        name: name,
        price: price ? parseFloat(price) : undefined, 
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : undefined 
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete menu item." });
  }
});

// --- INVENTORY MANAGEMENT ---
router.post('/inventory', async (req, res) => {
  const { name, amount, unit, min_limit, restaurant_id } = req.body;
  try {
    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        amount: parseFloat(amount),
        unit,
        min_limit: parseFloat(min_limit),
        restaurant_id: parseInt(restaurant_id)
      }
    });
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/inventory/:id', async (req, res) => {
  const { name, amount, unit, min_limit } = req.body;
  try {
    const updated = await prisma.inventoryItem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        amount: amount ? parseFloat(amount) : undefined,
        unit,
        min_limit: min_limit ? parseFloat(min_limit) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/inventory/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- INGREDIENTS & LOGIC ---
router.post('/menu-ingredients', async (req, res) => {
  const { menuItemId, inventoryId, quantityUsed } = req.body;
  try {
    const link = await prisma.menuItemIngredient.create({
      data: {
        menuItemId: parseInt(menuItemId),
        inventoryId: parseInt(inventoryId),
        quantityUsed: parseFloat(quantityUsed)
      }
    });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/menu/:id/ingredients', async (req, res) => {
  try {
    const ingredients = await prisma.menuItemIngredient.findMany({
      where: { menuItemId: parseInt(req.params.id) },
      include: { inventory: true }
    });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- QR & TABLES ---
router.get('/tables/:id/qrcode', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });

    if (!table) return res.status(404).json({ error: "Table not found" });

    const qrData = `campuseats://join?restaurantId=${table.restaurant_id}&tableId=${table.id}&qrId=${table.qr_code_id}`;
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ 
      tableNumber: table.table_number,
      qrCodeImage: qrImage 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BRANCH MANAGEMENT ---
router.get('/my-restaurants', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { admin_id: req.user.id }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register-branch', async (req, res) => {
  const { name, address } = req.body;
  const adminId = req.user.id;

  try {
    const newBranch = await prisma.restaurant.create({
      data: {
        name,
        address,
        admin_id: adminId,
        total_capacity: 50,
        current_occupancy: 0 
      }
    });
    res.status(201).json(newBranch);
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    res.status(500).json({ error: "Failed to create branch. Check required fields." });
  }
});

// --- UTILS ---
router.post('/coupons/verify', async (req, res) => {
  const { code, restaurantId } = req.body;
  try {
    if (!code || !restaurantId) return res.status(400).json({ error: "Missing data" });

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        restaurant_id: parseInt(restaurantId),
        is_active: true
      }
    });

    if (!coupon) return res.status(404).json({ error: "Invalid promo code" });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;