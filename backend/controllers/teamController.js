const Team = require('../models/Team');
const User = require('../models/User');
const mongoose = require('mongoose');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function isManager(req) {
  return req.user?.role === 'manager';
}

function canManageTeam(req, team) {
  if (isAdmin(req)) return true;
  if (isManager(req) && req.user?.team && String(req.user.team) === String(team._id)) return true;
  return false;
}

exports.getAll = async (req, res, next) => {
  try {
    let query = {};
    if (!isAdmin(req)) {
      query = {
        $or: [
          { _id: req.user.team || null },
          { 'members.user': req.user._id },
          { createdBy: req.user._id },
        ],
      };
    }

    const teams = await Team.find(query);
    res.json({ success: true, data: teams });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const team = await Team.findById(req.params.id).populate('members.user');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (!isAdmin(req)) {
      const isMember = team.members.some((m) => String(m.user?._id || m.user) === String(req.user._id));
      const isCreator = String(team.createdBy) === String(req.user._id);
      const isOwnTeamManager = isManager(req) && req.user.team && String(req.user.team) === String(team._id);
      if (!isMember && !isCreator && !isOwnTeamManager) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const members = Array.isArray(req.body.members) ? req.body.members : [];
    const safeMembers = members.filter((m) => isValidObjectId(m.user));

    const team = await Team.create({
      name,
      description,
      color,
      initials: (name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      members: safeMembers,
      createdBy: req.user ? req.user._id : null,
    });

    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!canManageTeam(req, team)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const allowedFields = ['name', 'description', 'color', 'settings', 'activeTickets'];
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        team[key] = req.body[key];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      team.initials = (team.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    }

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await team.deleteOne();
    res.json({ success: true, message: 'Team removed' });
  } catch (err) { next(err); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!isValidObjectId(req.params.id) || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid team or user id' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!canManageTeam(req, team)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyMember = team.members.some((m) => String(m.user) === String(userId));
    if (!alreadyMember) {
      team.members.push({ user: userId, role: role || 'member' });
    }

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(req.params.id) || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid team or user id' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!canManageTeam(req, team)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    team.members = team.members.filter(m => String(m.user) !== String(userId));
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};
