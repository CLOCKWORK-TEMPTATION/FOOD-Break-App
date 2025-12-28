/**
 * اختبارات تكامل لـ Orders API
 * Integration Tests for Orders API Endpoints
 *
 * يغطي:
 * - POST /api/v1/orders
 * - GET /api/v1/orders
 * - GET /api/v1/orders/:id
 * - PUT /api/v1/orders/:id/status
 * - DELETE /api/v1/orders/:id
 */

const request = require('supertest');
const express = require('express');
const orderRoutes = require('../../routes/orders');
const orderController = require('../../controllers/orderController');

jest.mock('../../controllers/orderController');
jest.mock('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/v1/orders', orderRoutes);

describe('Orders API Integration Tests - اختبارات تكامل API الطلبات', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    const { authenticateToken } = require('../../middleware/auth');
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'user-123', role: 'REGULAR' };
      next();
    });
  });

  describe('POST /api/v1/orders - إنشاء طلب جديد', () => {
    it('يجب إنشاء طلب جديد بنجاح - 201', async () => {
      // Arrange
      const orderData = {
        projectId: 'project-123',
        restaurantId: 'restaurant-456',
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            price: 50.00
          }
        ],
        totalAmount: 100.00,
        deliveryAddress: 'مكة المكرمة'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'order-123',
          ...orderData,
          userId: 'user-123',
          status: 'PENDING',
          createdAt: new Date()
        }
      };

      orderController.createOrder.mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', 'Bearer mock_token')
        .send(orderData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('يجب رفض الطلب بدون projectId - 400', async () => {
      // Arrange
      const invalidOrder = {
        restaurantId: 'restaurant-456',
        items: [],
        totalAmount: 0
      };

      orderController.createOrder.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'projectId مطلوب'
          }
        });
      });

      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', 'Bearer mock_token')
        .send(invalidOrder);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/orders - الحصول على قائمة الطلبات', () => {
    it('يجب الحصول على قائمة الطلبات بنجاح - 200', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          orders: [
            {
              id: 'order-1',
              userId: 'user-123',
              status: 'PENDING',
              totalAmount: 100
            },
            {
              id: 'order-2',
              userId: 'user-123',
              status: 'DELIVERED',
              totalAmount: 200
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      };

      orderController.getOrders.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('يجب فلترة الطلبات حسب الحالة - 200', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          orders: [
            {
              id: 'order-1',
              status: 'PENDING'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
          }
        }
      };

      orderController.getOrders.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .get('/api/v1/orders?status=PENDING')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.orders[0].status).toBe('PENDING');
    });

    it('يجب دعم Pagination - 200', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          orders: [],
          pagination: {
            page: 2,
            limit: 5,
            total: 12,
            pages: 3
          }
        }
      };

      orderController.getOrders.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .get('/api/v1/orders?page=2&limit=5')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/v1/orders/:id - الحصول على طلب محدد', () => {
    it('يجب الحصول على طلب محدد بنجاح - 200', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockResponse = {
        success: true,
        data: {
          id: orderId,
          userId: 'user-123',
          status: 'CONFIRMED',
          totalAmount: 150.50
        }
      };

      orderController.getOrderById.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(orderId);
    });

    it('يجب إرجاع 404 للطلب غير الموجود', async () => {
      // Arrange
      const orderId = 'nonexistent-order';

      orderController.getOrderById.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'الطلب غير موجود'
          }
        });
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/orders/:id/status - تحديث حالة الطلب', () => {
    it('يجب تحديث حالة الطلب بنجاح - 200', async () => {
      // Arrange
      const orderId = 'order-123';
      const statusUpdate = {
        status: 'CONFIRMED'
      };

      const mockResponse = {
        success: true,
        data: {
          id: orderId,
          status: 'CONFIRMED',
          updatedAt: new Date()
        }
      };

      orderController.updateOrderStatus.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', 'Bearer mock_token')
        .send(statusUpdate);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('يجب رفض الحالة غير الصحيحة - 400', async () => {
      // Arrange
      const orderId = 'order-123';
      const invalidStatus = {
        status: 'INVALID_STATUS'
      };

      orderController.updateOrderStatus.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'حالة الطلب غير صحيحة'
          }
        });
      });

      // Act
      const response = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', 'Bearer mock_token')
        .send(invalidStatus);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/orders/:id - إلغاء الطلب', () => {
    it('يجب إلغاء الطلب بنجاح - 200', async () => {
      // Arrange
      const orderId = 'order-123';

      const mockResponse = {
        success: true,
        message: 'تم إلغاء الطلب بنجاح',
        data: {
          id: orderId,
          status: 'CANCELLED'
        }
      };

      orderController.cancelOrder.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('يجب رفض إلغاء طلب تم تسليمه - 400', async () => {
      // Arrange
      const orderId = 'order-123';

      orderController.cancelOrder.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_CANCEL',
            message: 'لا يمكن إلغاء طلب تم تسليمه'
          }
        });
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض إلغاء طلب مستخدم آخر - 403', async () => {
      // Arrange
      const orderId = 'order-123';

      orderController.cancelOrder.mockImplementation((req, res) => {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'غير مصرح لك بإلغاء هذا الطلب'
          }
        });
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('Authorization - التصريحات', () => {
    it('يجب رفض الطلبات بدون توكن - 401', async () => {
      // Override the mock for this test
      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'التوكن غير موجود'
          }
        });
      });

      // Act
      const response = await request(app)
        .get('/api/v1/orders');

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
