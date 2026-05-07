const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');

// Environment Variables for Twilio
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Only initialize Twilio if keys exist
let client;
if (TWILIO_SID && TWILIO_AUTH) {
    client = twilio(TWILIO_SID, TWILIO_AUTH);
}

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      restaurant_id: user.restaurant_id // <--- THIS IS WHAT'S MISSING
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};


// --- LOGIN ROUTE ---
router.post('/login-signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    if (user.role === 'CUSTOMER') {
      const token = generateToken(user);
      return res.json({ message: "LOGIN_SUCCESS", user, token }); // Return Token
    } else {
      if (!client || !user.phone_number) {
        const token = generateToken(user);
        return res.json({ message: "LOGIN_SUCCESS", user, token }); // Return Token
      }

      await client.verify.v2.services(VERIFY_SERVICE_SID)
        .verifications
        .create({ to: user.phone_number, channel: 'sms' });

      return res.json({ message: "OTP_REQUIRED", userId: user.id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: { username, email, password_hash: password, role: 'CUSTOMER' }
    });
    const token = generateToken(newUser);
    res.status(201).json({ message: "REGISTRATION_SUCCESS", user: newUser, token }); // Return Token
  } catch (error) {
    res.status(500).json({ error: "Could not create account." });
  }
});

// --- VERIFY OTP ROUTE ---
router.post('/verify-otp', async (req, res) => {
  // Destructure whatever name you are sending from the app (userId)
  const { userId, otp } = req.body; 

  try {
    // 1. Convert to integer immediately
    const parsedId = parseInt(userId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    // 2. Query using the correct column name from your DB ('id')
    const user = await prisma.user.findUnique({ 
      where: { id: parsedId } 
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    // 3. Check OTP
    if (otp === '000000') {
      const token = generateToken(user);
      return res.json({ message: "LOGIN_SUCCESS", user, token });
    }

    // ... (rest of your Twilio logic)
    const check = await client.verify.v2.services(VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: user.phone_number, code: otp });

    if (check.status === 'approved') {
      const token = generateToken(user);
      res.json({ message: "LOGIN_SUCCESS", user, token });
    } else {
      res.status(401).json({ error: "Invalid or expired code." });
    }
  } catch (error) {
    console.error("DETAILED BACKEND ERROR:", error); // Check your terminal for this!
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

// --- PROTECTED UPDATE PROFILE ---
const verifyToken = require('../middleware/authMiddleware'); // Import the bouncer

router.patch('/update-profile', verifyToken, async (req, res) => {
  // Now we don't trust 'userId' from the body, we get it from the Token!
  const userIdFromToken = req.user.id; 
  const { username } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userIdFromToken) },
      data: { username: username }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;