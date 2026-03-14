const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error('[API Error]', {
      requestId: req?.requestId,
      statusCode,
      message: err.message,
      stack: err.stack
    });
  }

  res.status(statusCode).json({
    success: false,
    requestId: req?.requestId,
    message: statusCode >= 500 && isProd ? 'Internal server error' : (err.message || 'Internal server error')
  });
};

module.exports = errorHandler;
