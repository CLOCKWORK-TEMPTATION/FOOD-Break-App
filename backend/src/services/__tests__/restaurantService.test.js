/**
 * Tests for Restaurant Service
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');
const restaurantService = require('../restaurantService');

describe('Restaurant Service', () => {
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
      },
      review: {
        findMany: jest.fn(),
        aggregate: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('getAllRestaurants', () => {
    it('should get all restaurants', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Restaurant 1', cuisineType: 'Italian' },
        { id: 'r2', name: 'Restaurant 2', cuisineType: 'Chinese' }
      ]);

      const restaurants = await restaurantService.getAllRestaurants();

      expect(Array.isArray(restaurants)).toBe(true);
      expect(restaurants.length).toBe(2);
    });

    it('should filter by active status', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', isActive: true }
      ]);

      await restaurantService.getAllRestaurants({ isActive: true });

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
      const restaurantId = 'restaurant123';

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: restaurantId,
        name: 'Test Restaurant',
        cuisineType: 'Italian'
      });

      const restaurant = await restaurantService.getRestaurantById(
        restaurantId
      );

      expect(restaurant.id).toBe(restaurantId);
    });

    it('should return null if not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      const restaurant = await restaurantService.getRestaurantById(
        'invalid_id'
      );

      expect(restaurant).toBeNull();
    });
  });

  describe('createRestaurant', () => {
    it('should create restaurant successfully', async () => {
      const restaurantData = {
        name: 'New Restaurant',
        cuisineType: 'Italian',
        address: 'Test Address',
        latitude: 30.0444,
        longitude: 31.2357
      };

      mockPrisma.restaurant.create.mockResolvedValue({
        id: 'restaurant123',
        ...restaurantData
      });

      const restaurant = await restaurantService.createRestaurant(
        restaurantData
      );

      expect(restaurant).toHaveProperty('id');
      expect(restaurant.name).toBe('New Restaurant');
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant', async () => {
      const restaurantId = 'restaurant123';
      const updateData = { name: 'Updated Restaurant', isActive: false };

      mockPrisma.restaurant.update.mockResolvedValue({
        id: restaurantId,
        ...updateData
      });

      const updated = await restaurantService.updateRestaurant(
        restaurantId,
        updateData
      );

      expect(updated.name).toBe('Updated Restaurant');
      expect(updated.isActive).toBe(false);
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant', async () => {
      const restaurantId = 'restaurant123';

      mockPrisma.restaurant.delete.mockResolvedValue({
        id: restaurantId
      });

      const deleted = await restaurantService.deleteRestaurant(restaurantId);

      expect(deleted.id).toBe(restaurantId);
    });
  });

  describe('searchRestaurants', () => {
    it('should search restaurants by name', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Pizza Palace' },
        { id: 'r2', name: 'Italian Pizzeria' }
      ]);

      const results = await restaurantService.searchRestaurants('pizza');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });

    it('should search by cuisine type', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', cuisineType: 'Italian' }
      ]);

      const results = await restaurantService.searchRestaurants('Italian');

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('findNearbyRestaurants', () => {
    it('should find nearby restaurants', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([
        {
          id: 'r1',
          name: 'Nearby Restaurant',
          latitude: 30.0500,
          longitude: 31.2400
        }
      ]);

      const nearby = await restaurantService.findNearbyRestaurants(
        30.0444,
        31.2357,
        5
      );

      expect(Array.isArray(nearby)).toBe(true);
    });
  });

  describe('getRestaurantRatings', () => {
    it('should get restaurant ratings', async () => {
      const restaurantId = 'restaurant123';

      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { id: 100 }
      });

      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 3 }
      ]);

      const ratings = await restaurantService.getRestaurantRatings(
        restaurantId
      );

      expect(ratings).toHaveProperty('averageRating');
      expect(ratings).toHaveProperty('totalReviews');
      expect(ratings.averageRating).toBe(4.5);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { latitude: 30.0444, longitude: 31.2357 };
      const point2 = { latitude: 30.0626, longitude: 31.2497 };

      const distance = restaurantService.calculateDistance(
        point1.latitude,
        point1.longitude,
        point2.latitude,
        point2.longitude
      );

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it('should return 0 for same location', () => {
      const distance = restaurantService.calculateDistance(
        30.0444,
        31.2357,
        30.0444,
        31.2357
      );

      expect(distance).toBe(0);
    });
  });

  describe('toggleRestaurantStatus', () => {
    it('should toggle active status', async () => {
      const restaurantId = 'restaurant123';

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: restaurantId,
        isActive: true
      });

      mockPrisma.restaurant.update.mockResolvedValue({
        id: restaurantId,
        isActive: false
      });

      const updated = await restaurantService.toggleRestaurantStatus(
        restaurantId
      );

      expect(updated.isActive).toBe(false);
    });
  });

  describe('getRestaurantStatistics', () => {
    it('should get restaurant statistics', async () => {
      const restaurantId = 'restaurant123';

      const stats = await restaurantService.getRestaurantStatistics(
        restaurantId
      );

      expect(stats).toHaveProperty('totalOrders');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averageRating');
    });
  });
});
