const PDFDocument = require('pdfkit');
const fsSync = require('fs');
const fs = fsSync.promises;
const nodePath = require('path');
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);

// Output directory (Vercel-safe)
const OUTPUT_DIR = isVercel
  ? '/tmp/pdf'
  : nodePath.join(__dirname, '../../pdf');

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
      const filepath = nodePath.join(OUTPUT_DIR, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 14, bottom: 14, left: 14, right: 14 }
      });

      // IMPORTANT: use fsSync for streams
      const stream = fsSync.createWriteStream(filepath);
      doc.pipe(stream);

      // Render PDF content
      renderMenuPDF(doc, menuData, images, menuDate, careHomeName);

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        const stats = fsSync.statSync(filepath);

        console.log(`✓ PDF saved: ${filename}`);

        resolve({
          filename,
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
 * Render menu PDF layout
 */
function renderMenuPDF(doc, menuData, images, menuDate, careHomeName) {
  const pageWidth = doc.page.width - 28;

  // Header
  doc.rect(14, 14, pageWidth, 60)
    .fillAndStroke('#8b7355', '#6d5d4b');

  doc.fontSize(20)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text(careHomeName || 'Care Home Menu', 14, 28, {
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

  const hasDrinks = Object.keys(menuData.sections).some(s =>
    s.toLowerCase().includes('drink')
  );

  if (hasDrinks) {
    const y = doc.y + 10;
    doc.rect(14, y, pageWidth, 25)
      .fillAndStroke('#f0e6d6', '#c4a574');

    doc.fontSize(11)
      .fillColor('#5a4a3a')
      .font('Helvetica-Bold')
      .text('🍵 Drinks Available At All Times 🍵', 14, y + 8, {
        width: pageWidth,
        align: 'center'
      });

    doc.moveDown(1.5);
  }

  const sections = [];
  for (const [name, data] of Object.entries(menuData.sections)) {
    const normalized = name.toLowerCase();
    if (
      normalized.includes('drink') ||
      normalized === 'tea' ||
      normalized.includes('available') ||
      normalized.includes('request')
    ) continue;

    sections.push({ name, data, normalized });
  }

  const order = ['breakfast', 'lunch', 'dessert', 'evening', 'supper'];
  sections.sort((a, b) => {
    const ai = order.findIndex(o => a.normalized.includes(o));
    const bi = order.findIndex(o => b.normalized.includes(o));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  sections.forEach(section => {
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
 * Render a section
 */
function renderSection(doc, name, data, normalized, images, pageWidth) {
  const startY = doc.y + 10;

  let imageData = null;
  if (normalized.includes('breakfast')) imageData = images.breakfast;
  else if (normalized.includes('lunch')) imageData = images.lunch;
  else if (normalized.includes('dessert')) imageData = images.dessert || images.dessert2;
  else if (normalized.includes('evening')) imageData = images.eveningMeal;

  const height = imageData ? 100 : 60;

  doc.rect(14, startY, pageWidth, height)
    .fillAndStroke('#ffffff', '#d4a574');

  doc.rect(20, startY + 6, pageWidth - 12, 22)
    .fillAndStroke('#f5e6d3', '#c4a574');

  doc.fontSize(15)
    .fillColor('#6d5d4b')
    .font('Helvetica-BoldOblique')
    .text(name, 20, startY + 11, {
      width: pageWidth - 12,
      align: 'center'
    });

  const contentY = startY + 35;

  if (imageData?.localPath && fsSync.existsSync(imageData.localPath)) {
    try {
      const imgW = pageWidth * 0.28;
      doc.image(imageData.localPath, 25, contentY, {
        width: imgW,
        height: 55
      });

      renderSectionContent(
        doc,
        data,
        25 + imgW + 15,
        contentY,
        pageWidth - imgW - 45
      );
    } catch {
      renderSectionContent(doc, data, 25, contentY, pageWidth - 30);
    }
  } else {
    renderSectionContent(doc, data, 25, contentY, pageWidth - 30, true);
  }

  doc.y = startY + height + 5;
}

/**
 * Render section items
 */
function renderSectionContent(doc, data, x, y, width, centered = false) {
  doc.fontSize(11).font('Helvetica').fillColor('#3c3c3c');

  if (!data.items?.length) {
    doc.text(data.content || 'No items', x, y, {
      width,
      align: centered ? 'center' : 'left'
    });
    return;
  }

  let currentY = y;
  data.items.forEach(item => {
    doc.text(
      `${item.type === 'option' ? 'OR ' : '◆ '}${item.text}`,
      x + 10,
      currentY,
      { width: width - 10, align: centered ? 'center' : 'left' }
    );
    currentY += 15;
  });
}

/**
 * Format date
 */
function formatMenuDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
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
