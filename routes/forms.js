const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const Document = require('../models/Document');
const Deadline = require('../models/Deadline');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { validate, formSchema, formUpdateSchema, statusUpdateSchema } = require('../middleware/validate');

// GET /api/forms — list forms
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'shopkeeper') {
      filter.shopkeeperId = req.user._id;
    }

    if (status) filter.status = status;

    const forms = await Form.find(filter)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Form.countDocuments(filter);

    res.json({ forms, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// POST /api/forms — create a new form (customer only)
router.post('/', authMiddleware, requireRole('customer'), validate(formSchema), async (req, res, next) => {
  try {
    const form = await Form.create({
      ...req.body,
      customerId: req.user._id,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'form_submit',
      details: { formId: form._id },
      ip: req.ip,
    });

    const populated = await Form.findById(form._id)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// GET /api/forms/:id — get form details
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar');

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check access
    if (
      req.user.role === 'customer' && form.customerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (
      req.user.role === 'shopkeeper' && form.shopkeeperId?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await Document.find({ formId: form._id });
    const deadline = await Deadline.findOne({ formId: form._id });

    res.json({ form, documents, deadline });
  } catch (err) {
    next(err);
  }
});

// PUT /api/forms/:id — update form (customer only, if pending)
router.put('/:id', authMiddleware, requireRole('customer'), validate(formUpdateSchema), async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (form.status !== 'pending') {
      return res.status(400).json({ error: 'Can only edit pending forms' });
    }

    Object.assign(form, req.body);
    await form.save();

    const populated = await Form.findById(form._id)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/forms/:id/status — shopkeeper updates status
router.put('/:id/status', authMiddleware, requireRole('shopkeeper'), validate(statusUpdateSchema), async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.shopkeeperId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    form.status = req.body.status;
    await form.save();

    // If dueDate is provided, create/update deadline
    if (req.body.dueDate) {
      await Deadline.findOneAndUpdate(
        { formId: form._id },
        { dueDate: req.body.dueDate, completed: req.body.status === 'complete' },
        { upsert: true, new: true }
      );
    }

    // If completing, mark deadline as done
    if (req.body.status === 'complete') {
      await Deadline.findOneAndUpdate(
        { formId: form._id },
        { completed: true }
      );
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'form_status_update',
      details: { formId: form._id, status: form.status },
      ip: req.ip,
    });

    const populated = await Form.findById(form._id)
      .populate('customerId', 'name email mobile avatar')
      .populate('shopkeeperId', 'name email avatar');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/forms/:id — delete form (customer only, if pending)
router.delete('/:id', authMiddleware, requireRole('customer'), async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (form.status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending forms' });
    }

    await Document.deleteMany({ formId: form._id });
    await Deadline.deleteMany({ formId: form._id });
    await form.deleteOne();

    res.json({ message: 'Form deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
