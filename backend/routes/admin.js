const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs'); // INJECT CRYPTO HOOK
const verifyToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(isAdmin);

// --- OVERVIEW & HISTORY (DASHBOARD DATA - UPGRADED TO TRACK CREATOR DETAILS) ---
router.get('/dashboard-data', async (req, res) => {
  try {
    const restaurantId = parseInt(req.query.restaurantId);
    if (!restaurantId) return res.status(400).json({ error: "Missing restaurantId" });

    const checkOwnership = await prisma.restaurant.findFirst({
      where: { id: restaurantId, admin_id: req.user.id }
    });

    if (!checkOwnership) {
      return res.status(403).json({ error: "Access Denied: You do not own this restaurant." });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

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

    const [menu, staff, inventory, coupons, tables, densityLogs, history, activeSessions, newsFeed] = await Promise.all([
      prisma.menuItem.findMany({ 
        where: { restaurant_id: restaurantId },
        orderBy: { name: 'asc' } 
      }),
      prisma.user.findMany({ 
        where: { role: 'STAFF', restaurant_id: restaurantId },
        select: { id: true, username: true, email: true, phone_number: true, role: true } 
      }),
      prisma.inventoryItem.findMany({ 
        where: { restaurant_id: restaurantId },
        orderBy: { name: 'asc' } 
      }),
      prisma.coupon.findMany({ where: { restaurant_id: restaurantId } }),
      prisma.table.findMany({ where: { restaurant_id: restaurantId } }),
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
          table: { restaurant_id: Number(restaurantId) }
        },
        include: { 
          table: true, 
          orders: {
            include: {
              items: { 
                include: { 
                  item: true, 
                  paid_by: { select: { username: true } },
                  created_by: { select: { username: true } }
                } 
              }
            }
          }
        }
      }),
      prisma.promotionNews.findMany({ where: { restaurant_id: restaurantId }, orderBy: { created_at: 'desc' } })
    ]);

    res.json({ 
      menu, 
      staff, 
      inventory, 
      coupons, 
      tables, 
      history, 
      activeSessions, 
      totalRevenue: Number(calculatedRevenue.toFixed(2)), 
      densityLogs, 
      newsFeed: newsFeed || []
    });

  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});


// --- PROMOTIONS ENGINE - CREATE COUPON WITH USAGE LIMITS ---
router.post('/coupons', async (req, res) => {
  const { code, discount_value, restaurant_id, coupon_type, min_cart_limit, applicable_to, usage_limit } = req.body;
  
  if (!code || !discount_value || !restaurant_id) {
    return res.status(400).json({ error: "Missing required rule attributes." });
  }

  try {
    const formattedCode = code.toUpperCase().trim();
    
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: formattedCode }
    });

    if (existingCoupon) {
      return res.status(400).json({ error: "PROMO_CODE_ALREADY_EXISTS" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurant_id) },
      select: { admin_id: true }
    });

    if (!restaurant) return res.status(404).json({ error: "Restaurant branch context missing." });

    const newCoupon = await prisma.coupon.create({
      data: {
        code: formattedCode,
        discount_value: parseFloat(discount_value),
        restaurant_id: parseInt(restaurant_id),
        admin_id: restaurant.admin_id,
        coupon_type: coupon_type || 'PERCENT',
        min_cart_limit: min_cart_limit ? parseFloat(min_cart_limit) : 0.0,
        applicable_to: applicable_to || 'ALL',
        is_active: true,
        usage_limit: usage_limit ? parseInt(usage_limit) : 9999, // Fallback to large limit if blank
        current_usage: 0
      }
    });
    res.json(newCoupon);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile custom code rules." });
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

router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete coupon. It may not exist." });
  }
});

// --- STAFF MANAGEMENT (UPDATED FOR SECURE PROVISIONING) ---
router.post('/staff', async (req, res) => {
  const { username, password, phone_number, email, restaurant_id } = req.body;
  
  // FIX: Structural Email Regex & Strength Constraints
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!username || !password || !email || !restaurant_id) {
    return res.status(400).json({ error: "Missing required profile payload metrics." });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid staff email format schema structural boundary." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password allocation constraint failed: Min length is 8." });
  }

  try {
    // FIX: Secure Hashing Strategy before Transaction Create execution
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await prisma.user.create({
      data: { 
        username, 
        password_hash: hashedPassword, 
        phone_number, 
        email,
        role: 'STAFF',
        restaurant_id: parseInt(restaurant_id)
      }
    });

    // Don't leak raw hashes on client response returns
    const { password_hash, ...staffSafe } = newStaff;
    res.json(staffSafe);
  } catch (error) { 
    console.error(error);
    res.status(400).json({ error: "Username, Email, or Phone already exists in systemic directories." }); 
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
  const { username, phone_number, email, password } = req.body; // Expect plain password text if changing it
  
  const updateData = { username, phone_number, email };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format schema parameters." });
  }

  try {
    // FIX: Conditional execution if updating password parameter row
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password update must contain at least 8 characters." });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    
    const { password_hash, ...staffSafe } = updated;
    res.json(staffSafe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SYNCED MENU CREATE CONTROLLER ROUTE ---
router.post('/menu', async (req, res) => {
  const { 
    name, 
    price, 
    restaurant_id, 
    category, 
    image_name, 
    is_vegan, 
    is_gluten_free, 
    is_hot, 
    is_sweet, 
    is_sour,
    ingredients // Expecting format: [{ inventoryId: 1, quantityUsed: 0.5 }]
  } = req.body;

  if (!name || !price || !restaurant_id) {
    return res.status(400).json({ error: "Mandatory structural data attributes missing." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newItem = await tx.menuItem.create({
        data: { 
          name, 
          price: parseFloat(price), 
          restaurant_id: parseInt(restaurant_id),
          category: category ? category.toUpperCase().trim() : "COFFEE",
          image_name: image_name || "default",
          is_vegan: Boolean(is_vegan),
          is_gluten_free: Boolean(is_gluten_free),
          is_hot: Boolean(is_hot),
          is_sweet: Boolean(is_sweet),
          is_sour: Boolean(is_sour)
        }
      });

      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        const linksData = ingredients.map(ing => ({
          menuItemId: newItem.id,       // Matches camelCase schema field explicitly
          inventoryId: parseInt(ing.inventoryId), // Matches camelCase schema field explicitly
          quantityUsed: parseFloat(ing.quantityUsed)
        }));

        await tx.menuItemIngredient.createMany({
          data: linksData
        });
      }

      return newItem;
    });

    res.json(result);
  } catch (error) { 
    console.error("Recipe Link Compile Error:", error.message);
    res.status(500).json({ error: "Failed to allocate recipe definitions." }); 
  }
});

// --- UPDATE EXISTENT MENU ITEM METADATA & NESTED RECIPE SCALES ---
router.patch('/menu/:id', async (req, res) => {
  const mId = parseInt(req.params.id);
  const { 
    name, 
    price, 
    category, 
    image_name, 
    is_vegan, 
    is_gluten_free, 
    is_hot, 
    is_sweet, 
    is_sour,
    ingredients // Expecting your fresh array from the edit state list
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update basic informational attributes on the MenuItem
      const updatedItem = await tx.menuItem.update({
        where: { id: mId },
        data: { 
          name,
          price: price ? parseFloat(price) : undefined, 
          category: category ? category.toUpperCase().trim() : undefined,
          image_name: image_name || undefined,
          is_vegan: is_vegan !== undefined ? Boolean(is_vegan) : undefined,
          is_gluten_free: is_gluten_free !== undefined ? Boolean(is_gluten_free) : undefined,
          is_hot: is_hot !== undefined ? Boolean(is_hot) : undefined,
          is_sweet: is_sweet !== undefined ? Boolean(is_sweet) : undefined,
          is_sour: is_sour !== undefined ? Boolean(is_sour) : undefined
        }
      });

      // 2. If an ingredients payload was provided during the update, perform a clean re-write
      if (ingredients && Array.isArray(ingredients)) {
        // Drop all old recipe links associated with this specific item id first
        await tx.menuItemIngredient.deleteMany({
          where: { menuItemId: mId }
        });

        // Insert the updated layout map if the list isn't empty
        if (ingredients.length > 0) {
          const linksData = ingredients.map(ing => ({
            menuItemId: mId,
            inventoryId: parseInt(ing.inventoryId),
            quantityUsed: parseFloat(ing.quantityUsed)
          }));

          await tx.menuItemIngredient.createMany({
            data: linksData
          });
        }
      }

      return updatedItem;
    });

    res.json(result);
  } catch (error) {
    console.error("Recipe Modification Compile Error:", error.message);
    res.status(500).json({ error: "Failed to save menu item updates to systemic databases." });
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

// --- NEWSLETTER BROADCAST CONTROL PATHWAYS ---

// 1. Dispatch New Story Announcement
router.post('/news-feed', async (req, res) => {
  const { title, description, restaurant_id, image_tag } = req.body;
  if (!title || !description || !restaurant_id) {
    return res.status(400).json({ error: "Missing required newsletter payload properties." });
  }

  try {
    const newsItem = await prisma.promotionNews.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        restaurant_id: parseInt(restaurant_id),
        image_tag: image_tag || "default"
      }
    });
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast newsletter record." });
  }
});

// 2. Fetch Active Newsletter Backlog (Public Customer Pipeline Route)
router.get('/news-feed/:restaurantId', async (req, res) => {
  try {
    const feeds = await prisma.promotionNews.findMany({
      where: { restaurant_id: parseInt(req.params.restaurantId) },
      orderBy: { created_at: 'desc' }
    });
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: "Failed to pull newsletter updates." });
  }
});

// --- DELETE ANNOUNCEMENT BULLETIN ---
router.delete('/news-feed/:id', async (req, res) => {
  try {
    await prisma.promotionNews.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not drop bulletin item instance." });
  }
});

module.exports = router;  