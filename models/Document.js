const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['photo', 'certificate', 'signature', 'id_proof', 'other'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Document', documentSchema);
