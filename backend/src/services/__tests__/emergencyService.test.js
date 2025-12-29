/**
 * Smoke Tests - Emergency Service
 * اختبارات بسيطة للتغطية السريعة
 */

const emergencyService = require('../emergencyService');

jest.mock('@prisma/client');

describe('EmergencyService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.emergencySession.findFirst.mockResolvedValue(null);
    mockPrisma.emergencySession.create.mockResolvedValue({
      id: '1',
      projectId: 'project-1',
      emergencyType: 'URGENT',
      isActive: true
    });
    mockPrisma.emergencyLog.create.mockResolvedValue({ id: '1' });
    mockPrisma.emergencyOrder.create.mockResolvedValue({ id: '1' });
    mockPrisma.restaurant.findMany.mockResolvedValue([]);
    mockPrisma.emergencyRestaurantNotification.create.mockResolvedValue({ id: '1' });
    mockPrisma.emergencyOrder.update.mockResolvedValue({ id: '1' });
    mockPrisma.prePreparedInventory.findMany.mockResolvedValue([]);
    mockPrisma.prePreparedInventory.create.mockResolvedValue({ id: '1' });
    mockPrisma.emergencySession.update.mockResolvedValue({ id: '1', isActive: false });
    mockPrisma.emergencySession.findMany.mockResolvedValue([]);
    mockPrisma.emergencySession.count.mockResolvedValue(0);
    mockPrisma.scheduleChangeNotification.create.mockResolvedValue({ id: '1' });
  });

  it('should not throw when calling activateEmergencyMode', async () => {
    await expect(emergencyService.activateEmergencyMode({
      projectId: 'project-1',
      emergencyType: 'URGENT',
      reason: 'Test',
      estimatedDuration: 60,
      activatedBy: 'user-1'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling createEmergencyOrder', async () => {
    await expect(emergencyService.createEmergencyOrder({
      projectId: 'project-1',
      userId: 'user-1',
      sessionId: 'session-1',
      urgencyLevel: 'HIGH',
      specialInstructions: 'Test',
      deliveryLocation: {}
    })).resolves.not.toThrow();
  });

  it('should not throw when calling getActiveEmergencySession', async () => {
    await expect(emergencyService.getActiveEmergencySession('project-1')).resolves.not.toThrow();
  });

  it('should not throw when calling getEmergencyRestaurants', async () => {
    await expect(emergencyService.getEmergencyRestaurants({
      latitude: 24.7136,
      longitude: 46.6753,
      radius: 5000
    })).resolves.not.toThrow();
  });

  it('should not throw when calling notifyEmergencyRestaurants', async () => {
    const order = {
      id: '1',
      deliveryLocation: { latitude: 24.7136, longitude: 46.6753 }
    };
    await expect(emergencyService.notifyEmergencyRestaurants('project-1', order)).resolves.not.toThrow();
  });

  it('should not throw when calling updateEmergencyOrderStatus', async () => {
    await expect(emergencyService.updateEmergencyOrderStatus('order-1', 'CONFIRMED', {})).resolves.not.toThrow();
  });

  it('should not throw when calling getPrePreparedInventory', async () => {
    await expect(emergencyService.getPrePreparedInventory('project-1')).resolves.not.toThrow();
  });

  it('should not throw when calling addToPrePreparedInventory', async () => {
    await expect(emergencyService.addToPrePreparedInventory({
      projectId: 'project-1',
      itemName: 'Test Item',
      quantity: 10,
      addedBy: 'user-1'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling deactivateEmergencyMode', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.emergencySession.findFirst.mockResolvedValue({ id: '1', isActive: true });

    await expect(emergencyService.deactivateEmergencyMode('project-1', 'user-1', 'Test')).resolves.not.toThrow();
  });

  it('should not throw when calling getEmergencyHistory', async () => {
    await expect(emergencyService.getEmergencyHistory({
      projectId: 'project-1',
      page: 1,
      limit: 10
    })).resolves.not.toThrow();
  });

  it('should not throw when calling notifyScheduleChange', async () => {
    await expect(emergencyService.notifyScheduleChange({
      projectId: 'project-1',
      changeType: 'DELAY',
      newSchedule: {},
      reason: 'Test',
      affectedMeals: [],
      notifiedBy: 'user-1'
    })).resolves.not.toThrow();
  });
});
