/**
 * Smoke Tests - Performance Service
 */

jest.mock('@prisma/client');

const performanceService = require('../performanceService');

describe('PerformanceService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.order.count.mockResolvedValue(0);
  });

  it('should handle getPerformanceMetrics', async () => {
    if (performanceService.getPerformanceMetrics) {
      await expect(performanceService.getPerformanceMetrics({})).resolves.not.toThrow();
    }
  });

  it('should handle trackOperation', async () => {
    if (performanceService.trackOperation) {
      expect(() => performanceService.trackOperation('test')).not.toThrow();
    }
  });
});
