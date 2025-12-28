/**
 * Tests for Workflow Routes
 */

jest.mock('../../controllers/workflowController');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const workflowController = require('../../controllers/workflowController');
const { authenticate, authorize } = require('../../middleware/auth');

describe('Workflow Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user123', role: 'USER' };
      next();
    });

    authorize.mockImplementation(() => (req, res, next) => next());

    // Mock all controller functions
    Object.keys(workflowController).forEach((key) => {
      if (typeof workflowController[key] === 'function') {
        workflowController[key].mockImplementation((req, res) => {
          res.status(200).json({ success: true, data: {} });
        });
      }
    });

    // Load routes
    const workflowRoutes = require('../../routes/workflow');
    app.use('/api/workflow', workflowRoutes);
  });

  describe('POST /api/workflow/validate-qr', () => {
    it('should validate project QR code', async () => {
      const response = await request(app)
        .post('/api/workflow/validate-qr')
        .send({ qrCode: 'valid_qr_token' });

      expect(response.status).toBe(200);
      expect(workflowController.validateProjectQR).toHaveBeenCalled();
    });
  });

  describe('POST /api/workflow/orders', () => {
    it('should submit new order', async () => {
      const orderData = {
        projectId: 'project123',
        restaurantId: 'restaurant123',
        menuItems: [{ menuItemId: 'item1', quantity: 2 }]
      };

      const response = await request(app)
        .post('/api/workflow/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      expect(workflowController.submitOrder).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/workflow/orders/:orderId/confirm', () => {
    it('should confirm order', async () => {
      const response = await request(app)
        .patch('/api/workflow/orders/order123/confirm')
        .send({ confirmed: true });

      expect(response.status).toBe(200);
      expect(workflowController.confirmOrder).toHaveBeenCalled();
    });
  });

  describe('GET /api/workflow/orders', () => {
    it('should get user orders', async () => {
      const response = await request(app).get('/api/workflow/orders');

      expect(response.status).toBe(200);
      expect(workflowController.getUserOrders).toHaveBeenCalled();
    });

    it('should filter by project and status', async () => {
      const response = await request(app).get(
        '/api/workflow/orders?projectId=project123&status=PENDING'
      );

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/workflow/projects/:projectId/aggregated-orders', () => {
    it('should get aggregated orders for project', async () => {
      const response = await request(app).get(
        '/api/workflow/projects/project123/aggregated-orders'
      );

      expect(response.status).toBe(200);
      expect(workflowController.getAggregatedOrders).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/workflow/orders/:orderId/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .patch('/api/workflow/orders/order123/status')
        .send({ status: 'PREPARING' });

      expect(response.status).toBe(200);
      expect(workflowController.updateOrderStatus).toHaveBeenCalled();
    });
  });

  describe('POST /api/workflow/send-reminders', () => {
    it('should send order reminders', async () => {
      const response = await request(app)
        .post('/api/workflow/send-reminders')
        .send({ projectId: 'project123' });

      expect(response.status).toBe(200);
      expect(workflowController.sendOrderReminders).toHaveBeenCalled();
    });
  });

  describe('GET /api/workflow/orders/:orderId/tracking', () => {
    it('should get order tracking', async () => {
      const response = await request(app).get(
        '/api/workflow/orders/order123/tracking'
      );

      expect(response.status).toBe(200);
      expect(workflowController.getOrderTracking).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/workflow/orders/:orderId/location', () => {
    it('should update delivery location', async () => {
      const response = await request(app)
        .patch('/api/workflow/orders/order123/location')
        .send({ latitude: 30.0444, longitude: 31.2357 });

      expect(response.status).toBe(200);
      expect(workflowController.updateDeliveryLocation).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/workflow/orders/:orderId/deliver', () => {
    it('should mark order as delivered', async () => {
      const response = await request(app).patch(
        '/api/workflow/orders/order123/deliver'
      );

      expect(response.status).toBe(200);
      expect(workflowController.deliverOrder).toHaveBeenCalled();
    });
  });
});
