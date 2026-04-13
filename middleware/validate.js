const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(d => d.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
};

const formSchema = Joi.object({
  applicantName: Joi.string().trim().min(2).max(100).required(),
  fatherName: Joi.string().trim().min(2).max(100).required(),
  mobileNumber: Joi.string().trim().pattern(/^\+?[\d\s-]{7,15}$/).required()
    .messages({ 'string.pattern.base': 'Invalid mobile number' }),
  email: Joi.string().email().allow('', null).optional(),
  address: Joi.string().trim().max(500).allow('', null).optional(),
  dateOfBirth: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().valid('', null)
  ).optional(),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  shopkeeperId: Joi.string().hex().length(24).required(),
});

const formUpdateSchema = Joi.object({
  applicantName: Joi.string().trim().min(2).max(100),
  fatherName: Joi.string().trim().min(2).max(100),
  mobileNumber: Joi.string().trim().pattern(/^\+?[1-9]\d{6,14}$/),
  email: Joi.string().email().allow(''),
  address: Joi.string().trim().max(500).allow(''),
  dateOfBirth: Joi.date().iso().allow(null),
  description: Joi.string().trim().max(1000).allow(''),
}).min(1);

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('applied', 'complete').required(),
  dueDate: Joi.date().iso().greater('now').optional(),
});

module.exports = {
  validate,
  formSchema,
  formUpdateSchema,
  statusUpdateSchema,
};
