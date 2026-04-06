const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now }
});

const CommentSub = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const AiPredSchema = new mongoose.Schema({
  predictedPriority: String,
  confidence: Number,
  reasoning: String
}, { _id: false });

const SimilarSchema = new mongoose.Schema({
  ticketId: String,
  similarity: Number
}, { _id: false });

const PriorityOverrideSchema = new mongoose.Schema({
  from: String,
  to: String,
  reason: String,
  overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  overriddenAt: { type: Date, default: Date.now },
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  from: String,
  to: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  category: String,
  customerTier: { type: String, enum: ['Enterprise', 'Business', 'Professional', 'Premium', 'Basic', 'Free'], default: 'Basic' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentiment: { type: String, enum: ['Angry', 'Frustrated', 'Neutral', 'Calm', 'Happy'] },
  confidence: { type: Number },
  estimatedTime: String,
  estimatedResolutionTime: Number,
  resolutionTime: Number,
  slaDeadline: { type: Date },
  affectedUsers: Number,
  tags: [String],
  attachments: [AttachmentSchema],
  comments: [CommentSub],
  aiPredictions: AiPredSchema,
  similarTickets: [SimilarSchema],
  impactScore: { type: Number, default: 0 },
  priorityOverrideAudit: [PriorityOverrideSchema],
  statusHistory: [StatusHistorySchema],
  reopenCount: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for query performance
TicketSchema.index({ team: 1, status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ assignee: 1, status: 1 });
TicketSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Ticket', TicketSchema);
