require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const mongoose = require('mongoose');

const PORT = env.port;
const DB_RETRY_MS = env.dbRetryMs;

let server;
let isShuttingDown = false;

const connectWithRetry = async () => {
  while (!isShuttingDown) {
    try {
      await connectDB();
      return;
    } catch (error) {
      console.error(`Database connection failed: ${error.message}. Retrying in ${DB_RETRY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_MS));
    }
  }
};

const startServer = async () => {
  await connectWithRetry();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close(false);
    process.exit(0);
  } catch (error) {
    console.error('Graceful shutdown failed:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

startServer();
