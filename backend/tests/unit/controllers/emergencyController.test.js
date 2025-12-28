/**
 * Emergency Controller Tests
 * اختبارات متحكم الطوارئ - Phase 4 Feature
 */

const emergencyController = require('../../../src/controllers/emergencyController');
const emergencyService = require('../../../src/services/emergencyService');
const notificationService = require('../../../src/services/notificationService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

// Mock the emergency service and notification service
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

describe('Emergency Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('activateEmergencyMode', () => {
    it('should activate emergency mode successfully', async () => {
      const mockEmergency = {
        id: 'emergency-1',
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        isActive: true
      };

      mockReq.body = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        reason: 'Urgent schedule change'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.activateEmergencyMode.mockResolvedValue(mockEmergency);
      notificationService.sendEmergencyAlert.mockResolvedValue();

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmergency,
        message: expect.any(String)
      });
      expect(emergencyService.activateEmergencyMode).toHaveBeenCalledWith({
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        reason: 'Urgent schedule change',
        activatedBy: 'user-1',
        estimatedDuration: undefined
      });
    });

    it('should handle missing required fields', async () => {
      mockReq.body = {
        emergencyType: 'SCHEDULE_CHANGE'
        // Missing projectId
      };

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_REQUIRED_FIELDS'
        })
      });
    });

    it('should handle activation errors', async () => {
      mockReq.body = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE'
      };

      emergencyService.activateEmergencyMode.mockRejectedValue(new Error('Activation failed'));

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'EMERGENCY_ACTIVATION_FAILED'
        })
      });
    });
  });

  describe('createEmergencyOrder', () => {
    it('should create emergency order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        projectId: 'project-1',
        urgencyLevel: 'HIGH',
        status: 'URGENT_PENDING'
      };

      const mockSession = {
        id: 'session-1',
        projectId: 'project-1',
        isActive: true
      };

      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH',
        specialInstructions: 'Urgent delivery needed'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.getActiveEmergencySession.mockResolvedValue(mockSession);
      emergencyService.createEmergencyOrder.mockResolvedValue(mockOrder);
      emergencyService.notifyEmergencyRestaurants.mockResolvedValue();

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: expect.any(String)
      });
    });

    it('should handle no active emergency session', async () => {
      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH'
      };

      emergencyService.getActiveEmergencySession.mockResolvedValue(null);

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'NO_ACTIVE_EMERGENCY_SESSION'
        })
      });
    });

    it('should validate urgency level', async () => {
      mockReq.body = {
        projectId: 'project-1'
        // Missing urgencyLevel
      };

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_REQUIRED_FIELDS'
        })
      });
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency restaurants', async () => {
      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'Emergency Restaurant 1',
          emergencyResponseTime: 15,
          emergencyAvailable: true
        }
      ];

      mockReq.query = {
        latitude: '30.0444',
        longitude: '31.2357',
        radius: '5000'
      };

      emergencyService.getEmergencyRestaurants.mockResolvedValue(mockRestaurants);

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants,
        meta: {
          count: 1,
          radius: "5000" // radius comes as string from query params
        }
      });
    });

    it('should handle missing coordinates', async () => {
      mockReq.query = {
        latitude: '30.0444'
        // Missing longitude
      };

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'COORDINATES_REQUIRED'
        })
      });
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update emergency order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'URGENT_CONFIRMED',
        estimatedDeliveryTime: 20,
        userId: 'user-1'
      };

      mockReq.params = { orderId: 'order-1' };
      mockReq.body = {
        status: 'URGENT_CONFIRMED',
        estimatedDeliveryTime: 20
      };

      emergencyService.updateEmergencyOrderStatus.mockResolvedValue(mockOrder);
      notificationService.sendOrderStatusUpdate.mockResolvedValue();

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: expect.any(String)
      });
    });

    it('should handle missing status', async () => {
      mockReq.params = { orderId: 'order-1' };
      mockReq.body = {
        // Missing status
        estimatedDeliveryTime: 20
      };

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'STATUS_REQUIRED'
        })
      });
    });
  });

  describe('getPrePreparedInventory', () => {
    it('should return pre-prepared inventory', async () => {
      const mockInventory = [
        {
          id: 'item-1',
          itemName: 'Emergency Sandwich',
          quantity: 50,
          expiryDate: new Date()
        }
      ];

      mockReq.query = { projectId: 'project-1' };

      emergencyService.getPrePreparedInventory.mockResolvedValue(mockInventory);

      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory
      });
    });

    it('should handle missing project ID', async () => {
      mockReq.query = {};

      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'PROJECT_ID_REQUIRED'
        })
      });
    });
  });

  describe('addToPrePreparedInventory', () => {
    it('should add item to inventory successfully', async () => {
      const mockItem = {
        id: 'item-1',
        projectId: 'project-1',
        itemName: 'Emergency Sandwich',
        quantity: 50
      };

      mockReq.body = {
        projectId: 'project-1',
        itemName: 'Emergency Sandwich',
        quantity: 50,
        storageLocation: 'Fridge A'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.addToPrePreparedInventory.mockResolvedValue(mockItem);

      await emergencyController.addToPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem,
        message: expect.any(String)
      });
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode successfully', async () => {
      const mockResult = {
        id: 'emergency-1',
        isActive: false,
        deactivatedAt: new Date()
      };

      mockReq.body = {
        projectId: 'project-1',
        reason: 'Emergency resolved'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.deactivateEmergencyMode.mockResolvedValue(mockResult);
      notificationService.sendEmergencyAlert.mockResolvedValue();

      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: expect.any(String)
      });
    });
  });

  describe('getEmergencyHistory', () => {
    it('should return emergency history with pagination', async () => {
      const mockHistory = {
        sessions: [
          {
            id: 'emergency-1',
            emergencyType: 'SCHEDULE_CHANGE',
            createdAt: new Date(),
            resolvedAt: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockReq.query = {
        projectId: 'project-1',
        page: '1',
        limit: '20'
      };

      emergencyService.getEmergencyHistory.mockResolvedValue(mockHistory);

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });
  });

  describe('notifyScheduleChange', () => {
    it('should send schedule change notification', async () => {
      const mockNotification = {
        id: 'notification-1',
        projectId: 'project-1',
        changeType: 'DELAY'
      };

      mockReq.body = {
        projectId: 'project-1',
        changeType: 'DELAY',
        newSchedule: { deliveryTime: '14:00' },
        reason: 'Traffic delay'
      };
      mockReq.user = { id: 'user-1' };

      emergencyService.notifyScheduleChange.mockResolvedValue(mockNotification);

      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: expect.any(String)
      });
    });
  });
});