const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { OUTPUT_DIR } = require('../config/paths');

// Ensure output directory exists
if (!fsSync.existsSync(OUTPUT_DIR)) {
  fsSync.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate PDF using PDFKit
 */
async function generatePDF(options) {
  const { menuData, images, menuDate, careHomeName } = options;

  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating PDF with PDFKit...');

      const filename = `menu-${Date.now()}-${uuidv4().slice(0, 8)}.pdf`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .fillColor('#2563eb')
        .text(careHomeName || 'Chichester Court Care Home', { align: 'center' });

      doc
        .fontSize(12)
        .fillColor('#666666')
        .text(formatMenuDate(menuDate), { align: 'center' });

      doc.moveDown(2);

      // Generate sections
      const sectionOrder = ['breakfast', 'lunch', 'dessert', 'evening', 'supper'];

      const sections = Object.entries(menuData.sections)
        .filter(([name]) => {
          const n = name.toLowerCase();
          return !(n.includes('drink') || n === 'tea' || n.includes('available'));
        })
        .map(([name, data]) => ({ name, data, normalized: name.toLowerCase() }))
        .sort((a, b) => {
          const ai = sectionOrder.findIndex(o => a.normalized.includes(o));
          const bi = sectionOrder.findIndex(o => b.normalized.includes(o));
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });

      sections.forEach((section, index) => {
        // Section title
        doc
          .fontSize(16)
          .fillColor('#2563eb')
          .text(section.name, { underline: true });

        doc.moveDown(0.5);

        // Add image if available
        const normalized = section.normalized;
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

        if (imageData?.localPath && fsSync.existsSync(imageData.localPath)) {
          try {
            const currentY = doc.y;
            doc.image(imageData.localPath, 50, currentY, {
              width: 200,
              align: 'left'
            });

            // Move to right of image for content
            const contentX = 270;
            const contentY = currentY;

            // Add menu items next to image
            if (section.data.items?.length) {
              section.data.items.forEach((item, i) => {
                const y = contentY + (i * 20);

                doc
                  .fontSize(11)
                  .fillColor(item.type === 'option' ? '#666666' : '#333333')
                  .text(
                    item.type === 'option' ? `→ ${item.text}` : `• ${item.text}`,
                    contentX,
                    y,
                    { width: 250 }
                  );
              });
            }

            // Move down past the image
            doc.y = currentY + 210;

          } catch (err) {
            console.error('Error adding image:', err);
            addMenuItems(doc, section.data);
          }
        } else {
          // No image, just add items
          addMenuItems(doc, section.data);
        }

        doc.moveDown(1.5);
      });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        const stats = fsSync.statSync(filepath);
        console.log(`✅ PDF saved: ${filename}`);

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
      console.error('❌ PDF generation failed:', error);
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
}

/**
 * Add menu items to PDF
 */
function addMenuItems(doc, sectionData) {
  if (sectionData.items?.length) {
    sectionData.items.forEach(item => {
      doc
        .fontSize(11)
        .fillColor(item.type === 'option' ? '#666666' : '#333333')
        .text(
          item.type === 'option' ? `→ ${item.text}` : `• ${item.text}`,
          { indent: 20 }
        );
    });
  } else if (sectionData.content) {
    doc.fontSize(11).fillColor('#333333').text(sectionData.content);
  }
}

/**
 * Format menu date
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

module.exports = { generatePDF };