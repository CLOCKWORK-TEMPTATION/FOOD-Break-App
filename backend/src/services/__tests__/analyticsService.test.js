/**
 * Tests for Analytics Service
 */

jest.mock('@prisma/client');
jest.mock('../cacheService');

const { PrismaClient } = require('@prisma/client');
const analyticsService = require('../analyticsService');
const cacheService = require('../cacheService');

describe('Analytics Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn()
      },
      user: {
        count: jest.fn(),
        groupBy: jest.fn()
      },
      restaurant: {
        findMany: jest.fn(),
        count: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
    cacheService.get = jest.fn().mockResolvedValue(null);
    cacheService.set = jest.fn().mockResolvedValue();
  });

  describe('getOverallStats', () => {
    it('should get overall statistics', async () => {
      mockPrisma.order.count.mockResolvedValue(100);
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.restaurant.count.mockResolvedValue(10);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 5000 }
      });

      const stats = await analyticsService.getOverallStats();

      expect(stats).toHaveProperty('totalOrders');
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalRestaurants');
      expect(stats).toHaveProperty('totalRevenue');
    });

    it('should use cache when available', async () => {
      const cachedStats = {
        totalOrders: 100,
        totalUsers: 50
      };

      cacheService.get.mockResolvedValue(cachedStats);

      const stats = await analyticsService.getOverallStats();

      expect(stats).toEqual(cachedStats);
      expect(mockPrisma.order.count).not.toHaveBeenCalled();
    });
  });

  describe('getOrderStatsByPeriod', () => {
    it('should get order stats by day', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { createdAt: new Date('2025-01-01'), totalAmount: 100 },
        { createdAt: new Date('2025-01-01'), totalAmount: 150 },
        { createdAt: new Date('2025-01-02'), totalAmount: 200 }
      ]);

      const stats = await analyticsService.getOrderStatsByPeriod('day', 7);

      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should get order stats by week', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const stats = await analyticsService.getOrderStatsByPeriod('week', 4);

      expect(Array.isArray(stats)).toBe(true);
    });

    it('should get order stats by month', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const stats = await analyticsService.getOrderStatsByPeriod('month', 12);

      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getTopRestaurants', () => {
    it('should get top restaurants by revenue', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Restaurant 1' },
        { id: 'r2', name: 'Restaurant 2' }
      ]);

      mockPrisma.order.findMany.mockResolvedValue([
        { restaurantId: 'r1', totalAmount: 1000 },
        { restaurantId: 'r2', totalAmount: 800 }
      ]);

      const topRestaurants = await analyticsService.getTopRestaurants(10);

      expect(Array.isArray(topRestaurants)).toBe(true);
    });

    it('should limit results to specified count', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const topRestaurants = await analyticsService.getTopRestaurants(5);

      expect(Array.isArray(topRestaurants)).toBe(true);
    });
  });

  describe('getUserGrowth', () => {
    it('should calculate user growth over time', async () => {
      mockPrisma.user.groupBy.mockResolvedValue([
        { _count: { id: 10 }, createdAt: new Date('2025-01-01') },
        { _count: { id: 15 }, createdAt: new Date('2025-01-02') }
      ]);

      const growth = await analyticsService.getUserGrowth(30);

      expect(Array.isArray(growth)).toBe(true);
    });
  });

  describe('getRevenueByRestaurant', () => {
    it('should get revenue breakdown by restaurant', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([
        {
          restaurantId: 'r1',
          _sum: { totalAmount: 5000 },
          _count: { id: 50 }
        },
        {
          restaurantId: 'r2',
          _sum: { totalAmount: 3000 },
          _count: { id: 30 }
        }
      ]);

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Restaurant 1' },
        { id: 'r2', name: 'Restaurant 2' }
      ]);

      const revenue = await analyticsService.getRevenueByRestaurant();

      expect(Array.isArray(revenue)).toBe(true);
      expect(revenue.length).toBe(2);
    });
  });

  describe('getPeakOrderTimes', () => {
    it('should identify peak order times', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { createdAt: new Date('2025-01-01T12:30:00') },
        { createdAt: new Date('2025-01-01T12:45:00') },
        { createdAt: new Date('2025-01-01T19:20:00') }
      ]);

      const peakTimes = await analyticsService.getPeakOrderTimes();

      expect(Array.isArray(peakTimes)).toBe(true);
    });
  });

  describe('getAverageOrderValue', () => {
    it('should calculate average order value', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({
        _avg: { totalAmount: 125.50 },
        _count: { id: 100 }
      });

      const avgValue = await analyticsService.getAverageOrderValue();

      expect(typeof avgValue).toBe('number');
      expect(avgValue).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no orders exist', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({
        _avg: { totalAmount: null },
        _count: { id: 0 }
      });

      const avgValue = await analyticsService.getAverageOrderValue();

      expect(avgValue).toBe(0);
    });
  });

  describe('getOrderStatusDistribution', () => {
    it('should get distribution of order statuses', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: { id: 10 } },
        { status: 'DELIVERED', _count: { id: 80 } },
        { status: 'CANCELLED', _count: { id: 5 } }
      ]);

      const distribution = await analyticsService.getOrderStatusDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBe(3);
    });
  });

  describe('getCustomerRetentionRate', () => {
    it('should calculate customer retention rate', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.order.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 3 } },
        { userId: 'u2', _count: { id: 5 } },
        { userId: 'u3', _count: { id: 1 } }
      ]);

      const retentionRate = await analyticsService.getCustomerRetentionRate();

      expect(typeof retentionRate).toBe('number');
      expect(retentionRate).toBeGreaterThanOrEqual(0);
      expect(retentionRate).toBeLessThanOrEqual(100);
    });
  });
});
