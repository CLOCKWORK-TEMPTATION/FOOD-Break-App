/**
 * Recommendation Routes - Optimized
 * مسارات التوصيات المحسّنة
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const recommendationService = require('../services/recommendationServiceOptimized');
const logger = require('../utils/logger');

/**
 * GET /api/v1/recommendations
 * الحصول على التوصيات للمستخدم
 */
router.get('/', auth, aiRateLimiter.middleware(), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await recommendationService.getRecommendations(userId, limit);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'فشل الحصول على التوصيات'
    });
  }
});

/**
 * GET /api/v1/recommendations/personalized
 * التوصيات الشخصية فقط
 */
router.get('/personalized', auth, aiRateLimiter.middleware(), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'فشل الحصول على التوصيات الشخصية'
    });
  }
});

/**
 * GET /api/v1/recommendations/trending
 * التوصيات الشائعة
 */
router.get('/trending', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const recommendations = await recommendationService.getTrendingRecommendations(limit);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Error getting trending recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'فشل الحصول على التوصيات الشائعة'
    });
  }
});

/**
 * DELETE /api/v1/recommendations/cache
 * مسح cache التوصيات للمستخدم
 */
router.delete('/cache', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await recommendationService.clearUserCache(userId);

    res.json({
      success: true,
      message: 'تم مسح cache التوصيات بنجاح'
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'فشل مسح cache'
    });
  }
});

module.exports = router;
