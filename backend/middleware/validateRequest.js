const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      requestId: req?.requestId,
      message: 'Validation failed',
      errors: formatted
    });
  }
  return next();
};

module.exports = validateRequest;
