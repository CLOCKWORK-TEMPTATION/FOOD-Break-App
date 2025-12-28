/**
 * Tests for Menu Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/menuService');

const menuController = require('../menuController');
const { PrismaClient } = require('@prisma/client');
const menuService = require('../../services/menuService');

describe('Menu Controller', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      menuItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      restaurant: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

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

  describe('getRestaurantMenu', () => {
    it('should get menu items for restaurant', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Pizza', price: 150 },
        { id: 'item2', name: 'Burger', price: 100 }
      ]);

      await menuController.getRestaurantMenu(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should filter by availability', async () => {
      req.params = { restaurantId: 'restaurant123' };
      req.query = { isAvailable: 'true' };

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Pizza', isAvailable: true }
      ]);

      await menuController.getRestaurantMenu(req, res);

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: 'restaurant123',
            isAvailable: true
          })
        })
      );
    });
  });

  describe('getMenuItem', () => {
    it('should get menu item by ID', async () => {
      req.params = { menuItemId: 'item123' };

      mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: 'item123',
        name: 'Pizza',
        price: 150
      });

      await menuController.getMenuItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return 404 if item not found', async () => {
      req.params = { menuItemId: 'invalid_item' };

      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await menuController.getMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createMenuItem', () => {
    it('should create menu item', async () => {
      req.body = {
        restaurantId: 'restaurant123',
        name: 'New Pizza',
        description: 'Delicious pizza',
        price: 150,
        category: 'Main Course'
      };

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'restaurant123',
        name: 'Restaurant 1'
      });

      mockPrisma.menuItem.create.mockResolvedValue({
        id: 'item123',
        ...req.body
      });

      await menuController.createMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('updateMenuItem', () => {
    it('should update menu item', async () => {
      req.params = { menuItemId: 'item123' };
      req.body = { name: 'Updated Pizza', price: 175 };

      mockPrisma.menuItem.update.mockResolvedValue({
        id: 'item123',
        ...req.body
      });

      await menuController.updateMenuItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete menu item', async () => {
      req.params = { menuItemId: 'item123' };

      mockPrisma.menuItem.delete.mockResolvedValue({
        id: 'item123'
      });

      await menuController.deleteMenuItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('toggleAvailability', () => {
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

      await menuController.toggleAvailability(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isAvailable: false
          })
        })
      );
    });
  });

  describe('searchMenuItems', () => {
    it('should search menu items', async () => {
      req.query = { search: 'pizza' };

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Margherita Pizza', price: 120 },
        { id: 'item2', name: 'Pepperoni Pizza', price: 140 }
      ]);

      await menuController.searchMenuItems(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getMenuItemsByCategory', () => {
    it('should get menu items by category', async () => {
      req.params = { restaurantId: 'restaurant123' };
      req.query = { category: 'Main Course' };

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', category: 'Main Course', name: 'Pizza' }
      ]);

      await menuController.getMenuItemsByCategory(req, res);

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: 'restaurant123',
            category: 'Main Course'
          })
        })
      );
    });
  });
});
