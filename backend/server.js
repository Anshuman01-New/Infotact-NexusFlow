require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const telemetryRoutes = require('./routes/telemetryRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'NexusFlow Ingestion & Rule Engine API',
    version: '1.0.0 (Week 1)',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      engine: 'MongoDB Time-Series'
    },
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  NexusFlow Backend running on http://localhost:${PORT}`);
    console.log(`  Health Check : http://localhost:${PORT}/api/health`);
    console.log(`  Telemetry API: http://localhost:${PORT}/api/telemetry`);
    console.log(`  Device API   : http://localhost:${PORT}/api/devices`);
    console.log(`==================================================\n`);
  });

  const shutdown = () => {
    console.log('\nShutting down NexusFlow backend gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Only auto-start when executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
