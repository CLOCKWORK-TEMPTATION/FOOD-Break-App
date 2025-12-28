const restaurantController = require('../../../src/controllers/restaurantController');
const restaurantService = require('../../../src/services/restaurantService');

jest.mock('../../../src/services/restaurantService');

describe('Restaurant Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getNearbyRestaurants', () => {
    it('should return nearby restaurants', async () => {
      req.query = { latitude: '24.7136', longitude: '46.6753' };
      restaurantService.getNearbyRestaurants.mockResolvedValue([
        { id: '1', name: 'Restaurant A', distance: 1.5 }
      ]);

      await restaurantController.getNearbyRestaurants(req, res, next);

      expect(restaurantService.getNearbyRestaurants).toHaveBeenCalledWith(24.7136, 46.6753, 3);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: '1', name: 'Restaurant A', distance: 1.5 }]
      });
    });

    it('should reject without coordinates', async () => {
      req.query = {};

      await restaurantController.getNearbyRestaurants(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createRestaurant', () => {
    it('should create restaurant', async () => {
      req.body = { name: 'New Restaurant', latitude: 24.7, longitude: 46.6 };
      restaurantService.createRestaurant.mockResolvedValue({ id: '1', name: 'New Restaurant' });

      await restaurantController.createRestaurant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
