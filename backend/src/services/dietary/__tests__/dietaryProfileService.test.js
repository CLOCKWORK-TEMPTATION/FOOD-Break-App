/**
 * Smoke Tests - Dietary Profile Service
 */

jest.mock('@prisma/client');

describe('DietaryProfileService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.dietaryProfile.findUnique.mockResolvedValue({ id: '1' });
    mockPrisma.dietaryProfile.upsert.mockResolvedValue({ id: '1' });
  });

  it('should load without errors', () => {
    const service = require('../dietaryProfileService');
    expect(service).toBeDefined();
  });
});
