/**
 * Smoke Tests - Analytics Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Analytics Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../analytics');
    expect(router).toBeDefined();
  });
});
