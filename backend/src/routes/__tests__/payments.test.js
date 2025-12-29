/**
 * Smoke Tests - Payments Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Payments Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../payments');
    expect(router).toBeDefined();
  });
});
