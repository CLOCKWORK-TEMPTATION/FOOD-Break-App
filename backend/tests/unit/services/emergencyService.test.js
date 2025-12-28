/**
 * Emergency Service Tests
 * اختبارات خدمة الطوارئ - Phase 4 Feature
 */

const emergencyService = require('../../../src/services/emergencyService');
const { PrismaClient } = require('@prisma/client');
const notificationService = require('../../../src/services/notificationService');

// Mock Prisma Client
jest.mock('@prisma/client');
jest.mock('../../../src/services/notificationService');

const mockPrisma = {
  emergencySession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  emergencyOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  emergencyLog: {
    create: jest.fn()
  },
  restaurant: {
    findMany: jest.fn()
  },
  prePreparedInventory: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  scheduleChangeNotification: {
    create: jest.fn()
  },
  project: {
    findUnique: jest.fn()
  },
  user: {
    findMany: jest.fn()
  }
};

PrismaClient.mockImplementation(() => mockPrisma);

describe('Emergency Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateEmergencyMode', () => {
    it('should activate emergency mode successfully', async () => {
      const emergencyData = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        reason: 'Urgent schedule change',
        estimatedDuration: 120
      };

      const mockEmergency = {
        id: 'emergency-1',
        ...emergencyData,
        isActive: true,
        activatedAt: new Date()
      };

      mockPrisma.emergencySession.findFirst.mockResolvedValue(null); // No active emergency
      mockPrisma.emergencySession.create.mockResolvedValue(mockEmergency);
      mockPrisma.emergencyLog.create.mockResolvedValue({ id: 'log-1' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-1', name: 'Test Project' });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1', email: 'test@test.com' }]);

      const result = await emergencyService.activateEmergencyMode(emergencyData);

      expect(result).toEqual(mockEmergency);
      expect(mockPrisma.emergencySession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          emergencyType: 'SCHEDULE_CHANGE',
          isActive: true
        }),
        include: expect.any(Object)
      });
      expect(notificationService.sendBroadcastNotification).toHaveBeenCalled();
    });

    it('should prevent multiple active emergencies for same project', async () => {
      const emergencyData = {
        projectId: 'project-1',
        emergencyType: 'MEDICAL'
      };

      mockPrisma.emergencySession.findFirst.mockResolvedValue({
        id: 'existing-emergency',
        projectId: 'project-1',
        isActive: true
      });

      await expect(emergencyService.activateEmergencyMode(emergencyData))
        .rejects.toThrow('يوجد بالفعل جلسة طوارئ نشطة لهذا المشروع');
    });
  });

  describe('createEmergencyOrder', () => {
    it('should create emergency order with high priority', async () => {
      const orderData = {
        projectId: 'project-1',
        urgencyLevel: 'CRITICAL',
        specialInstructions: 'Immediate delivery required',
        deliveryLocation: { address: '123 Emergency St' }
      };

      const mockOrder = {
        id: 'order-1',
        ...orderData,
        status: 'URGENT_PENDING',
        estimatedDeliveryTime: 15,
        createdAt: new Date()
      };

      mockPrisma.emergencyMode.findFirst.mockResolvedValue({
        id: 'emergency-1',
        projectId: 'project-1',
        isActive: true
      });
      mockPrisma.emergencyOrder.create.mockResolvedValue(mockOrder);

      const result = await emergencyService.createEmergencyOrder('user-1', orderData);

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.emergencyOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          urgencyLevel: 'CRITICAL',
          status: 'URGENT_PENDING'
        })
      });
    });

    it('should require active emergency mode', async () => {
      const orderData = {
        projectId: 'project-1',
        urgencyLevel: 'HIGH'
      };

      mockPrisma.emergencyMode.findFirst.mockResolvedValue(null);

      await expect(emergencyService.createEmergencyOrder('user-1', orderData))
        .rejects.toThrow('No active emergency mode for this project');
    });

    it('should calculate priority-based delivery time', async () => {
      const orderData = {
        projectId: 'project-1',
        urgencyLevel: 'LOW'
      };

      mockPrisma.emergencyMode.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: true
      });
      mockPrisma.emergencyOrder.create.mockResolvedValue({
        id: 'order-1',
        urgencyLevel: 'LOW',
        estimatedDeliveryTime: 45
      });

      const result = await emergencyService.createEmergencyOrder('user-1', orderData);

      expect(result.estimatedDeliveryTime).toBe(45); // LOW priority = 45 minutes
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency partner restaurants within radius', async () => {
      const location = { latitude: 30.0444, longitude: 31.2357 };
      const radius = 5000; // 5km

      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'Emergency Restaurant 1',
          latitude: 30.0450,
          longitude: 31.2360,
          isEmergencyPartner: true,
          emergencyResponseTime: 15,
          emergencyCapacity: 50
        }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const result = await emergencyService.getEmergencyRestaurants(location, radius);

      expect(result).toEqual(mockRestaurants);
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isEmergencyPartner: true,
          isActive: true,
          // Geographic filtering would be implemented here
        },
        orderBy: {
          emergencyResponseTime: 'asc'
        }
      });
    });

    it('should sort restaurants by response time', async () => {
      const location = { latitude: 30.0444, longitude: 31.2357 };
      
      const mockRestaurants = [
        { id: 'restaurant-1', emergencyResponseTime: 20 },
        { id: 'restaurant-2', emergencyResponseTime: 10 },
        { id: 'restaurant-3', emergencyResponseTime: 15 }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const result = await emergencyService.getEmergencyRestaurants(location);

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { emergencyResponseTime: 'asc' }
        })
      );
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update emergency order status', async () => {
      const updateData = {
        status: 'URGENT_CONFIRMED',
        estimatedDeliveryTime: 20,
        notes: 'Order confirmed by restaurant'
      };

      const mockOrder = {
        id: 'order-1',
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.emergencyOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'URGENT_PENDING'
      });
      mockPrisma.emergencyOrder.update.mockResolvedValue(mockOrder);

      const result = await emergencyService.updateEmergencyOrderStatus('order-1', updateData);

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.emergencyOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: updateData
      });
    });

    it('should send notifications on status change', async () => {
      const updateData = { status: 'URGENT_OUT_FOR_DELIVERY' };

      mockPrisma.emergencyOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'URGENT_PREPARING'
      });
      mockPrisma.emergencyOrder.update.mockResolvedValue({
        id: 'order-1',
        ...updateData
      });

      await emergencyService.updateEmergencyOrderStatus('order-1', updateData);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          type: 'EMERGENCY_ORDER_UPDATE',
          title: expect.any(String),
          message: expect.any(String)
        })
      );
    });
  });

  describe('getPrePreparedInventory', () => {
    it('should return pre-prepared inventory for project', async () => {
      const mockInventory = [
        {
          id: 'item-1',
          projectId: 'project-1',
          itemName: 'Emergency Sandwich',
          quantity: 50,
          expiryDate: new Date(),
          storageLocation: 'Fridge A'
        }
      ];

      mockPrisma.prePreparedInventory.findMany.mockResolvedValue(mockInventory);

      const result = await emergencyService.getPrePreparedInventory('project-1');

      expect(result).toEqual(mockInventory);
      expect(mockPrisma.prePreparedInventory.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          quantity: { gt: 0 },
          expiryDate: { gte: expect.any(Date) }
        },
        orderBy: { expiryDate: 'asc' }
      });
    });

    it('should filter out expired items', async () => {
      await emergencyService.getPrePreparedInventory('project-1');

      expect(mockPrisma.prePreparedInventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiryDate: { gte: expect.any(Date) }
          })
        })
      );
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode successfully', async () => {
      const deactivationData = {
        projectId: 'project-1',
        reason: 'Emergency resolved'
      };

      mockPrisma.emergencyMode.findFirst.mockResolvedValue({
        id: 'emergency-1',
        projectId: 'project-1',
        isActive: true
      });
      mockPrisma.emergencyMode.update.mockResolvedValue({
        id: 'emergency-1',
        isActive: false,
        deactivatedAt: new Date()
      });

      const result = await emergencyService.deactivateEmergencyMode(deactivationData);

      expect(result.success).toBe(true);
      expect(mockPrisma.emergencyMode.update).toHaveBeenCalledWith({
        where: { id: 'emergency-1' },
        data: {
          isActive: false,
          deactivatedAt: expect.any(Date),
          deactivationReason: 'Emergency resolved'
        }
      });
    });

    it('should handle no active emergency', async () => {
      mockPrisma.emergencyMode.findFirst.mockResolvedValue(null);

      await expect(emergencyService.deactivateEmergencyMode({ projectId: 'project-1' }))
        .rejects.toThrow('No active emergency mode found for this project');
    });
  });

  describe('getEmergencyHistory', () => {
    it('should return paginated emergency history', async () => {
      const filters = {
        projectId: 'project-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        page: 1,
        limit: 10
      };

      const mockEmergencies = [
        {
          id: 'emergency-1',
          emergencyType: 'SCHEDULE_CHANGE',
          activatedAt: new Date(),
          deactivatedAt: new Date(),
          duration: 120
        }
      ];

      mockPrisma.emergencyMode.findMany.mockResolvedValue(mockEmergencies);

      const result = await emergencyService.getEmergencyHistory(filters);

      expect(result.emergencies).toEqual(mockEmergencies);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });
  });

  describe('notifyScheduleChange', () => {
    it('should send schedule change notifications', async () => {
      const changeData = {
        projectId: 'project-1',
        changeType: 'DELAY',
        newSchedule: { deliveryTime: '14:00' },
        reason: 'Traffic delay',
        affectedMeals: ['LUNCH']
      };

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user1@test.com' },
        { id: 'user-2', email: 'user2@test.com' }
      ]);

      const result = await emergencyService.notifyScheduleChange(changeData);

      expect(result.projectId).toBe('project-1');
      expect(result.sentTo).toBe(2);
      expect(notificationService.sendBroadcastNotification).toHaveBeenCalledWith({
        title: expect.stringContaining('تغيير في الجدولة'),
        message: expect.any(String),
        type: 'SCHEDULE_CHANGE',
        targetUsers: ['user-1', 'user-2'],
        data: changeData
      });
    });

    it('should handle different change types', async () => {
      const changeTypes = ['DELAY', 'CANCELLATION', 'TIME_CHANGE', 'LOCATION_CHANGE'];

      for (const changeType of changeTypes) {
        mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);

        await emergencyService.notifyScheduleChange({
          projectId: 'project-1',
          changeType,
          reason: `Test ${changeType}`
        });

        expect(notificationService.sendBroadcastNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining(changeType === 'DELAY' ? 'تأخير' : 'تغيير')
          })
        );
      }
    });
  });
});