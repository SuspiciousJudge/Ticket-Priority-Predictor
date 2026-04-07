const User = require('../models/User');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function isSelf(req, targetUserId) {
  return String(req.user?._id) === String(targetUserId);
}

function isPrivileged(req) {
  return req.user?.role === 'admin' || req.user?.role === 'manager';
}

exports.getAll = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'manager' && req.user.team) {
      query.team = req.user.team;
    }

    const users = await User.find(query).select('-password -resetPasswordToken -resetPasswordExpire');
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!isSelf(req, req.params.id) && !isPrivileged(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.role === 'manager' && user.team && req.user.team && String(user.team) !== String(req.user.team)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!isSelf(req, req.params.id) && !isPrivileged(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const allowedSelfFields = ['name', 'avatar', 'expertise'];
    const allowedPrivilegedFields = ['role', 'team', 'isActive'];
    const allowedFields = isPrivileged(req) ? [...allowedSelfFields, ...allowedPrivilegedFields] : allowedSelfFields;

    const updates = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getTickets = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!isSelf(req, req.params.id) && !isPrivileged(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const tickets = await Ticket.find({ assignee: req.params.id }).populate('team').populate('createdBy');
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};

exports.getPerformance = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!isSelf(req, req.params.id) && !isPrivileged(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Simple metrics for demo
    const totalAssigned = await Ticket.countDocuments({ assignee: req.params.id });
    const resolved = await Ticket.countDocuments({ assignee: req.params.id, status: { $in: ['Resolved', 'Closed'] } });
    res.json({ success: true, data: { totalAssigned, resolved, resolutionRate: totalAssigned ? Math.round((resolved / totalAssigned) * 100) : 0 } });
  } catch (err) { next(err); }
};
