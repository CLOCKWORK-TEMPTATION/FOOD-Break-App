const recommendationService = require('../services/recommendationService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// الحصول على التوصيات للمستخدم
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id; // من middleware المصادقة
    const { location } = req.query;

    const recommendations = await recommendationService.getUserRecommendations(userId, location);

    res.json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('خطأ في الحصول على التوصيات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATION_ERROR',
        message: 'حدث خطأ في الحصول على التوصيات'
      }
    });
  }
};

// حفظ توصية
const saveRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId, type, score, reason, weatherData } = req.body;

    // التحقق من صحة البيانات
    if (!menuItemId || !type || !score || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'البيانات المطلوبة مفقودة'
        }
      });
    }

    const recommendation = await recommendationService.saveRecommendation(
      userId,
      menuItemId,
      type,
      score,
      reason,
      weatherData
    );

    res.status(201).json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    console.error('خطأ في حفظ التوصية:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_RECOMMENDATION_ERROR',
        message: 'حدث خطأ في حفظ التوصية'
      }
    });
  }
};

// الحصول على التوصيات المحفوظة
const getSavedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await recommendationService.getSavedRecommendations(userId);

    res.json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('خطأ في الحصول على التوصيات المحفوظة:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SAVED_RECOMMENDATIONS_ERROR',
        message: 'حدث خطأ في الحصول على التوصيات المحفوظة'
      }
    });
  }
};

// تحديث تفضيلات المستخدم
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // التحقق من صحة البيانات
    const allowedFields = [
      'dietaryRestrictions',
      'favoriteCuisines',
      'spiceLevel',
      'allergies',
      'healthGoals'
    ];

    const filteredPreferences = {};
    Object.keys(preferences).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredPreferences[key] = preferences[key];
      }
    });

    const updatedPreferences = await recommendationService.updateUserPreferences(
      userId,
      filteredPreferences
    );

    res.json({
      success: true,
      data: updatedPreferences
    });

  } catch (error) {
    console.error('خطأ في تحديث تفضيلات المستخدم:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PREFERENCES_ERROR',
        message: 'حدث خطأ في تحديث التفضيلات'
      }
    });
  }
};

// الحصول على تفضيلات المستخدم
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await recommendationService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('خطأ في الحصول على تفضيلات المستخدم:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PREFERENCES_ERROR',
        message: 'حدث خطأ في الحصول على التفضيلات'
      }
    });
  }
};

// تحليل التوصيات للاختبار A/B
const getRecommendationAnalytics = async (req, res) => {
  try {
    // هذا للاختبار A/B - يمكن توسيعه لاحقاً
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // حساب معدل التحويل من التوصيات
    const recommendations = await prisma.recommendation.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        menuItem: true
      }
    });

    // حساب الإحصائيات الأساسية
    const stats = {
      totalRecommendations: recommendations.length,
      byType: {},
      topRecommendedItems: []
    };

    // تجميع حسب النوع
    recommendations.forEach(rec => {
      stats.byType[rec.recommendationType] = (stats.byType[rec.recommendationType] || 0) + 1;
    });

    // العناصر الأكثر توصية
    const itemCounts = {};
    recommendations.forEach(rec => {
      const itemName = rec.menuItem.name;
      itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
    });

    stats.topRecommendedItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: stats,
      meta: {
        period: { start, end }
      }
    });

  } catch (error) {
    console.error('خطأ في تحليل التوصيات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'حدث خطأ في تحليل التوصيات'
      }
    });
  }
};

module.exports = {
  getRecommendations,
  saveRecommendation,
  getSavedRecommendations,
  updateUserPreferences,
  getUserPreferences,
  getRecommendationAnalytics
};