// ===============================
// Imports (clean, no duplicates)
// ===============================
const chromium = process.env.VERCEL ? require('@sparticuz/chromium') : null;
const puppeteer = process.env.VERCEL
  ? require('puppeteer-core')
  : require('puppeteer');

const fs = require('fs').promises; // async fs
const fsSync = require('fs');      // sync fs
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ✅ Import centralized paths
const { OUTPUT_DIR } = require('../config/paths');

// ===============================
// Paths & constants
// ===============================
const TEMPLATE_PATH = path.join(__dirname, '../templates/menuTemplate.html');

// ✅ Ensure output directory exists
if (!fsSync.existsSync(OUTPUT_DIR)) {
  fsSync.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ===============================
// Main PDF generator
// ===============================
async function generatePDF(options) {
  const { menuData, images, menuDate, careHomeName } = options;

  try {
    console.log('📄 Loading HTML template...');
    const template = await loadTemplate();

    const html = renderTemplate(template, {
      menuData,
      images,
      menuDate: formatMenuDate(menuDate),
      careHomeName: careHomeName || 'Chichester Court Care Home'
    });

    console.log('🖨️ Generating PDF with Puppeteer...');

    // Launch browser (Vercel vs local)
    const browser = await puppeteer.launch(
      process.env.VERCEL
        ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
        : {
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const filename = `menu-${Date.now()}-${uuidv4().slice(0, 8)}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        bottom: '8mm',
        left: '8mm',
        right: '8mm'
      }
    });

    await browser.close();

    const stats = await fs.stat(filepath);

    console.log(`✅ PDF saved: ${filename}`);

    return {
      filename,
      path: filepath,
      size: stats.size,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

// ===============================
// Template helpers
// ===============================
async function loadTemplate() {
  try {
    return await fs.readFile(TEMPLATE_PATH, 'utf8');
  } catch {
    console.warn('⚠️ Template not found, using default');
    return getDefaultTemplate();
  }
}

function renderTemplate(template, data) {
  let html = template;

  html = html.replace(/\{\{careHomeName\}\}/g, data.careHomeName);
  html = html.replace(/\{\{menuDate\}\}/g, data.menuDate);

  const hasDrinks = Object.keys(data.menuData.sections).some(s =>
    s.toLowerCase().includes('drink')
  );

  const drinksRegex = /\{\{#if hasDrinks\}\}([\s\S]*?)\{\{\/if\}\}/g;
  html = hasDrinks ? html.replace(drinksRegex, '$1') : html.replace(drinksRegex, '');

  const sectionsHtml = generateSectionsHtml(data.menuData, data.images);
  return html.replace(/\{\{sections\}\}/g, sectionsHtml);
}

// ===============================
// Section rendering
// ===============================
function generateSectionsHtml(menuData, images) {
  const sectionOrder = ['breakfast', 'lunch', 'dessert', 'evening', 'supper'];

  const sections = Object.entries(menuData.sections)
    .filter(([name]) => {
      const n = name.toLowerCase();
      return !(
        n.includes('drink') ||
        n === 'tea' ||
        n.includes('available') ||
        n.includes('request')
      );
    })
    .map(([name, data]) => ({ name, data, normalized: name.toLowerCase() }))
    .sort((a, b) => {
      const ai = sectionOrder.findIndex(o => a.normalized.includes(o));
      const bi = sectionOrder.findIndex(o => b.normalized.includes(o));
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  return sections
    .map(section => generateSectionHtml(section.name, section.data, images))
    .join('\n');
}

function generateSectionHtml(sectionName, sectionData, images) {
  const normalized = sectionName.toLowerCase();
  let imageHtml = '';

  if (normalized.includes('breakfast') && images.breakfast) {
    imageHtml = generateImageHtml(images.breakfast);
  } else if (normalized.includes('lunch') && images.lunch) {
    imageHtml = generateImageHtml(images.lunch);
  } else if (normalized.includes('dessert')) {
    imageHtml = generateImageHtml(images.dessert || images.dessert2);
  } else if (normalized.includes('evening') && images.eveningMeal) {
    imageHtml = generateImageHtml(images.eveningMeal);
  }

  const contentHtml = formatSectionContent(sectionData);

  return imageHtml
    ? `
      <div class="section full-width">
        <div class="section-title">${sectionName}</div>
        <div class="section-flex">
          <div class="section-image">${imageHtml}</div>
          <div class="section-content-flex">${contentHtml}</div>
        </div>
      </div>
    `
    : `
      <div class="section full-width">
        <div class="section-title">${sectionName}</div>
        <div class="section-content">${contentHtml}</div>
      </div>
    `;
}

// ===============================
// Utilities
// ===============================
function generateImageHtml(imageData) {
  if (!imageData?.localPath || !fsSync.existsSync(imageData.localPath)) {
    return '';
  }

  const base64 = fsSync.readFileSync(imageData.localPath).toString('base64');
  return `<img src="data:image/png;base64,${base64}" class="meal-image" alt="Meal">`;
}

function formatSectionContent(sectionData) {
  if (!sectionData.items?.length) {
    return `<p>${sectionData.content || 'No items'}</p>`;
  }

  return `
    <ul class="meal-list">
      ${sectionData.items.map(item =>
    item.type === 'option'
      ? `<li class="meal-option">${item.text}</li>`
      : `<li class="meal-item">${item.text}</li>`
  ).join('')}
    </ul>
  `;
}

function formatMenuDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ===============================
// Default template
// ===============================
function getDefaultTemplate() {
  return `<!DOCTYPE html> ... same template ...`;
}

// ===============================
module.exports = { generatePDF };
