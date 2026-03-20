const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Shared Login & Signup
router.post('/login-signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { username } });

    // Signup logic
    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          password_hash: password, // Reminder: Use bcrypt in production
          role: 'CUSTOMER' 
        }
      });
    }

    // Role check
    if (user.role === 'CUSTOMER') {
      return res.json({ message: "LOGIN_SUCCESS", user });
    } else {
      // Staff/Admin: Generate 6-digit OTP
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          otp_code: generatedOTP,
          otp_expiry: new Date(Date.now() + 10 * 60000) // 10 min expiry
        }
      });

      console.log(`[SECURITY] OTP for ${user.username}: ${generatedOTP}`);
      return res.json({ message: "OTP_REQUIRED", userId: user.id });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. OTP Verification
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.otp_code !== otp) {
      return res.status(401).json({ error: "Invalid OTP code" });
    }

    if (new Date() > user.otp_expiry) {
      return res.status(401).json({ error: "OTP has expired" });
    }

    // Clear OTP after successful use
    await prisma.user.update({
      where: { id: userId },
      data: { otp_code: null, otp_expiry: null }
    });

    res.json({ message: "LOGIN_SUCCESS", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/guest-login', async (req, res) => {
  try {
    const guestUser = await prisma.user.create({
      data: {
        username: `guest_${Math.floor(Math.random() * 1000000)}`,
        password_hash: "GUEST_ACCOUNT", // Placeholder
        role: 'CUSTOMER'
      }
    });
    res.json({ message: "GUEST_LOGIN_SUCCESS", user: guestUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;