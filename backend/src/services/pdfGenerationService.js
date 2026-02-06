const PDFDocument = require('pdfkit');
const fsSync = require('fs');
const fs = fsSync.promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);

const OUTPUT_DIR = isVercel
  ? '/tmp/pdf'
  : path.join(__dirname, '../../pdf');

// Ensure output directory exists
if (!fsSync.existsSync(OUTPUT_DIR)) {
  fsSync.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate PDF from menu data and images
 */
async function generatePDF(options) {
  const { menuData, images, menuDate, careHomeName } = options;

  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating PDF with original design...');

      // Generate unique filename
      const filename = `menu-${Date.now()}-${uuidv4().substring(0, 8)}.pdf`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 14, bottom: 14, left: 14, right: 14 } // 5mm margins
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Render the menu
      renderMenuPDF(doc, menuData, images, menuDate, careHomeName);

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        const stats = fsSync.statSync(filepath);
        console.log(`✓ PDF saved: ${filename}`);

        resolve({
          filename: filename,
          path: filepath,
          size: stats.size,
          generatedAt: new Date().toISOString()
        });
      });

      stream.on('error', (err) => {
        reject(new Error(`PDF generation failed: ${err.message}`));
      });

    } catch (error) {
      console.error('PDF generation failed:', error);
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
}

/**
 * Render menu PDF with original design
 */
function renderMenuPDF(doc, menuData, images, menuDate, careHomeName) {
  const pageWidth = doc.page.width - 28; // Account for margins

  // Header with gradient background effect
  doc.rect(14, 14, pageWidth, 60)
    .fillAndStroke('#8b7355', '#6d5d4b');

  doc.fontSize(20)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text(careHomeName || 'Chichester Court Care Home', 14, 28, {
      width: pageWidth,
      align: 'center'
    });

  doc.fontSize(13)
    .fillColor('#f5e6d3')
    .font('Helvetica-Oblique')
    .text(formatMenuDate(menuDate), 14, 52, {
      width: pageWidth,
      align: 'center'
    });

  doc.moveDown(1);

  // Check if drinks section exists
  const hasDrinks = Object.keys(menuData.sections).some(s =>
    s.toLowerCase().includes('drink')
  );

  if (hasDrinks) {
    const currentY = doc.y + 10;
    doc.rect(14, currentY, pageWidth, 25)
      .fillAndStroke('#f0e6d6', '#c4a574');

    doc.fontSize(11)
      .fillColor('#5a4a3a')
      .font('Helvetica-Bold')
      .text('🍵 Drinks Available At All Times 🍵', 14, currentY + 8, {
        width: pageWidth,
        align: 'center'
      });

    doc.moveDown(1.5);
  }

  // Process sections
  const allSections = [];

  for (const [sectionName, sectionData] of Object.entries(menuData.sections)) {
    const normalized = sectionName.toLowerCase();

    // Skip drinks, tea duplicate, available on request
    if (normalized.includes('drink') ||
      normalized === 'tea' ||
      sectionName === 'Tea' ||
      normalized.includes('available') ||
      normalized.includes('request')) {
      continue;
    }

    allSections.push({ name: sectionName, data: sectionData, normalized });
  }

  // Sort sections
  const sectionOrder = ['breakfast', 'lunch', 'dessert', 'evening', 'supper'];
  allSections.sort((a, b) => {
    const aIndex = sectionOrder.findIndex(order => a.normalized.includes(order));
    const bIndex = sectionOrder.findIndex(order => b.normalized.includes(order));

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Render each section
  allSections.forEach(section => {
    renderSection(doc, section.name, section.data, section.normalized, images, pageWidth);
  });

  // Footer
  const footerY = doc.page.height - 50;
  doc.rect(14, footerY, pageWidth, 35)
    .fillAndStroke('#8b7355', '#6d5d4b');

  doc.fontSize(11)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text('IF ANYTHING ELSE IS PREFERRED PLEASE ASK', 14, footerY + 12, {
      width: pageWidth,
      align: 'center'
    });
}

/**
 * Render individual section
 */
function renderSection(doc, sectionName, sectionData, normalized, images, pageWidth) {
  const startY = doc.y + 10;

  // Check for image
  let imageData = null;
  if (normalized.includes('breakfast') && images.breakfast) {
    imageData = images.breakfast;
  } else if (normalized.includes('lunch') && images.lunch) {
    imageData = images.lunch;
  } else if (normalized.includes('dessert')) {
    imageData = images.dessert || images.dessert2;
  } else if (normalized.includes('evening') && images.eveningMeal) {
    imageData = images.eveningMeal;
  }

  // Section background
  const sectionHeight = imageData ? 100 : 60;
  doc.rect(14, startY, pageWidth, sectionHeight)
    .fillAndStroke('#ffffff', '#d4a574');

  // Section title background
  doc.rect(20, startY + 6, pageWidth - 12, 22)
    .fillAndStroke('#f5e6d3', '#c4a574');

  doc.fontSize(15)
    .fillColor('#6d5d4b')
    .font('Helvetica-BoldOblique')
    .text(sectionName, 20, startY + 11, {
      width: pageWidth - 12,
      align: 'center'
    });

  // Content area
  const contentStartY = startY + 35;

  if (imageData && imageData.localPath && fsSync.existsSync(imageData.localPath)) {
    // With image - side by side layout
    try {
      const imageX = 25;
      const imageY = contentStartY;
      const imageWidth = pageWidth * 0.28;
      const imageHeight = 55;

      doc.image(imageData.localPath, imageX, imageY, {
        width: imageWidth,
        height: imageHeight,
        fit: [imageWidth, imageHeight]
      });

      // Content next to image
      const contentX = imageX + imageWidth + 15;
      const contentWidth = pageWidth - imageWidth - 45;

      renderSectionContent(doc, sectionData, contentX, contentStartY, contentWidth);

    } catch (err) {
      console.warn('Failed to add image, rendering text only:', err.message);
      renderSectionContent(doc, sectionData, 25, contentStartY, pageWidth - 30);
    }
  } else {
    // No image - centered content
    renderSectionContent(doc, sectionData, 25, contentStartY, pageWidth - 30, true);
  }

  doc.y = startY + sectionHeight + 5;
}

/**
 * Render section content (items)
 */
function renderSectionContent(doc, sectionData, x, y, width, centered = false) {
  doc.fontSize(11)
    .fillColor('#3c3c3c')
    .font('Helvetica');

  if (!sectionData.items || sectionData.items.length === 0) {
    doc.text(sectionData.content || 'No items', x, y, {
      width: width,
      align: centered ? 'center' : 'left'
    });
    return;
  }

  let currentY = y;

  sectionData.items.forEach(item => {
    if (item.type === 'option') {
      doc.font('Helvetica-BoldOblique')
        .fillColor('#6d5d4b')
        .text(`OR ${item.text}`, x + 10, currentY, {
          width: width - 10,
          align: centered ? 'center' : 'left'
        });
    } else {
      doc.font('Helvetica')
        .fillColor('#3c3c3c')
        .text(`◆ ${item.text}`, x + 10, currentY, {
          width: width - 10,
          align: centered ? 'center' : 'left'
        });
    }
    currentY += 15;
  });
}

/**
 * Format menu date
 */
function formatMenuDate(dateString) {
  if (!dateString) {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

module.exports = {
  generatePDF
};