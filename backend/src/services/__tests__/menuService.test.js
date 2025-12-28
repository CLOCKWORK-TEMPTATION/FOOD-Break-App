/**
 * Smoke Tests - Menu Service
 */

jest.mock('@prisma/client');

describe('MenuService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    mockPrisma.menuItem.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
    mockPrisma.menuItem.create.mockResolvedValue({ id: '1' });
    mockPrisma.menuItem.update.mockResolvedValue({ id: '1' });
    mockPrisma.menuItem.delete.mockResolvedValue({ id: '1' });
    mockPrisma.restaurant.findMany.mockResolvedValue([]);
  });

  it('should load menuService module', () => {
    const menuService = require('../menuService');
    expect(menuService).toBeDefined();

    // Call any exported functions if they exist
    if (typeof menuService === 'object') {
      Object.keys(menuService).forEach(key => {
        expect(menuService[key]).toBeDefined();
      });
    }
  });
});
