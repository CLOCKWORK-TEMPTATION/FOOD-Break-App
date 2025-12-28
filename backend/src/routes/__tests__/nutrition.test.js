/**
 * Smoke Tests - Nutrition Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Nutrition Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../nutrition');
    expect(router).toBeDefined();
  });
});
