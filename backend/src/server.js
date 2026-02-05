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

// --- Vercel-safe directories setup ---
const isVercel = !!process.env.VERCEL;

const UPLOAD_DIR = isVercel
  ? '/tmp/uploads'
  : path.join(__dirname, process.env.UPLOAD_DIR || '../uploads');

const OUTPUT_DIR = isVercel
  ? '/tmp/outputs'
  : path.join(__dirname, process.env.OUTPUT_DIR || '../outputs');

const CACHE_DIR = isVercel
  ? '/tmp/cache'
  : path.join(__dirname, process.env.CACHE_DIR || '../cache');

const LOG_DIR = isVercel
  ? '/tmp/logs'
  : path.join(__dirname, './logs');

const directories = [UPLOAD_DIR, OUTPUT_DIR, CACHE_DIR, LOG_DIR];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Expose directories globally for routes
app.locals.UPLOAD_DIR = UPLOAD_DIR;
app.locals.OUTPUT_DIR = OUTPUT_DIR;
app.locals.CACHE_DIR = CACHE_DIR;

console.log('Directory setup:');
console.log('UPLOAD_DIR:', UPLOAD_DIR);
console.log('OUTPUT_DIR:', OUTPUT_DIR);
console.log('CACHE_DIR:', CACHE_DIR);
console.log('LOG_DIR:', LOG_DIR);

// --- Middleware ---
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isVercel) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/outputs', express.static(OUTPUT_DIR));
app.use('/cache', express.static(CACHE_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// --- Favicon handler to avoid 404 ---
app.get('/favicon.ico', (req, res) => res.status(204));

// --- Health check endpoint ---
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

// --- API Routes ---
// Correct route mounting: /api/menu and /api/cache
app.use('/api/menu', menuRoutes);
app.use('/api/cache', cacheRoutes);

// --- Error handling middleware ---
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

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log('\n🚀 Elderly Care Menu Generator API');
  console.log('=====================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('\n📋 API Endpoints:');
  console.log(`  POST   /api/menu/extract`);
  console.log(`  POST   /api/menu/generate`);
  console.log(`  GET    /api/cache/stats`);
  console.log(`  GET    /health`);
  console.log('\n✓ Ready to generate menus!\n');
});

// --- Graceful shutdown ---
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

// --- Export app for Vercel serverless ---
module.exports = app;
