/**
 * Smoke Tests - Menu Filter Service
 */

jest.mock('@prisma/client');

describe('MenuFilterService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../menuFilterService');
    expect(service).toBeDefined();
  });
});
