const requiredInProduction = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizeOrigins(value) {
  const origins = [
    'https://ahar-rho.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  if (value) {
    String(value)
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin && origin !== '*')
      .forEach((origin) => {
        if (!origins.includes(origin)) origins.push(origin);
      });
  }

  return origins;
}

function validateEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = requiredInProduction.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

validateEnvironment();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: toNumber(process.env.PORT, 5000),
  dbRetryMs: toNumber(process.env.DB_RETRY_MS, 10000),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',
  corsOrigins: normalizeOrigins(process.env.CORS_ORIGIN),
  trustProxy: toBoolean(process.env.TRUST_PROXY, false),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 300),
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 20000),
  mongoUri: process.env.MONGODB_URI,
  mongoUriFallback: process.env.MONGODB_URI_FALLBACK,
  mlDemandUrl: process.env.ML_DEMAND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001/predict-demand'),
  mlHealthUrl: process.env.ML_HEALTH_URL || '',
  mlTimeoutMs: toNumber(process.env.ML_TIMEOUT_MS, 15000),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'development-only-ahare-access-secret'),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'development-only-ahare-refresh-secret'),
  accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'ahar_refresh',
  cookieSameSite: process.env.NODE_ENV === 'production'
    ? 'none'
    : (String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase() === 'strict' ? 'strict' : 'lax'),
  defaultKitchenId: process.env.DEFAULT_KITCHEN_ID || 'kitchen-nyc-001'
};
