/**
 * Smoke Tests - Quantity Forecast Service
 */

jest.mock('@prisma/client');

describe('QuantityForecastService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.order.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../quantityForecastService');
    expect(service).toBeDefined();
  });
});
