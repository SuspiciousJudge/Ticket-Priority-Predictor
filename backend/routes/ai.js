const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getModelHealth } = require('../utils/mlPredict');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /api/ai/model-health
router.get('/model-health', auth, async (req, res, next) => {
  try {
    const health = await getModelHealth();
    return res.json({ success: true, data: health });
  } catch (err) {
    return next(err);
  }
});

// POST /api/ai/chat
router.post('/chat', auth, async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service not configured. Please set GEMINI_API_KEY.' });
    }

    // Fetch user's recent tickets for context
    const userId = req.user?._id;
    let ticketContext = '';
    if (userId) {
      const recentTickets = await Ticket.find({
        $or: [{ assignee: userId }, { createdBy: userId }]
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('ticketId title description priority status category createdAt')
        .lean();

      if (recentTickets.length > 0) {
        ticketContext = '\n\nHere are the user\'s recent tickets:\n' +
          recentTickets.map(t =>
            `- [${t.ticketId}] "${t.title}" | Priority: ${t.priority} | Status: ${t.status} | Category: ${t.category || 'N/A'}`
          ).join('\n');
      }
    }

    // Fetch overall stats
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
        }
      }
    ]);
    const s = stats[0] || {};
    const statsContext = `\nCurrent system stats: ${s.total || 0} total tickets, ${s.open || 0} open, ${s.inProgress || 0} in progress, ${s.resolved || 0} resolved, ${s.critical || 0} critical, ${s.high || 0} high priority.`;

    const systemPrompt = `You are TicketPro AI Assistant — a helpful, concise IT service management assistant built into the TicketPro dashboard.

Your capabilities:
- Answer questions about the user's tickets (status, priority, assignments)
- Provide insights and summaries from ticket data
- Suggest solutions based on common IT issues
- Help draft ticket descriptions
- Explain priority levels and SLA implications

Rules:
- Be concise and professional
- Use markdown formatting for lists and emphasis
- If you don't know something, say so honestly
- Never make up ticket data — only reference what's provided
- Keep responses under 300 words unless asked for detail
${statsContext}${ticketContext}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build conversation for Gemini
    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({
      success: true,
      data: {
        message: response,
        role: 'assistant',
      },
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    if (err.message?.includes('API_KEY')) {
      return res.status(500).json({ success: false, message: 'Invalid Gemini API key' });
    }
    next(err);
  }
});

// POST /api/ai/suggest-priority — Quick priority suggestion without full chat
router.post('/suggest-priority', auth, async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    if (!process.env.GEMINI_API_KEY) {
      // Fallback to rule-based
      const { predictPriority } = require('../utils/mlPredict');
      const prediction = await predictPriority(title, description || '', '');
      return res.json({ success: true, data: prediction });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are an IT ticket priority classifier. Given the following ticket, respond ONLY with a JSON object (no markdown, no code fences):
{"priority": "Critical|High|Medium|Low", "confidence": 0-100, "reasoning": "one sentence explanation"}

Title: ${title}
Description: ${description || 'No description provided'}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
      res.json({ success: true, data: parsed });
    } catch {
      res.json({ success: true, data: { priority: 'Medium', confidence: 50, reasoning: 'Could not parse AI response' } });
    }
  } catch (err) { next(err); }
});

module.exports = router;
