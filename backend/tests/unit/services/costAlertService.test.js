/**
 * Cost Alert Service Tests
 * اختبارات خدمة تنبيهات التكلفة
 */

const costAlertService = require('../../../src/services/costAlertService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Cost Alert Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create cost alert', async () => {
      const alertData = {
        userId: 'user-123',
        threshold: 1000,
        period: 'MONTHLY'
      };
      global.mockPrisma.costAlert.create.mockResolvedValue({ id: '1', ...alertData });

      const result = await costAlertService.createAlert(alertData);

      expect(result).toHaveProperty('id');
      expect(global.mockPrisma.costAlert.create).toHaveBeenCalled();
    });
  });

  describe('checkAlerts', () => {
    it('should check and trigger alerts', async () => {
      global.mockPrisma.costAlert.findMany.mockResolvedValue([
        { id: '1', userId: 'user-123', threshold: 100 }
      ]);
      global.mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 150 } });

      const result = await costAlertService.checkAlerts('user-123');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserAlerts', () => {
    it('should get all alerts for user', async () => {
      const mockAlerts = [
        { id: '1', threshold: 100 },
        { id: '2', threshold: 200 }
      ];
      global.mockPrisma.costAlert.findMany.mockResolvedValue(mockAlerts);

      const result = await costAlertService.getUserAlerts('user-123');

      expect(result).toEqual(mockAlerts);
    });
  });

  describe('updateAlert', () => {
    it('should update alert', async () => {
      global.mockPrisma.costAlert.update.mockResolvedValue({ id: '1', threshold: 200 });

      const result = await costAlertService.updateAlert('1', { threshold: 200 });

      expect(result.threshold).toBe(200);
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      global.mockPrisma.costAlert.delete.mockResolvedValue({ id: '1' });

      await costAlertService.deleteAlert('1');

      expect(global.mockPrisma.costAlert.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });

  describe('getSpendingReport', () => {
    it('should generate spending report', async () => {
      global.mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 500 } });

      const result = await costAlertService.getSpendingReport('user-123', 'MONTHLY');

      expect(result).toHaveProperty('totalSpent');
    });
  });
});
