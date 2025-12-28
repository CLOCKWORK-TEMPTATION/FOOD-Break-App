/**
 * Analytics Controller Unit Tests
 * اختبارات وحدة متحكم التحليلات
 */

const analyticsController = require('../../../src/controllers/analyticsController');
const analyticsService = require('../../../src/services/analyticsService');

jest.mock('../../../src/services/analyticsService');

describe('Analytics Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id', role: 'ADMIN' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalUsers: 1500,
        totalOrders: 5000,
        totalRevenue: 250000,
        activeRestaurants: 75,
        todayOrders: 150
      };

      analyticsService.getDashboardStats.mockResolvedValue(mockStats);

      await analyticsController.getDashboardStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should filter by date range', async () => {
      mockReq.query.startDate = '2025-01-01';
      mockReq.query.endDate = '2025-12-31';

      analyticsService.getDashboardStats.mockResolvedValue({});

      await analyticsController.getDashboardStats(mockReq, mockRes, mockNext);

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      );
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        total: 5000,
        pending: 50,
        confirmed: 150,
        preparing: 100,
        delivered: 4500,
        cancelled: 200
      };

      analyticsService.getOrderStats.mockResolvedValue(mockStats);

      await analyticsController.getOrderStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue statistics', async () => {
      const mockStats = {
        totalRevenue: 250000,
        averageOrderValue: 50,
        revenueByRestaurant: [
          { restaurantId: 'r1', revenue: 50000 },
          { restaurantId: 'r2', revenue: 30000 }
        ],
        dailyRevenue: [
          { date: '2025-01-01', revenue: 5000 },
          { date: '2025-01-02', revenue: 5500 }
        ]
      };

      analyticsService.getRevenueStats.mockResolvedValue(mockStats);

      await analyticsController.getRevenueStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalUsers: 1500,
        activeUsers: 1200,
        newUsersThisMonth: 150,
        usersByRole: {
          REGULAR: 1200,
          VIP: 200,
          ADMIN: 50,
          PRODUCER: 50
        }
      };

      analyticsService.getUserStats.mockResolvedValue(mockStats);

      await analyticsController.getUserStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getRestaurantStats', () => {
    it('should return restaurant statistics', async () => {
      const mockStats = {
        totalRestaurants: 75,
        activeRestaurants: 60,
        averageRating: 4.3,
        topRestaurants: [
          { id: 'r1', name: 'مطعم 1', orders: 500 },
          { id: 'r2', name: 'مطعم 2', orders: 450 }
        ]
      };

      analyticsService.getRestaurantStats.mockResolvedValue(mockStats);

      await analyticsController.getRestaurantStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPopularItems', () => {
    it('should return popular menu items', async () => {
      const mockItems = [
        { menuItemId: 'm1', name: 'طبق شعبي', orderCount: 300 },
        { menuItemId: 'm2', name: 'أرز بالخضار', orderCount: 250 }
      ];

      mockReq.query.limit = '10';

      analyticsService.getPopularItems.mockResolvedValue(mockItems);

      await analyticsController.getPopularItems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(analyticsService.getPopularItems).toHaveBeenCalledWith(10);
    });
  });

  describe('getRecommendationStats', () => {
    it('should return recommendation statistics', async () => {
      const mockStats = {
        totalRecommendations: 5000,
        acceptedRecommendations: 3000,
        acceptanceRate: 0.6,
        recommendationTypes: {
          PERSONALIZED: 2000,
          WEATHER_BASED: 1500,
          TRENDING: 1000,
          SIMILAR_ITEMS: 500
        }
      };

      analyticsService.getRecommendationStats.mockResolvedValue(mockStats);

      await analyticsController.getRecommendationStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getNutritionStats', () => {
    it('should return nutrition statistics', async () => {
      const mockStats = {
        averageDailyCalories: 2000,
        averageDailyProtein: 150,
        usersWithGoals: 500,
        goalAchievementRate: 0.75
      };

      analyticsService.getNutritionStats.mockResolvedValue(mockStats);

      await analyticsController.getNutritionStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getFinancialReport', () => {
    it('should return financial report', async () => {
      const mockReport = {
        period: 'monthly',
        totalRevenue: 50000,
        totalCosts: 30000,
        netProfit: 20000,
        profitMargin: 0.4,
        breakdown: {
          orders: 45000,
          exceptions: 5000
        }
      };

      mockReq.query.period = 'monthly';
      mockReq.query.month = '1';
      mockReq.query.year = '2025';

      analyticsService.getFinancialReport.mockResolvedValue(mockReport);

      await analyticsController.getFinancialReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('exportReport', () => {
    it('should export report as PDF', async () => {
      const mockReport = {
        buffer: Buffer.from('test'),
        filename: 'report-2025-01.pdf'
      };

      mockReq.query.type = 'financial';
      mockReq.query.format = 'pdf';

      analyticsService.exportReport.mockResolvedValue(mockReport);

      await analyticsController.exportReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should export report as Excel', async () => {
      const mockReport = {
        buffer: Buffer.from('test'),
        filename: 'report-2025-01.xlsx'
      };

      mockReq.query.type = 'orders';
      mockReq.query.format = 'excel';

      analyticsService.exportReport.mockResolvedValue(mockReport);

      await analyticsController.exportReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getRealTimeStats', () => {
    it('should return real-time statistics', async () => {
      const mockStats = {
        activeOrders: 25,
        onlineUsers: 150,
        pendingNotifications: 50,
        serverLoad: 0.45
      };

      analyticsService.getRealTimeStats.mockResolvedValue(mockStats);

      await analyticsController.getRealTimeStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCustomReport', () => {
    it('should generate custom report', async () => {
      const mockReport = {
        metrics: ['orders', 'revenue', 'users'],
        data: {},
        generatedAt: new Date()
      };

      mockReq.body = {
        metrics: ['orders', 'revenue', 'users'],
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        groupBy: 'month'
      };

      analyticsService.generateCustomReport.mockResolvedValue(mockReport);

      await analyticsController.getCustomReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should validate required metrics', async () => {
      mockReq.body = {
        // Missing metrics
      };

      await analyticsController.getCustomReport(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getComparisonReport', () => {
    it('should compare two periods', async () => {
      const mockComparison = {
        period1: {
          start: '2025-01-01',
          end: '2025-01-31',
          orders: 1000,
          revenue: 50000
        },
        period2: {
          start: '2025-02-01',
          end: '2025-02-28',
          orders: 1200,
          revenue: 60000
        },
        changes: {
          orders: '+20%',
          revenue: '+20%'
        }
      };

      mockReq.query.period1Start = '2025-01-01';
      mockReq.query.period1End = '2025-01-31';
      mockReq.query.period2Start = '2025-02-01';
      mockReq.query.period2End = '2025-02-28';

      analyticsService.getComparisonReport.mockResolvedValue(mockComparison);

      await analyticsController.getComparisonReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
