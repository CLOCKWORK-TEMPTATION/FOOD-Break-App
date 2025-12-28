/**
 * Admin Controller Tests
 * اختبارات وحدة المسؤول الإداري
 */

const adminController = require('../../../src/controllers/adminController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Admin Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin-123', role: 'ADMIN' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' }
      ];
      global.mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      global.mockPrisma.user.count.mockResolvedValue(2);

      req.query = { page: '1', limit: '10' };

      await adminController.getAllUsers(req, res, next);

      expect(global.mockPrisma.user.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should handle errors', async () => {
      global.mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await adminController.getAllUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', name: 'User 1', email: 'user1@test.com' };
      global.mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      req.params.id = '1';

      await adminController.getUserById(req, res, next);

      expect(global.mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });

    it('should handle user not found', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(null);

      req.params.id = 'non-existent';

      await adminController.getUserById(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = { id: '1', name: 'Updated User', email: 'updated@test.com' };
      global.mockPrisma.user.update.mockResolvedValue(mockUser);

      req.params.id = '1';
      req.body = { name: 'Updated User' };

      await adminController.updateUser(req, res, next);

      expect(global.mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: req.body
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      global.mockPrisma.user.delete.mockResolvedValue({ id: '1' });

      req.params.id = '1';

      await adminController.deleteUser(req, res, next);

      expect(global.mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      global.mockPrisma.user.count.mockResolvedValue(100);
      global.mockPrisma.order.count.mockResolvedValue(50);
      global.mockPrisma.restaurant.count.mockResolvedValue(10);

      await adminController.getDashboardStats(req, res, next);

      expect(global.mockPrisma.user.count).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getSystemSettings', () => {
    it('should return system settings', async () => {
      await adminController.getSystemSettings(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('updateSystemSettings', () => {
    it('should update system settings', async () => {
      req.body = { maintenance: false, maxOrders: 100 };

      await adminController.updateSystemSettings(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});
