const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
// --- OVERVIEW & HISTORY ---
router.get('/dashboard-data', async (req, res) => {
  try {
    const menu = await prisma.menuItem.findMany({ orderBy: { name: 'asc' } });
    const staff = await prisma.user.findMany({ where: { role: 'STAFF' } });
    const inventory = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } }); // Added this
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyOrders = await prisma.order.findMany({
      where: { created_at: { gte: startOfDay } }
    });
    
    const totalRevenue = dailyOrders.reduce((sum, order) => sum + order.total_amount, 0);

    const history = await prisma.order.findMany({
      take: 30,
      orderBy: { created_at: 'desc' },
      include: { 
        customer: { select: { username: true } },
        items: { include: { item: true } }
      }
    });

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

    // Added inventory to the response
    res.json({ menu, staff, history, activeSessions, totalRevenue, inventory });
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

// Update Inventory (Restock or Change Limit)
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

// Delete Inventory Item
router.delete('/inventory/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


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

// Get ingredients for a specific menu item
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

router.get('/tables/:id/qrcode', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });

    if (!table) return res.status(404).json({ error: "Table not found" });

    // This is the data the phone's camera will read
    // We use a deep link format so the CampusEats app opens automatically
    const qrData = `campuseats://join?restaurantId=${table.restaurant_id}&tableId=${table.id}&qrId=${table.qr_code_id}`;

    // Generate the QR as a Base64 Data URL (Image)
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ 
      tableNumber: table.table_number,
      qrCodeImage: qrImage // This is a long string starting with "data:image/png;base64..."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;