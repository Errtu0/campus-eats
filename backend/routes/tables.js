const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middleware/authMiddleware'); // Added JWT protection

// Apply security to all table-related actions
router.use(verifyToken);

// 1. Get tables for a specific restaurant (Secure & Scoped)
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

// 2. Initialize/Open a Table (The first person to scan)
router.post('/open-session', async (req, res) => {
  const { tableId, restaurantId } = req.body; 
  const userId = req.user.id; // Get ID from secure token, not request body

  try {
    const table = await prisma.table.findUnique({ 
      where: { id: parseInt(tableId) },
      include: { restaurant: true } 
    });
    
    if (!table) return res.status(404).json({ error: "Table not found." });
    
    // Ownership Check
    if (table.restaurant_id !== parseInt(restaurantId)) {
      return res.status(403).json({ error: "This table belongs to a different restaurant branch!" });
    }
    
    // Status Logic
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

    // Transaction: Create session and update occupancy simultaneously
    const [session] = await prisma.$transaction([
      prisma.session.create({
        data: {
          table_id: parseInt(tableId),
          join_code: joinCode,
          is_active: true
        }
      }),
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
    res.status(500).json({ error: error.message });
  }
});

// 3. Join an existing Table
router.post('/join-session', async (req, res) => {
  const { joinCode } = req.body;
  // Security: We use req.user.id from token if we need to track who joined

  try {
    const session = await prisma.session.findUnique({
      where: { join_code: joinCode.toUpperCase() },
      include: { table: { include: { restaurant: true } } }
    });

    if (!session || !session.is_active) {
      return res.status(404).json({ error: "Invalid or expired join code." });
    }

    // Increment occupancy for the new person joining
    await prisma.restaurant.update({
      where: { id: session.table.restaurant_id },
      data: { current_occupancy: { increment: 1 } }
    });

    res.json({ 
      message: "Joined Session", 
      session, 
      restaurantName: session.table.restaurant.name, 
      restaurantId: session.table.restaurant.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Check if session is still alive (Heartbeat)
router.get('/session-status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      select: { is_active: true }
    });

    res.json({ is_active: !!session?.is_active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;