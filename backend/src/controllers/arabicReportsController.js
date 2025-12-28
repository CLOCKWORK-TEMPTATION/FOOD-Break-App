/**
 * تحكم التقارير العربية
 * Arabic Reports Controller
 */

const arabicPdfService = require('../services/arabicPdfService');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

class ArabicReportsController {
  /**
   * إنشاء تقرير الطلبات اليومية
   */
  async generateDailyOrdersReport(req, res) {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date) : new Date();
      
      // تحديد بداية ونهاية اليوم
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      // جلب الطلبات
      const orders = await Order.find({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).populate('restaurant', 'name nameAr')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });

      // تحويل البيانات للتقرير
      const reportData = orders.map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'غير محدد',
        restaurant: {
          name: order.restaurant?.nameAr || order.restaurant?.name || 'غير محدد'
        },
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }));

      // إنشاء PDF
      const doc = await arabicPdfService.generateOrdersReport(reportData, {
        companyInfo: {
          nameAr: 'بريك آب',
          address: 'العنوان الرئيسي للشركة',
          phone: '+20 123 456 7890',
          email: 'info@breakapp.com'
        }
      });

      // إعداد الاستجابة
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="daily-orders-${reportDate.toISOString().split('T')[0]}.pdf"`);
      
      doc.pipe(res);
      doc.end();

    } catch (error) {
      console.error('خطأ في إنشاء تقرير الطلبات اليومية:', error);
      res.status(500).json({
        success: false,
        message: req.t('general.serverError'),
        error: error.message
      });
    }
  }

  /**
   * إنشاء تقرير الطلبات الشهرية
   */
  async generateMonthlyOrdersReport(req, res) {
    try {
      const { year, month } = req.query;
      const reportYear = parseInt(year) || new Date().getFullYear();
      const reportMonth = parseInt(month) || new Date().getMonth() + 1;

      // تحديد بداية ونهاية الشهر
      const startOfMonth = new Date(reportYear, reportMonth - 1, 1);
      const endOfMonth = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

      // جلب الطلبات
      const orders = await Order.find({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }).populate('restaurant', 'name nameAr')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });

      // تحويل البيانات للتقرير
      const reportData = orders.map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'غير محدد',
        restaurant: {
          name: order.restaurant?.nameAr || order.restaurant?.name || 'غير محدد'
        },
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }));

      // إنشاء PDF
      const doc = await arabicPdfService.generateOrdersReport(reportData, {
        companyInfo: {
          nameAr: 'بريك آب',
          address: 'العنوان الرئيسي للشركة',
          phone: '+20 123 456 7890',
          email: 'info@breakapp.com'
        }
      });

      // إعداد الاستجابة
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-orders-${reportYear}-${reportMonth.toString().padStart(2, '0')}.pdf"`);
      
      doc.pipe(res);
      doc.end();

    } catch (error) {
      console.error('خطأ في إنشاء تقرير الطلبات الشهرية:', error);
      res.status(500).json({
        success: false,
        message: req.t('general.serverError'),
        error: error.message
      });
    }
  }

  /**
   * إنشاء تقرير المطاعم
   */
  async generateRestaurantsReport(req, res) {
    try {
      // جلب المطاعم مع إحصائياتها
      const restaurants = await Restaurant.find({}).sort({ nameAr: 1 });
      
      const restaurantStats = await Promise.all(
        restaurants.map(async (restaurant) => {
          const totalOrders = await Order.countDocuments({ restaurant: restaurant._id });
          const totalRevenue = await Order.aggregate([
            { $match: { restaurant: restaurant._id, status: 'DELIVERED' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]);

          return {
            nameAr: restaurant.nameAr,
            name: restaurant.name,
            cuisineTypeAr: restaurant.cuisineTypeAr,
            isActive: restaurant.isActive ? 'نشط' : 'غير نشط',
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            rating: restaurant.rating || 0
          };
        })
      );

      // إنشاء PDF
      const doc = arabicPdfService.createDocument();
      
      // إضافة رأس الشركة
      arabicPdfService.addCompanyHeader(doc, {
        nameAr: 'بريك آب',
        address: 'العنوان الرئيسي للشركة',
        phone: '+20 123 456 7890',
        email: 'info@breakapp.com'
      });
      
      // إضافة عنوان التقرير
      arabicPdfService.addArabicTitle(doc, 'تقرير المطاعم');
      
      // إضافة معلومات التقرير
      const reportDate = new Date().toLocaleDateString('ar-EG');
      arabicPdfService.addArabicText(doc, `تاريخ التقرير: ${reportDate}`, doc.page.margins.left, doc.y);
      arabicPdfService.addArabicText(doc, `عدد المطاعم: ${restaurants.length}`, doc.page.margins.left, doc.y + 5);
      
      doc.moveDown(1);

      // إضافة جدول المطاعم
      const headers = ['اسم المطعم', 'نوع المطبخ', 'الحالة', 'عدد الطلبات', 'الإيرادات', 'التقييم'];
      const rows = restaurantStats.map(restaurant => [
        restaurant.nameAr,
        restaurant.cuisineTypeAr,
        restaurant.isActive,
        restaurant.totalOrders.toString(),
        `${restaurant.totalRevenue.toLocaleString('ar-EG')} ج.م`,
        restaurant.rating.toFixed(1)
      ]);

      arabicPdfService.addArabicTable(doc, headers, rows);

      // إضافة إحصائيات عامة
      const totalRevenue = restaurantStats.reduce((sum, r) => sum + r.totalRevenue, 0);
      const totalOrders = restaurantStats.reduce((sum, r) => sum + r.totalOrders, 0);
      const avgRating = restaurantStats.reduce((sum, r) => sum + r.rating, 0) / restaurants.length;

      doc.moveDown(1);
      arabicPdfService.addArabicText(doc, `إجمالي الإيرادات: ${totalRevenue.toLocaleString('ar-EG')} ج.م`, doc.page.margins.left, doc.y);
      arabicPdfService.addArabicText(doc, `إجمالي الطلبات: ${totalOrders.toLocaleString('ar-EG')}`, doc.page.margins.left, doc.y + 5);
      arabicPdfService.addArabicText(doc, `متوسط التقييم: ${avgRating.toFixed(2)}`, doc.page.margins.left, doc.y + 5);

      // إضافة التذييل
      arabicPdfService.addPageFooter(doc);

      // إعداد الاستجابة
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="restaurants-report.pdf"');
      
      doc.pipe(res);
      doc.end();

    } catch (error) {
      console.error('خطأ في إنشاء تقرير المطاعم:', error);
      res.status(500).json({
        success: false,
        message: req.t('general.serverError'),
        error: error.message
      });
    }
  }

  /**
   * إنشاء فاتورة للطلب
   */
  async generateInvoice(req, res) {
    try {
      const { orderId } = req.params;

      // جلب الطلب
      const order = await Order.findById(orderId)
        .populate('restaurant', 'name nameAr')
        .populate('customer', 'name email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: req.t('orders.orderNotFound')
        });
      }

      // التحقق من صلاحية الوصول
      if (req.user.role !== 'ADMIN' && req.user.role !== 'PRODUCER' && 
          order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: req.t('payments.orderAccessDenied')
        });
      }

      // تحويل البيانات للفاتورة
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'غير محدد',
        customerEmail: order.customer?.email || 'غير محدد',
        deliveryAddress: order.deliveryAddress,
        items: order.items.map(item => ({
          name: item.nameAr || item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.totalAmount,
        notes: order.notes,
        createdAt: order.createdAt
      };

      // إنشاء PDF
      const doc = await arabicPdfService.generateInvoice(invoiceData, {
        companyInfo: {
          nameAr: 'بريك آب',
          address: 'العنوان الرئيسي للشركة',
          phone: '+20 123 456 7890',
          email: 'info@breakapp.com'
        }
      });

      // إعداد الاستجابة
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
      
      doc.pipe(res);
      doc.end();

    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error);
      res.status(500).json({
        success: false,
        message: req.t('general.serverError'),
        error: error.message
      });
    }
  }

  /**
   * إنشاء تقرير الإحصائيات العامة
   */
  async generateStatsReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // تحديد الفترة الزمنية
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // جلب الإحصائيات
      const totalOrders = await Order.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });

      const ordersByStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const revenueStats = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'DELIVERED' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' } } }
      ]);

      const topRestaurants = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$restaurant', orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
        { $unwind: '$restaurant' },
        { $sort: { orderCount: -1 } },
        { $limit: 10 }
      ]);

      // إنشاء PDF
      const doc = arabicPdfService.createDocument();
      
      // إضافة رأس الشركة
      arabicPdfService.addCompanyHeader(doc, {
        nameAr: 'بريك آب',
        address: 'العنوان الرئيسي للشركة',
        phone: '+20 123 456 7890',
        email: 'info@breakapp.com'
      });
      
      // إضافة عنوان التقرير
      arabicPdfService.addArabicTitle(doc, 'تقرير الإحصائيات العامة');
      
      // إضافة معلومات الفترة
      arabicPdfService.addArabicText(doc, `من: ${start.toLocaleDateString('ar-EG')}`, doc.page.margins.left, doc.y);
      arabicPdfService.addArabicText(doc, `إلى: ${end.toLocaleDateString('ar-EG')}`, doc.page.margins.left, doc.y + 5);
      
      doc.moveDown(1);

      // إحصائيات عامة
      arabicPdfService.addArabicText(doc, 'الإحصائيات العامة:', doc.page.margins.left, doc.y, { fontSize: 14, font: 'ArabicBold' });
      arabicPdfService.addArabicText(doc, `إجمالي الطلبات: ${totalOrders.toLocaleString('ar-EG')}`, doc.page.margins.left, doc.y + 5);
      
      const totalRevenue = revenueStats[0]?.total || 0;
      const avgOrderValue = revenueStats[0]?.avg || 0;
      arabicPdfService.addArabicText(doc, `إجمالي الإيرادات: ${totalRevenue.toLocaleString('ar-EG')} ج.م`, doc.page.margins.left, doc.y + 5);
      arabicPdfService.addArabicText(doc, `متوسط قيمة الطلب: ${avgOrderValue.toFixed(2)} ج.م`, doc.page.margins.left, doc.y + 5);

      doc.moveDown(1);

      // الطلبات حسب الحالة
      if (ordersByStatus.length > 0) {
        arabicPdfService.addArabicText(doc, 'الطلبات حسب الحالة:', doc.page.margins.left, doc.y, { fontSize: 14, font: 'ArabicBold' });
        
        const statusHeaders = ['الحالة', 'العدد'];
        const statusRows = ordersByStatus.map(item => [
          arabicPdfService.translateOrderStatus(item._id),
          item.count.toString()
        ]);

        arabicPdfService.addArabicTable(doc, statusHeaders, statusRows);
      }

      // أفضل المطاعم
      if (topRestaurants.length > 0) {
        doc.moveDown(1);
        arabicPdfService.addArabicText(doc, 'أفضل المطاعم:', doc.page.margins.left, doc.y, { fontSize: 14, font: 'ArabicBold' });
        
        const restaurantHeaders = ['المطعم', 'عدد الطلبات', 'الإيرادات'];
        const restaurantRows = topRestaurants.map(item => [
          item.restaurant.nameAr || item.restaurant.name,
          item.orderCount.toString(),
          `${item.revenue.toLocaleString('ar-EG')} ج.م`
        ]);

        arabicPdfService.addArabicTable(doc, restaurantHeaders, restaurantRows);
      }

      // إضافة التذييل
      arabicPdfService.addPageFooter(doc);

      // إعداد الاستجابة
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="stats-report.pdf"');
      
      doc.pipe(res);
      doc.end();

    } catch (error) {
      console.error('خطأ في إنشاء تقرير الإحصائيات:', error);
      res.status(500).json({
        success: false,
        message: req.t('general.serverError'),
        error: error.message
      });
    }
  }
}

module.exports = new ArabicReportsController();