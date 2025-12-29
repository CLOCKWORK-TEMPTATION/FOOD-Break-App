/**
 * Smoke Tests - Allergy Service
 */

jest.mock('@prisma/client');

describe('AllergyService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    mockPrisma.dietaryProfile.findUnique.mockResolvedValue({ allergies: [] });
  });

  it('should load without errors', () => {
    const allergyService = require('../allergyService');
    expect(allergyService).toBeDefined();
  });
});
