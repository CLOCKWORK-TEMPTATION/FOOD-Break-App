/**
 * خدمة اقتراحات الطلب التلقائي
 * Auto Order Suggestion Service
 *
 * اقتراح طلبات تلقائية للمستخدمين بناءً على أنماطهم
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const patternRecognitionService = require('./patternRecognitionService');
const behaviorAnalysisService = require('./behaviorAnalysisService');

class AutoOrderSuggestionService {
  constructor() {
    // مدة صلاحية الاقتراح بالساعات
    this.SUGGESTION_EXPIRY_HOURS = 2;
    // الحد الأدنى للثقة لإنشاء اقتراح
    this.MIN_CONFIDENCE = 0.6;
  }

  /**
   * إنشاء اقتراحات الطلب للمستخدم
   * @param {string} userId - معرف المستخدم
   * @returns {Object} الاقتراح المنشأ
   */
  async generateSuggestion(userId) {
    // التحقق من وجود اقتراح نشط
    const existingSuggestion = await this._getActiveSuggestion(userId);
    if (existingSuggestion) {
      return existingSuggestion;
    }

    // الحصول على الأنماط المطابقة للوقت الحالي
    const matchingPatterns = await patternRecognitionService.checkPatternMatch(userId);

    if (matchingPatterns.length === 0) {
      return null;
    }

    // اختيار أفضل نمط
    const bestPattern = matchingPatterns[0];

    if (bestPattern.confidence < this.MIN_CONFIDENCE) {
      return null;
    }

    // بناء الاقتراح
    const suggestion = await this._buildSuggestion(userId, bestPattern);

    if (!suggestion) {
      return null;
    }

    // حفظ الاقتراح
    const saved = await this._saveSuggestion(suggestion);

    return saved;
  }

  /**
   * الحصول على اقتراح نشط
   */
  async _getActiveSuggestion(userId) {
    return await prisma.autoOrderSuggestion.findFirst({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      }
    });
  }

  /**
   * بناء الاقتراح من النمط
   */
  async _buildSuggestion(userId, pattern) {
    // جلب تفاصيل الأصناف
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: pattern.menuItemIds },
        isAvailable: true
      },
      include: {
        restaurant: true
      }
    });

    if (menuItems.length === 0) {
      return null;
    }

    // الحصول على سجل المستخدم لتحديد الكميات
    const userBehavior = await behaviorAnalysisService.getUserBehavior(userId);

    // بناء قائمة الأصناف المقترحة
    const suggestedItems = menuItems.map(item => {
      // تحديد الكمية بناءً على السجل
      const quantity = this._determineQuantity(item.id, userBehavior);

      return {
        menuItemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        quantity,
        price: item.price,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurant?.name
      };
    });

    // حساب المجموع
    const totalAmount = suggestedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // تحديد وقت الطلب المقترح
    const suggestedTime = this._getSuggestedTime(pattern.timePreference);

    // إنشاء سبب الاقتراح
    const reason = this._generateReason(pattern, suggestedItems);

    return {
      userId,
      suggestedItems,
      totalAmount,
      suggestedTime,
      reason,
      confidence: pattern.confidence,
      patternId: pattern.id
    };
  }

  /**
   * تحديد الكمية المقترحة
   */
  _determineQuantity(menuItemId, behaviors) {
    // البحث في سجل السلوك
    for (const behavior of behaviors) {
      if (behavior.preferredItems.includes(menuItemId)) {
        // إذا كان الصنف مفضلاً، نقترح كمية أعلى
        return 1;
      }
    }
    return 1;
  }

  /**
   * تحديد وقت الطلب المقترح
   */
  _getSuggestedTime(timePreference) {
    const now = new Date();
    const hour = now.getHours();

    // تحديد الوقت المناسب حسب الفترة
    const timeSlots = {
      morning: { start: 8, end: 10 },
      lunch: { start: 12, end: 13 },
      afternoon: { start: 15, end: 16 },
      evening: { start: 18, end: 19 }
    };

    const slot = timeSlots[timePreference] || timeSlots.lunch;

    // إذا كنا في نفس الفترة أو قبلها
    if (hour < slot.start) {
      now.setHours(slot.start, 0, 0, 0);
    } else if (hour >= slot.start && hour <= slot.end) {
      // نقترح بعد 15 دقيقة
      now.setMinutes(now.getMinutes() + 15);
    } else {
      // الفترة انتهت، نقترح للوقت الحالي
      now.setMinutes(now.getMinutes() + 10);
    }

    return now;
  }

  /**
   * إنشاء سبب الاقتراح
   */
  _generateReason(pattern, items) {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const timeSlotNames = {
      morning: 'الصباح',
      lunch: 'الغداء',
      afternoon: 'العصر',
      evening: 'المساء'
    };

    let reason = 'اقتراح بناءً على ';

    if (pattern.patternType === 'WEEKLY' && pattern.dayOfWeek !== null) {
      reason += `طلباتك المعتادة يوم ${dayNames[pattern.dayOfWeek]}`;
    } else if (pattern.patternType === 'DAILY') {
      reason += `طلباتك اليومية في فترة ${timeSlotNames[pattern.timePreference] || 'الغداء'}`;
    } else {
      reason += 'أنماط طلباتك السابقة';
    }

    if (items.length > 0) {
      const itemNames = items.slice(0, 2).map(i => i.nameAr || i.name);
      reason += ` (${itemNames.join('، ')})`;
    }

    return reason;
  }

  /**
   * حفظ الاقتراح
   */
  async _saveSuggestion(suggestion) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SUGGESTION_EXPIRY_HOURS);

    return await prisma.autoOrderSuggestion.create({
      data: {
        userId: suggestion.userId,
        suggestedItems: suggestion.suggestedItems,
        totalAmount: suggestion.totalAmount,
        suggestedTime: suggestion.suggestedTime,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        status: 'PENDING',
        expiresAt
      }
    });
  }

  /**
   * قبول الاقتراح وإنشاء الطلب
   */
  async acceptSuggestion(suggestionId, modifications = null) {
    const suggestion = await prisma.autoOrderSuggestion.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion || suggestion.status !== 'PENDING') {
      throw new Error('الاقتراح غير متوفر أو تم الرد عليه مسبقاً');
    }

    // تحديث حالة الاقتراح
    const status = modifications ? 'MODIFIED' : 'ACCEPTED';

    await prisma.autoOrderSuggestion.update({
      where: { id: suggestionId },
      data: {
        status,
        userResponse: modifications ? JSON.stringify(modifications) : null,
        respondedAt: new Date()
      }
    });

    // إنشاء الطلب الفعلي
    const items = modifications || suggestion.suggestedItems;
    const order = await this._createOrderFromSuggestion(suggestion.userId, items);

    return order;
  }

  /**
   * رفض الاقتراح
   */
  async rejectSuggestion(suggestionId, reason = null) {
    await prisma.autoOrderSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        userResponse: reason,
        respondedAt: new Date()
      }
    });
  }

  /**
   * إنشاء طلب من الاقتراح
   */
  async _createOrderFromSuggestion(userId, items) {
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // تحديد المطعم (من أول صنف)
    const restaurantId = items[0]?.restaurantId || null;

    const order = await prisma.order.create({
      data: {
        userId,
        restaurantId,
        status: 'PENDING',
        orderType: 'REGULAR',
        totalAmount,
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    return order;
  }

  /**
   * الحصول على اقتراحات المستخدم
   */
  async getUserSuggestions(userId, status = null) {
    const where = { userId };

    if (status) {
      where.status = status;
    }

    return await prisma.autoOrderSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  /**
   * تنظيف الاقتراحات المنتهية
   */
  async cleanupExpiredSuggestions() {
    const result = await prisma.autoOrderSuggestion.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    return result.count;
  }

  /**
   * الحصول على إحصائيات الاقتراحات
   */
  async getSuggestionStats(userId = null) {
    const where = userId ? { userId } : {};

    const stats = await prisma.autoOrderSuggestion.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const accepted = stats.find(s => s.status === 'ACCEPTED')?._count || 0;
    const modified = stats.find(s => s.status === 'MODIFIED')?._count || 0;

    return {
      total,
      byStatus: stats.reduce((obj, s) => {
        obj[s.status] = s._count;
        return obj;
      }, {}),
      acceptanceRate: total > 0 ? ((accepted + modified) / total) * 100 : 0
    };
  }

  /**
   * تعديل الطلب المقترح (إضافة/حذف/تعديل أصناف)
   */
  async modifySuggestion(suggestionId, modifications) {
    const suggestion = await prisma.autoOrderSuggestion.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion || suggestion.status !== 'PENDING') {
      throw new Error('الاقتراح غير متوفر للتعديل');
    }

    let items = suggestion.suggestedItems;

    // تطبيق التعديلات
    if (modifications.add) {
      items = [...items, ...modifications.add];
    }

    if (modifications.remove) {
      items = items.filter(i => !modifications.remove.includes(i.menuItemId));
    }

    if (modifications.updateQuantity) {
      items = items.map(item => {
        const update = modifications.updateQuantity.find(
          u => u.menuItemId === item.menuItemId
        );
        if (update) {
          return { ...item, quantity: update.quantity };
        }
        return item;
      });
    }

    // إعادة حساب المجموع
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // تحديث الاقتراح
    return await prisma.autoOrderSuggestion.update({
      where: { id: suggestionId },
      data: {
        suggestedItems: items,
        totalAmount
      }
    });
  }
}

module.exports = new AutoOrderSuggestionService();
