const { body, validationResult } = require('express-validator');

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Build a per-field error map for easy frontend consumption
      const fieldErrors = {};
      errors.array().forEach((e) => {
        if (!fieldErrors[e.path]) fieldErrors[e.path] = e.msg;
      });
      return res.status(400).json({
        success: false,
        message: Object.values(fieldErrors).join('. '),
        fieldErrors,
        errors: errors.array(),
      });
    }
    next();
  }
];

exports.loginValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach((e) => {
        if (!fieldErrors[e.path]) fieldErrors[e.path] = e.msg;
      });
      return res.status(400).json({
        success: false,
        message: Object.values(fieldErrors).join('. '),
        fieldErrors,
        errors: errors.array(),
      });
    }
    next();
  }
];
