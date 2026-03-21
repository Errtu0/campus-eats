const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- OVERVIEW & HISTORY ---
router.get('/dashboard-data', async (req, res) => {
  try {
    const menu = await prisma.menuItem.findMany({ orderBy: { name: 'asc' } });
    const staff = await prisma.user.findMany({ where: { role: 'STAFF' } });
    
    // 1. Calculate Today's Revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyOrders = await prisma.order.findMany({
      where: { created_at: { gte: startOfDay } }
    });
    const totalRevenue = dailyOrders.reduce((sum, order) => sum + order.total_amount, 0);

    // 2. History with deep nesting
    const history = await prisma.order.findMany({
      take: 30,
      orderBy: { created_at: 'desc' },
      include: { 
        customer: { select: { username: true } },
        items: { include: { item: true } }
      }
    });

    // 3. Active Sessions with Order Statuses
    const activeSessions = await prisma.session.findMany({
      where: { is_active: true },
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
    });

    res.json({ menu, staff, history, activeSessions, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STAFF MANAGEMENT ---
router.post('/staff', async (req, res) => {
  const { username, password, phone_number } = req.body;
  try {
    const newStaff = await prisma.user.create({
      data: { username, password_hash: password, phone_number, role: 'STAFF' }
    });
    res.json(newStaff);
  } catch (error) { res.status(400).json({ error: "Username already exists" }); }
});

router.delete('/staff/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.delete('/menu/:id', async (req, res) => {
  await prisma.menuItem.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// --- INVENTORY MANAGEMENT ---
router.post('/menu', async (req, res) => {
  const { name, price, stock_quantity, restaurant_id } = req.body;
  try {
    const newItem = await prisma.menuItem.create({
      data: { 
        name, 
        price: parseFloat(price), 
        stock_quantity: parseInt(stock_quantity),
        restaurant_id: parseInt(restaurant_id),
        alert_threshold: 5 // Default threshold
      }
    });
    res.json(newItem);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update Menu Item
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

// Update Staff Member
router.patch('/staff/:id', async (req, res) => {
  const { username, phone_number, password_hash } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        username, 
        phone_number, 
        password_hash // In a real app, hash this first!
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;