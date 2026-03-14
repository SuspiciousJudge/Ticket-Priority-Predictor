module.exports = function (err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const response = { success: false, message: err.message || 'Server Error' };
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) response.error = err.stack;
  res.status(status).json(response);
};
