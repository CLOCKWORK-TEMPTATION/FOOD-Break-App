/**
 * Unit Tests - Analytics Service
 * اختبارات وحدة خدمة التحليلات
 */

const analyticsService = require('../../../src/services/analyticsService');

jest.mock('../../../src/utils/logger');

describe('Analytics Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  // ==========================================
  // Get Dashboard Stats Tests
  // ==========================================
  describe('getDashboardStats', () => {
    it('should get dashboard stats successfully', async () => {
      mockPrisma.order.count
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(5); // pendingOrders

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 15000 }
      });

      mockPrisma.user.count.mockResolvedValue(50);

      const stats = await analyticsService.getDashboardStats();

      expect(stats).toEqual({
        totalOrders: 100,
        totalSpent: 15000,
        activeUsers: 50,
        pendingOrders: 5
      });
    });

    it('should filter stats by project ID', async () => {
      mockPrisma.order.count.mockResolvedValue(50);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });
      mockPrisma.user.count.mockResolvedValue(20);

      await analyticsService.getDashboardStats('project-123');

      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-123' })
        })
      );
    });

    it('should filter stats by date range', async () => {
      mockPrisma.order.count.mockResolvedValue(30);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 3000 } });
      mockPrisma.user.count.mockResolvedValue(15);

      const dateRange = {
        start: '2024-01-01',
        end: '2024-01-31'
      };

      await analyticsService.getDashboardStats(null, dateRange);

      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date(dateRange.start),
              lte: new Date(dateRange.end)
            }
          })
        })
      );
    });

    it('should handle null totalSpent', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });
      mockPrisma.user.count.mockResolvedValue(10);

      const stats = await analyticsService.getDashboardStats();

      expect(stats.totalSpent).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.order.count.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getDashboardStats()).rejects.toThrow('Database error');
    });
  });

  // ==========================================
  // Get Spending Report Tests
  // ==========================================
  describe('getSpendingReport', () => {
    it('should generate daily spending report', async () => {
      const mockOrders = [
        {
          totalAmount: 100,
          createdAt: new Date('2024-01-15T10:00:00'),
          orderType: 'REGULAR'
        },
        {
          totalAmount: 200,
          createdAt: new Date('2024-01-15T14:00:00'),
          orderType: 'EXCEPTION'
        },
        {
          totalAmount: 150,
          createdAt: new Date('2024-01-16T10:00:00'),
          orderType: 'REGULAR'
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      const report = await analyticsService.getSpendingReport('project-123', 'daily', 30);

      expect(report).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: '2024-01-15',
            total: 300,
            regular: 100,
            exception: 200,
            count: 2
          }),
          expect.objectContaining({
            date: '2024-01-16',
            total: 150,
            regular: 150,
            exception: 0,
            count: 1
          })
        ])
      );
    });

    it('should generate weekly spending report', async () => {
      const mockOrders = [
        {
          totalAmount: 100,
          createdAt: new Date('2024-01-15'),
          orderType: 'REGULAR'
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      const report = await analyticsService.getSpendingReport('project-123', 'weekly', 7);

      expect(report[0]).toHaveProperty('date');
      expect(report[0].date).toMatch(/^\d{4}-W\d+$/);
    });

    it('should generate monthly spending report', async () => {
      const mockOrders = [
        {
          totalAmount: 500,
          createdAt: new Date('2024-01-15'),
          orderType: 'REGULAR'
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      const report = await analyticsService.getSpendingReport('project-123', 'monthly', 30);

      expect(report[0].date).toBe('2024-01');
    });

    it('should exclude cancelled orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await analyticsService.getSpendingReport('project-123', 'daily', 30);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['CANCELLED'] }
          })
        })
      );
    });

    it('should return empty array for no orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const report = await analyticsService.getSpendingReport('project-123', 'daily', 30);

      expect(report).toEqual([]);
    });
  });

  // ==========================================
  // Forecast Budget Tests
  // ==========================================
  describe('forecastBudget', () => {
    it('should forecast budget based on historical data', async () => {
      const mockReport = [
        { date: '2024-01-01', total: 100 },
        { date: '2024-01-02', total: 150 },
        { date: '2024-01-03', total: 200 }
      ];

      jest.spyOn(analyticsService, 'getSpendingReport').mockResolvedValue(mockReport);

      const forecast = await analyticsService.forecastBudget('project-123', 7);

      expect(forecast.avgDaily).toBe(150); // (100 + 150 + 200) / 3
      expect(forecast.totalPredicted).toBe(1050); // 150 * 7
      expect(forecast.forecast).toHaveLength(7);
      expect(forecast.forecast[0]).toHaveProperty('date');
      expect(forecast.forecast[0]).toHaveProperty('predicted', 150);
      expect(forecast.forecast[0]).toHaveProperty('confidence');
    });

    it('should return empty forecast for no data', async () => {
      jest.spyOn(analyticsService, 'getSpendingReport').mockResolvedValue([]);

      const forecast = await analyticsService.forecastBudget('project-123', 7);

      expect(forecast).toEqual({
        forecast: [],
        avgDaily: 0
      });
    });

    it('should decrease confidence over time', async () => {
      const mockReport = [{ date: '2024-01-01', total: 100 }];
      jest.spyOn(analyticsService, 'getSpendingReport').mockResolvedValue(mockReport);

      const forecast = await analyticsService.forecastBudget('project-123', 30);

      expect(forecast.forecast[0].confidence).toBeGreaterThan(
        forecast.forecast[29].confidence
      );
    });
  });

  // ==========================================
  // Compare Projects Tests
  // ==========================================
  describe('compareProjects', () => {
    it('should compare multiple projects', async () => {
      mockPrisma.order.count.mockResolvedValue(50);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });
      mockPrisma.projectMember.count.mockResolvedValue(10);
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Project 1' });

      const comparison = await analyticsService.compareProjects(['proj-1', 'proj-2']);

      expect(comparison).toHaveLength(2);
      expect(comparison[0]).toEqual(
        expect.objectContaining({
          projectId: 'proj-1',
          projectName: 'Project 1',
          totalOrders: 50,
          totalSpent: 5000,
          avgPerOrder: 100,
          members: 10,
          avgPerMember: 500
        })
      );
    });

    it('should handle projects with no orders', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });
      mockPrisma.projectMember.count.mockResolvedValue(5);
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Empty Project' });

      const comparison = await analyticsService.compareProjects(['proj-1']);

      expect(comparison[0].avgPerOrder).toBe(0);
      expect(comparison[0].avgPerMember).toBe(0);
    });

    it('should filter by date range', async () => {
      mockPrisma.order.count.mockResolvedValue(10);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000 } });
      mockPrisma.projectMember.count.mockResolvedValue(5);
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Project' });

      const dateRange = { start: '2024-01-01', end: '2024-01-31' };
      await analyticsService.compareProjects(['proj-1'], dateRange);

      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });

  // ==========================================
  // Analyze Exceptions Tests
  // ==========================================
  describe('analyzeExceptions', () => {
    it('should analyze exceptions successfully', async () => {
      const mockExceptions = [
        {
          userId: 'user-1',
          exceptionType: 'DIET',
          totalAmount: 100,
          exceptionAmount: 20,
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe', role: 'VIP' }
        },
        {
          userId: 'user-1',
          exceptionType: 'DIET',
          totalAmount: 150,
          exceptionAmount: 30,
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe', role: 'VIP' }
        },
        {
          userId: 'user-2',
          exceptionType: 'MEDICAL',
          totalAmount: 200,
          exceptionAmount: 50,
          user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', role: 'REGULAR' }
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockExceptions);

      const analysis = await analyticsService.analyzeExceptions('project-123');

      expect(analysis).toEqual({
        total: 3,
        byType: { DIET: 2, MEDICAL: 1 },
        byUser: expect.arrayContaining([
          expect.objectContaining({
            user: expect.objectContaining({ id: 'user-1' }),
            count: 2,
            totalSpent: 250
          }),
          expect.objectContaining({
            user: expect.objectContaining({ id: 'user-2' }),
            count: 1,
            totalSpent: 200
          })
        ]),
        totalCost: 100,
        avgCost: 100 / 3
      });
    });

    it('should sort users by total spent', async () => {
      const mockExceptions = [
        {
          userId: 'user-1',
          exceptionType: 'DIET',
          totalAmount: 100,
          exceptionAmount: 0,
          user: { id: 'user-1', firstName: 'John' }
        },
        {
          userId: 'user-2',
          exceptionType: 'DIET',
          totalAmount: 500,
          exceptionAmount: 0,
          user: { id: 'user-2', firstName: 'Jane' }
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockExceptions);

      const analysis = await analyticsService.analyzeExceptions();

      expect(analysis.byUser[0].totalSpent).toBeGreaterThan(
        analysis.byUser[1].totalSpent
      );
    });
  });

  // ==========================================
  // Get Top Restaurants Tests
  // ==========================================
  describe('getTopRestaurants', () => {
    it('should get top restaurants by order count', async () => {
      const mockGrouped = [
        {
          restaurantId: 'rest-1',
          _count: { id: 100 },
          _sum: { totalAmount: 10000 }
        },
        {
          restaurantId: 'rest-2',
          _count: { id: 50 },
          _sum: { totalAmount: 5000 }
        }
      ];

      const mockRestaurants = [
        { id: 'rest-1', name: 'Restaurant 1', rating: 4.5, cuisineType: 'Italian' },
        { id: 'rest-2', name: 'Restaurant 2', rating: 4.0, cuisineType: 'Egyptian' }
      ];

      mockPrisma.order.groupBy.mockResolvedValue(mockGrouped);
      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const topRestaurants = await analyticsService.getTopRestaurants('project-123', 10);

      expect(topRestaurants).toHaveLength(2);
      expect(topRestaurants[0]).toEqual({
        restaurant: mockRestaurants[0],
        orderCount: 100,
        totalRevenue: 10000,
        avgOrderValue: 100
      });
    });

    it('should limit results', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([]);
      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      await analyticsService.getTopRestaurants(null, 5);

      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  // ==========================================
  // Get Top Menu Items Tests
  // ==========================================
  describe('getTopMenuItems', () => {
    it('should get top menu items by quantity', async () => {
      const mockGrouped = [
        {
          menuItemId: 'item-1',
          _count: { id: 50 },
          _sum: { quantity: 100, price: 5000 }
        }
      ];

      const mockMenuItems = [
        { id: 'item-1', name: 'Pizza', nameAr: 'بيتزا', category: 'Main', price: 50 }
      ];

      mockPrisma.orderItem.groupBy.mockResolvedValue(mockGrouped);
      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const topItems = await analyticsService.getTopMenuItems('project-123', 10);

      expect(topItems).toHaveLength(1);
      expect(topItems[0]).toEqual({
        menuItem: mockMenuItems[0],
        orderCount: 50,
        totalQuantity: 100,
        totalRevenue: 5000
      });
    });

    it('should filter by project', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);
      mockPrisma.menuItem.findMany.mockResolvedValue([]);

      await analyticsService.getTopMenuItems('project-123');

      expect(mockPrisma.orderItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order: { projectId: 'project-123' } }
        })
      );
    });
  });

  // ==========================================
  // Export Report Tests
  // ==========================================
  describe('exportReport', () => {
    it('should export comprehensive report', async () => {
      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue({
        totalOrders: 100,
        totalSpent: 10000
      });
      jest.spyOn(analyticsService, 'getSpendingReport').mockResolvedValue([]);
      jest.spyOn(analyticsService, 'analyzeExceptions').mockResolvedValue({
        total: 5
      });
      jest.spyOn(analyticsService, 'getTopRestaurants').mockResolvedValue([]);
      jest.spyOn(analyticsService, 'getTopMenuItems').mockResolvedValue([]);

      const report = await analyticsService.exportReport('project-123', 'json');

      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('projectId', 'project-123');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('spending');
      expect(report).toHaveProperty('exceptions');
      expect(report).toHaveProperty('topRestaurants');
      expect(report).toHaveProperty('topItems');
    });

    it('should include date range in report', async () => {
      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue({});
      jest.spyOn(analyticsService, 'getSpendingReport').mockResolvedValue([]);
      jest.spyOn(analyticsService, 'analyzeExceptions').mockResolvedValue({});
      jest.spyOn(analyticsService, 'getTopRestaurants').mockResolvedValue([]);
      jest.spyOn(analyticsService, 'getTopMenuItems').mockResolvedValue([]);

      const dateRange = { start: '2024-01-01', end: '2024-01-31' };
      const report = await analyticsService.exportReport('project-123', 'json', dateRange);

      expect(report.dateRange).toEqual(dateRange);
    });

    it('should handle export errors', async () => {
      jest.spyOn(analyticsService, 'getDashboardStats').mockRejectedValue(
        new Error('Export error')
      );

      await expect(
        analyticsService.exportReport('project-123')
      ).rejects.toThrow('Export error');
    });
  });
});
