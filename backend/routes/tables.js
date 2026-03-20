const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Initialize/Open a Table (When first person scans QR)
router.post('/open-session', async (req, res) => {
  const { tableId, userId } = req.body;

  try {
    // Generate a unique 4-character join code (e.g., A7B2)
    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create the session
    const session = await prisma.session.create({
      data: {
        table_id: tableId,
        join_code: joinCode,
        is_active: true
      }
    });

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    });

    res.json({ message: "Session Started", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Join an existing Table (When Customer B enters the code)
router.post('/join-session', async (req, res) => {
  const { joinCode, userId } = req.body; // Added userId to request

  try {
    const session = await prisma.session.findUnique({
      where: { join_code: joinCode },
      include: { table: true, orders: true }
    });

    if (!session || !session.is_active) {
      return res.status(404).json({ error: "Invalid or expired join code." });
    }

    // Check if the user is already the one who started the session
    const initialOrder = await prisma.order.findFirst({
        where: { session_id: session.id }
    });

    if (initialOrder && initialOrder.customer_id === userId) {
        return res.status(400).json({ error: "You are already the host of this table." });
    }

    res.json({ message: "Joined Session", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get All Tables Status (For the "Restaurant View" feature)
router.get('/status/:restaurantId', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { restaurant_id: parseInt(req.params.restaurantId) },
      orderBy: { table_number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;