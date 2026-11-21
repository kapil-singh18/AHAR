const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authorization.slice(7);
    const payload = jwt.verify(token, env.jwtAccessSecret);
    if (payload.type !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid access token' });
    }

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = user;
    req.kitchenId = user.activeKitchenId;
    return next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return res.status(401).json({ success: false, message });
  }
};

const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  return next();
};

const scopeToActiveKitchen = (req, res, next) => {
  const activeKitchenId = req.kitchenId;

  if (req.body && typeof req.body === 'object' && req.body.kitchenId) {
    if (req.body.kitchenId !== activeKitchenId) {
      return res.status(403).json({ success: false, message: 'Kitchen access denied' });
    }
  }

  if (req.body && typeof req.body === 'object') {
    req.body.kitchenId = activeKitchenId;
  }

  if (req.query && typeof req.query === 'object' && req.query.kitchenId) {
    if (req.query.kitchenId !== activeKitchenId) {
      return res.status(403).json({ success: false, message: 'Kitchen access denied' });
    }
  }

  if (req.query && typeof req.query === 'object') {
    req.query.kitchenId = activeKitchenId;
  }

  return next();
};

module.exports = { authenticate, authorizeRole, scopeToActiveKitchen };
