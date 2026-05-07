const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


router.get('/', async (req, res) => {
  const restaurantId = parseInt(req.query.restaurantId);
  
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  try {
    const tables = await prisma.table.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { table_number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Initialize/Open a Table (The first person to scan)
router.post('/open-session', async (req, res) => {
  // 1. Match the key name 'restaurantId' sent by the frontend
  const { tableId, userId, restaurantId } = req.body; 

  try {
    const table = await prisma.table.findUnique({ 
      where: { id: parseInt(tableId) },
      include: { restaurant: true } 
    });
    
    if (!table) return res.status(404).json({ error: "Table not found." });
    
    // 2. Add parseInt here to prevent "2" !== 2 mismatch errors
    if (table.restaurant_id !== parseInt(restaurantId)) {
      console.log(`403 Denied: Table is for Rest #${table.restaurant_id}, Request sent Rest #${restaurantId}`);
      return res.status(403).json({ error: "This table belongs to a different restaurant branch!" });
    }
    
    // Check Statuses
    if (table.status === 'OCCUPIED') {
      return res.status(400).json({ 
        message: "TABLE_OCCUPIED", 
        error: "This table is already active. Use the Join Code." 
      });
    }

    if (table.status === 'CLEANING') {
      return res.status(400).json({ error: "Table is being cleaned. Please wait." });
    }

    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Start the session
    const session = await prisma.session.create({
      data: {
        table_id: parseInt(tableId),
        join_code: joinCode,
        is_active: true
      }
    });

    // --- DENSITY LOGIC ---
    await prisma.$transaction([
      prisma.table.update({
        where: { id: parseInt(tableId) },
        data: { status: 'OCCUPIED' }
      }),
      prisma.restaurant.update({
        where: { id: table.restaurant_id },
        data: { current_occupancy: { increment: 1 } }
      })
    ]);

    res.json({ 
      message: "Session Started", 
      session, 
      restaurantName: table.restaurant.name, 
      restaurantId: table.restaurant.id 
    });
  } catch (error) {
    console.error("Open Session Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Join an existing Table (Friends joining the same table)
router.post('/join-session', async (req, res) => {
  const { joinCode, userId } = req.body;

  try {
    const session = await prisma.session.findUnique({
      where: { join_code: joinCode },
      include: { table: { include: { restaurant: true } } }
    });

    if (!session || !session.is_active) {
      return res.status(404).json({ error: "Invalid or expired join code." });
    }

    // --- DENSITY LOGIC ---
    // Even if the table is already 'OCCUPIED', a new person joining 
    // means the building density increases by 1.
    await prisma.restaurant.update({
      where: { id: session.table.restaurant_id },
      data: { current_occupancy: { increment: 1 } }
    });

    res.json({ message: "Joined Session", session, restaurantName: session.table.restaurant.name, restaurantId: session.table.restaurant.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/session-status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      select: { is_active: true }
    });

    if (!session || !session.is_active) {
      return res.json({ is_active: false });
    }

    res.json({ is_active: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;