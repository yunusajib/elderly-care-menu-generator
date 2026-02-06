const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
// ✅ Import centralized paths
const isVercel = !!process.env.VERCEL;
const CACHE_DIR = isVercel ? '/tmp/cache' : path.join(__dirname, '../../cache');

const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'cache-index.json');

/**
 * Initialize cache index
 */
async function initializeCacheIndex() {
  try {
    // ✅ Ensure cache directory exists
    if (!fsSync.existsSync(CACHE_DIR)) {
      fsSync.mkdirSync(CACHE_DIR, { recursive: true });
    }

    await fs.access(CACHE_INDEX_FILE);
  } catch {
    // Create empty index
    await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify({}, null, 2));
  }
}

/**
 * Load cache index
 */
async function loadCacheIndex() {
  try {
    const data = await fs.readFile(CACHE_INDEX_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Save cache index
 */
async function saveCacheIndex(index) {
  await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * Get image from cache
 */
async function getFromCache(cacheKey) {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  if (index[cacheKey]) {
    const entry = index[cacheKey];

    // Check if file still exists
    const imagePath = path.join(CACHE_DIR, `${cacheKey}.png`);
    try {
      await fs.access(imagePath);

      // Update usage count and last used
      entry.usageCount = (entry.usageCount || 0) + 1;
      entry.lastUsed = new Date().toISOString();
      index[cacheKey] = entry;
      await saveCacheIndex(index);

      return {
        ...entry,
        localPath: imagePath,
        cached: true
      };
    } catch {
      // File missing, remove from index
      delete index[cacheKey];
      await saveCacheIndex(index);
      return null;
    }
  }

  return null;
}

/**
 * Save image to cache
 */
async function saveToCache(cacheKey, imageData) {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  index[cacheKey] = {
    mealDescription: imageData.mealDescription,
    mealType: imageData.mealType,
    prompt: imageData.prompt,
    generatedAt: imageData.generatedAt,
    usageCount: 1,
    lastUsed: new Date().toISOString(),
    url: imageData.url,
    localPath: imageData.localPath
  };

  await saveCacheIndex(index);
}

/**
 * Delete from cache
 */
async function deleteFromCache(cacheKey) {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  if (index[cacheKey]) {
    // Delete image files
    const imagePath = path.join(CACHE_DIR, `${cacheKey}.png`);
    const metadataPath = path.join(CACHE_DIR, `${cacheKey}.json`);

    try {
      await fs.unlink(imagePath);
    } catch { }

    try {
      await fs.unlink(metadataPath);
    } catch { }

    // Remove from index
    delete index[cacheKey];
    await saveCacheIndex(index);

    return { found: true, deleted: true };
  }

  return { found: false, deleted: false };
}

/**
 * Get cache statistics
 */
async function getStats() {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  const entries = Object.values(index);
  const totalImages = entries.length;
  const totalUsage = entries.reduce((sum, e) => sum + (e.usageCount || 1), 0);
  const avgUsagePerImage = totalImages > 0 ? (totalUsage / totalImages).toFixed(2) : 0;

  // Calculate cache size
  let totalSize = 0;
  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith('.png')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
  } catch { }

  const cacheSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  // Most used images
  const mostUsed = entries
    .sort((a, b) => (b.usageCount || 1) - (a.usageCount || 1))
    .slice(0, 5)
    .map(e => ({
      mealDescription: e.mealDescription,
      usageCount: e.usageCount,
      lastUsed: e.lastUsed
    }));

  return {
    totalImages: totalImages,
    totalUsage: totalUsage,
    avgUsagePerImage: parseFloat(avgUsagePerImage),
    cacheSizeMB: parseFloat(cacheSizeMB),
    mostUsed: mostUsed
  };
}

/**
 * List all cached images
 */
async function listCached() {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  return Object.entries(index).map(([key, data]) => ({
    cacheKey: key,
    mealDescription: data.mealDescription,
    mealType: data.mealType,
    usageCount: data.usageCount,
    generatedAt: data.generatedAt,
    lastUsed: data.lastUsed
  }));
}

/**
 * Clear entire cache
 */
async function clearCache() {
  await initializeCacheIndex();
  const index = await loadCacheIndex();

  const keys = Object.keys(index);
  let deletedCount = 0;

  for (const key of keys) {
    const result = await deleteFromCache(key);
    if (result.deleted) deletedCount++;
  }

  return { deletedCount: deletedCount };
}

module.exports = {
  getFromCache,
  saveToCache,
  deleteFromCache,
  getStats,
  listCached,
  clearCache
};