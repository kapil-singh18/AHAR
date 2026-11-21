const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const ttlToMilliseconds = (ttl) => {
  if (/^\d+$/.test(ttl)) return Number(ttl) * 1000;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * units[match[2]];
};

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  activeKitchenId: user.activeKitchenId,
  kitchenIds: user.kitchenIds
});

const issueTokenPair = async (user) => {
  const accessPayload = { sub: String(user._id), type: 'access', role: user.role };
  const accessToken = jwt.sign(accessPayload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl });

  const refreshJti = crypto.randomUUID();
  const refreshToken = jwt.sign(
    { sub: String(user._id), type: 'refresh', jti: refreshJti },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl }
  );
  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + ttlToMilliseconds(env.refreshTokenTtl));

  user.refreshTokens.push({ tokenHash: refreshHash, expiresAt, createdAt: new Date() });
  await user.save();

  return { accessToken, refreshToken, expiresAt };
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.cookieSameSite,
  path: '/api/auth',
  maxAge: ttlToMilliseconds(env.refreshTokenTtl)
});

const clearCookie = (res) => {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.cookieSameSite,
    path: '/api/auth'
  });
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(env.refreshCookieName, refreshToken, cookieOptions());
};

const register = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const kitchenId = req.body.kitchenId || env.defaultKitchenId;
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      name: req.body.name.trim(),
      email,
      passwordHash,
      role: 'manager',
      kitchenIds: [kitchenId],
      activeKitchenId: kitchenId,
      refreshTokens: []
    });

    const tokens = await issueTokenPair(user);
    setRefreshCookie(res, tokens.refreshToken);
    return res.status(201).json({ success: true, data: { user: publicUser(user), accessToken: tokens.accessToken } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() })
      .select('+passwordHash +refreshTokens');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const tokens = await issueTokenPair(user);
    setRefreshCookie(res, tokens.refreshToken);
    return res.status(200).json({ success: true, data: { user: publicUser(user), accessToken: tokens.accessToken } });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[env.refreshCookieName];
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh session missing' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch (error) {
      clearCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh session expired or invalid' });
    }
    if (payload.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokenHash = hashToken(refreshToken);
    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) {
      clearCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh session invalid' });
    }

    const currentRecord = user.refreshTokens.find((record) => record.tokenHash === tokenHash);
    if (!currentRecord) {
      clearCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh session has been revoked' });
    }

    if (currentRecord.revokedAt || currentRecord.expiresAt <= new Date()) {
      user.refreshTokens.forEach((record) => {
        if (!record.revokedAt) record.revokedAt = new Date();
      });
      await user.save();
      clearCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh-token reuse detected. Please sign in again.' });
    }

    currentRecord.revokedAt = new Date();
    const refreshJti = crypto.randomUUID();
    const replacementToken = jwt.sign(
      { sub: String(user._id), type: 'refresh', jti: refreshJti },
      env.jwtRefreshSecret,
      { expiresIn: env.refreshTokenTtl }
    );
    const replacementHash = hashToken(replacementToken);
    currentRecord.replacedByHash = replacementHash;

    const accessToken = jwt.sign(
      { sub: String(user._id), type: 'access', role: user.role },
      env.jwtAccessSecret,
      { expiresIn: env.accessTokenTtl }
    );
    user.refreshTokens.push({
      tokenHash: replacementHash,
      expiresAt: new Date(Date.now() + ttlToMilliseconds(env.refreshTokenTtl)),
      createdAt: new Date()
    });
    await user.save();

    setRefreshCookie(res, replacementToken);
    return res.status(200).json({ success: true, data: { user: publicUser(user), accessToken } });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[env.refreshCookieName];
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
        const tokenHash = hashToken(refreshToken);
        const user = await User.findById(payload.sub).select('+refreshTokens');
        if (user) {
          const record = user.refreshTokens.find((item) => item.tokenHash === tokenHash);
          if (record) record.revokedAt = new Date();
          await user.save();
        }
      } catch (error) {
        // Invalid or expired refresh tokens are cleared below.
      }
    }
    clearCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) => {
  return res.status(200).json({ success: true, data: { user: publicUser(req.user) } });
};

module.exports = { register, login, refresh, logout, me };
