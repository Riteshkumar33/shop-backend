const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  applicantName: {
    type: String,
    required: true,
    trim: true,
  },
  fatherName: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'complete', 'overdue'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

formSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Form', formSchema);
