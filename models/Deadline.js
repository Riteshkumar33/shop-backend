const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true,
  },
  dueDate: {
    type: Date,
    required: true,
    index: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  notifiedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Deadline', deadlineSchema);
