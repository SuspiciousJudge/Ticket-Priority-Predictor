module.exports = function (err, req, res, next) {
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const fieldErrors = {};
    Object.keys(err.errors).forEach((field) => {
      fieldErrors[field] = err.errors[field].message;
    });
    return res.status(400).json({
      success: false,
      message: Object.values(fieldErrors).join('. '),
      fieldErrors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}`,
      fieldErrors: { [field]: `This ${field} is already taken` },
    });
  }

  const status = err.status || 500;
  const response = { success: false, message: err.message || 'Server Error' };
  const exposeErrors = process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACES === 'true';
  if (exposeErrors) response.error = err.stack;
  res.status(status).json(response);
};
