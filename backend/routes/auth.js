const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');

// Environment Variables for Twilio
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Only initialize Twilio if keys exist
let client;
if (TWILIO_SID && TWILIO_AUTH) {
    client = twilio(TWILIO_SID, TWILIO_AUTH);
}

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
      // Logic stripped: Removed token generation
      return res.json({ message: "LOGIN_SUCCESS", user });
    } else {
      // For Staff/Admin: Bypass OTP if Twilio is missing
      if (!client || !user.phone_number) {
        console.log("⚠️ SMS Bypass: Logging in directly.");
        return res.json({ message: "LOGIN_SUCCESS", user });
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
    // Logic stripped: Removed token generation
    res.status(201).json({ message: "REGISTRATION_SUCCESS", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Could not create account." });
  }
});

// --- VERIFY OTP ROUTE ---
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // DEV BYPASS: Use '000000' to skip Twilio wait
    if (otp === '000000') {
        return res.json({ message: "LOGIN_SUCCESS", user });
    }

    const check = await client.verify.v2.services(VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: user.phone_number, code: otp });

    if (check.status === 'approved') {
      res.json({ message: "LOGIN_SUCCESS", user });
    } else {
      res.status(401).json({ error: "Invalid or expired code." });
    }
  } catch (error) {
    res.status(500).json({ error: "Verification failed." });
  }
});

module.exports = router;