/**
 * Tests for Workflow Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/orderService');
jest.mock('../../services/notificationService');
jest.mock('../../services/gpsTrackingService');
jest.mock('../../services/qrCodeService');
jest.mock('express-validator');

const workflowController = require('../workflowController');
const { PrismaClient } = require('@prisma/client');
const notificationService = require('../../services/notificationService');
const gpsTrackingService = require('../../services/gpsTrackingService');
const qrCodeService = require('../../services/qrCodeService');
const { validationResult } = require('express-validator');

describe('Workflow Controller', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      project: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      projectMember: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
      },
      menuItem: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('validateProjectQR', () => {
    it('should validate QR code successfully', async () => {
      req.body = { qrCode: 'valid_qr_token' };

      qrCodeService.validateQRCodeFromInput = jest.fn().mockResolvedValue({
        valid: true,
        projectId: 'project123',
        projectName: 'Test Project',
        expiresAt: new Date()
      });

      mockPrisma.project.update.mockResolvedValue({});
      mockPrisma.projectMember.upsert.mockResolvedValue({});

      await workflowController.validateProjectQR(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            projectId: 'project123'
          })
        })
      );
    });

    it('should reject missing QR code', async () => {
      req.body = {};

      await workflowController.validateProjectQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid QR code', async () => {
      req.body = { qrCode: 'invalid_token' };

      qrCodeService.validateQRCodeFromInput = jest.fn().mockResolvedValue({
        valid: false
      });

      await workflowController.validateProjectQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('submitOrder', () => {
    beforeEach(() => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        location: 'Test Location',
        startDate: futureDate,
        orderWindow: 60
      });

      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'member123'
      });

      mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: 'item123',
        price: 50
      });
    });

    it('should submit order successfully', async () => {
      req.body = {
        projectId: 'project123',
        restaurantId: 'restaurant123',
        menuItems: [
          { menuItemId: 'item123', quantity: 2 }
        ],
        notes: 'Test order'
      };

      mockPrisma.order.create.mockResolvedValue({
        id: 'order123',
        userId: 'user123',
        status: 'PENDING',
        totalAmount: 100,
        createdAt: new Date(),
        user: {},
        restaurant: {},
        items: []
      });

      notificationService.sendOrderConfirmation = jest.fn().mockResolvedValue();
      notificationService.notifyProducersNewOrder = jest.fn().mockResolvedValue();

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: 'order123'
          })
        })
      );
    });

    it('should reject order for non-existent project', async () => {
      req.body = {
        projectId: 'invalid_project',
        restaurantId: 'restaurant123',
        menuItems: []
      };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject order for unauthorized user', async () => {
      req.body = {
        projectId: 'project123',
        restaurantId: 'restaurant123',
        menuItems: []
      };

      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await workflowController.submitOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order successfully', async () => {
      req.params = { orderId: 'order123' };
      req.body = { confirmed: true };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order123',
        userId: 'user123',
        status: 'PENDING',
        user: {},
        restaurant: {}
      });

      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'CONFIRMED'
      });

      notificationService.sendOrderStatus = jest.fn().mockResolvedValue();

      await workflowController.confirmOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'CONFIRMED'
          })
        })
      );
    });

    it('should cancel order when not confirmed', async () => {
      req.params = { orderId: 'order123' };
      req.body = { confirmed: false };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order123',
        user: {},
        restaurant: {}
      });

      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'CANCELLED'
      });

      await workflowController.confirmOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'CANCELLED'
          })
        })
      );
    });

    it('should reject for non-existent order', async () => {
      req.params = { orderId: 'invalid_order' };
      req.body = { confirmed: true };

      mockPrisma.order.findUnique.mockResolvedValue(null);

      await workflowController.confirmOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserOrders', () => {
    it('should get user orders', async () => {
      req.query = { page: '1', limit: '10' };

      mockPrisma.order.findMany.mockResolvedValue([
        { id: 'order1' },
        { id: 'order2' }
      ]);

      mockPrisma.order.count.mockResolvedValue(2);

      await workflowController.getUserOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should filter by project and status', async () => {
      req.query = {
        projectId: 'project123',
        status: 'PENDING',
        page: '1',
        limit: '10'
      };

      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await workflowController.getUserOrders(req, res, next);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
            projectId: 'project123',
            status: 'PENDING'
          })
        })
      );
    });
  });

  describe('getAggregatedOrders', () => {
    it('should get aggregated orders for producer', async () => {
      req.user.role = 'PRODUCER';
      req.params = { projectId: 'project123' };

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          restaurantId: 'restaurant1',
          totalAmount: 100,
          restaurant: { id: 'restaurant1', name: 'Restaurant 1' },
          items: [
            {
              menuItemId: 'item1',
              quantity: 2,
              price: 50,
              menuItem: { id: 'item1', name: 'Item 1' }
            }
          ]
        }
      ]);

      await workflowController.getAggregatedOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            summary: expect.any(Object),
            aggregatedByRestaurant: expect.any(Object)
          })
        })
      );
    });

    it('should reject for non-producer user', async () => {
      req.user.role = 'USER';
      req.params = { projectId: 'project123' };

      await workflowController.getAggregatedOrders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      req.params = { orderId: 'order123' };
      req.body = { status: 'PREPARING' };

      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'PREPARING'
      });

      notificationService.sendOrderStatus = jest.fn().mockResolvedValue();

      await workflowController.updateOrderStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'PREPARING'
          })
        })
      );
    });

    it('should reject invalid status', async () => {
      req.params = { orderId: 'order123' };
      req.body = { status: 'INVALID_STATUS' };

      await workflowController.updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sendOrderReminders', () => {
    it('should send reminders successfully', async () => {
      req.user.role = 'PRODUCER';
      req.body = { projectId: 'project123' };

      mockPrisma.projectMember.findMany.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' }
      ]);

      mockPrisma.order.groupBy.mockResolvedValue([
        { userId: 'user1' }
      ]);

      notificationService.sendReminder = jest.fn().mockResolvedValue();

      await workflowController.sendOrderReminders(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            remindersSent: 2
          })
        })
      );
    });

    it('should reject for non-producer', async () => {
      req.user.role = 'USER';
      req.body = { projectId: 'project123' };

      await workflowController.sendOrderReminders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getOrderTracking', () => {
    it('should get order tracking', async () => {
      req.params = { orderId: 'order123' };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order123',
        status: 'OUT_FOR_DELIVERY',
        restaurant: {
          name: 'Restaurant',
          latitude: 30.0,
          longitude: 31.0
        },
        user: {},
        deliveryLat: 30.1,
        deliveryLng: 31.1,
        deliveryAddress: 'Test Address',
        estimatedTime: 30
      });

      gpsTrackingService.getOrderTracking = jest.fn().mockResolvedValue({
        currentLocation: { latitude: 30.05, longitude: 31.05 },
        eta: 15
      });

      await workflowController.getOrderTracking(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: 'order123',
            tracking: expect.any(Object)
          })
        })
      );
    });

    it('should handle non-existent order', async () => {
      req.params = { orderId: 'invalid_order' };

      mockPrisma.order.findUnique.mockResolvedValue(null);

      await workflowController.getOrderTracking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateDeliveryLocation', () => {
    it('should update delivery location', async () => {
      req.params = { orderId: 'order123' };
      req.body = { latitude: 30.1, longitude: 31.1 };

      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'OUT_FOR_DELIVERY'
      });

      gpsTrackingService.recordOrderTrackingPoint = jest.fn().mockResolvedValue({
        etaMinutes: 15
      });

      notificationService.sendLocationUpdate = jest.fn().mockResolvedValue();

      await workflowController.updateDeliveryLocation(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            location: expect.any(Object)
          })
        })
      );
    });

    it('should reject missing location', async () => {
      req.params = { orderId: 'order123' };
      req.body = {};

      await workflowController.updateDeliveryLocation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deliverOrder', () => {
    it('should deliver order successfully', async () => {
      req.params = { orderId: 'order123' };

      const deliveredAt = new Date();
      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'DELIVERED',
        deliveredAt
      });

      notificationService.sendDeliveryNotification = jest.fn().mockResolvedValue();

      await workflowController.deliverOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'DELIVERED',
            deliveredAt
          })
        })
      );
    });
  });
});
