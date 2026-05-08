const mongoose = require('mongoose');
const logger = require('../utils/logger.js');

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

async function connectWithRetry(retryCount = 0) {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_ms';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    logger.info(`Database name: ${mongoose.connection.name}`);
    return true;
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(`MongoDB connection failed. Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retryCount + 1);
    } else {
      logger.error('MongoDB connection failed after maximum retries');
      logger.error('Make sure MongoDB service is running:');
      logger.error('  Windows: net start MongoDB');
      logger.error('  Or open services.msc and start MongoDB Server');
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err.message);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

async function checkAndSeedDatabase() {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      logger.info('Database is empty. Running initial seed...');
      const { seedDatabase } = require('../scripts/seed.js');
      await seedDatabase();
      logger.info('Database seeded successfully with demo data');
    } else {
      logger.info(`Database has ${userCount} users. Skipping seed.`);
    }
  } catch (error) {
    logger.warn('Could not check/seed database:', error.message);
  }
}

module.exports = async function connectDB() {
  await connectWithRetry();
  await checkAndSeedDatabase();
};
module.exports.connectWithRetry = connectWithRetry;
module.exports.checkAndSeedDatabase = checkAndSeedDatabase;
