const mongoose = require('mongoose');
const env = require('./env');

function isSrvResolutionError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('querysrv') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('eservfail')
  );
}

const connectDB = async () => {
  const primaryUri = env.mongoUri;
  const fallbackUri = env.mongoUriFallback;

  if (!primaryUri) {
    throw new Error('MONGODB_URI is not set');
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 7000
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const shouldTryFallback = Boolean(
      fallbackUri && primaryUri?.startsWith('mongodb+srv://') && isSrvResolutionError(error)
    );

    if (!shouldTryFallback) {
      throw error;
    }

    console.warn('MongoDB SRV DNS lookup failed. Trying MONGODB_URI_FALLBACK...');
    const conn = await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 7000
    });
    console.log(`MongoDB connected via fallback: ${conn.connection.host}`);
    return conn;
  }
};

module.exports = connectDB;
