const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import services
const ocrService = require('../services/ocrService');
const validationService = require('../services/validationService');
const imageGenerationService = require('../services/imageGenerationService');
const pdfGenerationService = require('../services/pdfGenerationService');
const auditService = require('../services/auditService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF)'));
  }
});

/**
 * POST /api/menu/extract
 * Extract menu content from uploaded image or text
 */
router.post('/extract', upload.single('menuImage'), async (req, res, next) => {
  try {
    console.log('\n📤 Received menu extraction request');

    let menuText;

    if (req.file) {
      // Image uploaded - use OCR
      console.log('📸 Processing uploaded image with GPT-4 Vision...');
      menuText = await ocrService.extractMenuFromImage(req.file.path);
    } else if (req.body.menuText) {
      // Text provided directly
      console.log('📝 Processing text input...');
      menuText = req.body.menuText;
    } else {
      return res.status(400).json({
        error: 'Either menuImage file or menuText is required'
      });
    }

    console.log('✓ Menu content extracted');

    // Parse menu structure
    const parsedMenu = validationService.parseMenuStructure(menuText);
    console.log('✓ Menu structure parsed');

    // Validate menu
    const validation = validationService.validateMenu(parsedMenu);
    console.log(`✓ Validation complete: ${validation.valid ? 'PASSED' : 'FAILED'}`);

    res.json({
      success: true,
      extractedText: menuText,
      parsedMenu: parsedMenu,
      validation: validation,
      uploadedFile: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      } : null
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    next(error);
  }
});

/**
 * POST /api/menu/generate
 * Generate complete menu with images and PDF
 */
router.post('/generate', async (req, res, next) => {
  const startTime = Date.now();

  try {
    console.log('\n🎨 Starting menu generation...');

    const { parsedMenu, menuDate } = req.body;

    if (!parsedMenu) {
      return res.status(400).json({
        error: 'parsedMenu is required'
      });
    }

    // Step 1: Generate images for all sections
    console.log('📸 Generating meal images...');
    const images = await imageGenerationService.generateAllImages(parsedMenu);
    console.log(`✓ Generated ${Object.keys(images).length} images`);

    // Step 2: Generate PDF
    console.log('📄 Generating PDF...');
    const pdfResult = await pdfGenerationService.generatePDF({
      menuData: parsedMenu,
      images: images,
      menuDate: menuDate || new Date().toISOString(),
      careHomeName: process.env.CARE_HOME_NAME || 'Chichester Court Care Home'
    });
    console.log('✓ PDF generated');

    // Step 3: Log to audit trail
    const auditLog = await auditService.logGeneration({
      menuData: parsedMenu,
      images: images,
      pdfPath: pdfResult.path,
      generationTime: Date.now() - startTime,
      menuDate: menuDate
    });
    console.log('✓ Audit log saved');

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Menu generation complete in ${generationTime}s`);

    res.json({
      success: true,
      pdf: {
        filename: pdfResult.filename,
        downloadUrl: `/outputs/${pdfResult.filename}`,
        path: pdfResult.path,
        size: pdfResult.size
      },
      images: images,
      auditLog: {
        id: auditLog.id,
        timestamp: auditLog.timestamp
      },
      generationTime: generationTime
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    next(error);
  }
});

/**
 * POST /api/menu/validate
 * Validate menu structure without generating
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { menuText } = req.body;

    if (!menuText) {
      return res.status(400).json({
        error: 'menuText is required'
      });
    }

    const parsedMenu = validationService.parseMenuStructure(menuText);
    const validation = validationService.validateMenu(parsedMenu);

    res.json({
      success: true,
      parsedMenu: parsedMenu,
      validation: validation
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/menu/history
 * Get generation history
 */
router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await auditService.getHistory(limit);

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;