/**
 * Smoke Tests - Training Data Service
 */

jest.mock('@prisma/client');

describe('TrainingDataService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.order.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../trainingDataService');
    expect(service).toBeDefined();
  });
});
