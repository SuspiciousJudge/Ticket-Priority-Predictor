const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { predictPriority } = require('../utils/mlPredict');
const { generateTicketId } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.getAll = async (req, res, next) => {
  try {
    const { priority, status, team, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (team && mongoose.Types.ObjectId.isValid(team)) query.team = team;
    if (search) query.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { ticketId: new RegExp(search, 'i') }];

    const total = await Ticket.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const tickets = await Ticket.find(query).skip((page - 1) * limit).limit(Number(limit)).populate('assignee').populate('createdBy').populate('team');
    res.json({ success: true, data: { tickets, totalPages, currentPage: Number(page), total } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('assignee').populate('createdBy').populate('team');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, category, customerTier, team: teamId } = req.body;
    const ticketId = generateTicketId();
    const ai = await predictPriority(title, description, customerTier);

    // Suggest assignee by expertise (simple): find user with matching expertise
    let suggested = null;
    if (req.body.suggestExpertise) {
      const users = await User.find({ expertise: { $in: ai.tags } });
      suggested = users[0] || null;
    }

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      priority: ai.priority,
      status: 'Open',
      category,
      customerTier,
      assignee: suggested ? suggested._id : null,
      team: teamId || null,
      createdBy: req.user ? req.user._id : null,
      sentiment: ai.sentiment,
      confidence: ai.confidence,
      estimatedTime: ai.estimatedTime,
      tags: ai.tags,
      aiPredictions: { predictedPriority: ai.priority, confidence: ai.confidence, reasoning: ai.reasoning },
    });

    // Find similar tickets (very simple text match)
    const similar = await Ticket.find({ $text: { $search: title } }).limit(5).select('ticketId');
    ticket.similarTickets = similar.map(s => ({ ticketId: s.ticketId || String(s._id), similarity: 0.7 }));
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    // Hard delete
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ticket.comments.push({ author: req.user ? req.user._id : null, text });
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const total = await Ticket.countDocuments();
    const byPriority = await Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
    const byStatus = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const byCategory = await Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const avgResolution = await Ticket.aggregate([{ $match: { resolutionTime: { $exists: true } } }, { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }]);
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayResolved = await Ticket.countDocuments({ status: 'Resolved', updatedAt: { $gte: today } });

    res.json({ success: true, data: { total, byPriority, byStatus, byCategory, avgResolution: avgResolution[0]?.avg || 0, todaysResolved: todayResolved } });
  } catch (err) { next(err); }
};

exports.similar = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    // Simple similarity by tag overlap
    const similar = await Ticket.find({ _id: { $ne: ticket._id }, tags: { $in: ticket.tags } }).limit(5);
    res.json({ success: true, data: similar });
  } catch (err) { next(err); }
};
