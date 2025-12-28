/**
 * Tests for Admin Controller
 */

jest.mock('@prisma/client');
jest.mock('../../utils/logger');

const adminController = require('../adminController');
const { PrismaClient } = require('@prisma/client');

describe('Admin Controller', () => {
  let req, res;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
      },
      menuItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      user: {
        findMany: jest.fn()
      },
      notification: {
        createMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    req = {
      user: { id: 'admin123', role: 'ADMIN' },
      params: {},
      query: {},
      body: {},
      t: (key, data) => key
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getDashboardStats', () => {
    it('should get dashboard statistics', async () => {
      mockPrisma.order.count.mockResolvedValueOnce(100); // totalOrders
      mockPrisma.order.count.mockResolvedValueOnce(15);  // pendingOrders
      mockPrisma.order.count.mockResolvedValueOnce(75);  // completedOrders
      mockPrisma.order.count.mockResolvedValueOnce(10);  // cancelledOrders
      mockPrisma.order.count.mockResolvedValueOnce(5);   // todayOrders

      mockPrisma.order.findMany.mockResolvedValueOnce([
        { totalAmount: 100 },
        { totalAmount: 150 },
        { totalAmount: 200 }
      ]); // todayOrdersData

      mockPrisma.order.findMany.mockResolvedValueOnce([
        { totalAmount: 500 },
        { totalAmount: 750 },
        { totalAmount: 1000 }
      ]); // allOrders

      await adminController.getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalOrders: expect.any(Number),
            pendingOrders: expect.any(Number),
            completedOrders: expect.any(Number),
            totalRevenue: expect.any(Number),
            avgOrderValue: expect.any(Number)
          })
        })
      );
    });

    it('should filter by date range', async () => {
      req.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await adminController.getDashboardStats(req, res);

      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });

  describe('getAdminOrders', () => {
    it('should get all orders with pagination', async () => {
      req.query = { page: '1', limit: '20' };

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          userId: 'user1',
          restaurantId: 'restaurant1',
          totalAmount: 100,
          status: 'PENDING',
          createdAt: new Date(),
          user: { id: 'user1', firstName: 'John', lastName: 'Doe' },
          restaurant: { id: 'restaurant1', name: 'Restaurant 1' },
          items: []
        }
      ]);

      mockPrisma.order.count.mockResolvedValue(1);

      await adminController.getAdminOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: expect.any(Array),
            total: 1
          })
        })
      );
    });

    it('should filter by status and restaurant', async () => {
      req.query = {
        status: 'PENDING',
        restaurantId: 'restaurant123'
      };

      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await adminController.getAdminOrders(req, res);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            restaurantId: 'restaurant123'
          })
        })
      );
    });
  });

  describe('getOrderById', () => {
    it('should get order by ID', async () => {
      req.params = { orderId: 'order123' };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order123',
        userId: 'user1',
        status: 'PENDING',
        user: {},
        restaurant: {},
        items: []
      });

      await adminController.getOrderById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return 404 for non-existent order', async () => {
      req.params = { orderId: 'invalid_order' };

      mockPrisma.order.findUnique.mockResolvedValue(null);

      await adminController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      req.params = { orderId: 'order123' };
      req.body = { status: 'CONFIRMED', notes: 'Order confirmed' };

      mockPrisma.order.update.mockResolvedValue({
        id: 'order123',
        status: 'CONFIRMED',
        user: {},
        restaurant: {}
      });

      await adminController.updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getPendingOrders', () => {
    it('should get pending orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          status: 'PENDING',
          user: {},
          restaurant: {},
          items: []
        }
      ]);

      await adminController.getPendingOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getRestaurants', () => {
    it('should get all restaurants', async () => {
      req.query = { page: '1', limit: '20' };

      mockPrisma.restaurant.findMany.mockResolvedValue([
        {
          id: 'restaurant1',
          name: 'Restaurant 1',
          cuisineType: 'Italian',
          isActive: true
        }
      ]);

      mockPrisma.restaurant.count.mockResolvedValue(1);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await adminController.getRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            restaurants: expect.any(Array),
            total: 1
          })
        })
      );
    });

    it('should filter by isActive and search', async () => {
      req.query = {
        isActive: 'true',
        search: 'Italian'
      };

      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.restaurant.count.mockResolvedValue(0);

      await adminController.getRestaurants(req, res);

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            OR: expect.any(Array)
          })
        })
      );
    });
  });

  describe('toggleRestaurantStatus', () => {
    it('should toggle restaurant status', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'restaurant123',
        isActive: true
      });

      mockPrisma.restaurant.update.mockResolvedValue({
        id: 'restaurant123',
        isActive: false
      });

      await adminController.toggleRestaurantStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return 404 for non-existent restaurant', async () => {
      req.params = { restaurantId: 'invalid_restaurant' };

      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await adminController.toggleRestaurantStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getRestaurantMenu', () => {
    it('should get restaurant menu', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Item 1', category: 'Appetizer' },
        { id: 'item2', name: 'Item 2', category: 'Main Course' }
      ]);

      await adminController.getRestaurantMenu(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('updateMenuItem', () => {
    it('should update menu item', async () => {
      req.params = { menuItemId: 'item123' };
      req.body = {
        name: 'Updated Item',
        price: 25
      };

      mockPrisma.menuItem.update.mockResolvedValue({
        id: 'item123',
        ...req.body
      });

      await adminController.updateMenuItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('toggleMenuItemAvailability', () => {
    it('should toggle menu item availability', async () => {
      req.params = { menuItemId: 'item123' };

      mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: 'item123',
        isAvailable: true
      });

      mockPrisma.menuItem.update.mockResolvedValue({
        id: 'item123',
        isAvailable: false
      });

      await adminController.toggleMenuItemAvailability(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return 404 for non-existent item', async () => {
      req.params = { menuItemId: 'invalid_item' };

      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await adminController.toggleMenuItemAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to all users', async () => {
      req.body = {
        type: 'ANNOUNCEMENT',
        recipients: 'all',
        title: 'Important Announcement',
        message: 'Please read this'
      };

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user1' },
        { id: 'user2' },
        { id: 'user3' }
      ]);

      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

      await adminController.sendNotification(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sent: 3
          })
        })
      );
    });

    it('should send notification to active order users', async () => {
      req.body = {
        type: 'ORDER_UPDATE',
        recipients: 'active_orders',
        title: 'Order Update',
        message: 'Your order is being prepared'
      };

      mockPrisma.order.findMany.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' }
      ]);

      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      await adminController.sendNotification(req, res);

      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });

    it('should send notification to specific users', async () => {
      req.body = {
        type: 'CUSTOM',
        recipients: 'specific',
        userIds: ['user1', 'user2', 'user3'],
        title: 'Test Notification',
        message: 'Test message'
      };

      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

      await adminController.sendNotification(req, res);

      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });
  });
});
