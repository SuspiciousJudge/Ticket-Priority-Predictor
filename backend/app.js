require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const dbReady = require('./middleware/dbReady');
const auditLogger = require('./middleware/audit');
const { generalApiLimiter } = require('./middleware/rateLimiters');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const teamRoutes = require('./routes/teams');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const i18nRoutes = require('./routes/i18n');

function assertRequiredEnv() {
  const required = ['JWT_SECRET'];
  if (process.env.NODE_ENV === 'production') {
    required.push('MONGODB_URI', 'CLIENT_URL');
  }
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
}

assertRequiredEnv();

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  hsts: process.env.NODE_ENV === 'production',
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1|::1)$/.test(hostname);
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS: rejecting origin', origin);
    return callback(new Error('CORS: Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ service: 'ticket-priority-backend', status: 'ok', health: '/api/health' });
});

if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'https') return next();
    return res.status(403).json({ success: false, message: 'HTTPS is required' });
  });
}

app.use('/api', generalApiLimiter);
app.use('/api', auditLogger);

if (process.env.ENABLE_PUBLIC_UPLOADS === 'true') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({
    success: ready,
    ready,
    message: ready ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    database: { connected: ready, readyState: mongoose.connection.readyState },
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
app.use(errorHandler);

module.exports = { app, allowedOrigins, corsOptions };
