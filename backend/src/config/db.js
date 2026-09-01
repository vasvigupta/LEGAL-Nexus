const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

const connectDB = async (customUri = null, maxRetries = parseInt(process.env.MONGO_MAX_RETRIES, 10) || 1) => {
  const uri = customUri || config.mongo.uri;

  // First try the persistent MongoDB connection with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Connecting to MongoDB (Attempt ${attempt}/${maxRetries}): ${uri.replace(
          /\/\/([^:]+):([^@]+)@/,
          '//***:***@'
        )}`
      );

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      logger.info(
        `MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
      );

      global.__MONGO_STORAGE_MODE__ = 'PERSISTENT_DISK';

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB connection lost. Reconnecting...');
      });

      return conn;
    } catch (error) {
      logger.warn(
        `MongoDB Connection Attempt ${attempt}/${maxRetries} Failed: ${error.message}`
      );

      if (attempt < maxRetries) {
        const delay = Math.min(2000 * attempt, 6000);

        logger.info(
          `Retrying MongoDB connection in ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If persistent MongoDB fails, use MongoMemoryServer
  // in non-production environments.
  if (config.env !== 'production') {
    try {
      logger.info(
        'Persistent MongoDB unavailable. Attempting MongoMemoryServer fallback...'
      );

      const { MongoMemoryServer } = require('mongodb-memory-server');

      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();

      logger.info(
        `MongoMemoryServer database spawned successfully at: ${memoryUri}`
      );

      const conn = await mongoose.connect(memoryUri);

      logger.info(
        'MongoDB Connected to Local In-Memory Fallback Database! Ready to save users/cases.'
      );

      global.__MONGO_MEMORY_SERVER__ = mongod;
      global.__MONGO_STORAGE_MODE__ = 'EPHEMERAL_IN_MEMORY';

      // Automatically seed the in-memory database
      try {
        const { seedDatabase } = require('../seed');

        await seedDatabase(true);

        logger.info(
          'In-Memory Database automatically seeded with advocates, admin, and test users.'
        );
      } catch (seedErr) {
        logger.warn(
          `Auto-seeding warning: ${seedErr.message}`
        );
      }

      return conn;
    } catch (memErr) {
      logger.error(
        `Failed to spawn MongoMemoryServer fallback: ${memErr.message}`
      );
    }
  }

  logger.error(
    'CRITICAL: All MongoDB connection attempts and fallbacks failed.'
  );

  return null;
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();

    logger.info('MongoDB Disconnected successfully.');

    if (global.__MONGO_MEMORY_SERVER__) {
      await global.__MONGO_MEMORY_SERVER__.stop();

      logger.info(
        'MongoMemoryServer stopped successfully.'
      );

      global.__MONGO_MEMORY_SERVER__ = null;
      global.__MONGO_STORAGE_MODE__ = null;
    }
  } catch (error) {
    logger.error(
      `Error disconnecting MongoDB: ${error.message}`
    );
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};