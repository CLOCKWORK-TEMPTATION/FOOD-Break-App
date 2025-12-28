/**
 * Integration Tests لمسارات الطلبات (Orders Routes)
 * اختبارات شاملة لـ API Endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../services/orderService');
jest.mock('../../services/qrCodeService');
jest.mock('../../services/notificationService');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/validation');

const orderService = require('../../services/orderService');
const qrCodeService = require('../../services/qrCodeService');
const notificationService = require('../../services/notificationService');
const { authenticateToken } = require('../../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../../middleware/validation');

// Import routes after mocking
const orderRoutes = require('../../routes/orders');

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());
app.use('/api/v1/orders', orderRoutes);

describe('Orders Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/orders - إنشاء طلب جديد', () => {
    const validOrderData = {
      projectId: 'project_123',
      restaurantId: 'restaurant_456',
      totalAmount: 150.5,
      deliveryAddress: 'القاهرة، شارع العمال',
      items: [
        {
          menuItemId: 'menu_1',
          quantity: 2,
          price: 50,
          specialInstructions: 'بدون بصلاً',
        },
        {
          menuItemId: 'menu_2',
          quantity: 1,
          price: 50.5,
        },
      ],
    };

    it('يجب أن ينشئ طلباً جديداً بنجاح', async () => {
      const mockOrder = {
        id: 'order_789',
        userId: 'user_123',
        ...validOrderData,
        status: 'PENDING',
        user: { id: 'user_123', firstName: 'محمد' },
        restaurant: { id: validOrderData.restaurantId, name: 'مطعم حسن' },
        project: { id: validOrderData.projectId, name: 'مشروع الأسبوع' },
      };

      const mockQRCode = {
        qrCode: 'data:image/png;base64,mock_qr_data',
        token: 'qr_token_123',
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      validateOrder.mockImplementation((req, res, next) => next());

      orderService.createOrder.mockResolvedValue(mockOrder);
      qrCodeService.generateOrderQR.mockResolvedValue(mockQRCode);
      notificationService.sendOrderConfirmation.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', 'Bearer valid_token')
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toHaveProperty('id', 'order_789');
      expect(response.body.data.qrCode).toBe(mockQRCode.qrCode);
      expect(orderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          totalAmount: validOrderData.totalAmount,
        })
      );
    });

    it('يجب أن يطلب المصادقة', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/v1/orders')
        .send(validOrderData);

      expect(response.status).toBe(401);
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });

    it('يجب أن يعالج أخطاء الخدمة', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      validateOrder.mockImplementation((req, res, next) => next());

      orderService.createOrder.mockRejectedValue(
        new Error('المطعم غير متاح')
      );

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', 'Bearer valid_token')
        .send(validOrderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders - جلب الطلبات', () => {
    const mockOrders = [
      {
        id: 'order_1',
        status: 'PENDING',
        totalAmount: 100,
        user: { id: 'user_123', firstName: 'محمد' },
      },
      {
        id: 'order_2',
        status: 'DELIVERED',
        totalAmount: 200,
        user: { id: 'user_123', firstName: 'محمد' },
      },
    ];

    it('يجب أن يرجع طلبات المستخدم الحالي', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrders.mockResolvedValue({
        orders: mockOrders,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
        })
      );
    });

    it('يجب أن يسمح للأدمن برؤية طلبات مستخدم آخر', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin_123', role: 'ADMIN' };
        next();
      });

      orderService.getOrders.mockResolvedValue({
        orders: mockOrders,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      });

      const response = await request(app)
        .get('/api/v1/orders?userId=user_456')
        .set('Authorization', 'Bearer admin_token');

      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_456',
        })
      );
    });

    it('يجب أن يطبق الفلاتر والترقيم', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrders.mockResolvedValue({
        orders: [mockOrders[0]],
        pagination: { page: 1, limit: 5, total: 1, pages: 1 },
      });

      const response = await request(app)
        .get('/api/v1/orders?status=PENDING&page=1&limit=5')
        .set('Authorization', 'Bearer valid_token');

      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          page: '1',
          limit: '5',
        })
      );
    });

    it('يجب أن يمنع المستخدم العادي من رؤية طلبات الآخرين', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrders.mockResolvedValue({
        orders: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });

      const response = await request(app)
        .get('/api/v1/orders?userId=user_456')
        .set('Authorization', 'Bearer user_token');

      // يجب أن يستخدم userId الخاص بالمستخدم الحالي
      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123', // 不是 user_456
        })
      );
    });
  });

  describe('GET /api/v1/orders/:id - جلب طلب محدد', () => {
    const mockOrder = {
      id: 'order_123',
      userId: 'user_123',
      status: 'PENDING',
      totalAmount: 150,
      user: { id: 'user_123', firstName: 'محمد' },
      restaurant: { id: 'rest_1', name: 'مطعم حسن' },
    };

    it('يجب أن يرجع طلب المستخدم', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrderById.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/v1/orders/order_123')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('order_123');
      expect(orderService.getOrderById).toHaveBeenCalledWith('order_123');
    });

    it('يجب أن يسمح للأدمن برؤية أي طلب', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'user_456' };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin_123', role: 'ADMIN' };
        next();
      });

      orderService.getOrderById.mockResolvedValue(otherUserOrder);

      const response = await request(app)
        .get('/api/v1/orders/order_123')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
    });

    it('يجب أن يرفض طلب مستخدم آخر', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'user_456' };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrderById.mockResolvedValue(otherUserOrder);

      const response = await request(app)
        .get('/api/v1/orders/order_123')
        .set('Authorization', 'Bearer user_token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('يجب أن يعالج الطلب غير الموجود', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.getOrderById.mockRejectedValue(
        new Error('الطلب غير موجود')
      );

      const response = await request(app)
        .get('/api/v1/orders/non_existent')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/orders/:id/status - تحديث حالة الطلب', () => {
    it('يجب أن يحدث حالة الطلب', async () => {
      const updatedOrder = {
        id: 'order_123',
        status: 'CONFIRMED',
        user: { id: 'user_123', firstName: 'محمد' },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'ADMIN' };
        next();
      });

      validateOrderStatus.mockImplementation((req, res, next) => next());

      orderService.updateOrderStatus.mockResolvedValue(updatedOrder);
      notificationService.sendOrderStatusUpdate.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch('/api/v1/orders/order_123/status')
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CONFIRMED');
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        'order_123',
        'CONFIRMED',
        'user_123'
      );
    });

    it('يجب أن يرفض الحالة غير الصحيحة', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'ADMIN' };
        next();
      });

      validateOrderStatus.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'حالة الطلب غير صحيحة' },
        });
      });

      const response = await request(app)
        .patch('/api/v1/orders/order_123/status')
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/orders/:id - إلغاء الطلب', () => {
    it('يجب أن يلغي طلب المستخدم', async () => {
      const cancelledOrder = {
        id: 'order_123',
        userId: 'user_123',
        status: 'CANCELLED',
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.cancelOrder.mockResolvedValue(cancelledOrder);

      const response = await request(app)
        .delete('/api/v1/orders/order_123')
        .set('Authorization', 'Bearer user_token')
        .send({ reason: 'رغبة المستخدم' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.message).toBe('تم إلغاء الطلب بنجاح');
      expect(orderService.cancelOrder).toHaveBeenCalledWith(
        'order_123',
        'user_123',
        'رغبة المستخدم'
      );
    });

    it('يجب أن يعالج فشل الإلغاء', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      orderService.cancelOrder.mockRejectedValue(
        new Error('لا يمكن إلغاء طلب تم تسليمه')
      );

      const response = await request(app)
        .delete('/api/v1/orders/order_123')
        .set('Authorization', 'Bearer user_token')
        .send({ reason: 'غير راضٍ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_CANCELLATION_FAILED');
    });
  });

  describe('POST /api/v1/orders/track/qr - تتبع بـ QR', () => {
    it('يجب أن يتتبع الطلب عبر QR Code', async () => {
      const mockOrder = {
        id: 'order_123',
        status: 'DELIVERING',
      };

      const decodedQRData = {
        type: 'ORDER_TRACKING',
        orderId: 'order_123',
        token: 'qr_token',
      };

      qrCodeService.decodeQRData.mockResolvedValue(decodedQRData);
      orderService.getOrderById.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/v1/orders/track/qr')
        .send({ qrData: 'mock_qr_string' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.trackingInfo).toEqual(decodedQRData);
    });

    it('يجب أن يرفض QR Code غير صحيح', async () => {
      const decodedQRData = {
        type: 'MENU_VIEW', // ليس ORDER_TRACKING
      };

      qrCodeService.decodeQRData.mockResolvedValue(decodedQRData);

      const response = await request(app)
        .post('/api/v1/orders/track/qr')
        .send({ qrData: 'invalid_qr_string' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_QR_TYPE');
    });

    it('لا يحتاج هذا المسار لمصادقة', async () => {
      // المسار يعمل بدون توكن
      const decodedQRData = {
        type: 'ORDER_TRACKING',
        orderId: 'order_123',
      };

      qrCodeService.decodeQRData.mockResolvedValue(decodedQRData);
      orderService.getOrderById.mockResolvedValue({ id: 'order_123' });

      const response = await request(app)
        .post('/api/v1/orders/track/qr')
        .send({ qrData: 'valid_qr' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/orders/stats/:projectId - إحصائيات', () => {
    it('يجب أن يرجع إحصائيات الطلبات', async () => {
      const mockStats = [
        { status: 'PENDING', _count: { id: 10 }, _sum: { totalAmount: 500 } },
        { status: 'DELIVERED', _count: { id: 25 }, _sum: { totalAmount: 2500 } },
      ];

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'ADMIN' };
        next();
      });

      orderService.getOrderStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/orders/stats/project_123')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStats);
      expect(orderService.getOrderStats).toHaveBeenCalledWith(
        'project_123',
        null
      );
    });

    it('يجب أن يطبق فلاتر التاريخ', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'ADMIN' };
        next();
      });

      orderService.getOrderStats.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/orders/stats/project_123?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer admin_token');

      expect(orderService.getOrderStats).toHaveBeenCalledWith(
        'project_123',
        { start: '2024-01-01', end: '2024-12-31' }
      );
    });
  });
});
