/**
 * Smoke Tests - Emergency Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Emergency Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../emergency');
    expect(router).toBeDefined();
  });
});
