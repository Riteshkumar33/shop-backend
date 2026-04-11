const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
});

messageSchema.index({ chatId: 1, sentAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
