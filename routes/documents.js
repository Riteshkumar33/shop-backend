const express = require('express');
const router = express.Router();
const path = require('path');
const Document = require('../models/Document');
const Form = require('../models/Form');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getFileUrl, getFilePath, deleteFile } = require('../services/storageService');

// POST /api/documents — upload a document
router.post('/', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { formId, type } = req.body;
    if (!formId || !type) {
      return res.status(400).json({ error: 'formId and type are required' });
    }

    // Verify form exists and user has access
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const doc = await Document.create({
      formId,
      type,
      url: getFileUrl(req.file.filename),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/file/:filename — serve file
router.get('/file/:filename', authMiddleware, (req, res, next) => {
  try {
    const filePath = getFilePath(req.params.filename);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id — get document metadata
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id — delete a document
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const form = await Form.findById(doc.formId);
    if (!form || form.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (form.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete documents from non-pending forms' });
    }

    deleteFile(doc.filename);
    await doc.deleteOne();

    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
