/**
 * خدمة التنبؤ بالكميات
 * Quantity Forecasting Service
 *
 * التنبؤ بالكميات المطلوبة من كل صنف
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class QuantityForecastService {
  constructor() {
    // عدد الأيام للتحليل التاريخي
    this.HISTORY_DAYS = 30;
    // عامل الموسمية (للمناسبات والعطلات)
    this.SEASONAL_FACTOR = 1.2;
  }

  /**
   * التنبؤ بالكميات لمطعم معين
   * @param {string} restaurantId - معرف المطعم
   * @param {Date} targetDate - التاريخ المستهدف
   * @returns {Array} توقعات الكميات
   */
  async forecastForRestaurant(restaurantId, targetDate = new Date()) {
    // جلب الطلبات التاريخية
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - this.HISTORY_DAYS);

    const historicalOrders = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: 'DELIVERED',
          createdAt: {
            gte: startDate
          }
        }
      },
      include: {
        order: true,
        menuItem: true
      }
    });

    // تجميع البيانات حسب الصنف
    const itemStats = this._aggregateItemStats(historicalOrders);

    // حساب التوقعات لكل صنف
    const forecasts = [];
    const targetDayOfWeek = targetDate.getDay();

    for (const [menuItemId, stats] of Object.entries(itemStats)) {
      const forecast = this._calculateForecast(stats, targetDayOfWeek);

      forecasts.push({
        restaurantId,
        menuItemId,
        forecastDate: targetDate,
        predictedQty: forecast.quantity,
        confidence: forecast.confidence,
        factors: forecast.factors
      });
    }

    // حفظ التوقعات
    await this._saveForecasts(forecasts);

    return forecasts;
  }

  /**
   * تجميع إحصائيات الأصناف
   */
  _aggregateItemStats(orderItems) {
    const stats = {};

    orderItems.forEach(item => {
      const menuItemId = item.menuItemId;
      const orderDate = new Date(item.order.createdAt);
      const dayOfWeek = orderDate.getDay();

      if (!stats[menuItemId]) {
        stats[menuItemId] = {
          menuItemId,
          name: item.menuItem?.name,
          totalQuantity: 0,
          orderCount: 0,
          byDayOfWeek: {},
          byWeek: {},
          recentTrend: []
        };
      }

      stats[menuItemId].totalQuantity += item.quantity;
      stats[menuItemId].orderCount++;

      // إحصائيات حسب اليوم
      if (!stats[menuItemId].byDayOfWeek[dayOfWeek]) {
        stats[menuItemId].byDayOfWeek[dayOfWeek] = { qty: 0, count: 0 };
      }
      stats[menuItemId].byDayOfWeek[dayOfWeek].qty += item.quantity;
      stats[menuItemId].byDayOfWeek[dayOfWeek].count++;

      // إحصائيات أسبوعية
      const weekNum = this._getWeekNumber(orderDate);
      if (!stats[menuItemId].byWeek[weekNum]) {
        stats[menuItemId].byWeek[weekNum] = 0;
      }
      stats[menuItemId].byWeek[weekNum] += item.quantity;

      // الاتجاه الأخير
      stats[menuItemId].recentTrend.push({
        date: orderDate,
        qty: item.quantity
      });
    });

    return stats;
  }

  /**
   * حساب التوقع لصنف معين
   */
  _calculateForecast(stats, targetDayOfWeek) {
    const factors = {
      dayOfWeek: targetDayOfWeek,
      historicalAvg: 0,
      daySpecificAvg: 0,
      trend: 'stable',
      seasonalAdjustment: 1
    };

    // المتوسط العام
    const avgDaily = stats.totalQuantity / Math.max(this.HISTORY_DAYS, 1);
    factors.historicalAvg = avgDaily;

    // المتوسط حسب اليوم
    const dayStats = stats.byDayOfWeek[targetDayOfWeek];
    if (dayStats && dayStats.count > 0) {
      factors.daySpecificAvg = dayStats.qty / dayStats.count;
    } else {
      factors.daySpecificAvg = avgDaily;
    }

    // تحليل الاتجاه
    const trend = this._analyzeTrend(stats.recentTrend);
    factors.trend = trend.direction;
    const trendMultiplier = trend.multiplier;

    // حساب التوقع النهائي
    // الوزن: 60% للمتوسط اليومي، 40% للمتوسط العام
    let baseQuantity = (factors.daySpecificAvg * 0.6) + (avgDaily * 0.4);

    // تطبيق عامل الاتجاه
    baseQuantity *= trendMultiplier;

    // التحقق من المناسبات الخاصة
    const specialEvent = this._checkSpecialEvents(new Date());
    if (specialEvent) {
      factors.seasonalAdjustment = this.SEASONAL_FACTOR;
      baseQuantity *= this.SEASONAL_FACTOR;
    }

    // حساب الثقة
    const confidence = this._calculateConfidence(stats);

    return {
      quantity: Math.round(baseQuantity),
      confidence,
      factors
    };
  }

  /**
   * تحليل الاتجاه
   */
  _analyzeTrend(recentTrend) {
    if (recentTrend.length < 7) {
      return { direction: 'stable', multiplier: 1 };
    }

    // ترتيب حسب التاريخ
    const sorted = recentTrend.sort((a, b) => a.date - b.date);

    // تقسيم إلى نصفين
    const midPoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const firstAvg = firstHalf.reduce((s, i) => s + i.qty, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, i) => s + i.qty, 0) / secondHalf.length;

    const changeRatio = secondAvg / Math.max(firstAvg, 1);

    if (changeRatio > 1.15) {
      return { direction: 'increasing', multiplier: 1.1 };
    } else if (changeRatio < 0.85) {
      return { direction: 'decreasing', multiplier: 0.9 };
    }

    return { direction: 'stable', multiplier: 1 };
  }

  /**
   * التحقق من المناسبات الخاصة
   */
  _checkSpecialEvents(date) {
    // يمكن توسيع هذه الدالة للتحقق من:
    // - العطلات الرسمية
    // - المناسبات الدينية
    // - الأحداث المحلية

    const dayOfWeek = date.getDay();

    // عطلة نهاية الأسبوع
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 'weekend';
    }

    return null;
  }

  /**
   * حساب نسبة الثقة
   */
  _calculateConfidence(stats) {
    // الثقة تعتمد على:
    // 1. عدد الطلبات التاريخية
    // 2. انتظام الطلبات
    // 3. تغطية الأيام

    let confidence = 0.5; // قيمة أساسية

    // عامل عدد الطلبات
    if (stats.orderCount >= 20) {
      confidence += 0.2;
    } else if (stats.orderCount >= 10) {
      confidence += 0.1;
    }

    // عامل تغطية الأيام
    const daysWithData = Object.keys(stats.byDayOfWeek).length;
    if (daysWithData >= 5) {
      confidence += 0.2;
    } else if (daysWithData >= 3) {
      confidence += 0.1;
    }

    // عامل الانتظام
    const weeklyVariance = this._calculateVariance(Object.values(stats.byWeek));
    if (weeklyVariance < 0.3) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * حساب التباين
   */
  _calculateVariance(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((s, v) => s + v, 0) / values.length;

    return variance / Math.max(mean * mean, 1);
  }

  /**
   * الحصول على رقم الأسبوع
   */
  _getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * حفظ التوقعات
   */
  async _saveForecasts(forecasts) {
    for (const forecast of forecasts) {
      await prisma.quantityForecast.upsert({
        where: {
          restaurantId_menuItemId_forecastDate: {
            restaurantId: forecast.restaurantId,
            menuItemId: forecast.menuItemId,
            forecastDate: forecast.forecastDate
          }
        },
        update: {
          predictedQty: forecast.predictedQty,
          confidence: forecast.confidence,
          factors: forecast.factors
        },
        create: {
          restaurantId: forecast.restaurantId,
          menuItemId: forecast.menuItemId,
          forecastDate: forecast.forecastDate,
          predictedQty: forecast.predictedQty,
          confidence: forecast.confidence,
          factors: forecast.factors
        }
      });
    }
  }

  /**
   * الحصول على توقعات مطعم
   */
  async getRestaurantForecasts(restaurantId, startDate, endDate) {
    return await prisma.quantityForecast.findMany({
      where: {
        restaurantId,
        forecastDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            price: true
          }
        }
      },
      orderBy: [
        { forecastDate: 'asc' },
        { predictedQty: 'desc' }
      ]
    });
  }

  /**
   * تحديث التوقعات بالكميات الفعلية
   */
  async updateActualQuantity(restaurantId, menuItemId, date, actualQty) {
    const forecastDate = new Date(date);
    forecastDate.setHours(0, 0, 0, 0);

    await prisma.quantityForecast.updateMany({
      where: {
        restaurantId,
        menuItemId,
        forecastDate
      },
      data: {
        actualQty
      }
    });
  }

  /**
   * تقييم دقة التوقعات
   */
  async evaluateForecastAccuracy(restaurantId, days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const forecasts = await prisma.quantityForecast.findMany({
      where: {
        restaurantId,
        forecastDate: {
          gte: startDate,
          lte: endDate
        },
        actualQty: { not: null }
      }
    });

    if (forecasts.length === 0) {
      return { accuracy: null, message: 'No data available' };
    }

    let totalError = 0;
    let totalActual = 0;

    forecasts.forEach(f => {
      const error = Math.abs(f.predictedQty - f.actualQty);
      totalError += error;
      totalActual += f.actualQty;
    });

    const mape = totalActual > 0 ? (totalError / totalActual) * 100 : 0;
    const accuracy = 100 - mape;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      totalForecasts: forecasts.length,
      averageError: Math.round(totalError / forecasts.length),
      period: { startDate, endDate }
    };
  }
}

module.exports = new QuantityForecastService();
