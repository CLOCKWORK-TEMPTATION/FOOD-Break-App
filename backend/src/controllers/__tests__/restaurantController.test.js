/**
 * Tests for Restaurant Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/restaurantService');

const restaurantController = require('../restaurantController');
const { PrismaClient } = require('@prisma/client');
const restaurantService = require('../../services/restaurantService');

describe('Restaurant Controller', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
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

  describe('getAllRestaurants', () => {
    it('should get all restaurants with pagination', async () => {
      req.query = { page: '1', limit: '10' };

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Restaurant 1', cuisineType: 'Italian' },
        { id: 'r2', name: 'Restaurant 2', cuisineType: 'Chinese' }
      ]);

      mockPrisma.restaurant.count.mockResolvedValue(2);

      await restaurantController.getAllRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            restaurants: expect.any(Array),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should filter by cuisine type', async () => {
      req.query = { cuisineType: 'Italian' };

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Italian Bistro', cuisineType: 'Italian' }
      ]);

      mockPrisma.restaurant.count.mockResolvedValue(1);

      await restaurantController.getAllRestaurants(req, res);

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cuisineType: 'Italian'
          })
        })
      );
    });

    it('should filter by active status', async () => {
      req.query = { isActive: 'true' };

      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.restaurant.count.mockResolvedValue(0);

      await restaurantController.getAllRestaurants(req, res);

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true
          })
        })
      );
    });
  });

  describe('getRestaurantById', () => {
    it('should get restaurant by ID', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'restaurant123',
        name: 'Test Restaurant',
        cuisineType: 'Italian'
      });

      await restaurantController.getRestaurantById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return 404 if restaurant not found', async () => {
      req.params = { restaurantId: 'invalid_restaurant' };

      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await restaurantController.getRestaurantById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createRestaurant', () => {
    it('should create restaurant', async () => {
      req.body = {
        name: 'New Restaurant',
        cuisineType: 'Italian',
        address: 'Test Address',
        latitude: 30.0444,
        longitude: 31.2357
      };

      mockPrisma.restaurant.create.mockResolvedValue({
        id: 'restaurant123',
        ...req.body
      });

      await restaurantController.createRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant', async () => {
      req.params = { restaurantId: 'restaurant123' };
      req.body = { name: 'Updated Restaurant', isActive: true };

      mockPrisma.restaurant.update.mockResolvedValue({
        id: 'restaurant123',
        ...req.body
      });

      await restaurantController.updateRestaurant(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.restaurant.delete.mockResolvedValue({
        id: 'restaurant123'
      });

      await restaurantController.deleteRestaurant(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('searchRestaurants', () => {
    it('should search restaurants by name', async () => {
      req.query = { search: 'pizza' };

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Pizza Palace' },
        { id: 'r2', name: 'Italian Pizzeria' }
      ]);

      mockPrisma.restaurant.count.mockResolvedValue(2);

      await restaurantController.searchRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getNearbyRestaurants', () => {
    it('should get nearby restaurants', async () => {
      req.query = {
        latitude: '30.0444',
        longitude: '31.2357',
        radius: '5'
      };

      restaurantService.findNearbyRestaurants = jest.fn().mockResolvedValue([
        { id: 'r1', name: 'Nearby Restaurant 1', distance: 2.5 },
        { id: 'r2', name: 'Nearby Restaurant 2', distance: 4.0 }
      ]);

      await restaurantController.getNearbyRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should require location coordinates', async () => {
      req.query = {};

      await restaurantController.getNearbyRestaurants(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRestaurantRatings', () => {
    it('should get restaurant ratings', async () => {
      req.params = { restaurantId: 'restaurant123' };

      restaurantService.getRestaurantRatings = jest.fn().mockResolvedValue({
        averageRating: 4.5,
        totalReviews: 100,
        breakdown: {
          5: 60,
          4: 25,
          3: 10,
          2: 3,
          1: 2
        }
      });

      await restaurantController.getRestaurantRatings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('toggleRestaurantStatus', () => {
    it('should toggle restaurant active status', async () => {
      req.params = { restaurantId: 'restaurant123' };

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'restaurant123',
        isActive: true
      });

      mockPrisma.restaurant.update.mockResolvedValue({
        id: 'restaurant123',
        isActive: false
      });

      await restaurantController.toggleRestaurantStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isActive: false
          })
        })
      );
    });
  });
});
