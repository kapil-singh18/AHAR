const requiredInProduction = ['MONGODB_URI'];

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizeOrigins(value) {
  if (!value || value === '*') return ['*'];
  return String(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
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
  mongoUriFallback: process.env.MONGODB_URI_FALLBACK
};
