require('dotenv').config();
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { app, allowedOrigins } = require('./app');

function attachSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  app.set('io', io);
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_team', (teamId) => {
      if (teamId) socket.join(`team_${teamId}`);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    attachSocketServer(server);
  });
  server.on('error', (error) => {
    console.error('Server listen error:', error.message);
    process.exitCode = 1;
  });
  return server;
}

async function start() {
  const server = startServer(Number(process.env.PORT || 5000));
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB is unavailable; server remains live with a 503 readiness response');
  }
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  });
}

app.start = start;
app.attachSocketServer = attachSocketServer;
module.exports = app;
