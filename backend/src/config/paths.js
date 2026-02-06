const path = require('path');

// Determine if running on Vercel
const isVercel = !!process.env.VERCEL;

// Set up directory paths
const UPLOAD_DIR = isVercel
    ? '/tmp/uploads'
    : path.join(__dirname, '../../uploads');

const OUTPUT_DIR = isVercel
    ? '/tmp/outputs'
    : path.join(__dirname, '../../outputs');

const CACHE_DIR = isVercel
    ? '/tmp/cache'
    : path.join(__dirname, '../../cache');

const LOG_DIR = isVercel
    ? '/tmp/logs'
    : path.join(__dirname, '../logs');

module.exports = {
    isVercel,
    UPLOAD_DIR,
    OUTPUT_DIR,
    CACHE_DIR,
    LOG_DIR
};