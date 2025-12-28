const request = require('supertest');
const express = require('express');
const ordersRouter = require('../../routes/orders');
const orderService = require('../../services/orderService');
const qrCodeService = require('../../services/qrCodeService');
const notificationService = require('../../services/notificationService');

// Mock dependencies
jest.mock('../../services/orderService');
jest.mock('../../services/qrCodeService');
jest.mock('../../services/notificationService');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'user-1', role: 'REGULAR' };
    next();
  }
}));

// Mock validation middleware
jest.mock('../../middleware/validation', () => ({
  validateOrder: (req, res, next) => next(),
  validateOrderStatus: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

describe('Order Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    const orderData = {
      projectId: 'project-1',
      restaurantId: 'rest-1',
      items: [{ menuItemId: 'item-1', quantity: 1 }]
    };

    it('should create an order', async () => {
      orderService.createOrder.mockResolvedValue({
        id: 'order-1',
        ...orderData,
        status: 'PENDING',
        userId: 'user-1'
      });

      qrCodeService.generateOrderQR.mockResolvedValue({
        qrCode: 'mock-qr',
        token: 'mock-token'
      });

      notificationService.sendOrderConfirmation.mockResolvedValue();

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.data.order).toHaveProperty('id', 'order-1');
      expect(response.body.data.order.status).toBe('PENDING');
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/orders', () => {
    it('should get orders', async () => {
      orderService.getOrders.mockResolvedValue({
        orders: [{ id: 'order-1' }],
        pagination: { total: 1 }
      });

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.success).toBe(true);
    });
  });
});
