/**
 * Smoke Tests - Demand Forecast Report Service
 */

jest.mock('@prisma/client');

describe('DemandForecastReportService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.order.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../demandForecastReportService');
    expect(service).toBeDefined();
  });
});
