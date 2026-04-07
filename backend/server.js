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
const { generalApiLimiter } = require('./middleware/rateLimiters');

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const teamRoutes = require('./routes/teams');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');

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
    if (!origin) return cb(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket Setup
const { Server } = require('socket.io');
const io = new Server(server, {
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

module.exports = app;
