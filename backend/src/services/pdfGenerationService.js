const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ✅ ONLY CHANGE: Import centralized paths
const { OUTPUT_DIR, isVercel } = require('../config/paths');

// Handle different environments
const chromium = isVercel ? require('@sparticuz/chromium') : null;
const puppeteer = isVercel
  ? require('puppeteer-core')
  : require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, '../templates/menuTemplate.html');

// Ensure output directory exists
if (!fsSync.existsSync(OUTPUT_DIR)) {
  fsSync.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate PDF from menu data and images
 */
async function generatePDF(options) {
  const { menuData, images, menuDate, careHomeName } = options;

  try {
    console.log('📄 Loading HTML template...');

    // Load template
    const template = await loadTemplate();

    // Render HTML with data
    const html = renderTemplate(template, {
      menuData,
      images,
      menuDate: formatMenuDate(menuDate),
      careHomeName: careHomeName || 'Chichester Court Care Home'
    });

    console.log('🖨️  Generating PDF with Puppeteer...');

    // Generate PDF with environment-specific browser
    const browser = await puppeteer.launch(
      isVercel
        ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
        : {
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate unique filename
    const filename = `menu-${Date.now()}-${uuidv4().substring(0, 8)}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '5mm',
        bottom: '5mm',
        left: '5mm',
        right: '5mm'
      }
    });

    await browser.close();

    console.log(`✓ PDF saved: ${filename}`);

    // Get file size
    const stats = await fs.stat(filepath);

    return {
      filename: filename,
      path: filepath,
      size: stats.size,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Load HTML template
 */
async function loadTemplate() {
  try {
    return await fs.readFile(TEMPLATE_PATH, 'utf8');
  } catch (error) {
    console.warn('Template not found, using default template');
    return getDefaultTemplate();
  }
}

/**
 * Render template with data
 */
function renderTemplate(template, data) {
  let html = template;

  console.log('🔧 Rendering template...');
  console.log('📋 Sections available:', Object.keys(data.menuData.sections));

  // Replace basic variables
  html = html.replace(/\{\{careHomeName\}\}/g, data.careHomeName);
  html = html.replace(/\{\{menuDate\}\}/g, data.menuDate);

  // Check if drinks section exists
  const hasDrinks = Object.keys(data.menuData.sections).some(s =>
    s.toLowerCase().includes('drink')
  );

  console.log('🍵 Has drinks section:', hasDrinks);

  // Handle conditional rendering for drinks
  const drinksRegex = /\{\{#if hasDrinks\}\}([\s\S]*?)\{\{\/if\}\}/g;
  if (hasDrinks) {
    html = html.replace(drinksRegex, '$1');
  } else {
    html = html.replace(drinksRegex, '');
  }

  // Generate sections HTML
  const sectionsHtml = generateSectionsHtml(data.menuData, data.images);
  console.log('📝 Generated sections HTML length:', sectionsHtml.length);

  // Replace sections placeholder
  html = html.replace(/\{\{sections\}\}/g, sectionsHtml);

  return html;
}

/**
 * Generate HTML for all menu sections - FULL WIDTH
 */
function generateSectionsHtml(menuData, images) {
  console.log('🏗️  Building sections HTML...');

  const allSections = [];

  // Process all sections
  for (const [sectionName, sectionData] of Object.entries(menuData.sections)) {
    const normalized = sectionName.toLowerCase();

    console.log(`  Processing section: ${sectionName} (${normalized})`);

    // Skip: Drinks (in header), Tea (duplicate), Available on Request
    if (normalized.includes('drink')) {
      console.log('    ⏭️  Skipping (drinks in header)');
      continue;
    }

    if (normalized === 'tea' || sectionName === 'Tea') {
      console.log('    ⏭️  Skipping (tea is duplicate of evening meal)');
      continue;
    }

    if (normalized.includes('available') || normalized.includes('request')) {
      console.log('    ⏭️  Skipping (available on request)');
      continue;
    }

    console.log('    ✅ Including section');
    allSections.push({ name: sectionName, data: sectionData, normalized });
  }

  console.log(`📊 Total sections to render: ${allSections.length}`);

  // Sort sections by preferred order
  const sectionOrder = ['breakfast', 'lunch', 'dessert', 'evening', 'supper'];
  allSections.sort((a, b) => {
    const aIndex = sectionOrder.findIndex(order => a.normalized.includes(order));
    const bIndex = sectionOrder.findIndex(order => b.normalized.includes(order));

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Generate HTML for each section
  const sectionsHtmlArray = allSections.map(section => {
    console.log(`  🎨 Generating HTML for: ${section.name}`);
    return generateSectionHtml(section.name, section.data, images);
  });

  const finalHtml = sectionsHtmlArray.join('\n');
  console.log(`✅ Sections HTML generated (${finalHtml.length} characters)`);

  return finalHtml;
}

/**
 * Generate HTML for a single section
 */
function generateSectionHtml(sectionName, sectionData, images) {
  const normalized = sectionName.toLowerCase();

  // Determine if this section has an image
  let imageHtml = '';
  let hasImage = false;

  if (normalized.includes('breakfast') && images.breakfast) {
    imageHtml = generateImageHtml(images.breakfast);
    hasImage = true;
  } else if (normalized.includes('lunch') && images.lunch) {
    imageHtml = generateImageHtml(images.lunch);
    hasImage = true;
  } else if (normalized.includes('dessert')) {
    const dessertImage = images.dessert || images.dessert2;
    if (dessertImage) {
      imageHtml = generateImageHtml(dessertImage);
      hasImage = true;
    }
  } else if (normalized.includes('evening') && images.eveningMeal) {
    imageHtml = generateImageHtml(images.eveningMeal);
    hasImage = true;
  }

  // Generate content
  const contentHtml = formatSectionContent(sectionData);

  // If has image, use flex layout
  if (hasImage && imageHtml) {
    return `
      <div class="section full-width">
        <div class="section-title">${sectionName}</div>
        <div class="section-flex">
          <div class="section-image">
            ${imageHtml}
          </div>
          <div class="section-content-flex">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  } else {
    // No image, just content
    return `
      <div class="section full-width">
        <div class="section-title">${sectionName}</div>
        <div class="section-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }
}

/**
 * Generate image HTML
 */
function generateImageHtml(imageData) {
  if (!imageData || !imageData.localPath) {
    console.log('    ⚠️  No image data or path');
    return '';
  }

  try {
    if (!fsSync.existsSync(imageData.localPath)) {
      console.log('    ⚠️  Image file not found:', imageData.localPath);
      return '';
    }

    const imageBuffer = fsSync.readFileSync(imageData.localPath);
    const base64Image = imageBuffer.toString('base64');

    console.log('    ✅ Image loaded successfully');
    return `<img src="data:image/png;base64,${base64Image}" class="meal-image" alt="Meal image">`;
  } catch (error) {
    console.warn('    ❌ Failed to load image:', error.message);
    return '';
  }
}

/**
 * Format section content
 */
function formatSectionContent(sectionData) {
  if (!sectionData.items || sectionData.items.length === 0) {
    if (sectionData.content) {
      return `<p>${sectionData.content}</p>`;
    }
    return '<p>No items</p>';
  }

  let html = '<ul class="meal-list">';

  for (const item of sectionData.items) {
    if (item.type === 'option') {
      html += `<li class="meal-option">${item.text}</li>`;
    } else {
      html += `<li class="meal-item">${item.text}</li>`;
    }
  }

  html += '</ul>';

  return html;
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

/**
 * Default template - Compact single-page design
 */
function getDefaultTemplate() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Menu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Palatino', 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      color: #2c2c2c;
      line-height: 1.3;
      background: linear-gradient(135deg, #fdfbf7 0%, #f9f5f0 100%);
      padding: 6mm;
    }
    
    .header {
      text-align: center;
      margin-bottom: 6pt;
      padding: 8pt 15pt;
      background: linear-gradient(135deg, #8b7355 0%, #a0826d 100%);
      border-radius: 8pt;
      box-shadow: 0 2pt 6pt rgba(0,0,0,0.15);
      border: 1.5pt solid #6d5d4b;
    }
    
    .header h1 {
      font-size: 20pt;
      color: #ffffff;
      margin-bottom: 3pt;
      font-weight: bold;
      letter-spacing: 1.5pt;
      text-shadow: 1pt 1pt 3pt rgba(0,0,0,0.3);
    }
    
    .header .menu-date {
      font-size: 13pt;
      color: #f5e6d3;
      font-style: italic;
      font-weight: 500;
    }
    
    .drinks-header {
      text-align: center;
      font-size: 11pt;
      color: #5a4a3a;
      margin-bottom: 6pt;
      padding: 4pt;
      background: #f0e6d6;
      border-radius: 6pt;
      border: 1.5pt dashed #c4a574;
      font-weight: bold;
      letter-spacing: 0.3pt;
    }
    
    .section {
      margin-bottom: 6pt;
      page-break-inside: avoid;
      background: #ffffff;
      border-radius: 8pt;
      padding: 6pt;
      box-shadow: 0 1pt 4pt rgba(0,0,0,0.1);
      border: 1pt solid #d4a574;
    }
    
    .section.full-width {
      width: 100%;
    }
    
    .section-title {
      font-size: 15pt;
      font-weight: bold;
      color: #6d5d4b;
      margin-bottom: 5pt;
      text-align: center;
      font-style: italic;
      padding: 4pt 8pt;
      background: linear-gradient(135deg, #f5e6d3 0%, #e8d5c0 100%);
      border-radius: 5pt;
      border-bottom: 1.5pt solid #c4a574;
      letter-spacing: 0.8pt;
    }
    
    .section-flex {
      display: flex;
      align-items: flex-start;
      gap: 8pt;
    }
    
    .section-image {
      flex: 0 0 30%;
      max-width: 30%;
    }
    
    .meal-image {
      width: 100%;
      height: 65pt;
      object-fit: cover;
      border-radius: 6pt;
      border: 1.5pt solid #d4a574;
      box-shadow: 0 1pt 3pt rgba(0,0,0,0.15);
    }
    
    .section-content-flex {
      flex: 1;
      font-size: 11pt;
      line-height: 1.4;
      color: #3c3c3c;
    }
    
    .section-content {
      font-size: 11pt;
      text-align: center;
      line-height: 1.4;
      color: #3c3c3c;
      padding: 3pt;
    }
    
    .meal-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .meal-item {
      padding: 2pt 0;
      font-size: 11pt;
      position: relative;
      padding-left: 15pt;
      text-align: left;
    }
    
    .meal-item:before {
      content: "◆";
      color: #c4a574;
      font-size: 9pt;
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    .meal-option {
      padding: 2pt 0;
      padding-left: 15pt;
      font-style: italic;
      color: #6d5d4b;
      font-size: 11pt;
      font-weight: 600;
      text-align: left;
    }
    
    .meal-option:before {
      content: "OR ";
      font-weight: bold;
      color: #8b7355;
      letter-spacing: 0.8pt;
    }
    
    .footer {
      text-align: center;
      margin-top: 6pt;
      padding: 6pt;
      background: linear-gradient(135deg, #8b7355 0%, #a0826d 100%);
      border-radius: 8pt;
      font-size: 11pt;
      color: #ffffff;
      font-weight: bold;
      letter-spacing: 0.8pt;
      box-shadow: 0 2pt 6pt rgba(0,0,0,0.15);
      border: 1.5pt solid #6d5d4b;
    }
    
    .header:before,
    .header:after {
      content: "❖";
      color: #f5e6d3;
      font-size: 13pt;
      margin: 0 8pt;
    }
    
    .footer:before,
    .footer:after {
      content: "✦";
      color: #f5e6d3;
      font-size: 11pt;
      margin: 0 6pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{careHomeName}}</h1>
    <div class="menu-date">{{menuDate}}</div>
  </div>
  
  {{#if hasDrinks}}
  <div class="drinks-header">🍵 Drinks Available At All Times 🍵</div>
  {{/if}}
  
  {{sections}}
  
  <div class="footer">
    IF ANYTHING ELSE IS PREFERRED PLEASE ASK
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  generatePDF
};