const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// ✅ Import centralized paths
const { CACHE_DIR } = require('../config/paths');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const imageStyle = require('../config/imageStyle');
const cacheService = require('./cacheService');

// Ensure cache directory exists
if (!fsSync.existsSync(CACHE_DIR)) {
  fsSync.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate images for all relevant menu sections
 */
async function generateAllImages(parsedMenu) {
  console.log('🎨 Starting image generation for all sections...');

  const images = {};
  const sections = parsedMenu.sections || {};

  // Breakfast - Generate combined image
  if (sections.Breakfast || sections.breakfast) {
    const breakfastData = sections.Breakfast || sections.breakfast;
    console.log('  📸 Generating breakfast image...');

    const breakfastItems = extractMealItems(breakfastData);
    const breakfastDescription = breakfastItems.join(', ');

    images.breakfast = await generateMealImage(breakfastDescription, 'breakfast');
  }

  // Lunch - Generate for first option
  if (sections.Lunch || sections.lunch) {
    const lunchData = sections.Lunch || sections.lunch;
    console.log('  📸 Generating lunch image...');

    const lunchItems = extractMealItems(lunchData);
    const mainLunch = lunchItems[0] || lunchItems.join(', ');

    images.lunch = await generateMealImage(mainLunch, 'lunch');
  }

  // Dessert - Generate for first option
  if (sections.Dessert || sections.dessert) {
    const dessertData = sections.Dessert || sections.dessert;
    console.log('  📸 Generating dessert image...');

    const dessertItems = extractMealItems(dessertData);
    const mainDessert = dessertItems[0] || dessertItems.join(', ');

    images.dessert = await generateMealImage(mainDessert, 'dessert');
  }

  // Evening Meal - Generate combined sandwiches/soup
  const eveningSection = sections['Evening Meal'] || sections['evening meal'] ||
    sections['Evening meal'] || sections['Tea Meal'] || sections['Tea'];

  if (eveningSection) {
    console.log('  📸 Generating evening meal image...');

    const eveningItems = extractMealItems(eveningSection);
    const eveningDescription = eveningItems.join(' and ');

    images.eveningMeal = await generateMealImage(eveningDescription, 'evening');
  }

  console.log(`✓ Generated ${Object.keys(images).length} images`);

  return images;
}

/**
 * Extract meal items from section data
 */
function extractMealItems(sectionData) {
  if (!sectionData) return [];

  const items = [];

  if (sectionData.items && Array.isArray(sectionData.items)) {
    for (const item of sectionData.items) {
      if (item.text && !item.text.toLowerCase().includes('or ')) {
        items.push(item.text.trim());
      }
    }
  } else if (sectionData.content) {
    const lines = sectionData.content.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.toLowerCase().startsWith('or ')) {
        items.push(line.trim());
      }
    }
  }

  return items.filter(item => item.length > 0);
}

/**
 * Generate image for a specific meal
 */
async function generateMealImage(mealDescription, mealType = 'main') {
  try {
    console.log(`  🎨 Generating image for: ${mealDescription.substring(0, 50)}...`);

    // Check cache first
    const cacheKey = generateCacheKey(mealDescription);
    const cached = await cacheService.getFromCache(cacheKey);

    if (cached) {
      console.log(`  ♻️  Using cached image`);
      return cached;
    }

    // Check if OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set in environment');
    }

    // Generate new image
    const prompt = buildMealImagePrompt(mealDescription, mealType);

    console.log(`  🎨 Generating new image: ${mealDescription.substring(0, 50)}...`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: process.env.IMAGE_SIZE || "1024x1024",
      quality: process.env.IMAGE_QUALITY || "standard",
      style: "natural",
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
    console.error(`❌ Failed to generate image for "${mealDescription}"`);
    console.error(`Error details:`, error.message);

    // Return placeholder instead of crashing
    return {
      url: 'https://placehold.co/1024x1024/f5e6d3/8b7355?text=Image+Generation+Failed',
      localPath: null,
      prompt: 'failed',
      mealDescription: mealDescription,
      mealType: mealType,
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Build image generation prompt
 */
function buildMealImagePrompt(mealDescription, mealType) {
  const baseStyle = imageStyle.composition.baseStyle;
  const angle = imageStyle.composition.cameraAngle;
  const lighting = imageStyle.composition.lighting;
  const plating = imageStyle.composition.plating;

  let typeSpecific = '';

  switch (mealType) {
    case 'breakfast':
      typeSpecific = 'traditional British breakfast spread with multiple items';
      break;
    case 'lunch':
      typeSpecific = 'main course meal with protein and vegetables';
      break;
    case 'dessert':
      typeSpecific = 'dessert presentation';
      break;
    case 'evening':
      typeSpecific = 'light evening meal with sandwiches or simple dishes';
      break;
    default:
      typeSpecific = 'complete meal';
  }

  return `Professional food photography of ${typeSpecific}: ${mealDescription}. 
Style: ${baseStyle}, ${angle}, ${lighting}, ${plating}. 
Plated on white ceramic dinnerware, appropriate portion sizes for elderly care home residents. 
Traditional British care home quality presentation. Photorealistic, appetizing, clean presentation.
NO text, NO logos, NO hands, NO cutlery in frame, NO artistic filters.`;
}

/**
 * Generate cache key from meal description
 */
function generateCacheKey(mealDescription) {
  return crypto
    .createHash('md5')
    .update(mealDescription.toLowerCase().trim())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Save image to cache directory
 */
async function saveImage(buffer, cacheKey, description) {
  try {
    // Ensure cache directory exists
    if (!fsSync.existsSync(CACHE_DIR)) {
      fsSync.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const filename = `${cacheKey}.png`;
    const filepath = path.join(CACHE_DIR, filename);

    // Save image directly (no sharp processing)
    fsSync.writeFileSync(filepath, buffer);

    // Save metadata
    const metadataPath = path.join(CACHE_DIR, `${cacheKey}.json`);
    fsSync.writeFileSync(metadataPath, JSON.stringify({
      description: description,
      generatedAt: new Date().toISOString(),
      filename: filename
    }, null, 2));

    // ✅ Return web-accessible path instead of filesystem path
    return `/cache/${filename}`;

  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
}

module.exports = {
  generateAllImages,
  generateMealImage
};