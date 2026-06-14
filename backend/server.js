require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const dbReady = require('./middleware/dbReady');
const auditLogger = require('./middleware/audit');
const { generalApiLimiter } = require('./middleware/rateLimiters');

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const teamRoutes = require('./routes/teams');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const i18nRoutes = require('./routes/i18n');

const app = express();

function assertRequiredEnv() {
  const required = ['JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if ((process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Support both environment variable names used across the repo.
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    console.warn('No MongoDB URI set; falling back to mongodb://localhost:27017/ticketpro');
  }
}

// Warn about optional but recommended secrets in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.GEMINI_API_KEY) console.warn('Warning: GEMINI_API_KEY not set — AI features disabled');
  if (!process.env.SLACK_ALERT_WEBHOOK) console.warn('Warning: SLACK_ALERT_WEBHOOK not set — alerting disabled');
}

assertRequiredEnv();

// Connect DB
connectDB();

// Middleware
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  hsts: process.env.NODE_ENV === 'production',
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser or same-origin requests
    if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
    // Allow localhost / 127.0.0.1 / ::1 on any port (helps dev servers that pick alternate ports)
    try {
      const u = new URL(origin);
      if (/(localhost|127\.0\.0\.1|::1)$/.test(u.hostname)) return cb(null, true);
    } catch (e) {}
    console.warn('CORS: rejecting origin', origin);
    cb(new Error('CORS: Not allowed by CORS'));
  },
  credentials: true,
}));

// Compression for all responses (reduces payload size ~70%)
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (forwardedProto === 'https') return next();
    return res.status(403).json({ success: false, message: 'HTTPS is required' });
  });
}

// Rate limiter
app.use('/api', generalApiLimiter);
// Audit mutating requests
app.use('/api', auditLogger);

// Serve uploaded files statically only when explicitly enabled for local dev.
if (process.env.ENABLE_PUBLIC_UPLOADS === 'true') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Mount API
// Health
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;
  const message = dbConnected ? 'OK' : 'DEGRADED';
  const statusCode = dbConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: dbConnected,
    message,
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      readyState: dbState,
    },
  });
});

app.use('/api', dbReady);
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/i18n', i18nRoutes);

// Error handler
app.use(errorHandler);

const { Server } = require('socket.io');
let io = null;

function attachSocketServer(serverInstance) {
  if (io) return io;
  io = new Server(serverInstance, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_team', (teamId) => {
      if (teamId) {
        socket.join(`team_${teamId}`);
        console.log(`Socket ${socket.id} joined team_${teamId}`);
      }
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function startServer(port) {
  try {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      attachSocketServer(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy, trying ${nextPort}...`);
        try {
          server.close();
        } catch {}
        startServer(nextPort);
        return;
      }
      console.error('Server listen error:', err.message);
    });

    return server;
  } catch (err) {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, trying ${nextPort}...`);
      return startServer(nextPort);
    }
    console.error('Server start error:', err && err.message ? err.message : err);
    return null;
  }
}

const PORT = Number(process.env.PORT || 5000);
const server = startServer(PORT);

// Optional auto-retraining scheduler
try {
  if (process.env.ENABLE_AUTO_RETRAIN === 'true') {
    const { runRetrain } = require('./utils/retrain');
    const cronExpr = process.env.RETRAIN_CRON;
    if (cronExpr) {
      // Try to use node-cron if available
      try {
        const cron = require('node-cron');
        cron.schedule(cronExpr, async () => {
          console.log('Auto retrain triggered by cron:', cronExpr);
          try { await runRetrain(); console.log('Auto retrain completed'); } catch (e) { console.error('Auto retrain error:', e); }
        });
        console.log('Auto retrain scheduled via RETRAIN_CRON:', cronExpr);
      } catch (e) {
        console.warn('node-cron not installed; falling back to interval scheduling. Set RETRAIN_CRON to use cron.');
      }
    }

    const hours = Number(process.env.RETRAIN_INTERVAL_HOURS || 0);
    if (!cronExpr && hours > 0) {
      const intervalMs = Math.max(1, hours) * 60 * 60 * 1000;
      setInterval(async () => {
        console.log('Auto retrain triggered by interval:', hours, 'hours');
        try { await require('./utils/retrain').runRetrain(); console.log('Auto retrain completed'); } catch (e) { console.error('Auto retrain error:', e); }
      }, intervalMs);
      console.log('Auto retrain scheduled every', hours, 'hours');
    }
  }
} catch (e) {
  console.warn('Auto retrain scheduler failed to initialize:', e && e.message);
}

module.exports = app;
