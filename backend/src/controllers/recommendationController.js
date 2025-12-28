const recommendationService = require('../services/recommendationService');
const weatherService = require('../services/weatherService');
const logger = require('../utils/logger');

/**
 * Recommendation Controller
 * معالجات التوصيات الذكية
 */

// الحصول على التوصيات للمستخدم
exports.getUserRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lon, limit = 20 } = req.query;

    let location = null;
    if (lat && lon) {
      location = { lat: parseFloat(lat), lon: parseFloat(lon) };
    }

    const recommendations = await recommendationService.getUserRecommendations(userId, location);

    res.json({
      success: true,
      data: recommendations.slice(0, parseInt(limit))
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// الحصول على التوصيات بناءً على الطقس
exports.getWeatherRecommendations = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: { message: 'الموقع مطلوب (lat, lon)' }
      });
    }

    const weatherRecs = await weatherService.getWeatherRecommendations(
      parseFloat(lat),
      parseFloat(lon)
    );

    res.json({
      success: true,
      data: weatherRecs
    });
  } catch (error) {
    logger.error('Error getting weather recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// حفظ تفاعل المستخدم مع التوصية
exports.recordInteraction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recommendationId, action, menuItemId } = req.body;

    // حفظ التفاعل في قاعدة البيانات
    // يمكن استخدامه لتحسين التوصيات المستقبلية

    res.json({
      success: true,
      message: 'تم تسجيل التفاعل بنجاح'
    });
  } catch (error) {
    logger.error('Error recording interaction:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// الحصول على التوصيات المحفوظة
exports.getSavedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const saved = await recommendationService.getSavedRecommendations(userId);

    res.json({
      success: true,
      data: saved
    });
  } catch (error) {
    logger.error('Error getting saved recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};
