/**
 * Smoke Tests - Workflow Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Workflow Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../workflow');
    expect(router).toBeDefined();
  });
});
