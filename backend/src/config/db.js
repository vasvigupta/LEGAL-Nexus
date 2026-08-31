const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

const connectDB = async (customUri = null) => {
  const uri = customUri || config.mongo.uri;
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    global.__MONGO_STORAGE_MODE__ = 'PERSISTENT_DISK';

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Failed: ${error.message}`);
    
    if (config.env !== 'production') {
      try {
        logger.info('Local MongoDB server is offline. Spawning automatic MongoMemoryServer database fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        logger.info(`MongoMemoryServer database spawned successfully at: ${memoryUri}`);
        
        const conn = await mongoose.connect(memoryUri);
        logger.info('MongoDB Connected to Local In-Memory Fallback Database! Ready to save users/cases.');
        
        global.__MONGO_MEMORY_SERVER__ = mongod;
        global.__MONGO_STORAGE_MODE__ = 'EPHEMERAL_IN_MEMORY';

        // Automatically seed verified advocates, admin, and test citizen accounts
        try {
          const { seedDatabase } = require('../seed');
          await seedDatabase(true);
          logger.info('In-Memory Database automatically seeded with advocates, admin, and test users.');
        } catch (seedErr) {
          logger.warn(`Auto-seeding warning: ${seedErr.message}`);
        }

        return conn;
      } catch (memErr) {
        logger.error(`Failed to spawn MongoMemoryServer fallback: ${memErr.message}`);
      }
    }
    
    logger.warn('Continuing execution in disconnected DB mode or waiting for database to spin up.');
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected successfully.');
    if (global.__MONGO_MEMORY_SERVER__) {
      await global.__MONGO_MEMORY_SERVER__.stop();
      logger.info('MongoMemoryServer stopped successfully.');
      global.__MONGO_MEMORY_SERVER__ = null;
    }
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
