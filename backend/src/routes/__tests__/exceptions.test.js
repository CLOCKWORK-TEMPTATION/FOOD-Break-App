/**
 * Smoke Tests - Exceptions Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Exceptions Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../exceptions');
    expect(router).toBeDefined();
  });
});
