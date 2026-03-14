const crypto = require('crypto');

function generateTicketId() {
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `TICK-${rand}`;
}

function sanitizeString(s = '') {
  return String(s).trim();
}

module.exports = { generateTicketId, sanitizeString };
