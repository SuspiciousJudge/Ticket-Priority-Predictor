const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { predictPriority } = require('../utils/mlPredict');
const { generateTicketId } = require('../utils/helpers');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

function tokenizeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 1);
}

function termFrequency(tokens = []) {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function cosineSimilarity(tfA, tfB) {
  if (!tfA || !tfB || tfA.size === 0 || tfB.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const valA of tfA.values()) {
    normA += valA * valA;
  }

  for (const [token, valB] of tfB.entries()) {
    normB += valB * valB;
    const valA = tfA.get(token) || 0;
    dot += valA * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getSlaDeadline(priority, createdAt = new Date()) {
  const date = new Date(createdAt);
  if (priority === 'Critical') date.setHours(date.getHours() + 4);
  else if (priority === 'High') date.setHours(date.getHours() + 12);
  else if (priority === 'Medium') date.setHours(date.getHours() + 48);
  else date.setHours(date.getHours() + 120);
  return date;
}

function getPriorityWeight(priority) {
  if (priority === 'Critical') return 4;
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
}

function calculateImpactScore({ customerTier, priority, affectedUsers = 1, title = '', description = '' }) {
  const tierScoreMap = {
    Enterprise: 30,
    Business: 22,
    Professional: 16,
    Premium: 14,
    Basic: 10,
    Free: 6,
  };

  const priorityScoreMap = {
    Critical: 35,
    High: 25,
    Medium: 15,
    Low: 8,
  };

  const combinedText = `${title} ${description}`.toLowerCase();
  const wideImpact = /all users|multiple users|companywide|entire team|across organization/.test(combinedText) ? 12 : 0;
  const securityImpact = /security|unauthorized|breach|data loss|payment/.test(combinedText) ? 10 : 0;

  const usersScore = Math.min(18, Math.round(Math.log10(Math.max(1, affectedUsers)) * 9));
  const total = (tierScoreMap[customerTier] || 10) + (priorityScoreMap[priority] || 15) + usersScore + wideImpact + securityImpact;
  return Math.min(100, Math.max(0, total));
}

function getSlaRiskLevel(ticket) {
  if (!ticket?.slaDeadline) return 'No SLA';
  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) return 'Breached';
  if (diffHours <= 2) return 'At Risk';
  if (diffHours <= 8) return 'Warning';
  return 'Healthy';
}

function buildEscalationAdvice(ticket) {
  const text = `${ticket?.title || ''} ${ticket?.description || ''}`.toLowerCase();
  const isCriticalKeyword = /outage|service down|crash|security breach|data loss|payment failed/.test(text);
  const wideImpact = /all users|multiple users|companywide|entire team/.test(text);
  const slaRisk = getSlaRiskLevel(ticket);

  if (ticket?.priority === 'Critical' || isCriticalKeyword || wideImpact || slaRisk === 'Breached') {
    return {
      shouldEscalate: true,
      level: 'L3 Incident',
      reason: 'Critical impact or SLA breach risk detected.',
    };
  }

  if (ticket?.priority === 'High' || slaRisk === 'At Risk') {
    return {
      shouldEscalate: true,
      level: 'L2 Priority',
      reason: 'High priority ticket with elevated delivery risk.',
    };
  }

  return {
    shouldEscalate: false,
    level: 'Standard',
    reason: 'No immediate escalation criteria matched.',
  };
}

const PLAYBOOKS = {
  Authentication: ['Verify identity provider health', 'Check token/cookie expiry', 'Reproduce on affected browser and network'],
  Performance: ['Inspect slow queries and response time', 'Check cache hit ratio', 'Scale workers if queue is growing'],
  Billing: ['Validate payment gateway callbacks', 'Check duplicate transaction IDs', 'Confirm invoice generation job'],
  Authorization: ['Validate role mappings', 'Rebuild permissions cache', 'Audit recent policy changes'],
  Support: ['Collect exact reproduction steps', 'Attach logs/screenshots', 'Assign based on expertise tags'],
};

exports.getAll = async (req, res, next) => {
  try {
    const { priority, status, team, search, sort = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
    const query = {};
    if (priority) {
      const priorities = String(priority).split(',').map((p) => p.trim()).filter(Boolean);
      query.priority = priorities.length > 1 ? { $in: priorities } : priorities[0];
    }
    if (status) {
      const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
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
      .populate('comments.author', 'name email avatar')
      .populate('statusHistory.changedBy', 'name email')
      .populate('priorityOverrideAudit.overriddenBy', 'name email');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const escalationAdvice = buildEscalationAdvice(ticket);
    const playbook = PLAYBOOKS[ticket.category] || PLAYBOOKS.Support;

    res.json({
      success: true,
      data: {
        ...ticket.toObject(),
        escalationAdvice,
        playbook,
      },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, category, customerTier, team: teamId, attachments, priority: requestedPriority, affectedUsers } = req.body;
    const ticketId = generateTicketId();
    const ai = await predictPriority(title, description, customerTier);
    const allowedPriorities = ['Critical', 'High', 'Medium', 'Low'];
    const allowedCustomerTiers = ['Enterprise', 'Business', 'Professional', 'Premium', 'Basic', 'Free'];
    const finalPriority = allowedPriorities.includes(requestedPriority) ? requestedPriority : ai.priority;
    const normalizedCustomerTier = allowedCustomerTiers.includes(customerTier) ? customerTier : 'Basic';
    const impactScore = calculateImpactScore({
      customerTier: normalizedCustomerTier,
      priority: finalPriority,
      affectedUsers: Number(affectedUsers) || 1,
      title,
      description,
    });

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
      priority: finalPriority,
      status: 'Open',
      category,
      customerTier: normalizedCustomerTier,
      assignee: suggested ? suggested._id : null,
      team: teamId || null,
      createdBy: req.user ? req.user._id : null,
      sentiment: ai.sentiment,
      confidence: ai.confidence,
      estimatedTime: ai.estimatedTime,
      tags: ai.tags,
      attachments: attachments || [],
      affectedUsers: Number(affectedUsers) || 1,
      impactScore,
      statusHistory: [{ from: 'New', to: 'Open', changedBy: req.user ? req.user._id : null }],
      aiPredictions: { predictedPriority: ai.priority, confidence: ai.confidence, reasoning: ai.reasoning },
      slaDeadline: getSlaDeadline(finalPriority),
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
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const prevPriority = ticket.priority;
    const prevStatus = ticket.status;

    Object.assign(ticket, req.body);

    if (req.body.priority) {
      ticket.slaDeadline = getSlaDeadline(req.body.priority);
    }

    if (req.body.priority && req.body.priority !== prevPriority) {
      ticket.priorityOverrideAudit = ticket.priorityOverrideAudit || [];
      ticket.priorityOverrideAudit.push({
        from: prevPriority,
        to: req.body.priority,
        reason: req.body.priorityChangeReason || 'Manual override',
        overriddenBy: req.user ? req.user._id : null,
      });
    }

    if (req.body.status && req.body.status !== prevStatus) {
      ticket.statusHistory = ticket.statusHistory || [];
      ticket.statusHistory.push({
        from: prevStatus,
        to: req.body.status,
        changedBy: req.user ? req.user._id : null,
      });

      const wasClosedLike = prevStatus === 'Resolved' || prevStatus === 'Closed';
      const reopenedNow = req.body.status === 'Open' || req.body.status === 'In Progress';
      if (wasClosedLike && reopenedNow) {
        ticket.reopenCount = (ticket.reopenCount || 0) + 1;
      }
    }

    ticket.impactScore = calculateImpactScore({
      customerTier: ticket.customerTier,
      priority: ticket.priority,
      affectedUsers: ticket.affectedUsers || 1,
      title: ticket.title,
      description: ticket.description,
    });

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('team', 'name color initials');
    
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_updated', populatedTicket);
      if (populatedTicket.team) io.to(`team_${populatedTicket.team._id || populatedTicket.team}`).emit('team_ticket_updated', populatedTicket);
    }

    res.json({ success: true, data: populatedTicket });
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
    const { team } = req.query;
    const match = {};
    if (team && mongoose.Types.ObjectId.isValid(team)) {
      match.team = new mongoose.Types.ObjectId(team);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    const [total, byPriority, byStatus, byCategory, avgResolution, todayResolved] = await Promise.all([
      Ticket.countDocuments(match),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: { ...match, resolutionTime: { $exists: true, $ne: null } } }, { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }]),
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Ticket.countDocuments({ ...match, status: 'Resolved', updatedAt: { $gte: today } });
      })(),
    ]);

    const [ticketsOverTimeAgg, resolutionTrendAgg, heatmapAgg] = await Promise.all([
      Ticket.aggregate([
        { $match: { ...match, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              y: { $year: '$createdAt' },
              m: { $month: '$createdAt' },
              d: { $dayOfMonth: '$createdAt' },
            },
            open: {
              $sum: {
                $cond: [{ $in: ['$status', ['Open', 'In Progress']] }, 1, 0],
              },
            },
            resolved: {
              $sum: {
                $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0],
              },
            },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      ]),
      Ticket.aggregate([
        { $match: { ...match, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              y: { $year: '$createdAt' },
              m: { $month: '$createdAt' },
            },
            total: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0],
              },
            },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Ticket.aggregate([
        { $match: { ...match, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              day: { $isoDayOfWeek: '$createdAt' },
              hour: { $hour: '$createdAt' },
            },
            value: { $sum: 1 },
          },
        },
      ]),
    ]);

    const daysMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

    const heatmapLookup = new Map();
    for (const row of heatmapAgg) {
      heatmapLookup.set(`${row._id.day}-${row._id.hour}`, row.value);
    }
    const heatmapData = [];
    for (let d = 1; d <= 7; d += 1) {
      for (const h of hours) {
        heatmapData.push({
          day: daysMap[d - 1],
          hour: hourLabel(h),
          value: heatmapLookup.get(`${d}-${h}`) || 0,
        });
      }
    }

    const ticketsOverTime = ticketsOverTimeAgg.map((row) => {
      const dt = new Date(Date.UTC(row._id.y, row._id.m - 1, row._id.d));
      return {
        date: dt.toISOString().slice(0, 10),
        open: row.open,
        resolved: row.resolved,
      };
    });

    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const resolutionRateTrend = resolutionTrendAgg.map((row) => ({
      month: `${monthName[row._id.m - 1]} ${String(row._id.y).slice(-2)}`,
      rate: row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0,
    }));

    const openCount = byStatus.find((x) => x._id === 'Open')?.count || 0;
    const inProgressCount = byStatus.find((x) => x._id === 'In Progress')?.count || 0;
    const resolvedCount = byStatus.find((x) => x._id === 'Resolved')?.count || 0;
    const closedCount = byStatus.find((x) => x._id === 'Closed')?.count || 0;

    const funnelData = [
      { stage: 'Open', value: openCount, fill: '#3b82f6' },
      { stage: 'In Progress', value: inProgressCount, fill: '#8b5cf6' },
      { stage: 'Resolved', value: resolvedCount, fill: '#10b981' },
      { stage: 'Closed', value: closedCount, fill: '#14b8a6' },
    ];

    const now = new Date();
    const next8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const [breachedSla, atRiskSla, warningSla, triageQueue, reopenByCategory, overrideStats, workloadByAgentAgg, agentPerfAgg] = await Promise.all([
      Ticket.countDocuments({ ...match, status: { $in: ['Open', 'In Progress'] }, slaDeadline: { $lt: now } }),
      Ticket.countDocuments({ ...match, status: { $in: ['Open', 'In Progress'] }, slaDeadline: { $gte: now, $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) } }),
      Ticket.countDocuments({ ...match, status: { $in: ['Open', 'In Progress'] }, slaDeadline: { $gt: new Date(now.getTime() + 2 * 60 * 60 * 1000), $lte: next8Hours } }),
      Ticket.find({ ...match, status: 'Open', assignee: null })
        .sort({ impactScore: -1, createdAt: -1 })
        .limit(12)
        .select('ticketId title category priority impactScore createdAt')
        .lean(),
      Ticket.aggregate([
        { $match: { ...match, reopenCount: { $gt: 0 } } },
        { $group: { _id: '$category', reopenedTickets: { $sum: 1 }, totalReopens: { $sum: '$reopenCount' } } },
        { $sort: { totalReopens: -1 } },
      ]),
      Ticket.aggregate([
        {
          $project: {
            overrideCount: {
              $size: { $ifNull: ['$priorityOverrideAudit', []] },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOverrides: { $sum: '$overrideCount' },
            ticketsWithOverrides: {
              $sum: {
                $cond: [{ $gt: ['$overrideCount', 0] }, 1, 0],
              },
            },
          },
        },
      ]),
      Ticket.aggregate([
        { $match: { ...match, assignee: { $exists: true, $ne: null }, status: { $in: ['Open', 'In Progress'] } } },
        {
          $group: {
            _id: '$assignee',
            openCount: { $sum: 1 },
            weightedLoad: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                    { case: { $eq: ['$priority', 'High'] }, then: 3 },
                    { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  ],
                  default: 1,
                },
              },
            },
          },
        },
        { $sort: { weightedLoad: -1 } },
      ]),
      Ticket.aggregate([
        { $match: { ...match, assignee: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$assignee',
            resolved: {
              $sum: {
                $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0],
              },
            },
            open: {
              $sum: {
                $cond: [{ $in: ['$status', ['Open', 'In Progress']] }, 1, 0],
              },
            },
            avgResolution: { $avg: '$resolutionTime' },
            total: { $sum: 1 },
          },
        },
        { $sort: { resolved: -1 } },
      ]),
    ]);

    const assigneeIds = [...new Set([...workloadByAgentAgg, ...agentPerfAgg].map((x) => String(x._id)))];
    const assignees = await User.find({ _id: { $in: assigneeIds } }).select('name email').lean();
    const assigneeMap = new Map(assignees.map((u) => [String(u._id), u]));

    const workloadByAgent = workloadByAgentAgg.map((item) => {
      const user = assigneeMap.get(String(item._id));
      return {
        assigneeId: item._id,
        assigneeName: user?.name || 'Unknown',
        openCount: item.openCount,
        weightedLoad: item.weightedLoad,
      };
    });

    const agentPerformance = agentPerfAgg.map((item) => {
      const user = assigneeMap.get(String(item._id));
      const totalHandled = item.total || 1;
      return {
        assigneeId: item._id,
        assigneeName: user?.name || 'Unknown',
        resolved: item.resolved || 0,
        open: item.open || 0,
        resolutionRate: Math.round(((item.resolved || 0) / totalHandled) * 100),
        avgResolution: item.avgResolution || 0,
      };
    });

    res.json({
      success: true,
      data: {
        total,
        byPriority,
        byStatus,
        byCategory,
        avgResolution: avgResolution[0]?.avg || 0,
        todaysResolved: todayResolved,
        ticketsOverTime,
        resolutionRateTrend,
        heatmapData,
        funnelData,
        slaRisk: {
          breached: breachedSla,
          atRisk: atRiskSla,
          warning: warningSla,
        },
        triageQueue,
        reopenByCategory,
        priorityOverrideStats: overrideStats[0] || { totalOverrides: 0, ticketsWithOverrides: 0 },
        workloadByAgent,
        agentPerformance,
      },
    });
  } catch (err) { next(err); }
};

exports.similar = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const baseText = `${ticket.title || ''} ${ticket.description || ''}`.trim();
    const baseTf = termFrequency(tokenizeText(baseText));

    const candidates = await Ticket.find({ _id: { $ne: ticket._id } })
      .select('ticketId title description priority status createdAt updatedAt assignee comments')
      .populate('assignee', 'name email avatar')
      .lean();

    const ranked = candidates
      .map((candidate) => {
        const candidateText = `${candidate.title || ''} ${candidate.description || ''}`.trim();
        const candidateTf = termFrequency(tokenizeText(candidateText));
        const score = cosineSimilarity(baseTf, candidateTf);
        const likelyFix = candidate.status === 'Resolved' || candidate.status === 'Closed'
          ? (candidate.comments?.[candidate.comments.length - 1]?.text || candidate.description || '').slice(0, 180)
          : null;

        return {
          ...candidate,
          similarityScore: Number(score.toFixed(4)),
          similarityPercent: Number((score * 100).toFixed(1)),
          likelyFix,
        };
      })
      .filter((item) => item.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    res.json({ success: true, data: ranked });
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

exports.executiveSnapshotPdf = async (req, res, next) => {
  try {
    const [total, byPriority, byStatus, topCategories] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    ]);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="executive-snapshot.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('TicketPro Executive Snapshot', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1.2);

    doc.fillColor('#111').fontSize(14).text('Overview');
    doc.fontSize(11).text(`Total Tickets: ${total}`);
    doc.moveDown(0.6);

    doc.fontSize(13).text('Priority Distribution');
    byPriority.forEach((x) => {
      doc.fontSize(11).text(`- ${x._id || 'Unknown'}: ${x.count}`);
    });
    doc.moveDown(0.8);

    doc.fontSize(13).text('Status Distribution');
    byStatus.forEach((x) => {
      doc.fontSize(11).text(`- ${x._id || 'Unknown'}: ${x.count}`);
    });
    doc.moveDown(0.8);

    doc.fontSize(13).text('Top Categories');
    topCategories.forEach((x, idx) => {
      doc.fontSize(11).text(`${idx + 1}. ${x._id || 'Uncategorized'} (${x.count})`);
    });

    doc.moveDown(1.2);
    doc.fillColor('#333').fontSize(10).text('Generated by TicketPro analytics engine.');
    doc.end();
  } catch (err) { next(err); }
};
