const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const crypto = require('crypto');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const predictionRoutes = require('./routes/predictionRoutes');
const menuRoutes = require('./routes/menuRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const consumptionRoutes = require('./routes/consumptionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const imageRoutes = require('./routes/imageRoutes');
const donationRoutes = require('./routes/donationRoutes');
const env = require('./config/env');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use((req, res, next) => {
  const incomingRequestId = req.headers['x-request-id'];
  const requestId = typeof incomingRequestId === 'string' && incomingRequestId.trim()
    ? incomingRequestId.trim()
    : crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

morgan.token('request-id', (req) => req.requestId || '-');

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please retry later.'
  }
}));

app.use((req, res, next) => {
  req.setTimeout(env.requestTimeoutMs);
  res.setTimeout(env.requestTimeoutMs);
  next();
});

app.use(morgan(':method :url :status :response-time ms reqId=:request-id', {
  skip: (req) => req.path === '/api/health' || req.path === '/api/ready'
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    requestId: req?.requestId,
    message: 'API is healthy',
    uptimeSec: Math.round(process.uptime()),
    env: env.nodeEnv
  });
});

app.get('/api/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 200 : 503;
  res.status(status).json({
    success: isDbConnected,
    requestId: req?.requestId,
    database: isDbConnected ? 'connected' : 'disconnected',
    service: 'backend'
  });
});

app.use('/api', predictionRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', imageRoutes);
app.use('/api/donations', donationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
