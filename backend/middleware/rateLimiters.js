const rateLimit = require('express-rate-limit');

const defaultOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
};

const generalApiLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX || 1000),
});

const authLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 100),
});

const aiLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_MAX || 30),
});

const heavyExportLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_EXPORT_MAX || 30),
});

module.exports = {
  generalApiLimiter,
  authLimiter,
  aiLimiter,
  heavyExportLimiter,
};