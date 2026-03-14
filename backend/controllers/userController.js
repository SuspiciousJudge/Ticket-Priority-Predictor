const User = require('../models/User');
const Ticket = require('../models/Ticket');

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // password change via dedicated endpoint
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ assignee: req.params.id }).populate('team').populate('createdBy');
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};

exports.getPerformance = async (req, res, next) => {
  try {
    // Simple metrics for demo
    const totalAssigned = await Ticket.countDocuments({ assignee: req.params.id });
    const resolved = await Ticket.countDocuments({ assignee: req.params.id, status: { $in: ['Resolved', 'Closed'] } });
    res.json({ success: true, data: { totalAssigned, resolved, resolutionRate: totalAssigned ? Math.round((resolved / totalAssigned) * 100) : 0 } });
  } catch (err) { next(err); }
};
