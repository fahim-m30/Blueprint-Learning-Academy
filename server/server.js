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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// API Routes (supports both /api/* and root prefixes)
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/auth', authRoutes);
app.use('/public', publicRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// Root health check & keep-alive endpoints (supports root /, /api, /api/health, /health, /ping, /keep-alive, /status)
app.get(['/', '/api', '/api/health', '/health', '/ping', '/keep-alive', '/status'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Blueprint Learning Academy API',
    uptime: Math.floor(process.uptime()),
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
          const req = https.get(`${backendUrl}/api/health`, {
            headers: {
              'User-Agent': 'Blueprint-KeepAlive/2.0',
              'Cache-Control': 'no-cache',
            },
            timeout: 15000,
          }, (res) => {
            console.log(`⚡ Keep-Alive ping responded with ${res.statusCode} at ${new Date().toLocaleTimeString()}`);
          });
          req.on('error', (err) => {
            console.warn('⚠️ Keep-alive ping warning:', err.message);
          });
          req.on('timeout', () => {
            req.destroy();
          });
        } catch (pingErr) {
          console.warn('⚠️ Keep-alive ping failed:', pingErr.message);
        }
      };
      setInterval(pingServer, 4 * 60 * 1000); // Trigger every 4 minutes (Render sleeps after 15 min inactivity)
      // Immediate ping after 10 seconds of startup
      setTimeout(pingServer, 10000);
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
