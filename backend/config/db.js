const mongoose = require('mongoose');

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
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  try {
    const conn = await mongoose.connect(primaryUri);
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
    const conn = await mongoose.connect(fallbackUri);
    console.log(`MongoDB connected via fallback: ${conn.connection.host}`);
    return conn;
  }
};

module.exports = connectDB;
