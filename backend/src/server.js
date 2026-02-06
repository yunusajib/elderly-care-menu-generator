const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { CACHE_DIR, OUTPUT_DIR } = require('../config/paths');

/**
 * GET /api/files/cache/:filename
 * Serve cached images
 */
router.get('/cache/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: only allow .png files
    if (!filename.endsWith('.png')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const filepath = path.join(CACHE_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Serve the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving cache file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

/**
 * GET /api/files/outputs/:filename
 * Serve generated PDFs
 */
router.get('/outputs/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: only allow .pdf files
    if (!filename.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const filepath = path.join(OUTPUT_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Serve the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving output file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;