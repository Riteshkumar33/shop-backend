const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// GET /api/chats — list user's chats
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const filter = req.user.role === 'customer'
      ? { customerId: req.user._id }
      : { shopkeeperId: req.user._id };

    const chats = await Chat.find(filter)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar')
      .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (err) {
    next(err);
  }
});

// POST /api/chats — create or get existing chat
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { shopkeeperId, customerId } = req.body;

    const cId = req.user.role === 'customer' ? req.user._id : customerId;
    const sId = req.user.role === 'shopkeeper' ? req.user._id : shopkeeperId;

    if (!cId || !sId) {
      return res.status(400).json({ error: 'Both customer and shopkeeper IDs required' });
    }

    let chat = await Chat.findOne({ customerId: cId, shopkeeperId: sId });
    if (!chat) {
      chat = await Chat.create({ customerId: cId, shopkeeperId: sId });
    }

    chat = await Chat.findById(chat._id)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar');

    res.json(chat);
  } catch (err) {
    next(err);
  }
});

// GET /api/chats/:chatId/messages — paginated message history
router.get('/:chatId/messages', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Verify access
    const userId = req.user._id.toString();
    if (chat.customerId.toString() !== userId && chat.shopkeeperId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar');

    const total = await Message.countDocuments({ chatId: req.params.chatId });

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
