const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const crypto = require('crypto');

// ✅ Vercel-safe path import
const nodePath = require('path');
const isVercel = Boolean(process.env.VERCEL);

const CACHE_DIR = isVercel
  ? '/tmp/cache'
  : nodePath.join(__dirname, '../../cache');

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

  if (sections.Breakfast || sections.breakfast) {
    const breakfastData = sections.Breakfast || sections.breakfast;
    const items = extractMealItems(breakfastData);
    images.breakfast = await generateMealImage(items.join(', '), 'breakfast');
  }

  if (sections.Lunch || sections.lunch) {
    const lunchData = sections.Lunch || sections.lunch;
    const items = extractMealItems(lunchData);
    images.lunch = await generateMealImage(items[0] || items.join(', '), 'lunch');
  }

  if (sections.Dessert || sections.dessert) {
    const dessertData = sections.Dessert || sections.dessert;
    const items = extractMealItems(dessertData);
    images.dessert = await generateMealImage(items[0] || items.join(', '), 'dessert');
  }

  const eveningSection =
    sections['Evening Meal'] ||
    sections['evening meal'] ||
    sections['Evening meal'] ||
    sections['Tea Meal'] ||
    sections['Tea'];

  if (eveningSection) {
    const items = extractMealItems(eveningSection);
    images.eveningMeal = await generateMealImage(items.join(' and '), 'evening');
  }

  return images;
}

/**
 * Extract meal items from section data
 */
function extractMealItems(sectionData) {
  if (!sectionData) return [];

  const items = [];

  if (Array.isArray(sectionData.items)) {
    for (const item of sectionData.items) {
      if (item.text && !item.text.toLowerCase().startsWith('or ')) {
        items.push(item.text.trim());
      }
    }
  } else if (sectionData.content) {
    sectionData.content
      .split('\n')
      .filter(line => line.trim() && !line.toLowerCase().startsWith('or '))
      .forEach(line => items.push(line.trim()));
  }

  return items;
}

/**
 * Generate image for a specific meal
 */
async function generateMealImage(mealDescription, mealType = 'main') {
  try {
    const cacheKey = generateCacheKey(mealDescription);
    const cached = await cacheService.getFromCache(cacheKey);
    if (cached) return cached;

    const prompt = buildMealImagePrompt(mealDescription, mealType);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: process.env.IMAGE_SIZE || '1024x1024',
      quality: process.env.IMAGE_QUALITY || 'standard',
      style: 'natural',
      n: 1,
    });

    const imageUrl = response.data[0].url;
    const imageBuffer = await downloadImage(imageUrl);
    const localPath = await saveImage(imageBuffer, cacheKey, mealDescription);

    const imageData = {
      url: imageUrl,
      localPath,
      prompt,
      mealDescription,
      mealType,
      generatedAt: new Date().toISOString(),
    };

    if (process.env.ENABLE_IMAGE_CACHE !== 'false') {
      await cacheService.saveToCache(cacheKey, imageData);
    }

    return imageData;
  } catch (error) {
    console.error('❌ Image generation failed:', error.message);
    return { localPath: null, error: error.message };
  }
}

/**
 * Build image generation prompt
 */
function buildMealImagePrompt(mealDescription, mealType) {
  const base = imageStyle.composition;
  return `Professional food photography of ${mealType}: ${mealDescription}.
${base.baseStyle}, ${base.cameraAngle}, ${base.lighting}, ${base.plating}.
NO text, NO logos, NO hands.`;
}

/**
 * Generate cache key
 */
function generateCacheKey(text) {
  return crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
}

/**
 * Download image
 */
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Save image to cache
 */
async function saveImage(buffer, cacheKey, description) {
  try {
    const filename = `${cacheKey}.png`;
    const filepath = nodePath.join(CACHE_DIR, filename);

    fsSync.writeFileSync(filepath, buffer);

    const metadataPath = nodePath.join(CACHE_DIR, `${cacheKey}.json`);
    fsSync.writeFileSync(
      metadataPath,
      JSON.stringify({ description, filename }, null, 2)
    );

    // ✅ public URL used by PDF + frontend
    return `/cache/${filename}`;
  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
}

module.exports = {
  generateAllImages,
  generateMealImage,
};
