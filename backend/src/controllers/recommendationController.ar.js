const recommendationService = require('../services/recommendationServiceOptimized');
const logger = require('../utils/logger');

/**
 * متحكم التوصيات - Recommendation Controller
 * معالجات التوصيات الذكية والثقافية بالعربية
 */

// التوصيات الثقافية العربية
const CULTURAL_RECOMMENDATIONS = {
  ramadan: {
    title: 'توصيات رمضانية',
    items: ['تمر', 'لبن', 'شوربة', 'سمبوسة', 'قطايف'],
    message: 'أطباق مناسبة لشهر رمضان المبارك'
  },
  eid: {
    title: 'توصيات العيد',
    items: ['كبسة', 'مندي', 'معمول', 'كليجا'],
    message: 'أطباق احتفالية للعيد السعيد'
  },
  winter: {
    title: 'توصيات الشتاء',
    items: ['شوربة عدس', 'حريرة', 'مرقوق', 'جريش'],
    message: 'أطباق دافئة لأيام الشتاء'
  },
  summer: {
    title: 'توصيات الصيف',
    items: ['فتوش', 'تبولة', 'عصائر طازجة', 'سلطات'],
    message: 'أطباق منعشة لأيام الصيف'
  }
};

// الحصول على التوصيات الشخصية
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, parseInt(limit) || 10);

    res.json({
      success: true,
      data: recommendations,
      message: `لدينا ${recommendations.length} توصية مخصصة لك بناءً على ذوقك`
    });
  } catch (error) {
    logger.error('خطأ في الحصول على التوصيات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATIONS_FAILED',
        message: 'فشل الحصول على التوصيات الشخصية'
      }
    });
  }
};

// التوصيات الشائعة
exports.getTrendingRecommendations = async (req, res) => {
  try {
    const { limit } = req.query;

    const trending = await recommendationService.getTrendingRecommendations(parseInt(limit) || 5);

    res.json({
      success: true,
      data: trending,
      message: 'الأطباق الأكثر طلباً هذا الأسبوع'
    });
  } catch (error) {
    logger.error('خطأ في الحصول على الشائع:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDING_FAILED',
        message: 'فشل الحصول على الأطباق الشائعة'
      }
    });
  }
};

// التوصيات الثقافية
exports.getCulturalRecommendations = async (req, res) => {
  try {
    const { occasion } = req.query;

    const cultural = CULTURAL_RECOMMENDATIONS[occasion];

    if (!cultural) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OCCASION',
          message: 'المناسبة غير معروفة'
        }
      });
    }

    res.json({
      success: true,
      data: cultural,
      message: cultural.message
    });
  } catch (error) {
    logger.error('خطأ في التوصيات الثقافية:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CULTURAL_RECOMMENDATIONS_FAILED',
        message: 'فشل الحصول على التوصيات الثقافية'
      }
    });
  }
};

// التوصيات حسب الطقس
exports.getWeatherBasedRecommendations = async (req, res) => {
  try {
    const { location } = req.query;

    const recommendations = await recommendationService.getWeatherBasedRecommendations(location);

    res.json({
      success: true,
      data: recommendations,
      message: 'توصيات مناسبة للطقس الحالي'
    });
  } catch (error) {
    logger.error('خطأ في توصيات الطقس:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEATHER_RECOMMENDATIONS_FAILED',
        message: 'فشل الحصول على توصيات الطقس'
      }
    });
  }
};

// التوصيات الصحية
exports.getHealthyRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const healthy = await recommendationService.getHealthyRecommendations(userId);

    res.json({
      success: true,
      data: healthy,
      message: 'توصيات صحية متوازنة لك'
    });
  } catch (error) {
    logger.error('خطأ في التوصيات الصحية:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTHY_RECOMMENDATIONS_FAILED',
        message: 'فشل الحصول على التوصيات الصحية'
      }
    });
  }
};

// مسح ذاكرة التخزين المؤقت
exports.clearCache = async (req, res) => {
  try {
    const userId = req.user.id;

    await recommendationService.clearUserCache(userId);

    res.json({
      success: true,
      message: 'تم مسح ذاكرة التخزين المؤقت، ستحصل على توصيات محدثة'
    });
  } catch (error) {
    logger.error('خطأ في مسح الذاكرة:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_CLEAR_FAILED',
        message: 'فشل مسح ذاكرة التخزين المؤقت'
      }
    });
  }
};

// حفظ تفضيلات المستخدم
exports.savePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    await recommendationService.updateUserPreferences(userId, preferences);

    res.json({
      success: true,
      message: 'تم حفظ تفضيلاتك، سنقدم لك توصيات أفضل'
    });
  } catch (error) {
    logger.error('خطأ في حفظ التفضيلات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREFERENCES_SAVE_FAILED',
        message: 'فشل حفظ التفضيلات'
      }
    });
  }
};
