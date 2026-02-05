const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// ✅ Import centralized paths
const { LOG_DIR } = require('../config/paths');

const AUDIT_LOG_FILE = path.join(LOG_DIR, 'audit.json');

/**
 * Initialize audit log file
 */
async function initializeAuditLog() {
  try {
    // ✅ Ensure logs directory exists
    if (!fsSync.existsSync(LOG_DIR)) {
      fsSync.mkdirSync(LOG_DIR, { recursive: true });
    }

    await fs.access(AUDIT_LOG_FILE);
  } catch {
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Load audit log
 */
async function loadAuditLog() {
  await initializeAuditLog();
  const data = await fs.readFile(AUDIT_LOG_FILE, 'utf8');
  return JSON.parse(data);
}

/**
 * Save audit log
 */
async function saveAuditLog(logs) {
  await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2));
}

/**
 * Log menu generation
 */
async function logGeneration(data) {
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
}

/**
 * Get generation history
 */
async function getHistory(limit = 10) {
  const logs = await loadAuditLog();
  return logs.slice(0, limit);
}

/**
 * Get statistics
 */
async function getStatistics() {
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
}

module.exports = {
  logGeneration,
  getHistory,
  getStatistics
};