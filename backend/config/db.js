const mongoose = require('mongoose');

let hasSetupListeners = false;

function getConnectionOptions() {
  return {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10000),
    heartbeatFrequencyMS: Number(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || 10000),
    retryWrites: true,
  };
}

function setupConnectionListeners() {
  if (hasSetupListeners) return;
  hasSetupListeners = true;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketpro';
  const maxRetries = Number(process.env.MONGODB_CONNECT_RETRIES || 5);
  const baseDelayMs = Number(process.env.MONGODB_CONNECT_RETRY_DELAY_MS || 2000);

  setupConnectionListeners();

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(uri, getConnectionOptions());
      return mongoose.connection;
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      console.error(`MongoDB connection error (attempt ${attempt}/${maxRetries}):`, err.message);

      if (isLastAttempt) {
        process.exit(1);
      }

      const waitMs = baseDelayMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
};

module.exports = connectDB;
