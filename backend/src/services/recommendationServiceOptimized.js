/**
 * Recommendation Service - Optimized Version
 * خدمة التوصيات المحسّنة مع Caching و Dynamic AI Loading
 */

const { PrismaClient } = require('@prisma/client');
const aiProvider = require('./aiProviderService');
const cache = require('./cacheService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class RecommendationService {
  
  // الحصول على التوصيات الشخصية مع Caching
  async getPersonalizedRecommendations(userId, limit = 10) {
    const cacheKey = `recommendations:personalized:${userId}:${limit}`;
    
    return await cache.wrap(cacheKey, async () => {
      try {
        const userOrders = await prisma.order.findMany({
          where: { userId },
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        const allItems = await prisma.menuItem.findMany({
          where: { isAvailable: true },
          include: { nutritionalInfo: true },
          take: 100
        });

        if (userOrders.length === 0) {
          return this._getFallbackRecommendations(allItems, limit);
        }

        const userProfile = this._createUserProfile(userOrders);
        
        try {
          return await this._getAIRecommendations(userProfile, allItems, limit);
        } catch (aiError) {
          logger.warn('AI recommendations failed, using fallback:', aiError.message);
          return this._getFallbackRecommendations(allItems, limit, userProfile);
        }
      } catch (error) {
        logger.error('Error in getPersonalizedRecommendations:', error);
        return [];
      }
    }, 1800); // 30 دقيقة
  }

  _createUserProfile(userOrders) {
    const favoriteItems = new Map();
    const categories = new Map();
    let totalSpent = 0;

    userOrders.forEach(order => {
      totalSpent += order.totalAmount;
      order.items.forEach(item => {
        favoriteItems.set(item.menuItemId, (favoriteItems.get(item.menuItemId) || 0) + item.quantity);
        if (item.menuItem.category) {
          categories.set(item.menuItem.category, (categories.get(item.menuItem.category) || 0) + 1);
        }
      });
    });

    return {
      favoriteItems: Array.from(favoriteItems.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      favoriteCategories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      avgOrderValue: userOrders.length > 0 ? totalSpent / userOrders.length : 0,
      totalOrders: userOrders.length
    };
  }

  async _getAIRecommendations(userProfile, allItems, limit) {
    const userContext = `
المستخدم لديه:
- الفئات المفضلة: ${userProfile.favoriteCategories.map(([cat]) => cat).join(', ')}
- متوسط قيمة الطلب: ${userProfile.avgOrderValue} ريال
- عدد الطلبات: ${userProfile.totalOrders}
    `;

    const availableItems = allItems.slice(0, 30).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price
    }));

    const prompt = `${userContext}

الأطباق المتاحة: ${JSON.stringify(availableItems)}

اقترح ${limit} أطباق. أرجع JSON فقط:
{"recommendations": [{"menuItemId": "id", "score": 0.9, "reason": "السبب"}]}`;

    const response = await aiProvider.callAI(prompt);
    const aiRecommendations = JSON.parse(response);

    return aiRecommendations.recommendations
      .map(rec => {
        const menuItem = allItems.find(item => item.id === rec.menuItemId);
        return menuItem ? {
          menuItem,
          score: rec.score,
          reason: rec.reason,
          type: 'AI_PERSONALIZED'
        } : null;
      })
      .filter(Boolean);
  }

  _getFallbackRecommendations(allItems, limit, userProfile = null) {
    if (userProfile && userProfile.favoriteCategories.length > 0) {
      const favoriteCategories = userProfile.favoriteCategories.map(([cat]) => cat);
      const categoryItems = allItems.filter(item => favoriteCategories.includes(item.category));
      
      return categoryItems.slice(0, limit).map(item => ({
        menuItem: item,
        score: 0.8,
        reason: `من فئة ${item.category} المفضلة لديك`,
        type: 'CATEGORY_BASED'
      }));
    }

    // توصيات عشوائية للمستخدمين الجدد
    return allItems.slice(0, limit).map(item => ({
      menuItem: item,
      score: 0.7,
      reason: 'طبق مميز من قائمتنا',
      type: 'POPULAR'
    }));
  }

  // التوصيات الشائعة مع Caching
  async getTrendingRecommendations(limit = 5) {
    const cacheKey = `recommendations:trending:${limit}`;
    
    return await cache.wrap(cacheKey, async () => {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const trendingItems = await prisma.orderItem.groupBy({
          by: ['menuItemId'],
          where: { order: { createdAt: { gte: oneWeekAgo } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: limit
        });

        const itemIds = trendingItems.map(t => t.menuItemId);
        const items = await prisma.menuItem.findMany({
          where: { id: { in: itemIds } },
          include: { nutritionalInfo: true }
        });

        return items.map(item => ({
          menuItem: item,
          score: 0.7,
          reason: 'من أكثر الأطباق طلباً هذا الأسبوع',
          type: 'TRENDING'
        }));
      } catch (error) {
        logger.error('Error in getTrendingRecommendations:', error);
        return [];
      }
    }, 3600); // ساعة واحدة
  }

  // الحصول على التوصيات الشاملة
  async getRecommendations(userId, limit = 20) {
    try {
      const [personalized, trending] = await Promise.all([
        this.getPersonalizedRecommendations(userId, Math.floor(limit * 0.7)),
        this.getTrendingRecommendations(Math.floor(limit * 0.3))
      ]);

      const all = [...personalized, ...trending];
      const unique = this._removeDuplicates(all);
      
      return unique.slice(0, limit);
    } catch (error) {
      logger.error('Error in getRecommendations:', error);
      return [];
    }
  }

  _removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const id = rec.menuItem.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // حفظ التوصية
  async saveRecommendation(userId, menuItemId, type, score, reason) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return await prisma.recommendation.create({
        data: { userId, menuItemId, recommendationType: type, score, reason, expiresAt }
      });
    } catch (error) {
      logger.error('Error saving recommendation:', error);
      throw error;
    }
  }

  // مسح cache المستخدم
  async clearUserCache(userId) {
    await cache.delPattern(`recommendations:*:${userId}:*`);
  }
}

module.exports = new RecommendationService();
