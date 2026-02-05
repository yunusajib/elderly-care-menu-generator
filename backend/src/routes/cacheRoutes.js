const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cache/list
 * List all cached images
 */
router.get('/list', async (req, res, next) => {
  try {
    const cached = await cacheService.listCached();
    
    res.json({
      success: true,
      cached: cached
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cache/clear
 * Clear all cached images
 */
router.delete('/clear', async (req, res, next) => {
  try {
    const result = await cacheService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cache/:hash
 * Delete specific cached image
 */
router.delete('/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const result = await cacheService.deleteFromCache(hash);
    
    if (!result.found) {
      return res.status(404).json({
        error: 'Cached image not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Cached image deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
