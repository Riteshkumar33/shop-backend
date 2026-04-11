const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['customer', 'shopkeeper'],
    default: 'customer',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  avatar: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
