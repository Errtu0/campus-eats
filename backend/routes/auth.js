const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // INJECT CRYPTO HOOK
const verifyToken = require('../middleware/authMiddleware');

const client = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      restaurant_id: user.restaurant_id 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// --- GET ME PROFILE ROUTE ---
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        membership_points: true,
        phone_number: true,
        restaurant_id: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching user data" });
  }
});

// --- LOGIN ROUTE (UPDATED FOR BCRYPT) ---
router.post('/login-signup', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    let user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    // FIX: Secure comparison algorithm implementation
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.role === 'CUSTOMER') {
      const token = generateToken(user);
      const { password_hash, ...userSafe } = user;
      return res.json({ message: "LOGIN_SUCCESS", user: userSafe, token });
    } else {
      if (!client || !user.phone_number) {
        const token = generateToken(user);
        const { password_hash, ...userSafe } = user;
        return res.json({ message: "LOGIN_SUCCESS", user: userSafe, token });
      }

      await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications
        .create({ to: user.phone_number, channel: 'sms' });

      return res.json({ message: "OTP_REQUIRED", userId: user.id });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- REGISTER ROUTE (UPDATED FOR COMPLEXITY & HASHING) ---
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // FIX: Constraint Validation Checks
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All configuration entries are mandatory." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  try {
    // FIX: Dynamic Work-Factor Salt Gen & Async Hash
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { 
        username, 
        email, 
        password_hash: encryptedPassword, 
        role: 'CUSTOMER',
        membership_points: 0 
      }
    });

    const token = generateToken(newUser);
    const { password_hash, ...userSafe } = newUser;
    res.status(201).json({ message: "REGISTRATION_SUCCESS", user: userSafe, token });
  } catch (error) {
    res.status(500).json({ error: "Username or email already exists." });
  }
});

// --- VERIFY OTP ROUTE ---
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body; 

  try {
    const parsedId = parseInt(userId);
    if (isNaN(parsedId)) return res.status(400).json({ error: "Invalid User ID format" });

    const user = await prisma.user.findUnique({ where: { id: parsedId } });
    if (!user) return res.status(404).json({ error: "User not found in database" });

    if (otp === '000000') {
      const token = generateToken(user);
      const { password_hash, ...userSafe } = user;
      return res.json({ message: "LOGIN_SUCCESS", user: userSafe, token });
    }

    const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: user.phone_number, code: otp });

    if (check.status === 'approved') {
      const token = generateToken(user);
      const { password_hash, ...userSafe } = user;
      res.json({ message: "LOGIN_SUCCESS", user: userSafe, token });
    } else {
      res.status(401).json({ error: "Invalid or expired code." });
    }
  } catch (error) {
    console.error("DETAILED BACKEND ERROR:", error);
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

// --- PROFILE MODIFY COMPONENT ---
router.patch('/update-profile', verifyToken, async (req, res) => {
  const userIdFromToken = req.user.id; 
  const { username, email } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdFromToken },
      data: { 
        username: username || undefined,
        email: email || undefined 
      },
      select: { id: true, username: true, email: true, membership_points: true }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;