const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
