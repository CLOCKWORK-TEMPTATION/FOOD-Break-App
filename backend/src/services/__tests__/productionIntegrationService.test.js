/**
 * Tests for Production Integration Service
 */

jest.mock('@prisma/client');
jest.mock('../notificationService');

const { PrismaClient } = require('@prisma/client');
const productionIntegrationService = require('../productionIntegrationService');
const notificationService = require('../notificationService');

describe('Production Integration Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
      },
      restaurant: {
        findUnique: jest.fn()
      },
      productionReport: {
        create: jest.fn(),
        findMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
    notificationService.notifyProducers = jest.fn().mockResolvedValue();
  });

  describe('aggregateProjectOrders', () => {
    it('should aggregate orders for a project', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Film Production'
      });

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          restaurantId: 'r1',
          totalAmount: 500,
          items: [
            {
              menuItemId: 'item1',
              quantity: 10,
              price: 50,
              menuItem: { id: 'item1', name: 'Pizza' }
            }
          ],
          restaurant: { id: 'r1', name: 'Restaurant 1' }
        },
        {
          id: 'order2',
          restaurantId: 'r1',
          totalAmount: 300,
          items: [
            {
              menuItemId: 'item1',
              quantity: 6,
              price: 50,
              menuItem: { id: 'item1', name: 'Pizza' }
            }
          ],
          restaurant: { id: 'r1', name: 'Restaurant 1' }
        }
      ]);

      const aggregated = await productionIntegrationService.aggregateProjectOrders(
        projectId
      );

      expect(aggregated).toHaveProperty('projectId');
      expect(aggregated).toHaveProperty('totalOrders');
      expect(aggregated).toHaveProperty('totalAmount');
      expect(aggregated).toHaveProperty('byRestaurant');
      expect(aggregated.totalOrders).toBe(2);
      expect(aggregated.totalAmount).toBe(800);
    });

    it('should handle project with no orders', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Empty Project'
      });

      mockPrisma.order.findMany.mockResolvedValue([]);

      const aggregated = await productionIntegrationService.aggregateProjectOrders(
        projectId
      );

      expect(aggregated.totalOrders).toBe(0);
      expect(aggregated.totalAmount).toBe(0);
    });
  });

  describe('generateProductionReport', () => {
    it('should generate production report', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Film Production',
        startDate: new Date(),
        location: 'Cairo'
      });

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          totalAmount: 500,
          status: 'DELIVERED',
          items: [{ quantity: 10 }]
        }
      ]);

      mockPrisma.productionReport.create.mockResolvedValue({
        id: 'report123',
        projectId,
        totalOrders: 1,
        totalAmount: 500
      });

      const report = await productionIntegrationService.generateProductionReport(
        projectId
      );

      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('projectId');
      expect(report).toHaveProperty('totalOrders');
      expect(report).toHaveProperty('totalAmount');
    });
  });

  describe('getProjectStatistics', () => {
    it('should get comprehensive project statistics', async () => {
      const projectId = 'project123';

      mockPrisma.order.count.mockResolvedValue(50);

      mockPrisma.order.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: { id: 10 } },
        { status: 'DELIVERED', _count: { id: 35 } },
        { status: 'CANCELLED', _count: { id: 5 } }
      ]);

      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 100 },
        { totalAmount: 150 },
        { totalAmount: 200 }
      ]);

      const stats = await productionIntegrationService.getProjectStatistics(
        projectId
      );

      expect(stats).toHaveProperty('totalOrders');
      expect(stats).toHaveProperty('statusBreakdown');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averageOrderValue');
    });
  });

  describe('getActiveProjects', () => {
    it('should get all active projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'project1', name: 'Project 1', isActive: true },
        { id: 'project2', name: 'Project 2', isActive: true }
      ]);

      const projects = await productionIntegrationService.getActiveProjects();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBe(2);
    });
  });

  describe('notifyProducersAboutOrders', () => {
    it('should notify producers about new orders', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Film Production'
      });

      mockPrisma.order.findMany.mockResolvedValue([
        { id: 'order1', status: 'PENDING' },
        { id: 'order2', status: 'PENDING' }
      ]);

      const result = await productionIntegrationService.notifyProducersAboutOrders(
        projectId
      );

      expect(result).toHaveProperty('notificationsSent');
      expect(notificationService.notifyProducers).toHaveBeenCalled();
    });
  });

  describe('calculateProjectCosts', () => {
    it('should calculate total project costs', async () => {
      const projectId = 'project123';

      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 500, status: 'DELIVERED' },
        { totalAmount: 300, status: 'DELIVERED' },
        { totalAmount: 200, status: 'CANCELLED' }
      ]);

      const costs = await productionIntegrationService.calculateProjectCosts(
        projectId
      );

      expect(costs).toHaveProperty('totalCost');
      expect(costs).toHaveProperty('deliveredCost');
      expect(costs).toHaveProperty('cancelledCost');
      expect(costs.totalCost).toBe(1000);
      expect(costs.deliveredCost).toBe(800);
    });
  });

  describe('getRestaurantPerformance', () => {
    it('should get restaurant performance metrics', async () => {
      const projectId = 'project123';

      mockPrisma.order.findMany.mockResolvedValue([
        {
          restaurantId: 'r1',
          status: 'DELIVERED',
          totalAmount: 500,
          deliveredAt: new Date(),
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
        },
        {
          restaurantId: 'r1',
          status: 'DELIVERED',
          totalAmount: 300,
          deliveredAt: new Date(),
          createdAt: new Date(Date.now() - 40 * 60 * 1000) // 40 min ago
        }
      ]);

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        name: 'Restaurant 1'
      });

      const performance = await productionIntegrationService.getRestaurantPerformance(
        projectId,
        'r1'
      );

      expect(performance).toHaveProperty('restaurantId');
      expect(performance).toHaveProperty('totalOrders');
      expect(performance).toHaveProperty('totalRevenue');
      expect(performance).toHaveProperty('averageDeliveryTime');
    });
  });

  describe('exportProjectData', () => {
    it('should export project data in CSV format', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Film Production'
      });

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          userId: 'user1',
          totalAmount: 500,
          status: 'DELIVERED',
          createdAt: new Date()
        }
      ]);

      const csvData = await productionIntegrationService.exportProjectData(
        projectId,
        'csv'
      );

      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('orderId');
    });

    it('should export project data in JSON format', async () => {
      const projectId = 'project123';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Film Production'
      });

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          totalAmount: 500
        }
      ]);

      const jsonData = await productionIntegrationService.exportProjectData(
        projectId,
        'json'
      );

      expect(jsonData).toHaveProperty('project');
      expect(jsonData).toHaveProperty('orders');
    });
  });

  describe('trackOrderDeliveryTimes', () => {
    it('should track delivery times for orders', async () => {
      const projectId = 'project123';

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          createdAt: new Date('2025-01-01T12:00:00'),
          deliveredAt: new Date('2025-01-01T12:30:00'),
          status: 'DELIVERED'
        },
        {
          id: 'order2',
          createdAt: new Date('2025-01-01T13:00:00'),
          deliveredAt: new Date('2025-01-01T13:45:00'),
          status: 'DELIVERED'
        }
      ]);

      const deliveryTimes = await productionIntegrationService.trackOrderDeliveryTimes(
        projectId
      );

      expect(deliveryTimes).toHaveProperty('averageTime');
      expect(deliveryTimes).toHaveProperty('minTime');
      expect(deliveryTimes).toHaveProperty('maxTime');
      expect(deliveryTimes).toHaveProperty('orders');
    });
  });
});
