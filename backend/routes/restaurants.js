const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all restaurants with occupancy data for the Picker
router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: { 
        tables: true // This gets all restaurant fields AND the tables array
      }
    });
    
    // Log this to your terminal to verify data is coming through
    console.log("Sample Restaurant Data:", JSON.stringify(restaurants[0], null, 2));
    
    res.json(restaurants);
  } catch (error) {
    console.error("Fetch Restaurants Error:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// Get table layout and status for a specific restaurant
router.get('/:id/tables', async (req, res) => {
  const restaurantId = parseInt(req.params.id);
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

router.get('/network/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;

  try {
    // 1. Find the admin_id of the current restaurant
    const current = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) }
    });

    // 2. Find all restaurants with that same admin_id
    const network = await prisma.restaurant.findMany({
      where: { 
        admin_id: current.admin_id,
        NOT: { id: parseInt(restaurantId) } // Optional: exclude the one they are currently at
      }
    });

    res.json(network);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;