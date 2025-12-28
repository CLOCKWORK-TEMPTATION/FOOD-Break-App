/**
 * خدمة جدولة التوصيل
 * Delivery Scheduling Service
 *
 * التنبؤ بأوقات الذروة وتحسين تخطيط المسارات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DeliverySchedulingService {
  constructor() {
    // عدد الأيام للتحليل
    this.ANALYSIS_DAYS = 30;
    // الفترات الزمنية (30 دقيقة لكل فترة)
    this.TIME_SLOTS = this._generateTimeSlots();
    // عتبة الذروة (عدد الطلبات)
    this.PEAK_THRESHOLD = 10;
    // متوسط طلبات السائق في الساعة
    this.ORDERS_PER_DRIVER_HOUR = 3;
  }

  /**
   * إنشاء الفترات الزمنية
   */
  _generateTimeSlots() {
    const slots = [];
    for (let hour = 6; hour < 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:30-${(hour + 1).toString().padStart(2, '0')}:00`);
    }
    return slots;
  }

  /**
   * التنبؤ بجدول التوصيل ليوم معين
   * @param {Date} targetDate - التاريخ المستهدف
   * @returns {Array} جدول التوصيل المتوقع
   */
  async predictDeliverySchedule(targetDate = new Date()) {
    // جلب البيانات التاريخية
    const historicalData = await this._getHistoricalData(targetDate);

    // تحليل الأنماط حسب الفترة الزمنية
    const slotAnalysis = this._analyzeTimeSlots(historicalData, targetDate);

    // إنشاء الجدول
    const schedule = [];

    for (const slot of this.TIME_SLOTS) {
      const analysis = slotAnalysis[slot] || { avgOrders: 0, variance: 0 };

      const predictedOrders = Math.round(analysis.avgOrders);
      const isPeakTime = predictedOrders >= this.PEAK_THRESHOLD;
      const capacityStatus = this._determineCapacityStatus(predictedOrders);
      const recommendedDrivers = this._calculateRecommendedDrivers(predictedOrders);

      schedule.push({
        date: targetDate,
        timeSlot: slot,
        predictedOrders,
        isPeakTime,
        capacityStatus,
        recommendedDrivers
      });
    }

    // حفظ الجدول
    await this._saveSchedule(schedule);

    return schedule;
  }

  /**
   * جلب البيانات التاريخية
   */
  async _getHistoricalData(targetDate) {
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - this.ANALYSIS_DAYS);

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['DELIVERED', 'OUT_FOR_DELIVERY'] },
        createdAt: {
          gte: startDate,
          lt: targetDate
        }
      },
      select: {
        id: true,
        createdAt: true,
        deliveryLat: true,
        deliveryLng: true,
        deliveredAt: true
      }
    });

    return orders;
  }

  /**
   * تحليل الفترات الزمنية
   */
  _analyzeTimeSlots(orders, targetDate) {
    const targetDayOfWeek = targetDate.getDay();
    const slotData = {};

    // تجميع الطلبات حسب الفترة الزمنية واليوم
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayOfWeek = orderDate.getDay();
      const slot = this._getTimeSlot(orderDate);

      if (!slotData[slot]) {
        slotData[slot] = {
          allDays: [],
          sameDayOfWeek: []
        };
      }

      slotData[slot].allDays.push(order);

      if (dayOfWeek === targetDayOfWeek) {
        slotData[slot].sameDayOfWeek.push(order);
      }
    });

    // حساب المتوسطات
    const analysis = {};

    for (const [slot, data] of Object.entries(slotData)) {
      // وزن أكبر لنفس اليوم من الأسبوع
      const sameDayAvg = data.sameDayOfWeek.length > 0
        ? data.sameDayOfWeek.length / Math.ceil(this.ANALYSIS_DAYS / 7)
        : 0;

      const allDaysAvg = data.allDays.length / this.ANALYSIS_DAYS;

      // الوزن: 70% لنفس اليوم، 30% للمتوسط العام
      const weightedAvg = (sameDayAvg * 0.7) + (allDaysAvg * 0.3);

      analysis[slot] = {
        avgOrders: weightedAvg,
        sameDayCount: data.sameDayOfWeek.length,
        totalCount: data.allDays.length
      };
    }

    return analysis;
  }

  /**
   * تحديد الفترة الزمنية للطلب
   */
  _getTimeSlot(date) {
    const hour = date.getHours();
    const minutes = date.getMinutes();

    if (minutes < 30) {
      return `${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:30`;
    } else {
      return `${hour.toString().padStart(2, '0')}:30-${(hour + 1).toString().padStart(2, '0')}:00`;
    }
  }

  /**
   * تحديد حالة السعة
   */
  _determineCapacityStatus(predictedOrders) {
    if (predictedOrders < 5) return 'LOW';
    if (predictedOrders < 10) return 'NORMAL';
    if (predictedOrders < 20) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * حساب عدد السائقين المطلوب
   */
  _calculateRecommendedDrivers(predictedOrders) {
    if (predictedOrders === 0) return 1;

    // حساب عدد السائقين مع هامش أمان 20%
    const baseDrivers = predictedOrders / this.ORDERS_PER_DRIVER_HOUR;
    const withBuffer = baseDrivers * 1.2;

    return Math.ceil(withBuffer);
  }

  /**
   * حفظ الجدول
   */
  async _saveSchedule(schedule) {
    for (const slot of schedule) {
      await prisma.deliverySchedule.upsert({
        where: {
          date_timeSlot: {
            date: slot.date,
            timeSlot: slot.timeSlot
          }
        },
        update: {
          predictedOrders: slot.predictedOrders,
          isPeakTime: slot.isPeakTime,
          capacityStatus: slot.capacityStatus,
          recommendedDrivers: slot.recommendedDrivers,
          updatedAt: new Date()
        },
        create: {
          date: slot.date,
          timeSlot: slot.timeSlot,
          predictedOrders: slot.predictedOrders,
          isPeakTime: slot.isPeakTime,
          capacityStatus: slot.capacityStatus,
          recommendedDrivers: slot.recommendedDrivers
        }
      });
    }
  }

  /**
   * الحصول على أوقات الذروة ليوم معين
   */
  async getPeakTimes(date) {
    const schedule = await prisma.deliverySchedule.findMany({
      where: {
        date,
        isPeakTime: true
      },
      orderBy: { timeSlot: 'asc' }
    });

    return schedule;
  }

  /**
   * الحصول على الجدول الكامل ليوم
   */
  async getDaySchedule(date) {
    return await prisma.deliverySchedule.findMany({
      where: { date },
      orderBy: { timeSlot: 'asc' }
    });
  }

  /**
   * تحديث الجدول بالطلبات الفعلية
   */
  async updateActualOrders(date, timeSlot, actualOrders) {
    await prisma.deliverySchedule.updateMany({
      where: { date, timeSlot },
      data: { actualOrders }
    });
  }

  /**
   * تحسين تخطيط المسارات
   * (خوارزمية بسيطة لتجميع الطلبات القريبة)
   */
  async optimizeRoutes(orders) {
    if (orders.length === 0) return [];

    // تجميع الطلبات حسب المنطقة
    const clusters = this._clusterOrders(orders);

    // تخصيص كل مجموعة لسائق
    const routes = clusters.map((cluster, index) => ({
      routeId: `route-${index + 1}`,
      orders: cluster.orders,
      estimatedTime: this._estimateRouteTime(cluster.orders),
      totalDistance: cluster.totalDistance,
      startPoint: cluster.centroid
    }));

    return routes;
  }

  /**
   * تجميع الطلبات حسب الموقع
   */
  _clusterOrders(orders) {
    // خوارزمية تجميع بسيطة
    // (في الإنتاج، استخدم خوارزمية K-means أو DBSCAN)

    const CLUSTER_RADIUS_KM = 2; // نصف قطر المجموعة
    const clusters = [];
    const assigned = new Set();

    orders.forEach(order => {
      if (assigned.has(order.id) || !order.deliveryLat || !order.deliveryLng) {
        return;
      }

      // بدء مجموعة جديدة
      const cluster = {
        orders: [order],
        centroid: { lat: order.deliveryLat, lng: order.deliveryLng },
        totalDistance: 0
      };

      // البحث عن الطلبات القريبة
      orders.forEach(otherOrder => {
        if (
          assigned.has(otherOrder.id) ||
          otherOrder.id === order.id ||
          !otherOrder.deliveryLat ||
          !otherOrder.deliveryLng
        ) {
          return;
        }

        const distance = this._calculateDistance(
          order.deliveryLat,
          order.deliveryLng,
          otherOrder.deliveryLat,
          otherOrder.deliveryLng
        );

        if (distance <= CLUSTER_RADIUS_KM) {
          cluster.orders.push(otherOrder);
          cluster.totalDistance += distance;
          assigned.add(otherOrder.id);
        }
      });

      assigned.add(order.id);
      clusters.push(cluster);
    });

    return clusters;
  }

  /**
   * حساب المسافة بين نقطتين (بالكيلومتر)
   */
  _calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
        Math.cos(this._toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * تقدير وقت المسار
   */
  _estimateRouteTime(orders) {
    // متوسط 10 دقائق لكل طلب + 5 دقائق للتنقل
    return orders.length * 15;
  }

  /**
   * تقييم دقة التنبؤات
   */
  async evaluateAccuracy(startDate, endDate) {
    const schedules = await prisma.deliverySchedule.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        actualOrders: { not: null }
      }
    });

    if (schedules.length === 0) {
      return { accuracy: null, message: 'لا توجد بيانات كافية' };
    }

    let totalError = 0;
    let totalActual = 0;

    schedules.forEach(s => {
      const error = Math.abs(s.predictedOrders - s.actualOrders);
      totalError += error;
      totalActual += s.actualOrders;
    });

    const mape = totalActual > 0 ? (totalError / totalActual) * 100 : 0;
    const accuracy = 100 - mape;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      totalSlots: schedules.length,
      averageError: Math.round((totalError / schedules.length) * 100) / 100,
      period: { startDate, endDate }
    };
  }

  /**
   * الحصول على توصيات السعة
   */
  async getCapacityRecommendations(date) {
    const schedule = await this.getDaySchedule(date);

    const recommendations = {
      date,
      totalDriversNeeded: 0,
      peakHours: [],
      lowActivityHours: [],
      staffingPlan: []
    };

    schedule.forEach(slot => {
      if (slot.isPeakTime) {
        recommendations.peakHours.push(slot.timeSlot);
      }

      if (slot.capacityStatus === 'LOW') {
        recommendations.lowActivityHours.push(slot.timeSlot);
      }

      recommendations.totalDriversNeeded = Math.max(
        recommendations.totalDriversNeeded,
        slot.recommendedDrivers
      );

      recommendations.staffingPlan.push({
        timeSlot: slot.timeSlot,
        drivers: slot.recommendedDrivers,
        status: slot.capacityStatus
      });
    });

    return recommendations;
  }
}

module.exports = new DeliverySchedulingService();
