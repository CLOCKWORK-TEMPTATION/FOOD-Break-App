/**
 * Smoke Tests - Voice Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Voice Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../voice');
    expect(router).toBeDefined();
  });
});
