const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const qrCodeService = require('../services/qrCodeService');
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../middleware/validation');

// إنشاء طلب جديد
router.post('/', authenticateToken, validateOrder, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.id
    };

    const order = await orderService.createOrder(orderData);
    
    // إنشاء QR Code للطلب
    const qrCode = await qrCodeService.generateOrderQR(order);
    
    // إرسال إشعار تأكيد
    await notificationService.sendOrderConfirmation(order);

    res.status(201).json({
      success: true,
      data: {
        order,
        qrCode: qrCode.qrCode,
        trackingToken: qrCode.token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_FAILED',
        message: error.message
      }
    });
  }
});

// الحصول على جميع الطلبات
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Security: فقط ADMIN يمكنه تحديد userId آخر
    // Why: منع المستخدمين من رؤية طلبات الآخرين عبر query params
    let userId = req.user.id;
    if (req.query.userId && (req.user.role === 'ADMIN' || req.user.role === 'PRODUCER')) {
      userId = req.query.userId;
    }
    
    const filters = {
      userId,
      projectId: req.query.projectId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await orderService.getOrders(filters);

    res.json({
      success: true,
      data: result.orders,
      meta: {
        pagination: result.pagination
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// الحصول على طلب محدد
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    // التحقق من صلاحية المستخدم لرؤية الطلب
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'غير مصرح لك بعرض هذا الطلب'
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: error.message
      }
    });
  }
});

// تحديث حالة الطلب
router.patch('/:id/status', authenticateToken, validateOrderStatus, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id);
    
    // إرسال إشعار تحديث الحالة
    await notificationService.sendOrderStatusUpdate(order, status);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: error.message
      }
    });
  }
});

// إلغاء الطلب
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, req.user.id, reason);

    res.json({
      success: true,
      data: order,
      message: 'تم إلغاء الطلب بنجاح'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ORDER_CANCELLATION_FAILED',
        message: error.message
      }
    });
  }
});

// تتبع الطلب بـ QR Code
router.post('/track/qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    const decodedData = await qrCodeService.decodeQRData(qrData);
    
    if (decodedData.type !== 'ORDER_TRACKING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QR_TYPE',
          message: 'QR Code غير صحيح لتتبع الطلبات'
        }
      });
    }

    const order = await orderService.getOrderById(decodedData.orderId);

    res.json({
      success: true,
      data: {
        order,
        trackingInfo: decodedData
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QR_TRACKING_FAILED',
        message: error.message
      }
    });
  }
});

// إحصائيات الطلبات
router.get('/stats/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const stats = await orderService.getOrderStats(projectId, dateRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// إرسال تذكير الطلبات
router.post('/reminder/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const notifications = await notificationService.sendOrderReminder(projectId);

    res.json({
      success: true,
      data: {
        sentNotifications: notifications.length,
        notifications
      },
      message: `تم إرسال ${notifications.length} تذكير`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REMINDER_SEND_FAILED',
        message: error.message
      }
    });
  }
});

module.exports = router;