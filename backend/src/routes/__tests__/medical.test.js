/**
 * Smoke Tests - Medical Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Medical Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../medical');
    expect(router).toBeDefined();
  });
});
