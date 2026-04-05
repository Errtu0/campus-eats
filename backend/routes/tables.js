const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Initialize/Open a Table (The first person to scan)
router.post('/open-session', async (req, res) => {
  const { tableId, userId } = req.body;

  try {
    const table = await prisma.table.findUnique({ 
      where: { id: tableId },
      include: { restaurant: true } 
    });
    
    if (!table) return res.status(404).json({ error: "Table not found." });

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
        table_id: tableId,
        join_code: joinCode,
        is_active: true
      }
    });

    // --- DENSITY LOGIC ---
    // Update Table status AND Increment Restaurant occupancy by 1
    await prisma.$transaction([
      prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      }),
      prisma.restaurant.update({
        where: { id: table.restaurant_id },
        data: { current_occupancy: { increment: 1 } }
      })
    ]);

    res.json({ message: "Session Started", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Join an existing Table (Friends joining the same table)
router.post('/join-session', async (req, res) => {
  const { joinCode, userId } = req.body;

  try {
    const session = await prisma.session.findUnique({
      where: { join_code: joinCode },
      include: { table: true }
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

    res.json({ message: "Joined Session", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;