require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const cacheRoutes = require('./routes/cacheRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create required directories if they don't exist
const directories = [
  process.env.UPLOAD_DIR || './uploads',
  process.env.OUTPUT_DIR || './outputs',
  process.env.CACHE_DIR || './cache',
  './logs'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Request logging
// CORS - Allow all origins for development
// CORS Configuration - Vercel compatible
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Vercel internal requests)
    if (!origin) return callback(null, true);

    // In production on Vercel, allow same domain
    if (process.env.VERCEL) {
      return callback(null, true);
    }

    // In development, allow localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// Explicitly handle OPTIONS requests
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (generated PDFs, cached images)
app.use('/outputs', express.static(path.join(__dirname, '..', process.env.OUTPUT_DIR || 'outputs')));
app.use('/cache', express.static(path.join(__dirname, '..', process.env.CACHE_DIR || 'cache')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/cache', cacheRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Elderly Care Menu Generator API');
  console.log('=====================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('\n📋 API Endpoints:');
  console.log(`  POST   http://localhost:${PORT}/api/menu/extract`);
  console.log(`  POST   http://localhost:${PORT}/api/menu/generate`);
  console.log(`  GET    http://localhost:${PORT}/api/cache/stats`);
  console.log(`  GET    http://localhost:${PORT}/health`);
  console.log('\n✓ Ready to generate menus!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
// ... existing code ...

module.exports = app;

// For Vercel serverless
if (process.env.VERCEL) {
  module.exports = app;
}

module.exports = app;
