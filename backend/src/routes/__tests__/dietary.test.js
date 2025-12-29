/**
 * Smoke Tests - Dietary Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Dietary Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../dietary');
    expect(router).toBeDefined();
  });
});
