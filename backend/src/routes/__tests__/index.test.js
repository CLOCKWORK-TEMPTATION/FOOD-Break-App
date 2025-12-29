/**
 * Smoke Tests - Index Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Index Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../index');
    expect(router).toBeDefined();
  });
});
