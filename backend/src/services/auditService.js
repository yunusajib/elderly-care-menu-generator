const fs = require('fs').promises;
const fsSync = require('fs');
const nodePath = require('path');          // ✅ only once
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);

const CACHE_DIR = isVercel
  ? '/tmp/cache'
  : nodePath.join(__dirname, '../../cache');

const LOG_DIR = isVercel
  ? '/tmp/logs'
  : nodePath.join(__dirname, '../../logs');

const AUDIT_LOG_FILE = nodePath.join(LOG_DIR, 'audit.json');


/**
 * Initialize audit log file
 */
async function initializeAuditLog() {
  try {
    // ✅ Ensure logs directory exists (sync to guarantee it's created)
    if (!fsSync.existsSync(LOG_DIR)) {
      console.log(`Creating LOG_DIR: ${LOG_DIR}`);
      fsSync.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Check if file exists
    try {
      await fs.access(AUDIT_LOG_FILE);
      console.log(`Audit log file exists: ${AUDIT_LOG_FILE}`);
    } catch {
      // Create empty audit log file
      console.log(`Creating audit log file: ${AUDIT_LOG_FILE}`);
      await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing audit log:', error);
    throw error;
  }
}

/**
 * Load audit log
 */
async function loadAuditLog() {
  try {
    await initializeAuditLog();
    const data = await fs.readFile(AUDIT_LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading audit log:', error);
    // Return empty array if file can't be read
    return [];
  }
}

/**
 * Save audit log
 */
async function saveAuditLog(logs) {
  try {
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error saving audit log:', error);
    throw error;
  }
}

/**
 * Log menu generation
 */
async function logGeneration(data) {
  try {
    const logs = await loadAuditLog();

    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      menuDate: data.menuDate || new Date().toISOString(),
      pdfPath: data.pdfPath,
      generationTime: data.generationTime,
      sections: Object.keys(data.menuData.sections),
      sectionCount: Object.keys(data.menuData.sections).length,
      imageCount: Object.keys(data.images).length,
      images: Object.keys(data.images).map(key => ({
        section: key,
        mealDescription: data.images[key].mealDescription,
        cached: data.images[key].cached || false
      }))
    };

    logs.unshift(logEntry); // Add to beginning

    // Keep only last 100 entries
    if (logs.length > 100) {
      logs.splice(100);
    }

    await saveAuditLog(logs);

    console.log(`✓ Audit log saved: ${logEntry.id}`);

    return logEntry;
  } catch (error) {
    // Don't fail the entire request if audit logging fails
    console.error('⚠️ Failed to save audit log (non-critical):', error);
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      error: 'Failed to save audit log'
    };
  }
}

/**
 * Get generation history
 */
async function getHistory(limit = 10) {
  try {
    const logs = await loadAuditLog();
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Get statistics
 */
async function getStatistics() {
  try {
    const logs = await loadAuditLog();

    const totalGenerations = logs.length;
    const avgGenerationTime = logs.length > 0
      ? (logs.reduce((sum, log) => sum + log.generationTime, 0) / logs.length / 1000).toFixed(2)
      : 0;

    const totalImages = logs.reduce((sum, log) => sum + log.imageCount, 0);
    const cachedImages = logs.reduce((sum, log) =>
      sum + log.images.filter(img => img.cached).length, 0
    );

    const cacheHitRate = totalImages > 0
      ? ((cachedImages / totalImages) * 100).toFixed(1)
      : 0;

    return {
      totalGenerations,
      avgGenerationTime: parseFloat(avgGenerationTime),
      totalImages,
      cachedImages,
      cacheHitRate: parseFloat(cacheHitRate)
    };
  } catch {
    return {
      totalGenerations: 0,
      avgGenerationTime: 0,
      totalImages: 0,
      cachedImages: 0,
      cacheHitRate: 0
    };
  }
}

module.exports = {
  logGeneration,
  getHistory,
  getStatistics
};