/**
 * Smoke Tests - ML Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('ML Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../mlRoutes');
    expect(router).toBeDefined();
  });
});
