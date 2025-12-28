/**
 * Tests for Analytics Controller
 */

jest.mock('../../services/analyticsService');
jest.mock('@prisma/client');

const analyticsController = require('../analyticsController');
const analyticsService = require('../../services/analyticsService');

describe('Analytics Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'ADMIN' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getOverallStats', () => {
    it('should get overall statistics', async () => {
      analyticsService.getOverallStats = jest.fn().mockResolvedValue({
        totalOrders: 1000,
        totalUsers: 500,
        totalRevenue: 50000
      });

      await analyticsController.getOverallStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getOrderStats', () => {
    it('should get order statistics by period', async () => {
      req.query = { period: 'week', count: '4' };

      analyticsService.getOrderStatsByPeriod = jest.fn().mockResolvedValue([
        { date: '2025-01-01', orders: 50, revenue: 2500 },
        { date: '2025-01-08', orders: 60, revenue: 3000 }
      ]);

      await analyticsController.getOrderStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getTopRestaurants', () => {
    it('should get top performing restaurants', async () => {
      req.query = { limit: '10' };

      analyticsService.getTopRestaurants = jest.fn().mockResolvedValue([
        { restaurantId: 'r1', name: 'Restaurant 1', revenue: 10000 },
        { restaurantId: 'r2', name: 'Restaurant 2', revenue: 8000 }
      ]);

      await analyticsController.getTopRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getUserGrowth', () => {
    it('should get user growth statistics', async () => {
      req.query = { days: '30' };

      analyticsService.getUserGrowth = jest.fn().mockResolvedValue([
        { date: '2025-01-01', newUsers: 10 },
        { date: '2025-01-02', newUsers: 15 }
      ]);

      await analyticsController.getUserGrowth(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should get revenue analytics', async () => {
      analyticsService.getRevenueByRestaurant = jest.fn().mockResolvedValue([
        { restaurantId: 'r1', revenue: 5000 }
      ]);

      await analyticsController.getRevenueAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });
});
