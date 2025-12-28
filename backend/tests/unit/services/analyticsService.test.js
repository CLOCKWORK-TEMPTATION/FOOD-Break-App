/**
 * Unit Tests - Analytics Service
 */

const analyticsService = require('../../../src/services/analyticsService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');

describe('Analytics Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = {
      order: { count: jest.fn(), findMany: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
      user: { count: jest.fn() },
      projectMember: { count: jest.fn() },
      project: { findUnique: jest.fn() },
      restaurant: { findMany: jest.fn() },
      menuItem: { findMany: jest.fn() },
      orderItem: { groupBy: jest.fn() }
    };
    const PrismaClientMock = jest.fn(() => mockPrisma);
    require('@prisma/client').PrismaClient = PrismaClientMock;
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      mockPrisma.order.count.mockResolvedValue(100);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.order.count.mockResolvedValue(10);

      const stats = await analyticsService.getDashboardStats('proj-123');
      expect(stats.totalOrders).toBe(100);
      expect(stats.totalSpent).toBe(5000);
    });

    it('should handle date range filtering', async () => {
      const dateRange = { start: '2025-01-01', end: '2025-12-31' };
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);

      await analyticsService.getDashboardStats('proj-123', dateRange);
      expect(mockPrisma.order.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ createdAt: expect.any(Object) })
      }));
    });
  });

  describe('getSpendingReport', () => {
    it('should return daily spending report', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 100, createdAt: new Date('2025-01-01'), orderType: 'REGULAR' }
      ]);

      const report = await analyticsService.getSpendingReport('proj-123', 'daily', 30);
      expect(report).toEqual(expect.any(Array));
    });

    it('should exclude cancelled orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      await analyticsService.getSpendingReport('proj-123');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: { notIn: ['CANCELLED'] } })
      }));
    });
  });

  describe('forecastBudget', () => {
    it('should return budget forecast', async () => {
      mockPrisma.order.findMany.mockResolvedValue([{ totalAmount: 100, createdAt: new Date() }]);
      const forecast = await analyticsService.forecastBudget('proj-123', 30);
      expect(forecast).toEqual(expect.objectContaining({
        forecast: expect.any(Array),
        avgDaily: expect.any(Number)
      }));
    });

    it('should return empty forecast when no data', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const forecast = await analyticsService.forecastBudget('proj-123', 30);
      expect(forecast).toEqual({ forecast: [], avgDaily: 0 });
    });
  });

  describe('compareProjects', () => {
    it('should compare multiple projects', async () => {
      mockPrisma.order.count.mockResolvedValue(50);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });
      mockPrisma.projectMember.count.mockResolvedValue(10);
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Project A' });

      const comparison = await analyticsService.compareProjects(['proj-1', 'proj-2']);
      expect(comparison).toHaveLength(2);
    });

    it('should calculate averages correctly', async () => {
      mockPrisma.order.count.mockResolvedValue(10);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000 } });
      mockPrisma.projectMember.count.mockResolvedValue(5);
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test' });

      const comparison = await analyticsService.compareProjects(['proj-1']);
      expect(comparison[0].avgPerOrder).toBe(100);
      expect(comparison[0].avgPerMember).toBe(200);
    });
  });

  describe('analyzeExceptions', () => {
    it('should analyze exception orders', async () => {
      const exceptions = [
        { userId: 'user-1', exceptionType: 'SPECIAL', totalAmount: 100, exceptionAmount: 50, user: { id: 'user-1', firstName: 'Test', lastName: 'User', role: 'REGULAR' } }
      ];
      mockPrisma.order.findMany.mockResolvedValue(exceptions);

      const analysis = await analyticsService.analyzeExceptions('proj-123');
      expect(analysis.total).toBe(1);
      expect(analysis.byType).toBeDefined();
      expect(analysis.byUser).toEqual(expect.any(Array));
    });

    it('should handle no exceptions', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const analysis = await analyticsService.analyzeExceptions();
      expect(analysis.total).toBe(0);
    });
  });

  describe('getTopRestaurants', () => {
    it('should return top restaurants', async () => {
      const groups = [{ restaurantId: 'rest-1', _count: { id: 50 }, _sum: { totalAmount: 5000 } }];
      mockPrisma.order.groupBy.mockResolvedValue(groups);
      mockPrisma.restaurant.findMany.mockResolvedValue([{ id: 'rest-1', name: 'Restaurant 1', rating: 4.5, cuisineType: 'Fast Food' }]);

      const topRestaurants = await analyticsService.getTopRestaurants('proj-123', 10);
      expect(topRestaurants).toHaveLength(1);
      expect(topRestaurants[0].orderCount).toBe(50);
    });
  });

  describe('getTopMenuItems', () => {
    it('should return top menu items', async () => {
      const groups = [{ menuItemId: 'menu-1', _count: { id: 30 }, _sum: { quantity: 30, price: 3000 } }];
      mockPrisma.orderItem.groupBy.mockResolvedValue(groups);
      mockPrisma.menuItem.findMany.mockResolvedValue([{ id: 'menu-1', name: 'Burger', nameAr: 'برجر', category: 'Main', price: 100 }]);

      const topItems = await analyticsService.getTopMenuItems('proj-123', 10);
      expect(topItems).toHaveLength(1);
      expect(topItems[0].orderCount).toBe(30);
    });
  });

  describe('exportReport', () => {
    it('should export comprehensive report', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.groupBy.mockResolvedValue([]);
      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);
      mockPrisma.menuItem.findMany.mockResolvedValue([]);

      const report = await analyticsService.exportReport('proj-123', 'json', null);
      expect(report).toEqual(expect.objectContaining({
        generatedAt: expect.any(String),
        projectId: 'proj-123',
        summary: expect.any(Object)
      }));
    });
  });
});
