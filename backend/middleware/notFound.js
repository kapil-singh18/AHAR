const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    requestId: req?.requestId,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFound;
