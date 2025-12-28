/**
 * Smoke Tests - Menus Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Menus Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../menus');
    expect(router).toBeDefined();
  });
});
