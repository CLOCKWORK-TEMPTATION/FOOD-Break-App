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
          error: req.__('orders.itemsRequired')
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
        message: req.__('orders.orderCreated')
      });
    } catch (error) {
      console.error('❌ خطأ في إنشاء الطلب:', error);
      res.status(500).json({
        success: false,
        error: req.__('orders.orderCreationFailed'),
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
        error: req.__('orders.ordersFetchFailed'),
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
          error: req.__('orders.orderAccessDenied')
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
        error: req.__('orders.orderNotFound'),
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
          error: req.__('orders.orderStatusUpdateDenied')
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          error: req.__('orders.orderStatusRequired')
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
        message: req.__('orders.orderStatusUpdated', { status })
      });
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      res.status(500).json({
        success: false,
        error: req.__('orders.orderStatusUpdateFailed'),
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
        message: req.__('orders.orderCancelled')
      });
    } catch (error) {
      console.error('❌ خطأ في إلغاء الطلب:', error);
      res.status(500).json({
        success: false,
        error: req.__('orders.orderCancellationFailed'),
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
          error: req.__('orders.aggregationAccessDenied')
        });
      }

      const aggregation = await orderService.aggregateTeamOrders(projectId, {
        date,
        status
      });

      res.json({
        success: true,
        data: aggregation,
        message: req.__('orders.aggregationSuccess')
      });
    } catch (error) {
      console.error('❌ خطأ في تجميع الطلبات:', error);
      res.status(500).json({
        success: false,
        error: req.__('orders.aggregationFailed'),
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
          error: req.__('orders.summaryAccessDenied')
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
        error: req.__('orders.summaryFetchFailed'),
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
          error: req.__('orders.exportAccessDenied')
        });
      }

      const report = await orderService.exportAggregationReport(projectId, {
        date,
        status
      });

      res.json({
        success: true,
        data: report,
        message: req.__('orders.exportSuccess')
      });
    } catch (error) {
      console.error('❌ خطأ في تصدير التقرير:', error);
      res.status(500).json({
        success: false,
        error: req.__('orders.exportFailed'),
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
          error: req.__('orders.statsAccessDenied')
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
        error: req.__('orders.statsFetchFailed'),
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
          error: req.__('orders.usersInfoAccessDenied')
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
        error: req.__('orders.usersFetchFailed'),
        message: error.message
      });
    }
  }
};

module.exports = orderController;
