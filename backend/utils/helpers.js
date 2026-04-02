const crypto = require('crypto');

// Counter-based ticket ID to avoid collisions
let ticketCounter = 0;

function generateTicketId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  ticketCounter = (ticketCounter + 1) % 10000;
  const counter = String(ticketCounter).padStart(4, '0');
  return `TICK-${timestamp}-${counter}`;
}

function sanitizeString(s = '') {
  return String(s).trim();
}

module.exports = { generateTicketId, sanitizeString };
