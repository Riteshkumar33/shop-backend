const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users — list shopkeepers (for customer to select)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('name email mobile role avatar')
      .sort({ name: 1 });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me — already handled in auth.js, but alias here
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    mobile: req.user.mobile,
    role: req.user.role,
    avatar: req.user.avatar,
  });
});

// PUT /api/users/me — update profile
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
