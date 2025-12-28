/**
 * Analytics Service Tests
 * اختبارات خدمة التحليلات
 */

const analyticsService = require('../../../src/services/analyticsService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      global.mockPrisma.user.count.mockResolvedValue(100);
      global.mockPrisma.order.count.mockResolvedValue(500);

      const result = await analyticsService.getUserStats('user-123');

      expect(result).toHaveProperty('totalOrders');
      expect(global.mockPrisma.order.count).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      global.mockPrisma.order.count.mockRejectedValue(new Error('DB error'));

      await expect(analyticsService.getUserStats('user-123')).rejects.toThrow();
    });
  });

  describe('getRestaurantStats', () => {
    it('should return restaurant statistics', async () => {
      global.mockPrisma.order.count.mockResolvedValue(50);
      global.mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 1000 } });

      const result = await analyticsService.getRestaurantStats('rest-123');

      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('totalRevenue');
    });
  });

  describe('getOrderTrends', () => {
    it('should return order trends', async () => {
      global.mockPrisma.order.groupBy.mockResolvedValue([
        { _count: { id: 10 }, createdAt: new Date() }
      ]);

      const result = await analyticsService.getOrderTrends({ days: 7 });

      expect(Array.isArray(result)).toBe(true);
      expect(global.mockPrisma.order.groupBy).toHaveBeenCalled();
    });
  });

  describe('getPopularItems', () => {
    it('should return popular menu items', async () => {
      global.mockPrisma.orderItem.groupBy.mockResolvedValue([
        { menuItemId: 'item-1', _sum: { quantity: 100 } }
      ]);

      const result = await analyticsService.getPopularItems('rest-123');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should return revenue analytics', async () => {
      global.mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
        _avg: { amount: 50 }
      });

      const result = await analyticsService.getRevenueAnalytics({ period: 'month' });

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('averageOrderValue');
    });
  });

  describe('getPeakHours', () => {
    it('should return peak ordering hours', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([
        { createdAt: new Date('2024-01-01T12:00:00') },
        { createdAt: new Date('2024-01-01T13:00:00') }
      ]);

      const result = await analyticsService.getPeakHours();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
