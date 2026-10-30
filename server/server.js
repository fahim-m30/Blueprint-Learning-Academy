const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { initCronJobs } = require('./services/cronService');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Career Path Academy API',
    time: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource endpoint not found.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection & Server initialization
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careerpathacademy';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    // Start background cron jobs
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Career Path Academy Server running on http://localhost:${PORT}`);

      // Keep-Alive Ping Service to prevent Render Free Tier from sleeping
      const backendUrl = process.env.RENDER_EXTERNAL_URL || 'https://blueprint-learning-academy.onrender.com';
      const https = require('https');
      const pingServer = () => {
        try {
          https.get(`${backendUrl}/api/health`, (res) => {
            console.log(`⚡ Keep-Alive ping responded with ${res.statusCode} at ${new Date().toLocaleTimeString()}`);
          }).on('error', (err) => {
            console.warn('⚠️ Keep-alive ping warning:', err.message);
          });
        } catch (pingErr) {
          console.warn('⚠️ Keep-alive ping failed:', pingErr.message);
        }
      };
      setInterval(pingServer, 8 * 60 * 1000); // Trigger every 8 minutes (Render sleeps after 15 min inactivity)
      // Immediate ping after 30 seconds of startup
      setTimeout(pingServer, 30000);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Running server in standby mode without DB connection for debugging/inspection.');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT} (Database pending connection)`);
    });
  });

module.exports = app;
