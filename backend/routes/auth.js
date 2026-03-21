const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

router.post('/login-signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("Input Username:", username);
console.log("Input Password:", password);

    let user = await prisma.user.findUnique({ where: { username } });
    

    // 1. If user doesn't exist, create them as a CUSTOMER (Signup)
    if (!user) {
      console.log("No user found with that name");
      user = await prisma.user.create({
        data: { username, password_hash: password, role: 'CUSTOMER' }
      });
      // New users are customers, so login immediately
      return res.json({ message: "LOGIN_SUCCESS", user });
    } else {
    console.log("Found User:", user.username);
    console.log("DB Password:", user.password_hash);
    
    if (user.password_hash !== password) {
        console.log("PASSWORD MISMATCH!");
        return res.status(401).json({ error: "Invalid username or password." });
    
    }
  }
    // 2. If user EXISTS, you MUST check the password!
    // Since you're not using bcrypt yet, we compare strings directly
    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // 3. Password is correct, now check Role
    if (user.role === 'CUSTOMER') {
      return res.json({ message: "LOGIN_SUCCESS", user });
    } else {
      // STAFF/ADMIN Logic
      if (!user.phone_number) {
        return res.status(400).json({ error: "No phone number linked to this account." });
      }

      const verification = await client.verify.v2.services(VERIFY_SERVICE_SID)
        .verifications
        .create({ to: user.phone_number, channel: 'sms' });

      console.log(`[VERIFY] Code sent to ${user.phone_number}. Status: ${verification.status}`);
      return res.json({ message: "OTP_REQUIRED", userId: user.id });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Check code with Twilio
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

// Guest Login
router.post('/guest-login', async (req, res) => {
  try {
    const guestUser = await prisma.user.create({
      data: {
        username: `guest_${Math.floor(Math.random() * 1000000)}`,
        password_hash: "GUEST_ACCOUNT",
        role: 'CUSTOMER'
      }
    });
    res.json({ message: "GUEST_LOGIN_SUCCESS", user: guestUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;