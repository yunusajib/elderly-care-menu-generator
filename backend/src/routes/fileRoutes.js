const express = require('express');
const router = express.Router();
const fs = require('fs');
const nodePath = require('path');

// ✅ Get paths from global
const nodePath = require('path');
const isVercel = Boolean(process.env.VERCEL);

const CACHE_DIR = isVercel
    ? '/tmp/cache'
    : nodePath.join(__dirname, '../../cache');

const OUTPUT_DIR = isVercel
    ? '/tmp/pdf'
    : nodePath.join(__dirname, '../../pdf');


/**
 * GET /api/files/cache/:filename
 */
router.get('/cache/:filename', (req, res) => {
    try {
        const { filename } = req.params;

        if (!filename.endsWith('.png')) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const filepath = nodePath.join(CACHE_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.setHeader('Content-Type', 'image/png');
        fs.createReadStream(filepath).pipe(res);
    } catch (err) {
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

/**
 * GET /api/files/outputs/:filename
 */
router.get('/outputs/:filename', (req, res) => {
    try {
        const { filename } = req.params;

        if (!filename.endsWith('.pdf')) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const filepath = nodePath.join(OUTPUT_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        fs.createReadStream(filepath).pipe(res);
    } catch (err) {
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

module.exports = router;
