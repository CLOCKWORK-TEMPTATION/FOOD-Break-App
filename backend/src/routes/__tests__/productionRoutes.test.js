/**
 * Smoke Tests - Production Routes Alt
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Production Routes Alt - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../productionRoutes');
    expect(router).toBeDefined();
  });
});
