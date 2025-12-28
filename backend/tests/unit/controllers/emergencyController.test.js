/**
 * Emergency Controller Tests
 * اختبارات متحكم الطوارئ - Phase 4 Feature
 */

const emergencyController = require('../../../src/controllers/emergencyController');
const emergencyService = require('../../../src/services/emergencyService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

// Mock the emergency service
jest.mock('../../../src/services/emergencyService');

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

      emergencyService.activateEmergencyMode.mockResolvedValue(mockEmergency);

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmergency,
        message: expect.any(String)
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
          code: 'EMERGENCY_ACTIVATION_FAILED',
          message: expect.any(String)
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

      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH',
        specialInstructions: 'Urgent delivery needed'
      };

      emergencyService.createEmergencyOrder.mockResolvedValue(mockOrder);

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: expect.any(String)
      });
    });

    it('should validate urgency level', async () => {
      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'INVALID_LEVEL'
      };

      emergencyService.createEmergencyOrder.mockRejectedValue(new Error('Invalid urgency level'));

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency restaurants', async () => {
      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'Emergency Restaurant 1',
          emergencyResponseTime: 15,
          isEmergencyPartner: true
        }
      ];

      mockReq.query = {
        latitude: '30.0444',
        longitude: '31.2357',
        radius: '5000'
      };

      emergencyService.getEmergencyRestaurants.mockResolvedValue(mockRestaurants);

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants
      });
    });

    it('should handle location validation errors', async () => {
      mockReq.query = {
        latitude: 'invalid',
        longitude: 'invalid'
      };

      emergencyService.getEmergencyRestaurants.mockRejectedValue(new Error('Invalid coordinates'));

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update emergency order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'URGENT_CONFIRMED',
        estimatedDeliveryTime: 20
      };

      mockReq.params = { orderId: 'order-1' };
      mockReq.body = {
        status: 'URGENT_CONFIRMED',
        estimatedDeliveryTime: 20
      };

      emergencyService.updateEmergencyOrderStatus.mockResolvedValue(mockOrder);

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: expect.any(String)
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

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory
      });
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode successfully', async () => {
      mockReq.body = {
        projectId: 'project-1',
        reason: 'Emergency resolved'
      };

      emergencyService.deactivateEmergencyMode.mockResolvedValue({ success: true });

      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });
  });

  describe('getEmergencyHistory', () => {
    it('should return emergency history with pagination', async () => {
      const mockHistory = {
        emergencies: [
          {
            id: 'emergency-1',
            emergencyType: 'SCHEDULE_CHANGE',
            createdAt: new Date(),
            resolvedAt: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockReq.query = {
        projectId: 'project-1',
        page: '1',
        limit: '10'
      };

      emergencyService.getEmergencyHistory.mockResolvedValue(mockHistory);

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory.emergencies,
        meta: { pagination: mockHistory.pagination }
      });
    });
  });

  describe('notifyScheduleChange', () => {
    it('should send schedule change notification', async () => {
      const mockNotification = {
        id: 'notification-1',
        projectId: 'project-1',
        changeType: 'DELAY',
        sentTo: 25
      };

      mockReq.body = {
        projectId: 'project-1',
        changeType: 'DELAY',
        newSchedule: { deliveryTime: '14:00' },
        reason: 'Traffic delay'
      };

      emergencyService.notifyScheduleChange.mockResolvedValue(mockNotification);

      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: expect.any(String)
      });
    });
  });
});