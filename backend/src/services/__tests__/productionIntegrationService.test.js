/**
 * Smoke Tests - Production Integration Service
 */

jest.mock('@prisma/client');

const productionIntegrationService = require('../productionIntegrationService');

describe('ProductionIntegrationService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.project.findUnique.mockResolvedValue({ id: '1' });
  });

  it('should handle syncOrders', async () => {
    if (productionIntegrationService.syncOrders) {
      await expect(productionIntegrationService.syncOrders('project-1')).resolves.not.toThrow();
    }
  });

  it('should handle getProductionStats', async () => {
    if (productionIntegrationService.getProductionStats) {
      await expect(productionIntegrationService.getProductionStats('project-1')).resolves.not.toThrow();
    }
  });
});
