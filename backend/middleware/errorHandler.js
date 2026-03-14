const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const isOperationalError = statusCode < 500;

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
    message: statusCode >= 500 && isProd ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(isProd
      ? {}
      : {
        error: {
          type: err.name || 'Error',
          operational: isOperationalError,
          stack: err.stack
        }
      })
  });
};

module.exports = errorHandler;
