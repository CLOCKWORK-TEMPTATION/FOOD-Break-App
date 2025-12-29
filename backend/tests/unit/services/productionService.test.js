/**
 * Production Service Tests
 * اختبارات خدمة الإنتاج
 */

const productionService = require('../../../src/services/productionService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Production Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleProduction', () => {
    it('should schedule production order', async () => {
      global.mockPrisma.production.create.mockResolvedValue({ id: '1', status: 'SCHEDULED' });

      const result = await productionService.scheduleProduction({ menuItemId: 'item-123', quantity: 100 });

      expect(result).toHaveProperty('id');
    });
  });

  describe('getProductionQueue', () => {
    it('should get production queue', async () => {
      global.mockPrisma.production.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await productionService.getProductionQueue();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateProductionStatus', () => {
    it('should update production status', async () => {
      global.mockPrisma.production.update.mockResolvedValue({ id: '1', status: 'IN_PROGRESS' });

      const result = await productionService.updateProductionStatus('1', 'IN_PROGRESS');

      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('completeProduction', () => {
    it('should mark production as complete', async () => {
      global.mockPrisma.production.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });

      const result = await productionService.completeProduction('1');

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('getProductionStats', () => {
    it('should get production statistics', async () => {
      global.mockPrisma.production.count.mockResolvedValue(50);
      global.mockPrisma.production.findMany.mockResolvedValue([]);

      const result = await productionService.getProductionStats();

      expect(result).toHaveProperty('totalProductions');
    });
  });
});
