const orderService = require('../services/orderService');

/**
 * Order Controller
 * إدارة endpoints الطلبات
 */
const orderController = {
  /**
   * POST /api/orders
   * إنشاء طلب جديد
   */
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id; // من middleware المصادقة
      const { projectId, restaurantId, items, deliveryAddress, deliveryLat, deliveryLng, orderType } = req.body;

      // التحقق من البيانات المطلوبة
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'يجب إضافة عنصر واحد على الأقل للطلب'
        });
      }

      const orderData = {
        userId,
        projectId,
        restaurantId,
        items,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        orderType
      };

      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'تم إنشاء الطلب بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في إنشاء الطلب:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إنشاء الطلب',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders
   * الحصول على قائمة الطلبات
   */
  getOrders: async (req, res) => {
    try {
      const { projectId, status, page, limit } = req.query;
      const userId = req.user.role === 'REGULAR' ? req.user.id : undefined;

      const filters = {
        userId,
        projectId,
        status,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      };

      const result = await orderService.getOrders(filters);

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الطلبات:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب الطلبات',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/:id
   * الحصول على تفاصيل طلب محدد
   */
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      // التحقق من الصلاحية
      if (req.user.role === 'REGULAR' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بالوصول إلى هذا الطلب'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الطلب:', error);
      res.status(404).json({
        success: false,
        error: 'الطلب غير موجود',
        message: error.message
      });
    }
  },

  /**
   * PUT /api/orders/:id/status
   * تحديث حالة الطلب (Task 21)
   */
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, additionalData } = req.body;
      const updatedBy = req.user.id;

      // التحقق من الصلاحية (فقط ADMIN و PRODUCER)
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بتحديث حالة الطلب'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'حالة الطلب مطلوبة'
        });
      }

      const order = await orderService.updateOrderStatus(
        id,
        status,
        updatedBy,
        additionalData
      );

      res.json({
        success: true,
        data: order,
        message: `تم تحديث حالة الطلب إلى ${status}`
      });
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث حالة الطلب',
        message: error.message
      });
    }
  },

  /**
   * DELETE /api/orders/:id
   * إلغاء طلب
   */
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const order = await orderService.cancelOrder(id, userId, reason);

      res.json({
        success: true,
        data: order,
        message: 'تم إلغاء الطلب بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في إلغاء الطلب:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إلغاء الطلب',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/project/:projectId/aggregate
   * تجميع طلبات الفريق (Task 18)
   */
  aggregateTeamOrders: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { date, status } = req.query;

      // التحقق من الصلاحية (فقط ADMIN و PRODUCER)
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بالوصول إلى تجميع الطلبات'
        });
      }

      const aggregation = await orderService.aggregateTeamOrders(projectId, {
        date,
        status
      });

      res.json({
        success: true,
        data: aggregation,
        message: 'تم تجميع الطلبات بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في تجميع الطلبات:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تجميع الطلبات',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/project/:projectId/today
   * ملخص طلبات اليوم
   */
  getTodayOrdersSummary: async (req, res) => {
    try {
      const { projectId } = req.params;

      // التحقق من الصلاحية
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بالوصول إلى ملخص الطلبات'
        });
      }

      const summary = await orderService.getTodayOrdersSummary(projectId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('❌ خطأ في جلب ملخص اليوم:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب ملخص اليوم',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/project/:projectId/export
   * تصدير تقرير تجميع الطلبات
   */
  exportAggregationReport: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { date, status } = req.query;

      // التحقق من الصلاحية
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بتصدير التقارير'
        });
      }

      const report = await orderService.exportAggregationReport(projectId, {
        date,
        status
      });

      res.json({
        success: true,
        data: report,
        message: 'تم تصدير التقرير بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في تصدير التقرير:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تصدير التقرير',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/stats
   * إحصائيات الطلبات
   */
  getOrderStats: async (req, res) => {
    try {
      const { projectId, startDate, endDate } = req.query;

      // التحقق من الصلاحية
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بالوصول إلى الإحصائيات'
        });
      }

      const dateRange = startDate && endDate ? {
        start: startDate,
        end: endDate
      } : null;

      const stats = await orderService.getOrderStats(projectId, dateRange);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب الإحصائيات',
        message: error.message
      });
    }
  },

  /**
   * GET /api/orders/project/:projectId/users-without-orders
   * المستخدمون الذين لم يطلبوا اليوم
   */
  getUsersWithoutOrdersToday: async (req, res) => {
    try {
      const { projectId } = req.params;

      // التحقق من الصلاحية
      if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح لك بالوصول إلى هذه المعلومات'
        });
      }

      const users = await orderService.getUsersWithoutOrdersToday(projectId);

      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب المستخدمين',
        message: error.message
      });
    }
  }
};

module.exports = orderController;
