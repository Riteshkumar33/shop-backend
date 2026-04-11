const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

chatSchema.index({ customerId: 1, shopkeeperId: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
