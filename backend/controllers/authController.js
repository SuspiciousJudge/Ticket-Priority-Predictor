const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const SALT_ROUNDS = process.env.NODE_ENV === 'production' ? 10 : 8;

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use. Try logging in instead.',
        fieldErrors: { email: 'Email already in use. Try logging in instead.' },
      });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed, role: 'agent' });
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use. Try logging in instead.',
        fieldErrors: { email: 'Email already in use. Try logging in instead.' },
      });
    }
    if (err.name === 'ValidationError') {
      const fieldErrors = {};
      Object.keys(err.errors).forEach((field) => {
        fieldErrors[field] = err.errors[field].message;
      });
      return res.status(400).json({
        success: false,
        message: Object.values(fieldErrors).join('. '),
        fieldErrors,
      });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    res.json({ success: true, data: req.user });
  } catch (err) { next(err); }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(200).json({ success: true, message: 'If that email exists, we sent reset instructions' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.status(200).json({ success: true, message: 'If that email exists, we sent reset instructions' });

    // Generate a real reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // In production, email delivery should be used instead of returning token payloads.
    res.json({
      success: true,
      message: 'If that email exists, we sent reset instructions',
    });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Hash the incoming token and compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset fields
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) { next(err); }
};
