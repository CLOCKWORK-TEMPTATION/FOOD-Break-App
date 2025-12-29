/**
 * Smoke Tests - Notifications Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Notifications Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../notifications');
    expect(router).toBeDefined();
  });
});
