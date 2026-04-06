const mongoose = require('mongoose');

module.exports = function dbReady(req, res, next) {
  // 1 = connected in Mongoose readyState mapping.
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Database is not ready. Please retry in a few seconds.',
    dbReadyState: mongoose.connection.readyState,
  });
};
