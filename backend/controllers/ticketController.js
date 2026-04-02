const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { predictPriority } = require('../utils/mlPredict');
const { generateTicketId } = require('../utils/helpers');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

function getSlaDeadline(priority, createdAt = new Date()) {
  const date = new Date(createdAt);
  if (priority === 'Critical') date.setHours(date.getHours() + 4);
  else if (priority === 'High') date.setHours(date.getHours() + 12);
  else if (priority === 'Medium') date.setHours(date.getHours() + 48);
  else date.setHours(date.getHours() + 120);
  return date;
}

exports.getAll = async (req, res, next) => {
  try {
    const { priority, status, team, search, sort = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
    const query = {};
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (team && mongoose.Types.ObjectId.isValid(team)) query.team = team;
    if (search) query.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { ticketId: new RegExp(search, 'i') }];

    // Build sort object
    const sortObj = {};
    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    sortObj[sortField] = order === 'asc' ? 1 : -1;

    const total = await Ticket.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const tickets = await Ticket.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('team', 'name color initials')
      .lean();

    res.json({ success: true, data: { tickets, totalPages, currentPage: Number(page), total } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignee', 'name email avatar role')
      .populate('createdBy', 'name email')
      .populate('team', 'name color initials')
      .populate('comments.author', 'name email avatar');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, category, customerTier, team: teamId, attachments } = req.body;
    const ticketId = generateTicketId();
    const ai = await predictPriority(title, description, customerTier);

    // Suggest assignee by expertise
    let suggested = null;
    if (ai.tags && ai.tags.length > 0) {
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
      attachments: attachments || [],
      aiPredictions: { predictedPriority: ai.priority, confidence: ai.confidence, reasoning: ai.reasoning },
      slaDeadline: getSlaDeadline(ai.priority),
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_created', ticket);
      if (ticket.team) io.to(`team_${ticket.team}`).emit('team_ticket_created', ticket);
    }

    // Find similar tickets using text index (safe — index now exists)
    try {
      const similar = await Ticket.find(
        { $text: { $search: title }, _id: { $ne: ticket._id } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(5).select('ticketId title');
      ticket.similarTickets = similar.map(s => ({ ticketId: s.ticketId || String(s._id), similarity: 0.7 }));
      await ticket.save();
    } catch (textErr) {
      // Gracefully handle if text index is not yet built
      console.warn('Text search for similar tickets skipped:', textErr.message);
    }

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.body.priority) {
      req.body.slaDeadline = getSlaDeadline(req.body.priority);
    }
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('team', 'name color initials');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_updated', ticket);
      if (ticket.team) io.to(`team_${ticket.team._id || ticket.team}`).emit('team_ticket_updated', ticket);
    }

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ticket.comments.push({ author: req.user ? req.user._id : null, text: text.trim() });
    await ticket.save();
    
    // Return populated version
    const populated = await Ticket.findById(ticket._id)
      .populate('comments.author', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const [total, byPriority, byStatus, byCategory, avgResolution, todayResolved] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: { resolutionTime: { $exists: true } } }, { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }]),
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Ticket.countDocuments({ status: 'Resolved', updatedAt: { $gte: today } });
      })(),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byPriority,
        byStatus,
        byCategory,
        avgResolution: avgResolution[0]?.avg || 0,
        todaysResolved: todayResolved,
      },
    });
  } catch (err) { next(err); }
};

exports.similar = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const similar = await Ticket.find({ _id: { $ne: ticket._id }, tags: { $in: ticket.tags } })
      .limit(5)
      .select('ticketId title priority status createdAt')
      .lean();
    res.json({ success: true, data: similar });
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignee', 'email')
      .populate('team', 'name')
      .lean();
    
    const fields = ['ticketId', 'title', 'priority', 'status', 'category', 'team.name', 'assignee.email', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tickets);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('tickets.csv');
    return res.send(csv);
  } catch (err) { next(err); }
};
