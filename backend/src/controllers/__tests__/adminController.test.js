/**
 * Smoke Tests - Admin Controller
 */

jest.mock('@prisma/client');

const adminController = require('../adminController');

describe('AdminController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'admin-1', role: 'ADMIN' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.restaurant.count.mockResolvedValue(0);
  });

  it('should handle getDashboardStats', async () => {
    if (adminController.getDashboardStats) {
      await expect(adminController.getDashboardStats(req, res)).resolves.not.toThrow();
    }
  });

  it('should handle getAllUsers', async () => {
    if (adminController.getAllUsers) {
      await expect(adminController.getAllUsers(req, res)).resolves.not.toThrow();
    }
  });
});
