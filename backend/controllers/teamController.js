const Team = require('../models/Team');
const User = require('../models/User');

exports.getAll = async (req, res, next) => {
  try {
    // Return teams the user belongs to (if authenticated) or all teams
    const teams = await Team.find();
    res.json({ success: true, data: teams });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.user');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, color, members } = req.body;
    const team = await Team.create({ name, description, color, initials: (name || '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(), members, createdBy: req.user ? req.user._id : null });
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Team removed' });
  } catch (err) { next(err); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    team.members.push({ user: userId, role });
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    team.members = team.members.filter(m => String(m.user) !== String(userId));
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};
