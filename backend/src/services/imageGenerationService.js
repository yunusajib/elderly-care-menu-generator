const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const validationService = require('./validationService');
const cacheService = require('./cacheService');
const imageStyleConfig = require('../config/imageStyle');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate all meal images for menu
 */
async function generateAllImages(parsedMenu) {
  console.log('🎨 Starting image generation for all sections...');

  const mealOptions = validationService.extractMealOptions(parsedMenu);
  const images = {};

  // Generate images based on locked rules
  for (const [sectionName, options] of Object.entries(mealOptions)) {
    const normalized = sectionName.toLowerCase();

    // Breakfast - Combined image
    if (normalized.includes('breakfast')) {
      console.log('  📸 Generating breakfast image...');
      images.breakfast = await generateMealImage(
        'Bowl of porridge, bowl of cornflakes, full English breakfast with bacon, sausage, eggs, toast',
        'breakfast'
      );
    }

    // Lunch - First option only
    else if (normalized.includes('lunch')) {
      console.log('  📸 Generating lunch image...');
      const lunchDesc = options.firstOption || options.allItems.join(', ');
      images.lunch = await generateMealImage(lunchDesc, 'lunch');
    }

    // Dessert - First option only
    else if (normalized.includes('dessert')) {
      console.log('  📸 Generating dessert image...');
      const dessertDesc = options.firstOption || options.allItems[0];

      // Handle multiple dessert sections
      const key = images.dessert ? 'dessert2' : 'dessert';
      images[key] = await generateMealImage(dessertDesc, 'dessert');
    }

    // Evening Meal / Tea - Sandwiches and soup
    else if (normalized.includes('evening') || normalized.includes('tea')) {
      console.log('  📸 Generating evening meal image...');
      images.eveningMeal = await generateMealImage(
        'Assorted sandwiches and bowl of soup',
        'evening'
      );
    }

    // Supper - No image (as per requirements)
    // Drinks - No image (as per requirements)
  }

  console.log(`✓ Generated ${Object.keys(images).length} images`);

  return images;
}

/**
 * Generate single meal image with caching
 */
async function generateMealImage(mealDescription, mealType = 'main') {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(mealDescription);
    const cached = await cacheService.getFromCache(cacheKey);

    if (cached) {
      console.log(`  ♻️  Using cached image: ${mealDescription.substring(0, 40)}...`);
      return cached;
    }

    // Generate new image
    console.log(`  🎨 Generating new image: ${mealDescription.substring(0, 40)}...`);

    const prompt = buildMealImagePrompt(mealDescription, mealType);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: process.env.IMAGE_SIZE || "1024x1024",
      quality: process.env.IMAGE_QUALITY || "hd",
      style: "natural", // Not vivid - keeps it realistic
      n: 1,
    });

    const imageUrl = response.data[0].url;

    // Download and save image
    const imageBuffer = await downloadImage(imageUrl);
    const localPath = await saveImage(imageBuffer, cacheKey, mealDescription);

    const imageData = {
      url: imageUrl,
      localPath: localPath,
      prompt: prompt,
      mealDescription: mealDescription,
      mealType: mealType,
      generatedAt: new Date().toISOString()
    };

    // Cache for future use
    if (process.env.ENABLE_IMAGE_CACHE !== 'false') {
      await cacheService.saveToCache(cacheKey, imageData);
    }

    return imageData;

  } catch (error) {
    console.error(`❌ Failed to generate image for "${mealDescription}":`, error.message);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Build AI image prompt with locked style
 */
function buildMealImagePrompt(mealDescription, mealType) {
  // Parse meal components
  const components = parseMealComponents(mealDescription);
  const componentList = components.map(c => c.toLowerCase()).join(', ');

  // Get style template
  const style = imageStyleConfig.lockedStyle;

  // Construct prompt
  const prompt = `
Professional food photography of a complete plated meal:

MEAL COMPONENTS (all must be visible on one plate):
${componentList}

VISUAL STYLE (STRICT - DO NOT DEVIATE):
- Shot from ${style.cameraAngle}
- ${style.lighting}
- ${style.background}
- ${style.composition}
- ${style.context}
- ${style.platingStyle}
- ${style.portionSize}
- All components clearly visible and identifiable
- ${style.quality}
- ${style.colorBalance}

PROHIBITED:
${style.prohibited.map(p => `- No ${p}`).join('\n')}

CONTEXT: 
${style.additionalContext}
`.trim();

  return prompt;
}

/**
 * Parse meal description into components
 */
function parseMealComponents(mealText) {
  // Remove common prepositions and split
  const cleaned = mealText
    .replace(/\bwith\b/gi, ',')
    .replace(/\band\b/gi, ',')
    .replace(/\&/g, ',');

  const parts = cleaned
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return parts;
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Save image to local storage
 */
async function saveImage(buffer, cacheKey, description) {
  const cacheDir = process.env.VERCEL ? '/tmp/cache' : (process.env.CACHE_DIR || './cache');

  // Ensure directory exists
  const fsSync = require('fs');
  if (!fsSync.existsSync(cacheDir)) {
    fsSync.mkdirSync(cacheDir, { recursive: true });
  }

  const filename = `${cacheKey}.png`;
  const filepath = path.join(cacheDir, filename);

  fsSync.writeFileSync(filepath, buffer);

  // Also save metadata
  const metadataPath = path.join(cacheDir, `${cacheKey}.json`);
  fsSync.writeFileSync(metadataPath, JSON.stringify({
    description: description,
    generatedAt: new Date().toISOString(),
    filename: filename
  }, null, 2));

  return filepath;
}
/**
 * Generate cache key from meal description
 */
function generateCacheKey(mealDescription) {
  const normalized = mealDescription.toLowerCase().trim();
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Regenerate image with style corrections
 */
async function regenerateWithStyleCorrection(mealDescription, mealType, previousAttempt) {
  console.log(`  🔄 Regenerating with style correction...`);

  // Add more specific style enforcement to prompt
  const enhancedPrompt = buildMealImagePrompt(mealDescription, mealType) +
    '\n\nIMPORTANT: Ensure consistent style with institutional care home photography standards.';

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    size: "1024x1024",
    quality: "hd",
    style: "natural",
    n: 1,
  });

  const imageUrl = response.data[0].url;
  const imageBuffer = await downloadImage(imageUrl);
  const cacheKey = generateCacheKey(mealDescription + '_v2');
  const localPath = await saveImage(imageBuffer, cacheKey, mealDescription);

  return {
    url: imageUrl,
    localPath: localPath,
    prompt: enhancedPrompt,
    mealDescription: mealDescription,
    mealType: mealType,
    generatedAt: new Date().toISOString(),
    regenerated: true
  };
}

module.exports = {
  generateAllImages,
  generateMealImage,
  regenerateWithStyleCorrection
};
