/**
 * Workflow Controller Tests
 * اختبارات وحدة سير العمل
 */

const workflowController = require('../../../src/controllers/workflowController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('../../../src/services/orderService');
jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/services/gpsTrackingService');
jest.mock('../../../src/services/qrCodeService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const orderService = require('../../../src/services/orderService');
const notificationService = require('../../../src/services/notificationService');
const gpsTrackingService = require('../../../src/services/gpsTrackingService');
const qrCodeService = require('../../../src/services/qrCodeService');
const { validationResult } = require('express-validator');

describe('Workflow Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123', role: 'ADMIN' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();

    // Setup default mocks
    global.mockPrisma.project = {
      findUnique: jest.fn(),
      update: jest.fn()
    };
    global.mockPrisma.projectMember = {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn()
    };
    global.mockPrisma.order = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    };
    global.mockPrisma.menuItem = {
      findUnique: jest.fn()
    };
  });

  describe('validateProjectQR', () => {
    it('should validate QR code successfully', async () => {
      const mockValidation = {
        valid: true,
        projectId: 'project-123',
        projectName: 'Test Project',
        expiresAt: new Date()
      };

      req.body = { qrCode: 'test-qr-code' };
      qrCodeService.validateQRCodeFromInput = jest.fn().mockResolvedValue(mockValidation);
      global.mockPrisma.project.update.mockResolvedValue({});
      global.mockPrisma.projectMember.upsert.mockResolvedValue({});

      await workflowController.validateProjectQR(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          projectId: 'project-123',
          projectName: 'Test Project'
        })
      });
    });

    it('should return error if QR code is missing', async () => {
      req.body = {};

      await workflowController.validateProjectQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_QR'
        })
      });
    });

    it('should return error if QR code is invalid', async () => {
      req.body = { qrCode: 'invalid-qr' };
      qrCodeService.validateQRCodeFromInput = jest.fn().mockResolvedValue({ valid: false });

      await workflowController.validateProjectQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors gracefully', async () => {
      req.body = { qrCode: 'test-qr' };
      qrCodeService.validateQRCodeFromInput = jest.fn().mockRejectedValue(new Error('Service error'));

      await workflowController.validateProjectQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('submitOrder', () => {
    beforeEach(() => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    });

    it('should submit order successfully', async () => {
      const projectStartDate = new Date();
      const mockProject = {
        id: 'project-123',
        startDate: projectStartDate,
        location: 'Test Location'
      };

      req.body = {
        projectId: 'project-123',
        restaurantId: 'restaurant-123',
        menuItems: [{ menuItemId: 'item-123', quantity: 2 }],
        deliveryAddress: 'Test Address'
      };

      global.mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      global.mockPrisma.projectMember.findUnique.mockResolvedValue({ id: 'member-123' });
      global.mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item-123', price: 100 });
      global.mockPrisma.order.create.mockResolvedValue({
        id: 'order-123',
        status: 'PENDING',
        totalAmount: 200,
        createdAt: new Date(),
        user: {},
        restaurant: {},
        items: []
      });

      notificationService.sendOrderConfirmation = jest.fn();
      notificationService.notifyProducersNewOrder = jest.fn();

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order-123',
          status: 'PENDING'
        })
      });
    });

    it('should return error if validation fails', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid data' }]
      });

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return error if project not found', async () => {
      req.body = { projectId: 'invalid-project', restaurantId: 'r-123', menuItems: [] };
      global.mockPrisma.project.findUnique.mockResolvedValue(null);

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'PENDING',
        user: {},
        restaurant: {}
      };

      req.params.orderId = 'order-123';
      req.body = { confirmed: true };

      global.mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      global.mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'CONFIRMED' });
      notificationService.sendOrderStatus = jest.fn();

      await workflowController.confirmOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'CONFIRMED'
        })
      });
    });

    it('should cancel order when confirmed is false', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'PENDING',
        user: {},
        restaurant: {}
      };

      req.params.orderId = 'order-123';
      req.body = { confirmed: false };

      global.mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      global.mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });

      await workflowController.confirmOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'CANCELLED'
        })
      });
    });

    it('should return error if order not found', async () => {
      req.params.orderId = 'invalid-order';
      req.body = { confirmed: true };
      global.mockPrisma.order.findUnique.mockResolvedValue(null);

      await workflowController.confirmOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders with pagination', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'PENDING' },
        { id: 'order-2', status: 'CONFIRMED' }
      ];

      req.query = { page: '1', limit: '10' };

      global.mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      global.mockPrisma.order.count.mockResolvedValue(2);

      await workflowController.getUserOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orders: mockOrders,
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 2
          })
        })
      });
    });

    it('should filter orders by projectId and status', async () => {
      req.query = { projectId: 'project-123', status: 'PENDING' };

      global.mockPrisma.order.findMany.mockResolvedValue([]);
      global.mockPrisma.order.count.mockResolvedValue(0);

      await workflowController.getUserOrders(req, res, next);

      expect(global.mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-123',
            status: 'PENDING'
          })
        })
      );
    });
  });

  describe('getAggregatedOrders', () => {
    it('should return aggregated orders for producers', async () => {
      req.user.role = 'PRODUCER';
      req.params.projectId = 'project-123';

      const mockOrders = [
        {
          id: 'order-1',
          restaurantId: 'restaurant-1',
          totalAmount: 100,
          restaurant: { id: 'restaurant-1', name: 'Restaurant 1' },
          items: [
            {
              menuItemId: 'item-1',
              quantity: 2,
              price: 50,
              menuItem: { id: 'item-1', name: 'Item 1' }
            }
          ]
        }
      ];

      global.mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      await workflowController.getAggregatedOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          summary: expect.objectContaining({
            totalOrders: 1,
            totalAmount: 100
          })
        })
      });
    });

    it('should deny access for non-producers', async () => {
      req.user.role = 'REGULAR';
      req.params.projectId = 'project-123';

      await workflowController.getAggregatedOrders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      req.params.orderId = 'order-123';
      req.body = { status: 'PREPARING' };

      global.mockPrisma.order.update.mockResolvedValue({
        id: 'order-123',
        status: 'PREPARING'
      });

      notificationService.sendOrderStatus = jest.fn();

      await workflowController.updateOrderStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'PREPARING'
        })
      });
    });

    it('should reject invalid status', async () => {
      req.params.orderId = 'order-123';
      req.body = { status: 'INVALID_STATUS' };

      await workflowController.updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sendOrderReminders', () => {
    it('should send reminders to users without orders', async () => {
      req.user.role = 'PRODUCER';
      req.body = { projectId: 'project-123' };

      global.mockPrisma.projectMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' }
      ]);

      global.mockPrisma.order.groupBy.mockResolvedValue([
        { userId: 'user-1' }
      ]);

      notificationService.sendReminder = jest.fn();

      await workflowController.sendOrderReminders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          remindersSent: 2
        })
      });
    });

    it('should deny access for non-producers', async () => {
      req.user.role = 'REGULAR';
      req.body = { projectId: 'project-123' };

      await workflowController.sendOrderReminders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getOrderTracking', () => {
    it('should return order tracking information', async () => {
      req.params.orderId = 'order-123';

      const mockOrder = {
        id: 'order-123',
        status: 'OUT_FOR_DELIVERY',
        deliveryLat: 30.0,
        deliveryLng: 31.0,
        deliveryAddress: 'Test Address',
        estimatedTime: 30,
        restaurant: {
          name: 'Test Restaurant',
          latitude: 30.1,
          longitude: 31.1
        },
        user: {}
      };

      global.mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      gpsTrackingService.getOrderTracking = jest.fn().mockResolvedValue({
        currentLocation: { lat: 30.05, lng: 31.05 }
      });

      await workflowController.getOrderTracking(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order-123',
          status: 'OUT_FOR_DELIVERY'
        })
      });
    });

    it('should return error if order not found', async () => {
      req.params.orderId = 'invalid-order';
      global.mockPrisma.order.findUnique.mockResolvedValue(null);

      await workflowController.getOrderTracking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateDeliveryLocation', () => {
    it('should update delivery location successfully', async () => {
      req.params.orderId = 'order-123';
      req.body = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.update.mockResolvedValue({
        id: 'order-123',
        status: 'OUT_FOR_DELIVERY'
      });

      gpsTrackingService.recordOrderTrackingPoint = jest.fn().mockResolvedValue({
        etaMinutes: 15
      });

      notificationService.sendLocationUpdate = jest.fn();

      await workflowController.updateDeliveryLocation(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          location: { latitude: 30.0, longitude: 31.0 },
          eta: 15
        })
      });
    });

    it('should return error if location is missing', async () => {
      req.params.orderId = 'order-123';
      req.body = {};

      await workflowController.updateDeliveryLocation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deliverOrder', () => {
    it('should mark order as delivered', async () => {
      req.params.orderId = 'order-123';

      const mockOrder = {
        id: 'order-123',
        status: 'DELIVERED',
        deliveredAt: new Date()
      };

      global.mockPrisma.order.update.mockResolvedValue(mockOrder);
      notificationService.sendDeliveryNotification = jest.fn();

      await workflowController.deliverOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'DELIVERED',
          orderId: 'order-123'
        })
      });
    });
  });
});
