const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

// --- STATIC / EXPLICIT EXPLORATION PATHS FIRST ---

// 1. Get all restaurants with occupancy data (Secure)
router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: { 
        tables: { select: { status: true } }
      }
    });
    res.json(restaurants);
  } catch (error) {
    console.error("Fetch Restaurants Error:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// FIX 1: PLACED PUBLIC CLIENT NEWS PIPELINE ABOVE WILDCARD ID TARGETS TO PREVENT 404 GREEDY MATCHES
router.get('/news-feed/:restaurantId', async (req, res) => {
  const rId = parseInt(req.params.restaurantId);
  if (isNaN(rId)) return res.status(400).json({ error: "Invalid restaurant identification matrix mapping parameter." });

  try {
    const feeds = await prisma.promotionNews.findMany({
      where: { restaurant_id: rId },
      orderBy: { created_at: 'desc' }
    });
    res.json(feeds);
  } catch (error) {
    console.error("Public Newsletter Query Error:", error);
    res.status(500).json({ error: "Failed to pull public network branch updates." });
  }
});

// 3. Find sister branches (Network)
router.get('/network/:restaurantId', async (req, res) => {
  const rId = parseInt(req.params.restaurantId);
  try {
    const current = await prisma.restaurant.findUnique({ where: { id: rId } });
    if (!current) return res.status(404).json({ error: "Restaurant not found" });

    const network = await prisma.restaurant.findMany({
      where: { 
        admin_id: current.admin_id,
        NOT: { id: rId } 
      }
    });
    res.json(network);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DYNAMIC WILDCARD/ID PATHS LAST ---

// 2. Get table layout for a specific restaurant
router.get('/:id/tables', async (req, res) => {
  const restaurantId = parseInt(req.params.id);
  if (isNaN(restaurantId)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const tables = await prisma.table.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { table_number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

module.exports = router;