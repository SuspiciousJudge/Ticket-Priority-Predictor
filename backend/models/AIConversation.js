const mongoose = require('mongoose');

const ChatMsg = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const AIConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [ChatMsg],
  updatedAt: { type: Date, default: Date.now },
});

AIConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
