/**
 * خدمة التعرف على الأنماط
 * Pattern Recognition Service
 *
 * اكتشاف أنماط الطلب المتكررة للمستخدمين
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PatternRecognitionService {
  constructor() {
    // الحد الأدنى للتكرار لاعتبار النمط صالحاً
    this.MIN_FREQUENCY = 3;
    // الحد الأدنى للثقة
    this.MIN_CONFIDENCE = 0.6;
  }

  /**
   * اكتشاف أنماط الطلب لمستخدم معين
   * @param {string} userId - معرف المستخدم
   * @returns {Array} الأنماط المكتشفة
   */
  async discoverPatterns(userId) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED'
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (orders.length < this.MIN_FREQUENCY) {
      return [];
    }

    const patterns = [];

    // اكتشاف الأنماط الأسبوعية
    const weeklyPatterns = this._discoverWeeklyPatterns(orders);
    patterns.push(...weeklyPatterns);

    // اكتشاف الأنماط اليومية
    const dailyPatterns = this._discoverDailyPatterns(orders);
    patterns.push(...dailyPatterns);

    // اكتشاف أنماط الأصناف المتكررة
    const itemPatterns = this._discoverItemPatterns(orders);
    patterns.push(...itemPatterns);

    // حفظ الأنماط المكتشفة
    await this._savePatterns(userId, patterns);

    return patterns;
  }

  /**
   * اكتشاف الأنماط الأسبوعية
   * (مثل: كل يوم أحد يطلب من مطعم معين)
   */
  _discoverWeeklyPatterns(orders) {
    const weekdayOrders = {};

    orders.forEach(order => {
      const dayOfWeek = new Date(order.createdAt).getDay();

      if (!weekdayOrders[dayOfWeek]) {
        weekdayOrders[dayOfWeek] = {
          orders: [],
          restaurants: {},
          items: {}
        };
      }

      weekdayOrders[dayOfWeek].orders.push(order);

      if (order.restaurantId) {
        weekdayOrders[dayOfWeek].restaurants[order.restaurantId] =
          (weekdayOrders[dayOfWeek].restaurants[order.restaurantId] || 0) + 1;
      }

      order.items.forEach(item => {
        weekdayOrders[dayOfWeek].items[item.menuItemId] =
          (weekdayOrders[dayOfWeek].items[item.menuItemId] || 0) + 1;
      });
    });

    const patterns = [];

    Object.entries(weekdayOrders).forEach(([day, data]) => {
      const totalDayOrders = data.orders.length;

      if (totalDayOrders >= this.MIN_FREQUENCY) {
        // البحث عن المطعم الأكثر تكراراً
        const topRestaurant = this._getTopEntry(data.restaurants);
        const restaurantConfidence = topRestaurant ? topRestaurant.count / totalDayOrders : 0;

        if (restaurantConfidence >= this.MIN_CONFIDENCE) {
          patterns.push({
            patternType: 'WEEKLY',
            dayOfWeek: parseInt(day),
            restaurantId: topRestaurant.id,
            frequency: topRestaurant.count,
            confidence: restaurantConfidence,
            menuItemIds: this._getTopItems(data.items, 5),
            timePreference: this._getMostCommonTimeSlot(data.orders)
          });
        }

        // البحث عن العناصر الأكثر تكراراً
        const topItems = this._getTopItems(data.items, 3);
        const itemConfidence = topItems.length > 0 ?
          data.items[topItems[0]] / totalDayOrders : 0;

        if (itemConfidence >= this.MIN_CONFIDENCE && topItems.length >= 2) {
          patterns.push({
            patternType: 'WEEKLY',
            dayOfWeek: parseInt(day),
            restaurantId: null,
            frequency: totalDayOrders,
            confidence: itemConfidence,
            menuItemIds: topItems,
            timePreference: this._getMostCommonTimeSlot(data.orders)
          });
        }
      }
    });

    return patterns;
  }

  /**
   * اكتشاف الأنماط اليومية
   * (مثل: كل يوم في نفس الوقت)
   */
  _discoverDailyPatterns(orders) {
    const timeSlotOrders = {};

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const timeSlot = this._getTimeSlot(hour);

      if (!timeSlotOrders[timeSlot]) {
        timeSlotOrders[timeSlot] = {
          orders: [],
          items: {}
        };
      }

      timeSlotOrders[timeSlot].orders.push(order);

      order.items.forEach(item => {
        timeSlotOrders[timeSlot].items[item.menuItemId] =
          (timeSlotOrders[timeSlot].items[item.menuItemId] || 0) + 1;
      });
    });

    const patterns = [];
    const totalOrders = orders.length;

    Object.entries(timeSlotOrders).forEach(([timeSlot, data]) => {
      const slotOrders = data.orders.length;
      const slotPercentage = slotOrders / totalOrders;

      // إذا كان أكثر من 70% من الطلبات في نفس الفترة الزمنية
      if (slotPercentage >= 0.7 && slotOrders >= this.MIN_FREQUENCY) {
        const topItems = this._getTopItems(data.items, 5);

        patterns.push({
          patternType: 'DAILY',
          dayOfWeek: null,
          restaurantId: null,
          frequency: slotOrders,
          confidence: slotPercentage,
          menuItemIds: topItems,
          timePreference: timeSlot
        });
      }
    });

    return patterns;
  }

  /**
   * اكتشاف أنماط الأصناف المتكررة
   * (مثل: دائماً يطلب نفس المجموعة من الأصناف معاً)
   */
  _discoverItemPatterns(orders) {
    const itemCombinations = {};

    orders.forEach(order => {
      const itemIds = order.items.map(i => i.menuItemId).sort();

      // البحث عن مجموعات من 2-3 أصناف
      for (let i = 0; i < itemIds.length; i++) {
        for (let j = i + 1; j < itemIds.length; j++) {
          const combo = [itemIds[i], itemIds[j]].join('|');
          itemCombinations[combo] = (itemCombinations[combo] || 0) + 1;
        }
      }
    });

    const patterns = [];
    const totalOrders = orders.length;

    Object.entries(itemCombinations).forEach(([combo, count]) => {
      const confidence = count / totalOrders;

      if (count >= this.MIN_FREQUENCY && confidence >= 0.4) {
        patterns.push({
          patternType: 'WEEKLY',
          dayOfWeek: null,
          restaurantId: null,
          frequency: count,
          confidence,
          menuItemIds: combo.split('|'),
          timePreference: null
        });
      }
    });

    return patterns.slice(0, 5); // أعلى 5 أنماط
  }

  /**
   * تحديد الفترة الزمنية
   */
  _getTimeSlot(hour) {
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * الحصول على أعلى عنصر
   */
  _getTopEntry(obj) {
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;

    const top = entries.sort((a, b) => b[1] - a[1])[0];
    return { id: top[0], count: top[1] };
  }

  /**
   * الحصول على أعلى العناصر
   */
  _getTopItems(obj, limit) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  /**
   * الحصول على الفترة الزمنية الأكثر شيوعاً
   */
  _getMostCommonTimeSlot(orders) {
    const slots = {};

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const slot = this._getTimeSlot(hour);
      slots[slot] = (slots[slot] || 0) + 1;
    });

    const top = this._getTopEntry(slots);
    return top ? top.id : 'lunch';
  }

  /**
   * حفظ الأنماط في قاعدة البيانات
   */
  async _savePatterns(userId, patterns) {
    // حذف الأنماط القديمة
    await prisma.orderPattern.deleteMany({
      where: { userId }
    });

    // إضافة الأنماط الجديدة
    for (const pattern of patterns) {
      await prisma.orderPattern.create({
        data: {
          userId,
          patternType: pattern.patternType,
          confidence: pattern.confidence,
          frequency: pattern.frequency,
          menuItemIds: pattern.menuItemIds,
          restaurantId: pattern.restaurantId,
          dayOfWeek: pattern.dayOfWeek,
          timePreference: pattern.timePreference,
          isActive: true
        }
      });
    }
  }

  /**
   * الحصول على أنماط المستخدم
   */
  async getUserPatterns(userId) {
    return await prisma.orderPattern.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisineType: true
          }
        }
      },
      orderBy: { confidence: 'desc' }
    });
  }

  /**
   * التحقق من تطابق النمط مع الوقت الحالي
   */
  async checkPatternMatch(userId) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const timeSlot = this._getTimeSlot(hour);

    const matchingPatterns = await prisma.orderPattern.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { dayOfWeek: dayOfWeek },
          { dayOfWeek: null, timePreference: timeSlot }
        ]
      },
      include: {
        restaurant: true
      },
      orderBy: { confidence: 'desc' }
    });

    return matchingPatterns.filter(p => {
      if (p.timePreference && p.timePreference !== timeSlot) {
        return false;
      }
      return true;
    });
  }

  /**
   * تحديث النمط عند تفعيله
   */
  async triggerPattern(patternId) {
    await prisma.orderPattern.update({
      where: { id: patternId },
      data: { lastTriggered: new Date() }
    });
  }
}

module.exports = new PatternRecognitionService();
