const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { verifyGoogleToken } = require('../services/googleAuth');
const { sendOTP, verifyOTP } = require('../services/twilioService');
const { signToken } = require('../utils/jwt');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/google — Google OAuth login
router.post('/google', async (req, res, next) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    const googleData = await verifyGoogleToken(credential);

    let user = await User.findOne({ googleId: googleData.googleId });
    if (!user) {
      user = await User.findOne({ email: googleData.email });
      if (user) {
        user.googleId = googleData.googleId;
        user.avatar = googleData.avatar;
        await user.save();
      } else {
        user = await User.create({
          email: googleData.email,
          name: googleData.name,
          googleId: googleData.googleId,
          avatar: googleData.avatar,
          role: role || 'customer',
        });
      }
    }

    const token = signToken({ id: user._id, role: user.role });

    await AuditLog.create({
      userId: user._id,
      action: 'login_google',
      ip: req.ip,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/otp/send — Send OTP via SMS
router.post('/otp/send', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const result = await sendOTP(phone);
    res.json({ message: 'OTP sent', status: result.status });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/otp/verify — Verify OTP and issue token
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code, name, role } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code required' });
    }

    const result = await verifyOTP(phone, code);
    if (result.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ mobile: phone });
    if (!user) {
      user = await User.create({
        mobile: phone,
        name: name || '',
        role: role || 'customer',
      });
    }

    const token = signToken({ id: user._id, role: user.role });

    await AuditLog.create({
      userId: user._id,
      action: 'login_otp',
      ip: req.ip,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      role: req.user.role,
      avatar: req.user.avatar,
    },
  });
});

module.exports = router;
