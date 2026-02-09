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

// Multer config (for OCR uploads)
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
 * Extract menu content from uploaded image or text
 */
router.post('/extract', upload.single('menuImage'), async (req, res, next) => {
  try {
    let menuText;

    if (req.file) {
      // OCR for uploaded image
      menuText = await ocrService.extractMenuFromImage(req.file.path);
    } else if (req.body.menuText) {
      // Text provided directly
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
 * ✅ Streams PDF directly to browser (Vercel-safe)
 */
router.post('/generate', async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { parsedMenu, menuDate } = req.body;

    if (!parsedMenu) {
      return res.status(400).json({ error: 'parsedMenu is required' });
    }

    // 1️⃣ Generate images for menu
    const images = await imageGenerationService.generateAllImages(parsedMenu);

    // 2️⃣ Generate PDF and return buffer instead of writing to disk
    const pdfResult = await pdfGenerationService.generatePDF({
      menuData: parsedMenu,
      images,
      menuDate: menuDate || new Date().toISOString(),
      careHomeName: process.env.CARE_HOME_NAME || 'Chichester Court Care Home',
      returnBuffer: true // ✅ new flag to get buffer instead of file path
    });

    // 3️⃣ Log audit
    await auditService.logGeneration({
      menuData: parsedMenu,
      images,
      generationTime: Date.now() - startTime,
      menuDate
    });

    // 4️⃣ Stream PDF to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${pdfResult.filename}"`
    );
    res.send(pdfResult.buffer);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
