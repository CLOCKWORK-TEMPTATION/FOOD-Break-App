/**
 * Emergency Controller Simple Tests
 * اختبارات بسيطة لمتحكم الطوارئ
 */

const emergencyController = require('../../../src/controllers/emergencyController');
const emergencyService = require('../../../src/services/emergencyService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

// Mock the emergency service
jest.mock('../../../src/services/emergencyService', () => ({
  activateEmergencyMode: jest.fn(),
  createEmergencyOrder: jest.fn(),
  getEmergencyRestaurants: jest.fn(),
  updateEmergencyOrderStatus: jest.fn(),
  getPrePreparedInventory: jest.fn(),
  deactivateEmergencyMode: jest.fn(),
  getEmergencyHistory: jest.fn(),
  notifyScheduleChange: jest.fn()
}));

describe('Emergency Controller - Simple Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('activateEmergencyMode', () => {
    it('should handle successful activation', async () => {
      const mockEmergency = { id: 'emergency-1', isActive: true };
      emergencyService.activateEmergencyMode.mockResolvedValue(mockEmergency);

      mockReq.body = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE'
      };

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(emergencyService.activateEmergencyMode).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle activation errors', async () => {
      emergencyService.activateEmergencyMode.mockRejectedValue(new Error('Test error'));

      mockReq.body = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE'
      };

      await emergencyController.activateEmergencyMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createEmergencyOrder', () => {
    it('should handle successful order creation', async () => {
      const mockOrder = { id: 'order-1', status: 'URGENT_PENDING' };
      emergencyService.createEmergencyOrder.mockResolvedValue(mockOrder);

      mockReq.body = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH'
      };

      await emergencyController.createEmergencyOrder(mockReq, mockRes, mockNext);

      expect(emergencyService.createEmergencyOrder).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency restaurants', async () => {
      const mockRestaurants = [{ id: 'restaurant-1', name: 'Emergency Restaurant' }];
      emergencyService.getEmergencyRestaurants.mockResolvedValue(mockRestaurants);

      mockReq.query = {
        latitude: '30.0444',
        longitude: '31.2357'
      };

      await emergencyController.getEmergencyRestaurants(mockReq, mockRes, mockNext);

      expect(emergencyService.getEmergencyRestaurants).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = { id: 'order-1', status: 'URGENT_CONFIRMED' };
      emergencyService.updateEmergencyOrderStatus.mockResolvedValue(mockOrder);

      mockReq.params = { orderId: 'order-1' };
      mockReq.body = { status: 'URGENT_CONFIRMED' };

      await emergencyController.updateEmergencyOrderStatus(mockReq, mockRes, mockNext);

      expect(emergencyService.updateEmergencyOrderStatus).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPrePreparedInventory', () => {
    it('should return inventory', async () => {
      const mockInventory = [{ id: 'item-1', itemName: 'Emergency Sandwich' }];
      emergencyService.getPrePreparedInventory.mockResolvedValue(mockInventory);

      mockReq.query = { projectId: 'project-1' };

      await emergencyController.getPrePreparedInventory(mockReq, mockRes, mockNext);

      expect(emergencyService.getPrePreparedInventory).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode', async () => {
      emergencyService.deactivateEmergencyMode.mockResolvedValue({ success: true });

      mockReq.body = { projectId: 'project-1' };

      await emergencyController.deactivateEmergencyMode(mockReq, mockRes, mockNext);

      expect(emergencyService.deactivateEmergencyMode).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getEmergencyHistory', () => {
    it('should return emergency history', async () => {
      const mockHistory = {
        emergencies: [{ id: 'emergency-1' }],
        pagination: { page: 1, total: 1 }
      };
      emergencyService.getEmergencyHistory.mockResolvedValue(mockHistory);

      mockReq.query = { projectId: 'project-1' };

      await emergencyController.getEmergencyHistory(mockReq, mockRes, mockNext);

      expect(emergencyService.getEmergencyHistory).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('notifyScheduleChange', () => {
    it('should send schedule change notification', async () => {
      const mockNotification = { id: 'notification-1', sentTo: 5 };
      emergencyService.notifyScheduleChange.mockResolvedValue(mockNotification);

      mockReq.body = {
        projectId: 'project-1',
        changeType: 'DELAY'
      };

      await emergencyController.notifyScheduleChange(mockReq, mockRes, mockNext);

      expect(emergencyService.notifyScheduleChange).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});