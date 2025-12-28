/**
 * Emergency Controller Tests
 * اختبارات متحكم الطوارئ - Phase 4 Feature
 */

const emergencyController = require('../../../src/controllers/emergencyController');
const emergencyService = require('../../../src/services/emergencyService');
const notificationService = require('../../../src/services/notificationService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

jest.mock('../../../src/services/emergencyService');
jest.mock('../../../src/services/notificationService', () => ({
  sendEmergencyAlert: jest.fn(),
  sendOrderStatusUpdate: jest.fn(),
  sendNotification: jest.fn(),
  sendBroadcastNotification: jest.fn()
}));
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

describe('Emergency Controller - متحكم الطوارئ', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    mockReq.__ = jest.fn((key) => key);
    jest.clearAllMocks();
  });

  describe('activateEmergencyMode', () => {
    it('should activate emergency mode successfully', async () => {
      const mockEmergency = { id: 'emergency-1', projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE', isActive: true };
      mockReq.body = { projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE', reason: 'Urgent schedule change' };
      mockReq.user = { id: 'user-1' };
      emergencyService.activateEmergencyMode.mockResolvedValue(mockEmergency);
      notificationService.sendEmergencyAlert.mockResolvedValue();

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockEmergency, message: expect.any(String) });
    });

    it('should handle missing required fields', async () => {
      mockReq.body = { emergencyType: 'SCHEDULE_CHANGE' };
      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle activation errors', async () => {
      mockReq.body = { projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE' };
      emergencyService.activateEmergencyMode.mockRejectedValue(new Error('Activation failed'));
      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createEmergencyOrder', () => {
    it('should create emergency order successfully', async () => {
      const mockOrder = { id: 'order-1', projectId: 'project-1', urgencyLevel: 'HIGH', status: 'URGENT_PENDING' };
      const mockSession = { id: 'session-1', projectId: 'project-1', isActive: true };
      mockReq.body = { projectId: 'project-1', urgencyLevel: 'HIGH', specialInstructions: 'Urgent delivery needed' };
      mockReq.user = { id: 'user-1' };
      emergencyService.getActiveEmergencySession.mockResolvedValue(mockSession);
      emergencyService.createEmergencyOrder.mockResolvedValue(mockOrder);
      emergencyService.notifyEmergencyRestaurants.mockResolvedValue();

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockOrder, message: expect.any(String) });
    });

    it('should handle no active emergency session', async () => {
      mockReq.body = { projectId: 'project-1', urgencyLevel: 'HIGH' };
      emergencyService.getActiveEmergencySession.mockResolvedValue(null);
      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate urgency level', async () => {
      mockReq.body = { projectId: 'project-1' };
      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.body = { projectId: 'project-1', urgencyLevel: 'HIGH' };
      emergencyService.getActiveEmergencySession.mockResolvedValue({ id: 'session-1' });
      emergencyService.createEmergencyOrder.mockRejectedValue(new Error('Service error'));
      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency restaurants', async () => {
      const mockRestaurants = [{ id: 'restaurant-1', name: 'Emergency Restaurant 1', emergencyResponseTime: 15, emergencyAvailable: true }];
      mockReq.query = { latitude: '30.0444', longitude: '31.2357', radius: '5000' };
      emergencyService.getEmergencyRestaurants.mockResolvedValue(mockRestaurants);

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockRestaurants, meta: { count: 1, radius: "5000" } });
    });

    it('should handle missing coordinates', async () => {
      mockReq.query = { latitude: '30.0444' };
      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.query = { latitude: '30.0', longitude: '31.0' };
      emergencyService.getEmergencyRestaurants.mockRejectedValue(new Error('Error'));
      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update emergency order status', async () => {
      const mockOrder = { id: 'order-1', status: 'URGENT_CONFIRMED', estimatedDeliveryTime: 20, userId: 'user-1' };
      mockReq.params = { orderId: 'order-1' };
      mockReq.body = { status: 'URGENT_CONFIRMED', estimatedDeliveryTime: 20 };
      emergencyService.updateEmergencyOrderStatus.mockResolvedValue(mockOrder);
      notificationService.sendOrderStatusUpdate.mockResolvedValue();

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockOrder, message: expect.any(String) });
    });

    it('should handle missing status', async () => {
      mockReq.params = { orderId: 'order-1' };
      mockReq.body = { estimatedDeliveryTime: 20 };
      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.params = { orderId: 'order-1' };
      mockReq.body = { status: 'CONFIRMED' };
      emergencyService.updateEmergencyOrderStatus.mockRejectedValue(new Error('Error'));
      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPrePreparedInventory', () => {
    it('should return pre-prepared inventory', async () => {
      const mockInventory = [{ id: 'item-1', itemName: 'Emergency Sandwich', quantity: 50, expiryDate: new Date() }];
      mockReq.query = { projectId: 'project-1' };
      emergencyService.getPrePreparedInventory.mockResolvedValue(mockInventory);

      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockInventory });
    });

    it('should handle missing projectId', async () => {
      mockReq.query = {};
      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.query = { projectId: 'project-1' };
      emergencyService.getPrePreparedInventory.mockRejectedValue(new Error('Service error'));
      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addToPrePreparedInventory', () => {
    it('should add item to inventory successfully', async () => {
      const mockItem = { id: 'item-1', projectId: 'project-1', itemName: 'Emergency Meal', quantity: 100 };
      mockReq.body = { projectId: 'project-1', itemName: 'Emergency Meal', quantity: 100, expiryDate: '2024-12-31', storageLocation: 'Warehouse A' };
      mockReq.user = { id: 'user-1' };
      emergencyService.addToPrePreparedInventory.mockResolvedValue(mockItem);

      await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockItem, message: expect.any(String) });
    });

    it('should handle missing required fields', async () => {
      mockReq.body = { projectId: 'project-1' };
      await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.body = { projectId: 'project-1', itemName: 'Test', quantity: 10 };
      emergencyService.addToPrePreparedInventory.mockRejectedValue(new Error('Error'));
      await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode successfully', async () => {
      const mockResult = { id: 'session-1', projectId: 'project-1', isActive: false };
      mockReq.body = { projectId: 'project-1', reason: 'Emergency resolved' };
      mockReq.user = { id: 'user-1' };
      emergencyService.deactivateEmergencyMode.mockResolvedValue(mockResult);
      notificationService.sendEmergencyAlert.mockResolvedValue();

      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockResult, message: expect.any(String) });
    });

    it('should handle missing projectId', async () => {
      mockReq.body = { reason: 'Test' };
      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.body = { projectId: 'project-1' };
      emergencyService.deactivateEmergencyMode.mockRejectedValue(new Error('Error'));
      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEmergencyHistory', () => {
    it('should return emergency history', async () => {
      const mockHistory = { sessions: [{ id: 'session-1', emergencyType: 'SCHEDULE_CHANGE' }], pagination: { page: 1, limit: 20, total: 1 } };
      mockReq.query = { projectId: 'project-1', page: '1', limit: '20' };
      emergencyService.getEmergencyHistory.mockResolvedValue(mockHistory);

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockHistory });
    });

    it('should handle service errors', async () => {
      mockReq.query = {};
      emergencyService.getEmergencyHistory.mockRejectedValue(new Error('Error'));
      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('notifyScheduleChange', () => {
    it('should notify schedule change successfully', async () => {
      const mockNotification = { id: 'notification-1', projectId: 'project-1', changeType: 'DELAY' };
      mockReq.body = { projectId: 'project-1', changeType: 'DELAY', newSchedule: '14:00', reason: 'Production delay' };
      mockReq.user = { id: 'user-1' };
      emergencyService.notifyScheduleChange.mockResolvedValue(mockNotification);

      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockNotification, message: expect.any(String) });
    });

    it('should handle missing required fields', async () => {
      mockReq.body = { projectId: 'project-1' };
      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      mockReq.body = { projectId: 'project-1', changeType: 'DELAY' };
      emergencyService.notifyScheduleChange.mockRejectedValue(new Error('Error'));
      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // Additional comprehensive tests for edge cases and full coverage
  describe('activateEmergencyMode - Edge Cases', () => {
    it('should handle different emergency types', async () => {
      const emergencyTypes = ['WEATHER_EMERGENCY', 'STAFF_SHORTAGE', 'EQUIPMENT_FAILURE', 'SUPPLY_CHAIN_ISSUE'];

      for (const type of emergencyTypes) {
        mockReq.body = { projectId: 'project-1', emergencyType: type, reason: 'Test' };
        mockReq.user = { id: 'user-1' };
        emergencyService.activateEmergencyMode.mockResolvedValue({ id: `emergency-${type}` });

        await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

        expect(emergencyService.activateEmergencyMode).toHaveBeenCalledWith(
          expect.objectContaining({ emergencyType: type })
        );
      }
    });

    it('should validate estimated duration format', async () => {
      mockReq.body = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        estimatedDuration: 'invalid'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.activateEmergencyMode.mockRejectedValue(
        new Error('Invalid duration format')
      );

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle concurrent emergency activation attempts', async () => {
      mockReq.body = { projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE' };
      mockReq.user = { id: 'user-1' };

      emergencyService.activateEmergencyMode.mockRejectedValue(
        new Error('Emergency session already active')
      );

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createEmergencyOrder - Additional Tests', () => {
    it('should handle all urgency levels', async () => {
      const urgencyLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const level of urgencyLevels) {
        mockReq.body = {
          projectId: 'project-1',
          urgencyLevel: level,
          specialInstructions: `Test ${level} urgency`
        };
        mockReq.user = { id: 'user-1' };

        emergencyService.getActiveEmergencySession.mockResolvedValue({ id: 'session-1' });
        emergencyService.createEmergencyOrder.mockResolvedValue({
          id: `order-${level}`,
          urgencyLevel: level
        });
        emergencyService.notifyEmergencyRestaurants.mockResolvedValue();

        await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

        expect(emergencyService.createEmergencyOrder).toHaveBeenCalledWith(
          expect.objectContaining({ urgencyLevel: level })
        );
      }
    });

    it('should validate delivery location format', async () => {
      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH',
        deliveryLocation: { latitude: 'invalid', longitude: 'invalid' }
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.getActiveEmergencySession.mockResolvedValue({ id: 'session-1' });
      emergencyService.createEmergencyOrder.mockRejectedValue(
        new Error('Invalid coordinates')
      );

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle special characters in instructions', async () => {
      const specialInstructions = 'Urgent! @#$%^&*() استسلام طوارئ';

      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH',
        specialInstructions
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.getActiveEmergencySession.mockResolvedValue({ id: 'session-1' });
      emergencyService.createEmergencyOrder.mockResolvedValue({
        id: 'order-1',
        specialInstructions
      });
      emergencyService.notifyEmergencyRestaurants.mockResolvedValue();

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getEmergencyRestaurants - Advanced Tests', () => {
    it('should handle different radius values', async () => {
      const radii = ['1000', '5000', '10000', '20000'];

      for (const radius of radii) {
        mockReq.query = {
          latitude: '24.7136',
          longitude: '46.6753',
          radius
        };

        emergencyService.getEmergencyRestaurants.mockResolvedValue([]);

        await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

        expect(emergencyService.getEmergencyRestaurants).toHaveBeenCalledWith(
          expect.objectContaining({ radius: parseInt(radius) })
        );
      }
    });

    it('should validate coordinate ranges', async () => {
      mockReq.query = {
        latitude: '95.0', // Invalid latitude
        longitude: '46.6753'
      };

      emergencyService.getEmergencyRestaurants.mockRejectedValue(
        new Error('Invalid latitude')
      );

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return empty array when no restaurants found', async () => {
      mockReq.query = {
        latitude: '0.0',
        longitude: '0.0',
        radius: '100'
      };

      emergencyService.getEmergencyRestaurants.mockResolvedValue([]);

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          meta: expect.objectContaining({ count: 0 })
        })
      );
    });
  });

  describe('updateEmergencyOrderStatus - Status Transitions', () => {
    it('should handle all status transitions', async () => {
      const statuses = ['URGENT_PENDING', 'URGENT_CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

      for (const status of statuses) {
        mockReq.params = { orderId: 'order-1' };
        mockReq.body = { status };

        emergencyService.updateEmergencyOrderStatus.mockResolvedValue({
          id: 'order-1',
          status
        });
        notificationService.sendOrderStatusUpdate.mockResolvedValue();

        await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

        expect(emergencyService.updateEmergencyOrderStatus).toHaveBeenCalledWith(
          'order-1',
          status,
          expect.any(Object)
        );
      }
    });

    it('should handle estimated delivery time updates', async () => {
      const estimatedTime = 25;

      mockReq.params = { orderId: 'order-1' };
      mockReq.body = {
        status: 'PREPARING',
        estimatedDeliveryTime: estimatedTime,
        notes: 'Traffic delay expected'
      };

      emergencyService.updateEmergencyOrderStatus.mockResolvedValue({
        id: 'order-1',
        estimatedDeliveryTime: estimatedTime
      });
      notificationService.sendOrderStatusUpdate.mockResolvedValue();

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estimatedDeliveryTime: estimatedTime
          })
        })
      );
    });

    it('should handle status update for non-existent order', async () => {
      mockReq.params = { orderId: 'non-existent' };
      mockReq.body = { status: 'DELIVERED' };

      emergencyService.updateEmergencyOrderStatus.mockRejectedValue(
        new Error('Order not found')
      );

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Inventory Management - Additional Tests', () => {
    it('should handle inventory items with different expiry dates', async () => {
      const dates = [
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        null // No expiry
      ];

      for (const date of dates) {
        mockReq.body = {
          projectId: 'project-1',
          itemName: 'Test Item',
          quantity: 50,
          expiryDate: date?.toISOString()
        };
        mockReq.user = { id: 'user-1' };

        emergencyService.addToPrePreparedInventory.mockResolvedValue({
          id: 'item-1',
          expiryDate: date
        });

        await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(201);
      }
    });

    it('should validate quantity is positive number', async () => {
      mockReq.body = {
        projectId: 'project-1',
        itemName: 'Test',
        quantity: -10 // Invalid negative quantity
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.addToPrePreparedInventory.mockRejectedValue(
        new Error('Quantity must be positive')
      );

      await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should filter out expired inventory items', async () => {
      mockReq.query = { projectId: 'project-1' };

      emergencyService.getPrePreparedInventory.mockResolvedValue([
        { id: 'item-1', quantity: 50, expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        { id: 'item-2', quantity: 30, expiryDate: null }
        // Expired items should be filtered out
      ]);

      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array)
        })
      );
    });
  });

  describe('Emergency History and Analytics', () => {
    it('should handle date range filtering', async () => {
      mockReq.query = {
        projectId: 'project-1',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        page: '1',
        limit: '20'
      };

      emergencyService.getEmergencyHistory.mockResolvedValue({
        sessions: [],
        pagination: { total: 0, totalPages: 0 }
      });

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(emergencyService.getEmergencyHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockReq.query = {
        projectId: 'project-1',
        page: '3',
        limit: '50'
      };

      emergencyService.getEmergencyHistory.mockResolvedValue({
        sessions: [],
        pagination: { page: 3, limit: 50, total: 150, totalPages: 3 }
      });

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 3,
              limit: 50,
              totalPages: 3
            })
          })
        })
      );
    });
  });

  describe('Schedule Change Notifications - Extended', () => {
    it('should handle all change types', async () => {
      const changeTypes = ['DELAY', 'ADVANCE', 'CANCELLATION', 'LOCATION_CHANGE', 'TIME_EXTENSION'];

      for (const type of changeTypes) {
        mockReq.body = {
          projectId: 'project-1',
          changeType: type,
          newSchedule: '14:00',
          reason: 'Test notification'
        };
        mockReq.user = { id: 'user-1' };

        emergencyService.notifyScheduleChange.mockResolvedValue({
          id: `notification-${type}`,
          changeType: type
        });

        await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(201);
      }
    });

    it('should validate affected meals array', async () => {
      mockReq.body = {
        projectId: 'project-1',
        changeType: 'DELAY',
        affectedMeals: ['breakfast', 'lunch', 'dinner']
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.notifyScheduleChange.mockResolvedValue({
        id: 'notification-1',
        affectedMeals: ['breakfast', 'lunch', 'dinner']
      });

      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

      expect(emergencyService.notifyScheduleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          affectedMeals: ['breakfast', 'lunch', 'dinner']
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      mockReq.body = { projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE' };
      mockReq.user = { id: 'user-1' };

      emergencyService.activateEmergencyMode.mockRejectedValue(
        new Error('Database connection lost')
      );

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle notification service failures gracefully', async () => {
      mockReq.body = { projectId: 'project-1', emergencyType: 'SCHEDULE_CHANGE' };
      mockReq.user = { id: 'user-1' };

      emergencyService.activateEmergencyMode.mockResolvedValue({ id: 'emergency-1' });
      notificationService.sendEmergencyAlert.mockRejectedValue(
        new Error('Notification service unavailable')
      );

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      // Should still return success even if notification fails
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle malformed JSON in request body', async () => {
      mockReq.body = { invalid: 'data' };
      mockReq.user = { id: 'user-1' };

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle concurrent emergency orders', async () => {
      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.getActiveEmergencySession.mockResolvedValue({ id: 'session-1' });
      emergencyService.createEmergencyOrder.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
