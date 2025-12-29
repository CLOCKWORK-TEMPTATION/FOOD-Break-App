const db = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

/**
 * خدمة التحليلات العربية المتقدمة
 * توفر تحليلات شاملة ومتقدمة للتطبيق
 */
class AnalyticsService {
  /**
   * جلب التحليلات الشاملة
   */
  async getComprehensiveAnalytics({ period, startDate, endDate, userId }) {
    try {
      const dateFilter = this.buildDateFilter(period, startDate, endDate);
      
      const [
        orderAnalytics,
        revenueAnalytics,
        userAnalytics,
        restaurantAnalytics
      ] = await Promise.all([
        this.getOrderAnalytics({ period, userId }),
        this.getRevenueAnalytics({ period, userId }),
        this.getUserAnalytics({ period, adminId: userId }),
        this.getRestaurantAnalytics({ period, adminId: userId })
      ]);

      return {
        orders: orderAnalytics,
        revenue: revenueAnalytics,
        users: userAnalytics,
        restaurants: restaurantAnalytics,
        summary: await this.generateSummary({
          orderAnalytics,
          revenueAnalytics,
          userAnalytics,
          restaurantAnalytics
        })
      };
    } catch (error) {
      console.error('خطأ في التحليلات الشاملة:', error);
      throw new Error('فشل في جلب التحليلات الشاملة');
    }
  }

  /**
   * تحليلات الطلبات
   */
  async getOrderAnalytics({ period, restaurantId, userId }) {
    try {
      const dateFilter = this.buildDateFilter(period);
      let restaurantFilter = '';
      
      if (restaurantId) {
        restaurantFilter = `AND o.restaurant_id = ${restaurantId}`;
      }

      // الطلبات اليومية
      const dailyOrders = await db.query(`
        SELECT 
          DATE(o.created_at) as date,
          COUNT(*) as count,
          SUM(o.total_amount) as revenue,
          AVG(o.total_amount) as average_order_value
        FROM orders o
        WHERE o.created_at >= ? AND o.created_at <= ?
        ${restaurantFilter}
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
        LIMIT 30
      `, [dateFilter.start, dateFilter.end]);

      // الطلبات الشهرية
      const monthlyOrders = await db.query(`
        SELECT 
          DATE_FORMAT(o.created_at, '%Y-%m') as month,
          COUNT(*) as count,
          SUM(o.total_amount) as revenue,
          AVG(o.total_amount) as average_order_value
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        ${restaurantFilter}
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
        ORDER BY month DESC
      `);

      // توزيع الطلبات حسب الفئة
      const ordersByCategory = await db.query(`
        SELECT 
          r.category,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND created_at <= ?)), 2) as percentage
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.created_at >= ? AND o.created_at <= ?
        ${restaurantFilter}
        GROUP BY r.category
        ORDER BY count DESC
      `, [dateFilter.start, dateFilter.end, dateFilter.start, dateFilter.end]);

      // حالات الطلبات
      const ordersByStatus = await db.query(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND created_at <= ?)), 2) as percentage
        FROM orders
        WHERE created_at >= ? AND created_at <= ?
        ${restaurantFilter}
        GROUP BY status
      `, [dateFilter.start, dateFilter.end, dateFilter.start, dateFilter.end]);

      // أوقات الذروة
      const peakHours = await db.query(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as count
        FROM orders
        WHERE created_at >= ? AND created_at <= ?
        ${restaurantFilter}
        GROUP BY HOUR(created_at)
        ORDER BY count DESC
      `, [dateFilter.start, dateFilter.end]);

      return {
        daily: this.formatDailyData(dailyOrders),
        monthly: this.formatMonthlyData(monthlyOrders),
        byCategory: this.translateCategories(ordersByCategory),
        byStatus: this.translateOrderStatus(ordersByStatus),
        peakHours: this.formatPeakHours(peakHours),
        trends: await this.calculateOrderTrends(dailyOrders)
      };
    } catch (error) {
      console.error('خطأ في تحليلات الطلبات:', error);
      throw new Error('فشل في جلب تحليلات الطلبات');
    }
  }

  /**
   * تحليلات الإيرادات
   */
  async getRevenueAnalytics({ period, restaurantId, userId }) {
    try {
      const dateFilter = this.buildDateFilter(period);
      let restaurantFilter = '';
      
      if (restaurantId) {
        restaurantFilter = `AND o.restaurant_id = ${restaurantId}`;
      }

      // الإيرادات اليومية
      const dailyRevenue = await db.query(`
        SELECT 
          DATE(o.created_at) as date,
          SUM(o.total_amount) as amount,
          COUNT(*) as orders,
          AVG(o.total_amount) as average_order_value
        FROM orders o
        WHERE o.created_at >= ? AND o.created_at <= ?
        AND o.status = 'completed'
        ${restaurantFilter}
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
        LIMIT 30
      `, [dateFilter.start, dateFilter.end]);

      // الإيرادات الشهرية مع النمو
      const monthlyRevenue = await db.query(`
        SELECT 
          DATE_FORMAT(o.created_at, '%Y-%m') as month,
          SUM(o.total_amount) as amount,
          COUNT(*) as orders,
          LAG(SUM(o.total_amount)) OVER (ORDER BY DATE_FORMAT(o.created_at, '%Y-%m')) as previous_month_amount
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND o.status = 'completed'
        ${restaurantFilter}
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
        ORDER BY month DESC
      `);

      // الإيرادات حسب طريقة الدفع
      const revenueByPaymentMethod = await db.query(`
        SELECT 
          p.payment_method as method,
          SUM(p.amount) as amount,
          COUNT(*) as transactions,
          ROUND((SUM(p.amount) * 100.0 / (SELECT SUM(amount) FROM payments WHERE created_at >= ? AND created_at <= ?)), 2) as percentage
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.created_at >= ? AND p.created_at <= ?
        AND p.status = 'completed'
        ${restaurantFilter}
        GROUP BY p.payment_method
        ORDER BY amount DESC
      `, [dateFilter.start, dateFilter.end, dateFilter.start, dateFilter.end]);

      // أعلى المطاعم إيراداً
      const topRevenueRestaurants = await db.query(`
        SELECT 
          r.name,
          r.category,
          SUM(o.total_amount) as revenue,
          COUNT(*) as orders,
          AVG(o.total_amount) as average_order_value,
          AVG(r.rating) as rating
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.created_at >= ? AND o.created_at <= ?
        AND o.status = 'completed'
        GROUP BY r.id, r.name, r.category
        ORDER BY revenue DESC
        LIMIT 10
      `, [dateFilter.start, dateFilter.end]);

      return {
        daily: this.formatDailyData(dailyRevenue),
        monthly: this.calculateGrowthRates(monthlyRevenue),
        byPaymentMethod: this.translatePaymentMethods(revenueByPaymentMethod),
        topRestaurants: topRevenueRestaurants,
        trends: await this.calculateRevenueTrends(dailyRevenue),
        projections: await this.calculateRevenueProjections(monthlyRevenue)
      };
    } catch (error) {
      console.error('خطأ في تحليلات الإيرادات:', error);
      throw new Error('فشل في جلب تحليلات الإيرادات');
    }
  }

  /**
   * تحليلات المستخدمين
   */
  async getUserAnalytics({ period, adminId }) {
    try {
      const dateFilter = this.buildDateFilter(period);

      // نمو المستخدمين
      const userGrowth = await db.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as newUsers,
          (SELECT COUNT(*) FROM users WHERE created_at <= LAST_DAY(STR_TO_DATE(CONCAT(DATE_FORMAT(u.created_at, '%Y-%m'), '-01'), '%Y-%m-%d'))) as totalUsers
        FROM users u
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
      `);

      // التركيبة السكانية
      const demographics = await db.query(`
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 25 THEN 'أقل من 25'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 45 AND 54 THEN '45-54'
            ELSE 'أكثر من 55'
          END as ageGroup,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE birth_date IS NOT NULL)), 2) as percentage
        FROM users
        WHERE birth_date IS NOT NULL
        GROUP BY ageGroup
        ORDER BY count DESC
      `);

      // النشاط اليومي
      const dailyActivity = await db.query(`
        SELECT 
          DATE(last_login) as day,
          COUNT(DISTINCT user_id) as activeUsers
        FROM user_sessions
        WHERE last_login >= ? AND last_login <= ?
        GROUP BY DATE(last_login)
        ORDER BY day DESC
        LIMIT 30
      `, [dateFilter.start, dateFilter.end]);

      // المستخدمين الأكثر نشاطاً
      const topActiveUsers = await db.query(`
        SELECT 
          u.name,
          u.email,
          COUNT(o.id) as totalOrders,
          SUM(o.total_amount) as totalSpent,
          AVG(o.total_amount) as averageOrderValue,
          MAX(o.created_at) as lastOrderDate
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE o.created_at >= ? AND o.created_at <= ?
        GROUP BY u.id, u.name, u.email
        HAVING totalOrders > 0
        ORDER BY totalOrders DESC
        LIMIT 10
      `, [dateFilter.start, dateFilter.end]);

      return {
        growth: this.formatMonthlyData(userGrowth),
        demographics: demographics,
        activity: this.formatDailyData(dailyActivity),
        topActive: topActiveUsers,
        retention: await this.calculateUserRetention(dateFilter),
        churn: await this.calculateUserChurn(dateFilter)
      };
    } catch (error) {
      console.error('خطأ في تحليلات المستخدمين:', error);
      throw new Error('فشل في جلب تحليلات المستخدمين');
    }
  }

  /**
   * تحليلات المطاعم
   */
  async getRestaurantAnalytics({ period, category, adminId }) {
    try {
      const dateFilter = this.buildDateFilter(period);
      let categoryFilter = '';
      
      if (category) {
        categoryFilter = `AND r.category = '${category}'`;
      }

      // أداء المطاعم
      const restaurantPerformance = await db.query(`
        SELECT 
          r.id,
          r.name,
          r.category,
          r.rating,
          COUNT(o.id) as orders,
          SUM(o.total_amount) as revenue,
          AVG(o.total_amount) as averageOrderValue,
          COUNT(DISTINCT o.user_id) as uniqueCustomers
        FROM restaurants r
        LEFT JOIN orders o ON r.id = o.restaurant_id 
        WHERE o.created_at >= ? AND o.created_at <= ?
        ${categoryFilter}
        GROUP BY r.id, r.name, r.category, r.rating
        ORDER BY revenue DESC
      `, [dateFilter.start, dateFilter.end]);

      // توزيع الفئات
      const categoryDistribution = await db.query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(rating) as averageRating,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount
        FROM restaurants
        GROUP BY category
        ORDER BY count DESC
      `);

      return {
        performance: restaurantPerformance,
        categories: this.translateCategories(categoryDistribution),
        trends: await this.calculateRestaurantTrends(restaurantPerformance),
        ratings: await this.analyzeRatings(dateFilter)
      };
    } catch (error) {
      console.error('خطأ في تحليلات المطاعم:', error);
      throw new Error('فشل في جلب تحليلات المطاعم');
    }
  }

  /**
   * تصدير التحليلات إلى PDF
   */
  async exportAnalyticsToPDF({ period, type, userId }) {
    try {
      const analytics = await this.getComprehensiveAnalytics({ period, userId });
      
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'portrait',
        margin: 50
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // إعداد الخط العربي
      doc.font('Helvetica');
      
      // العنوان
      doc.fontSize(20).text('تقرير تحليلات BreakApp', { align: 'center' });
      doc.fontSize(14).text(`الفترة: ${this.translatePeriod(period)}`, { align: 'center' });
      doc.text(`تاريخ التقرير: ${moment().format('YYYY-MM-DD')}`, { align: 'center' });
      
      doc.moveDown(2);
      
      // ملخص الإحصائيات
      doc.fontSize(16).text('ملخص الإحصائيات', { underline: true });
      doc.moveDown();
      
      const summary = analytics.summary;
      doc.fontSize(12);
      doc.text(`إجمالي الطلبات: ${summary.totalOrders}`);
      doc.text(`إجمالي الإيرادات: ${summary.totalRevenue} ريال`);
      doc.text(`عدد المستخدمين النشطين: ${summary.activeUsers}`);
      doc.text(`عدد المطاعم النشطة: ${summary.activeRestaurants}`);
      
      doc.moveDown(2);
      
      // تفاصيل إضافية حسب النوع
      if (type === 'comprehensive') {
        this.addOrderAnalyticsToPDF(doc, analytics.orders);
        this.addRevenueAnalyticsToPDF(doc, analytics.revenue);
        this.addUserAnalyticsToPDF(doc, analytics.users);
      }
      
      doc.end();
      
      return new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      throw new Error('فشل في تصدير التحليلات إلى PDF');
    }
  }

  /**
   * تصدير التحليلات إلى Excel
   */
  async exportAnalyticsToExcel({ period, type, userId }) {
    try {
      const analytics = await this.getComprehensiveAnalytics({ period, userId });
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'BreakApp Analytics';
      workbook.created = new Date();
      
      // ورقة الملخص
      const summarySheet = workbook.addWorksheet('الملخص');
      summarySheet.columns = [
        { header: 'المؤشر', key: 'metric', width: 30 },
        { header: 'القيمة', key: 'value', width: 20 }
      ];
      
      const summary = analytics.summary;
      summarySheet.addRows([
        { metric: 'إجمالي الطلبات', value: summary.totalOrders },
        { metric: 'إجمالي الإيرادات', value: `${summary.totalRevenue} ريال` },
        { metric: 'المستخدمين النشطين', value: summary.activeUsers },
        { metric: 'المطاعم النشطة', value: summary.activeRestaurants }
      ]);
      
      // ورقة الطلبات
      const ordersSheet = workbook.addWorksheet('الطلبات');
      ordersSheet.columns = [
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'عدد الطلبات', key: 'count', width: 15 },
        { header: 'الإيرادات', key: 'revenue', width: 15 }
      ];
      ordersSheet.addRows(analytics.orders.daily);
      
      // ورقة الإيرادات
      const revenueSheet = workbook.addWorksheet('الإيرادات');
      revenueSheet.columns = [
        { header: 'الشهر', key: 'month', width: 15 },
        { header: 'المبلغ', key: 'amount', width: 15 },
        { header: 'النمو %', key: 'growth', width: 15 }
      ];
      revenueSheet.addRows(analytics.revenue.monthly);
      
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      throw new Error('فشل في تصدير التحليلات إلى Excel');
    }
  }

  /**
   * تصدير التحليلات إلى CSV
   */
  async exportAnalyticsToCSV({ period, type, userId }) {
    try {
      const analytics = await this.getComprehensiveAnalytics({ period, userId });
      
      let csvContent = 'تقرير تحليلات BreakApp\n';
      csvContent += `الفترة,${this.translatePeriod(period)}\n`;
      csvContent += `تاريخ التقرير,${moment().format('YYYY-MM-DD')}\n\n`;
      
      // ملخص الإحصائيات
      csvContent += 'ملخص الإحصائيات\n';
      csvContent += 'المؤشر,القيمة\n';
      const summary = analytics.summary;
      csvContent += `إجمالي الطلبات,${summary.totalOrders}\n`;
      csvContent += `إجمالي الإيرادات,${summary.totalRevenue} ريال\n`;
      csvContent += `المستخدمين النشطين,${summary.activeUsers}\n`;
      csvContent += `المطاعم النشطة,${summary.activeRestaurants}\n\n`;
      
      // الطلبات اليومية
      csvContent += 'الطلبات اليومية\n';
      csvContent += 'التاريخ,عدد الطلبات,الإيرادات\n';
      analytics.orders.daily.forEach(order => {
        csvContent += `${order.date},${order.count},${order.revenue}\n`;
      });
      
      return csvContent;
    } catch (error) {
      console.error('خطأ في تصدير CSV:', error);
      throw new Error('فشل في تصدير التحليلات إلى CSV');
    }
  }

  // دوال مساعدة
  buildDateFilter(period, startDate, endDate) {
    const now = moment();
    let start, end;
    
    if (startDate && endDate) {
      start = moment(startDate);
      end = moment(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = now.clone().subtract(30, 'days');
          end = now;
          break;
        case 'weekly':
          start = now.clone().subtract(12, 'weeks');
          end = now;
          break;
        case 'monthly':
          start = now.clone().subtract(12, 'months');
          end = now;
          break;
        default:
          start = now.clone().subtract(30, 'days');
          end = now;
      }
    }
    
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD')
    };
  }

  formatDailyData(data) {
    return data.map(item => ({
      ...item,
      date: moment(item.date).format('YYYY-MM-DD')
    }));
  }

  formatMonthlyData(data) {
    return data.map(item => ({
      ...item,
      month: moment(item.month).format('YYYY-MM')
    }));
  }

  translateCategories(categories) {
    const translations = {
      'fast_food': 'وجبات سريعة',
      'restaurant': 'مطاعم',
      'cafe': 'مقاهي',
      'dessert': 'حلويات',
      'healthy': 'طعام صحي'
    };
    
    return categories.map(cat => ({
      ...cat,
      category: translations[cat.category] || cat.category
    }));
  }

  translateOrderStatus(statuses) {
    const translations = {
      'pending': 'في الانتظار',
      'confirmed': 'مؤكد',
      'preparing': 'قيد التحضير',
      'ready': 'جاهز',
      'delivered': 'تم التوصيل',
      'cancelled': 'ملغي'
    };
    
    return statuses.map(status => ({
      ...status,
      status: translations[status.status] || status.status
    }));
  }

  translatePaymentMethods(methods) {
    const translations = {
      'credit_card': 'بطاقة ائتمان',
      'debit_card': 'بطاقة خصم',
      'cash': 'نقداً',
      'digital_wallet': 'محفظة رقمية'
    };
    
    return methods.map(method => ({
      ...method,
      method: translations[method.method] || method.method
    }));
  }

  translatePeriod(period) {
    const translations = {
      'daily': 'يومي',
      'weekly': 'أسبوعي',
      'monthly': 'شهري'
    };
    
    return translations[period] || period;
  }

  async generateSummary(analytics) {
    const totalOrders = analytics.orderAnalytics.daily.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = analytics.revenueAnalytics.daily.reduce((sum, item) => sum + item.amount, 0);
    const activeUsers = analytics.userAnalytics.activity.reduce((sum, item) => sum + item.activeUsers, 0);
    const activeRestaurants = analytics.restaurantAnalytics.performance.length;
    
    return {
      totalOrders,
      totalRevenue,
      activeUsers,
      activeRestaurants
    };
  }
}

module.exports = new AnalyticsService();