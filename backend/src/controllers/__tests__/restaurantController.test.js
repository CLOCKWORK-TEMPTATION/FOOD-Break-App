/**
 * Smoke Tests - Restaurant Controller
 */

jest.mock('@prisma/client');

const restaurantController = require('../restaurantController');

describe('RestaurantController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'user-1' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it('should load without errors', () => {
    expect(restaurantController).toBeDefined();
  });
});
