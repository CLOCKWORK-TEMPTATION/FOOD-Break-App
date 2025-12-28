/**
 * خدمة تحليل سلوك المستخدم
 * User Behavior Analysis Service
 *
 * تحليل أنماط الطلب للمستخدمين وتحديد التفضيلات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BehaviorAnalysisService {
  /**
   * تحليل سلوك مستخدم معين
   * @param {string} userId - معرف المستخدم
   * @returns {Object} تحليل السلوك
   */
  async analyzeUserBehavior(userId) {
    // جلب جميع طلبات المستخدم
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED'
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                restaurant: true
              }
            }
          }
        },
        restaurant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      return null;
    }

    // تحليل أنماط الطلب حسب اليوم والوقت
    const behaviorByDayTime = this._analyzeDayTimePatterns(orders);

    // تحليل المطابخ المفضلة
    const preferredCuisines = this._analyzePreferredCuisines(orders);

    // تحليل العناصر المفضلة
    const preferredItems = this._analyzePreferredItems(orders);

    // حساب متوسط قيمة الطلب
    const avgOrderValue = this._calculateAverageOrderValue(orders);

    // حساب تكرار الطلب
    const orderFrequency = this._calculateOrderFrequency(orders);

    // حفظ أو تحديث سجلات السلوك
    await this._saveUserBehaviors(userId, behaviorByDayTime, preferredCuisines, preferredItems, avgOrderValue, orderFrequency);

    return {
      userId,
      totalOrders: orders.length,
      avgOrderValue,
      orderFrequency,
      preferredCuisines,
      preferredItems: preferredItems.slice(0, 10),
      behaviorPatterns: behaviorByDayTime
    };
  }

  /**
   * تحليل أنماط الطلب حسب اليوم والوقت
   */
  _analyzeDayTimePatterns(orders) {
    const patterns = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const timeSlot = this._getTimeSlot(hour);

      const key = `${dayOfWeek}-${timeSlot}`;

      if (!patterns[key]) {
        patterns[key] = {
          dayOfWeek,
          timeSlot,
          count: 0,
          totalValue: 0,
          items: []
        };
      }

      patterns[key].count++;
      patterns[key].totalValue += order.totalAmount;

      order.items.forEach(item => {
        patterns[key].items.push(item.menuItemId);
      });
    });

    return Object.values(patterns).map(p => ({
      ...p,
      avgValue: p.totalValue / p.count,
      topItems: this._getMostFrequent(p.items, 5)
    }));
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
   * تحليل المطابخ المفضلة
   */
  _analyzePreferredCuisines(orders) {
    const cuisineCounts = {};

    orders.forEach(order => {
      if (order.restaurant?.cuisineType) {
        const cuisine = order.restaurant.cuisineType;
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      }
    });

    return Object.entries(cuisineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cuisine, count]) => ({ cuisine, count, percentage: (count / orders.length) * 100 }));
  }

  /**
   * تحليل العناصر المفضلة
   */
  _analyzePreferredItems(orders) {
    const itemCounts = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const id = item.menuItemId;
        if (!itemCounts[id]) {
          itemCounts[id] = {
            menuItemId: id,
            name: item.menuItem?.name,
            count: 0,
            totalQuantity: 0
          };
        }
        itemCounts[id].count++;
        itemCounts[id].totalQuantity += item.quantity;
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * حساب متوسط قيمة الطلب
   */
  _calculateAverageOrderValue(orders) {
    if (orders.length === 0) return 0;
    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return Math.round((total / orders.length) * 100) / 100;
  }

  /**
   * حساب تكرار الطلب (طلبات في الأسبوع)
   */
  _calculateOrderFrequency(orders) {
    if (orders.length < 2) return 0;

    const firstOrder = new Date(orders[orders.length - 1].createdAt);
    const lastOrder = new Date(orders[0].createdAt);
    const weeks = (lastOrder - firstOrder) / (7 * 24 * 60 * 60 * 1000);

    if (weeks < 1) return orders.length;
    return Math.round((orders.length / weeks) * 100) / 100;
  }

  /**
   * الحصول على العناصر الأكثر تكراراً
   */
  _getMostFrequent(arr, limit) {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item, count]) => ({ itemId: item, count }));
  }

  /**
   * حفظ سجلات السلوك في قاعدة البيانات
   */
  async _saveUserBehaviors(userId, patterns, cuisines, items, avgValue, frequency) {
    const cuisineList = cuisines.map(c => c.cuisine);
    const itemList = items.slice(0, 20).map(i => i.menuItemId);

    for (const pattern of patterns) {
      await prisma.userBehavior.upsert({
        where: {
          userId_dayOfWeek_timeSlot: {
            userId,
            dayOfWeek: pattern.dayOfWeek,
            timeSlot: pattern.timeSlot
          }
        },
        update: {
          avgOrderValue: pattern.avgValue,
          orderFrequency: frequency,
          preferredCuisines: cuisineList,
          preferredItems: itemList,
          totalOrders: pattern.count,
          lastOrderDate: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          dayOfWeek: pattern.dayOfWeek,
          timeSlot: pattern.timeSlot,
          avgOrderValue: pattern.avgValue,
          orderFrequency: frequency,
          preferredCuisines: cuisineList,
          preferredItems: itemList,
          totalOrders: pattern.count,
          lastOrderDate: new Date()
        }
      });
    }
  }

  /**
   * الحصول على سلوك المستخدم المحفوظ
   */
  async getUserBehavior(userId) {
    return await prisma.userBehavior.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeSlot: 'asc' }
      ]
    });
  }

  /**
   * تحليل سلوك جميع المستخدمين (للـ batch processing)
   */
  async analyzeAllUsersBehavior() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    const results = [];
    for (const user of users) {
      try {
        const analysis = await this.analyzeUserBehavior(user.id);
        if (analysis) {
          results.push(analysis);
        }
      } catch (error) {
        console.error(`Error analyzing user ${user.id}:`, error);
      }
    }

    return {
      totalAnalyzed: results.length,
      timestamp: new Date()
    };
  }
}

module.exports = new BehaviorAnalysisService();
