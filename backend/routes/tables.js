const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Initialize/Open a Table
router.post('/open-session', async (req, res) => {
  const { tableId, userId } = req.body;

  try {
    // SECURITY CHECK: Is the table already occupied?
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    
    if (table.status === 'OCCUPIED') {
      return res.status(400).json({ 
        message: "TABLE_OCCUPIED", 
        error: "This table is already active. Please enter the Join Code to connect." 
      });
    }

    if (table.status === 'CLEANING') {
      return res.status(400).json({ error: "Table is being cleaned. Please wait." });
    }

    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const session = await prisma.session.create({
      data: {
        table_id: tableId,
        join_code: joinCode,
        is_active: true
      }
    });

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    });

    res.json({ message: "Session Started", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Join an existing Table
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

    res.json({ message: "Joined Session", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;