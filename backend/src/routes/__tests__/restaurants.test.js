/**
 * Smoke Tests - Restaurants Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Restaurants Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../restaurants');
    expect(router).toBeDefined();
  });
});
