/**
 * Smoke Tests - Analytics Service
 * اختبارات بسيطة للتغطية السريعة
 */

const analyticsService = require('../analyticsService');

jest.mock('@prisma/client');

describe('AnalyticsService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.order.count.mockResolvedValue(10);
    mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });
    mockPrisma.user.count.mockResolvedValue(50);
    mockPrisma.order.findMany.mockResolvedValue([{
      totalAmount: 100,
      createdAt: new Date(),
      orderType: 'REGULAR'
    }]);
    mockPrisma.order.groupBy.mockResolvedValue([{
      restaurantId: 'rest-1',
      _count: { id: 5 },
      _sum: { totalAmount: 500 }
    }]);
    mockPrisma.restaurant.findMany.mockResolvedValue([{
      id: 'rest-1',
      name: 'Test Restaurant',
      rating: 4.5,
      cuisineType: 'Italian'
    }]);
    mockPrisma.menuItem.findMany.mockResolvedValue([{
      id: 'item-1',
      name: 'Test Item',
      category: 'MAIN'
    }]);
    mockPrisma.orderItem.groupBy.mockResolvedValue([{
      menuItemId: 'item-1',
      _count: { id: 10 },
      _sum: { quantity: 20, price: 200 }
    }]);
    mockPrisma.project.findUnique.mockResolvedValue({ id: '1', name: 'Test Project' });
    mockPrisma.projectMember.count.mockResolvedValue(5);
  });

  it('should call getDashboardStats successfully', async () => {
    const result = await analyticsService.getDashboardStats('project-1');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('totalOrders');
  });

  it('should call getSpendingReport successfully', async () => {
    const result = await analyticsService.getSpendingReport('project-1', 'daily', 30);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should call forecastBudget successfully', async () => {
    const result = await analyticsService.forecastBudget('project-1', 30);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('forecast');
  });

  it('should call compareProjects successfully', async () => {
    const result = await analyticsService.compareProjects(['project-1', 'project-2']);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should call analyzeExceptions successfully', async () => {
    const result = await analyticsService.analyzeExceptions('project-1');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('total');
  });

  it('should call getTopRestaurants successfully', async () => {
    const result = await analyticsService.getTopRestaurants('project-1', 10);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should call getTopMenuItems successfully', async () => {
    const result = await analyticsService.getTopMenuItems('project-1', 10);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should call exportReport successfully', async () => {
    const result = await analyticsService.exportReport('project-1', 'json');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('generatedAt');
  });
});
