/**
 * Smoke Tests - Projects Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Projects Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../projects');
    expect(router).toBeDefined();
  });
});
