const mongoose = require('mongoose');

const MemberSub = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String },
  initials: { type: String },
  members: [MemberSub],
  settings: {
    autoAssignment: { type: Boolean, default: true },
    workingHours: { type: Object, default: {} },
    slaTargets: { type: Object, default: {} },
  },
  activeTickets: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
