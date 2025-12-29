/**
 * Smoke Tests - Predictive Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Predictive Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../predictive');
    expect(router).toBeDefined();
  });
});
