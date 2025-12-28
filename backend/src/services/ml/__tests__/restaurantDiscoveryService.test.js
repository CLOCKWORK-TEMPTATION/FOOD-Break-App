/**
 * Smoke Tests - Restaurant Discovery Service
 */

jest.mock('@prisma/client');

describe('RestaurantDiscoveryService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.restaurant.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../restaurantDiscoveryService');
    expect(service).toBeDefined();
  });
});
