/**
 * خدمة تقارير التنبؤ بالطلب
 * Demand Forecast Report Service
 *
 * إنشاء تقارير للمطاعم للتفاوض على الخصومات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const quantityForecastService = require('./quantityForecastService');

class DemandForecastReportService {
  constructor() {
    // الحد الأدنى للطلبات للتأهل للخصم
    this.MIN_ORDERS_FOR_DISCOUNT = 50;
    // الحد الأدنى للإيرادات للتأهل للخصم
    this.MIN_REVENUE_FOR_DISCOUNT = 5000;
    // نسب الخصم المقترحة حسب حجم الطلبات
    this.DISCOUNT_TIERS = [
      { minOrders: 50, minRevenue: 5000, discount: 5 },
      { minOrders: 100, minRevenue: 10000, discount: 8 },
      { minOrders: 200, minRevenue: 20000, discount: 12 },
      { minOrders: 500, minRevenue: 50000, discount: 15 }
    ];
  }

  /**
   * إنشاء تقرير التنبؤ بالطلب لمطعم
   * @param {string} restaurantId - معرف المطعم
   * @param {string} period - الفترة (weekly, monthly)
   * @returns {Object} التقرير
   */
  async generateReport(restaurantId, period = 'weekly') {
    // تحديد نطاق التواريخ
    const { startDate, endDate } = this._getDateRange(period);

    // جلب البيانات التاريخية
    const historicalData = await this._getHistoricalData(restaurantId, period);

    // إنشاء توقعات الكمية
    const forecasts = await this._generateForecasts(restaurantId, startDate, endDate);

    // حساب إجمالي التوقعات
    const totals = this._calculateTotals(forecasts);

    // التحقق من أهلية الخصم
    const discountInfo = this._calculateDiscount(totals);

    // إنشاء التقرير
    const report = {
      restaurantId,
      reportPeriod: period,
      startDate,
      endDate,
      totalPredictedOrders: totals.totalOrders,
      totalPredictedRevenue: totals.totalRevenue,
      itemForecasts: forecasts,
      bulkDiscountEligible: discountInfo.eligible,
      suggestedDiscount: discountInfo.discount,
      status: 'GENERATED',
      historicalComparison: {
        previousPeriodOrders: historicalData.previousPeriodOrders,
        previousPeriodRevenue: historicalData.previousPeriodRevenue,
        growthRate: historicalData.growthRate
      }
    };

    // حفظ التقرير
    const savedReport = await this._saveReport(report);

    return savedReport;
  }

  /**
   * تحديد نطاق التواريخ
   */
  _getDateRange(period) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);

    if (period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return { startDate, endDate };
  }

  /**
   * جلب البيانات التاريخية
   */
  async _getHistoricalData(restaurantId, period) {
    const daysToAnalyze = period === 'weekly' ? 7 : 30;

    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - daysToAnalyze);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - daysToAnalyze);

    // الطلبات في الفترة الحالية
    const currentOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'DELIVERED',
        createdAt: { gte: currentStart }
      }
    });

    // الطلبات في الفترة السابقة
    const previousOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'DELIVERED',
        createdAt: {
          gte: previousStart,
          lt: currentStart
        }
      }
    });

    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const growthRate = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      previousPeriodOrders: previousOrders.length,
      previousPeriodRevenue: previousRevenue,
      currentPeriodOrders: currentOrders.length,
      currentPeriodRevenue: currentRevenue,
      growthRate: Math.round(growthRate * 100) / 100
    };
  }

  /**
   * إنشاء التوقعات
   */
  async _generateForecasts(restaurantId, startDate, endDate) {
    const forecasts = [];
    const currentDate = new Date(startDate);

    // جمع التوقعات لكل يوم
    const dailyForecasts = {};

    while (currentDate <= endDate) {
      const dayForecasts = await quantityForecastService.forecastForRestaurant(
        restaurantId,
        new Date(currentDate)
      );

      dayForecasts.forEach(f => {
        if (!dailyForecasts[f.menuItemId]) {
          dailyForecasts[f.menuItemId] = {
            menuItemId: f.menuItemId,
            predictedQty: 0,
            predictedRevenue: 0,
            avgConfidence: 0,
            dayCount: 0
          };
        }

        dailyForecasts[f.menuItemId].predictedQty += f.predictedQty;
        dailyForecasts[f.menuItemId].avgConfidence += f.confidence;
        dailyForecasts[f.menuItemId].dayCount++;
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // جلب أسعار الأصناف وحساب الإيرادات
    for (const [menuItemId, data] of Object.entries(dailyForecasts)) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: { id: true, name: true, nameAr: true, price: true }
      });

      if (menuItem) {
        forecasts.push({
          menuItemId,
          name: menuItem.name,
          nameAr: menuItem.nameAr,
          predictedQty: data.predictedQty,
          predictedRevenue: data.predictedQty * menuItem.price,
          avgConfidence: data.avgConfidence / data.dayCount,
          unitPrice: menuItem.price
        });
      }
    }

    return forecasts.sort((a, b) => b.predictedRevenue - a.predictedRevenue);
  }

  /**
   * حساب الإجماليات
   */
  _calculateTotals(forecasts) {
    return {
      totalOrders: forecasts.reduce((sum, f) => sum + f.predictedQty, 0),
      totalRevenue: forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0),
      itemCount: forecasts.length
    };
  }

  /**
   * حساب الخصم المقترح
   */
  _calculateDiscount(totals) {
    // البحث عن المستوى المناسب
    let eligible = false;
    let discount = 0;

    for (const tier of this.DISCOUNT_TIERS.reverse()) {
      if (
        totals.totalOrders >= tier.minOrders &&
        totals.totalRevenue >= tier.minRevenue
      ) {
        eligible = true;
        discount = tier.discount;
        break;
      }
    }

    return { eligible, discount };
  }

  /**
   * حفظ التقرير
   */
  async _saveReport(report) {
    return await prisma.demandForecastReport.create({
      data: {
        restaurantId: report.restaurantId,
        reportPeriod: report.reportPeriod,
        startDate: report.startDate,
        endDate: report.endDate,
        totalPredictedOrders: report.totalPredictedOrders,
        totalPredictedRevenue: report.totalPredictedRevenue,
        itemForecasts: report.itemForecasts,
        bulkDiscountEligible: report.bulkDiscountEligible,
        suggestedDiscount: report.suggestedDiscount,
        status: report.status
      }
    });
  }

  /**
   * إرسال التقرير للمطعم
   */
  async sendReportToRestaurant(reportId) {
    const report = await prisma.demandForecastReport.findUnique({
      where: { id: reportId },
      include: {
        restaurant: true
      }
    });

    if (!report) {
      throw new Error('التقرير غير موجود');
    }

    // تحديث حالة التقرير
    await prisma.demandForecastReport.update({
      where: { id: reportId },
      data: {
        status: 'SENT',
        sentToRestaurant: true
      }
    });

    // هنا يمكن إضافة منطق إرسال البريد الإلكتروني
    // أو الإشعار للمطعم

    return {
      success: true,
      message: 'تم إرسال التقرير بنجاح',
      reportId
    };
  }

  /**
   * تسجيل رد المطعم
   */
  async recordRestaurantResponse(reportId, response) {
    const { accepted, counterOffer, notes } = response;

    let status;
    if (accepted) {
      status = 'AGREED';
    } else if (counterOffer) {
      status = 'NEGOTIATING';
    } else {
      status = 'REJECTED';
    }

    return await prisma.demandForecastReport.update({
      where: { id: reportId },
      data: {
        status,
        restaurantResponse: {
          accepted,
          counterOffer,
          notes,
          respondedAt: new Date()
        }
      }
    });
  }

  /**
   * الحصول على تقارير مطعم
   */
  async getRestaurantReports(restaurantId, status = null) {
    const where = { restaurantId };

    if (status) {
      where.status = status;
    }

    return await prisma.demandForecastReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  /**
   * الحصول على ملخص المفاوضات
   */
  async getNegotiationsSummary() {
    const reports = await prisma.demandForecastReport.findMany({
      where: {
        status: { in: ['SENT', 'NEGOTIATING', 'AGREED', 'REJECTED'] }
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const summary = {
      totalReports: reports.length,
      byStatus: {},
      totalPotentialSavings: 0,
      agreedDiscounts: []
    };

    reports.forEach(report => {
      summary.byStatus[report.status] = (summary.byStatus[report.status] || 0) + 1;

      if (report.status === 'AGREED' && report.suggestedDiscount) {
        const savings = report.totalPredictedRevenue * (report.suggestedDiscount / 100);
        summary.totalPotentialSavings += savings;

        summary.agreedDiscounts.push({
          restaurantName: report.restaurant.name,
          discount: report.suggestedDiscount,
          estimatedSavings: savings
        });
      }
    });

    return summary;
  }

  /**
   * مقارنة التوقعات بالفعليات
   */
  async compareActualVsPredicted(reportId) {
    const report = await prisma.demandForecastReport.findUnique({
      where: { id: reportId }
    });

    if (!report || new Date() < report.endDate) {
      return { message: 'التقرير غير مكتمل بعد' };
    }

    // جلب الطلبات الفعلية
    const actualOrders = await prisma.order.findMany({
      where: {
        restaurantId: report.restaurantId,
        status: 'DELIVERED',
        createdAt: {
          gte: report.startDate,
          lte: report.endDate
        }
      },
      include: {
        items: true
      }
    });

    // حساب الكميات الفعلية
    const actualQuantities = {};
    let totalActualOrders = 0;
    let totalActualRevenue = 0;

    actualOrders.forEach(order => {
      totalActualOrders++;
      totalActualRevenue += order.totalAmount;

      order.items.forEach(item => {
        actualQuantities[item.menuItemId] =
          (actualQuantities[item.menuItemId] || 0) + item.quantity;
      });
    });

    // المقارنة
    const comparison = {
      predicted: {
        orders: report.totalPredictedOrders,
        revenue: report.totalPredictedRevenue
      },
      actual: {
        orders: totalActualOrders,
        revenue: totalActualRevenue
      },
      accuracy: {
        ordersAccuracy: this._calculateAccuracy(
          report.totalPredictedOrders,
          totalActualOrders
        ),
        revenueAccuracy: this._calculateAccuracy(
          report.totalPredictedRevenue,
          totalActualRevenue
        )
      },
      itemComparison: report.itemForecasts.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        predicted: item.predictedQty,
        actual: actualQuantities[item.menuItemId] || 0,
        accuracy: this._calculateAccuracy(
          item.predictedQty,
          actualQuantities[item.menuItemId] || 0
        )
      }))
    };

    return comparison;
  }

  /**
   * حساب نسبة الدقة
   */
  _calculateAccuracy(predicted, actual) {
    if (predicted === 0 && actual === 0) return 100;
    if (predicted === 0) return 0;

    const error = Math.abs(predicted - actual) / predicted;
    const accuracy = Math.max(0, (1 - error) * 100);

    return Math.round(accuracy * 100) / 100;
  }
}

module.exports = new DemandForecastReportService();
