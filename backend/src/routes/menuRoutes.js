const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Services
const ocrService = require('../services/ocrService');
const validationService = require('../services/validationService');
const imageGenerationService = require('../services/imageGenerationService');
const pdfGenerationService = require('../services/pdfGenerationService');
const auditService = require('../services/auditService');

// Multer config (still OK for OCR uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.app.locals.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

/**
 * POST /api/menu/extract
 */
router.post('/extract', upload.single('menuImage'), async (req, res, next) => {
  try {
    let menuText;

    if (req.file) {
      menuText = await ocrService.extractMenuFromImage(req.file.path);
    } else if (req.body.menuText) {
      menuText = req.body.menuText;
    } else {
      return res.status(400).json({ error: 'menuImage or menuText required' });
    }

    const parsedMenu = validationService.parseMenuStructure(menuText);
    const validation = validationService.validateMenu(parsedMenu);

    res.json({
      success: true,
      extractedText: menuText,
      parsedMenu,
      validation
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/menu/generate
 * ✅ STREAMS PDF DIRECTLY (Vercel-safe)
 */
router.post('/generate', async (req, res, next) => {
  const start = Date.now();

  try {
    const { parsedMenu, menuDate } = req.body;
    if (!parsedMenu) {
      return res.status(400).json({ error: 'parsedMenu is required' });
    }

    // 1. Generate images
    const images = await imageGenerationService.generateAllImages(parsedMenu);

    // 2. Generate PDF (buffer-based)
    const pdfResult = await pdfGenerationService.generatePDF({
      menuData: parsedMenu,
      images,
      menuDate: menuDate || new Date().toISOString(),
      careHomeName: process.env.CARE_HOME_NAME || 'Chichester Court Care Home'
    });

    // 3. Audit log (no filesystem path)
    await auditService.logGeneration({
      menuData: parsedMenu,
      images,
      generationTime: Date.now() - start,
      menuDate
    });

    // ✅ STREAM PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdfResult.filename}"`
    );

    res.send(pdfResult.buffer);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
