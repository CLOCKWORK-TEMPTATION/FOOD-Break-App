/**
 * Smoke Tests - Admin Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Admin Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../admin');
    expect(router).toBeDefined();
  });
});
