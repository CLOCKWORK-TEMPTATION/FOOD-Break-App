/**
 * Smoke Tests - Budgets Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Budgets Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../budgets');
    expect(router).toBeDefined();
  });
});
