/**
 * Emergency Service Tests
 * اختبارات خدمة الطوارئ - Phase 4 Feature
 */

const emergencyService = require('../../../src/services/emergencyService');

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Emergency Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock functions
    if (global.mockPrisma) {
      Object.keys(global.mockPrisma).forEach(model => {
        if (typeof global.mockPrisma[model] === 'object' && global.mockPrisma[model] !== null) {
          Object.keys(global.mockPrisma[model]).forEach(method => {
            if (jest.isMockFunction(global.mockPrisma[model][method])) {
              global.mockPrisma[model][method].mockReset();
            }
          });
        }
      });
    }
  });

  describe('activateEmergencyMode', () => {
    it('should activate emergency mode successfully', async () => {
      const emergencyData = {
        projectId: 'project-1',
        emergencyType: 'SCHEDULE_CHANGE',
        reason: 'Urgent schedule change',
        estimatedDuration: 120,
        activatedBy: 'user-1'
      };

      const mockEmergency = {
        id: 'emergency-1',
        ...emergencyData,
        isActive: true,
        activatedAt: new Date(),
        project: { name: 'Test Project' },
        activatedByUser: { firstName: 'Test', lastName: 'User' }
      };

      global.mockPrisma.emergencySession.findFirst.mockResolvedValue(null); // No active emergency
      global.mockPrisma.emergencySession.create.mockResolvedValue(mockEmergency);
      global.mockPrisma.emergencyLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await emergencyService.activateEmergencyMode(emergencyData);

      expect(result).toEqual(mockEmergency);
      expect(global.mockPrisma.emergencySession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          emergencyType: 'SCHEDULE_CHANGE',
          isActive: true,
          activatedBy: 'user-1'
        }),
        include: expect.any(Object)
      });
    });

    it('should prevent multiple active emergencies for same project', async () => {
      const emergencyData = {
        projectId: 'project-1',
        emergencyType: 'MEDICAL',
        activatedBy: 'user-1'
      };

      global.mockPrisma.emergencySession.findFirst.mockResolvedValue({
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
        userId: 'user-1',
        urgencyLevel: 'CRITICAL',
        specialInstructions: 'Immediate delivery required',
        deliveryLocation: { address: '123 Emergency St' },
        sessionId: 'session-1'
      };

      const mockOrder = {
        id: 'order-1',
        ...orderData,
        status: 'URGENT_PENDING',
        createdAt: new Date(),
        user: { firstName: 'Test', lastName: 'User', phoneNumber: '123456789' },
        project: { name: 'Test Project' }
      };

      global.mockPrisma.emergencyOrder.create.mockResolvedValue(mockOrder);
      global.mockPrisma.emergencyLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await emergencyService.createEmergencyOrder(orderData);

      expect(result).toEqual(mockOrder);
      expect(global.mockPrisma.emergencyOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          urgencyLevel: 'CRITICAL',
          status: 'URGENT_PENDING'
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('getEmergencyRestaurants', () => {
    it('should return emergency partner restaurants within radius', async () => {
      const location = { latitude: 30.0444, longitude: 31.2357, radius: 5000 };

      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'Emergency Restaurant 1',
          latitude: 30.0450,
          longitude: 31.2360,
          emergencyAvailable: true,
          emergencyContactPerson: 'Manager',
          emergencyContactPhone: '123456789',
          emergencyMenuItems: ['Sandwich', 'Water'],
          averagePreparationTime: 15,
          rating: 4.5
        }
      ];

      global.mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const result = await emergencyService.getEmergencyRestaurants(location);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(global.mockPrisma.restaurant.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          emergencyAvailable: true
        }),
        select: expect.any(Object),
        orderBy: { rating: 'desc' }
      });
    });
  });

  describe('updateEmergencyOrderStatus', () => {
    it('should update emergency order status', async () => {
      const orderId = 'order-1';
      const status = 'URGENT_CONFIRMED';
      const metadata = {
        estimatedDeliveryTime: 20,
        notes: 'Order confirmed by restaurant'
      };

      const mockOrder = {
        id: orderId,
        status,
        estimatedDeliveryTime: 20,
        notes: 'Order confirmed by restaurant',
        updatedAt: new Date(),
        user: { id: 'user-1', firstName: 'Test', lastName: 'User' },
        session: { id: 'session-1', projectId: 'project-1' }
      };

      global.mockPrisma.emergencyOrder.update.mockResolvedValue(mockOrder);
      global.mockPrisma.emergencyLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await emergencyService.updateEmergencyOrderStatus(orderId, status, metadata);

      expect(result).toEqual(mockOrder);
      expect(global.mockPrisma.emergencyOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: expect.objectContaining({
          status,
          estimatedDeliveryTime: 20,
          notes: 'Order confirmed by restaurant'
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('getPrePreparedInventory', () => {
    it('should return pre-prepared inventory for project', async () => {
      const projectId = 'project-1';
      const mockInventory = [
        {
          id: 'item-1',
          projectId,
          itemName: 'Emergency Sandwich',
          quantity: 50,
          expiryDate: new Date(),
          storageLocation: 'Fridge A',
          addedByUser: { firstName: 'Test', lastName: 'User' }
        }
      ];

      global.mockPrisma.prePreparedInventory.findMany.mockResolvedValue(mockInventory);

      const result = await emergencyService.getPrePreparedInventory(projectId);

      expect(result).toEqual(mockInventory);
      expect(global.mockPrisma.prePreparedInventory.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
          quantity: { gt: 0 },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: expect.any(Date) } }
          ]
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('deactivateEmergencyMode', () => {
    it('should deactivate emergency mode successfully', async () => {
      const projectId = 'project-1';
      const deactivatedBy = 'user-1';
      const reason = 'Emergency resolved';

      const activeSession = {
        id: 'emergency-1',
        projectId,
        isActive: true,
        activatedAt: new Date()
      };

      const deactivatedSession = {
        ...activeSession,
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy,
        deactivationReason: reason
      };

      global.mockPrisma.emergencySession.findFirst.mockResolvedValue(activeSession);
      global.mockPrisma.emergencySession.update.mockResolvedValue(deactivatedSession);
      global.mockPrisma.emergencyLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await emergencyService.deactivateEmergencyMode(projectId, deactivatedBy, reason);

      expect(result).toEqual(deactivatedSession);
      expect(global.mockPrisma.emergencySession.update).toHaveBeenCalledWith({
        where: { id: 'emergency-1' },
        data: {
          isActive: false,
          deactivatedAt: expect.any(Date),
          deactivatedBy,
          deactivationReason: reason
        }
      });
    });

    it('should handle no active emergency', async () => {
      global.mockPrisma.emergencySession.findFirst.mockResolvedValue(null);

      await expect(emergencyService.deactivateEmergencyMode('project-1', 'user-1', 'test'))
        .rejects.toThrow('لا توجد جلسة طوارئ نشطة لهذا المشروع');
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

      const mockSessions = [
        {
          id: 'emergency-1',
          emergencyType: 'SCHEDULE_CHANGE',
          activatedAt: new Date(),
          deactivatedAt: new Date(),
          project: { name: 'Test Project' },
          activatedByUser: { firstName: 'Test', lastName: 'User' },
          deactivatedByUser: { firstName: 'Test', lastName: 'User' },
          orders: [{ id: 'order-1', urgencyLevel: 'HIGH', status: 'COMPLETED', createdAt: new Date() }],
          _count: { orders: 1 }
        }
      ];

      global.mockPrisma.emergencySession.findMany.mockResolvedValue(mockSessions);
      global.mockPrisma.emergencySession.count.mockResolvedValue(1);

      const result = await emergencyService.getEmergencyHistory(filters);

      expect(result.sessions).toEqual(mockSessions);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
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
        affectedMeals: ['LUNCH'],
        notifiedBy: 'user-1'
      };

      const mockNotification = {
        id: 'notification-1',
        ...changeData,
        createdAt: new Date(),
        project: { name: 'Test Project' },
        notifiedByUser: { firstName: 'Test', lastName: 'User' }
      };

      global.mockPrisma.scheduleChangeNotification.create.mockResolvedValue(mockNotification);

      const result = await emergencyService.notifyScheduleChange(changeData);

      expect(result).toEqual(mockNotification);
      expect(global.mockPrisma.scheduleChangeNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          changeType: 'DELAY',
          reason: 'Traffic delay'
        }),
        include: expect.any(Object)
      });
    });
  });
});