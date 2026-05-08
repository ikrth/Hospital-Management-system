require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const mongoose = require('mongoose');
const { URL } = require('url');
const http = require('http');
const https = require('https');

const app = express();

// middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// connect to DB
connectDB();

// simple status route
app.get('/api/v1/status', (req, res) => res.json({ status: 'ok' }));

// health endpoint - no auth
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = { 0:'disconnected', 1:'connected', 
                         2:'connecting', 3:'disconnecting' };
    
    // Get collection counts
    let dbStats = {};
    if (dbState === 1) {
      const [users, appointments, doctors, patients, notifications] = 
        await Promise.all([
          mongoose.connection.db.collection('users').countDocuments(),
          mongoose.connection.db.collection('appointments').countDocuments(),
          mongoose.connection.db.collection('doctors').countDocuments(),
          mongoose.connection.db.collection('patients').countDocuments(),
          mongoose.connection.db.collection('notifications').countDocuments(),
        ]);
      dbStats = { users, appointments, doctors, patients, notifications };
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: {
        status: dbStateMap[dbState],
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        collections: dbStats
      },
      ai: await checkGroqStatus(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

async function checkGroqStatus() {
  try {
    const groqService = require('./services/groqService');
    return await groqService.checkHealth();
  } catch (err) {
    return { isOnline: false, provider: 'Groq', error: err.message };
  }
}

// register routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/patients', require('./routes/patients'));
app.use('/api/v1/doctors', require('./routes/doctors'));
app.use('/api/v1/appointments', require('./routes/appointments'));
app.use('/api/v1/ai', require('./routes/ai'));
const medicalRecordRoutes = require('./routes/medicalRecords');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const shutdown = (label, err) => {
  if (err) console.error(label, err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
};

// graceful shutdown handlers
process.on('uncaughtException', (err) => shutdown('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => shutdown('Unhandled Rejection:', reason));

module.exports = app;
