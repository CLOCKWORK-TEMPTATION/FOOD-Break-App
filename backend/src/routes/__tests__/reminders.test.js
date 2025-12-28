/**
 * Smoke Tests - Reminders Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('Reminders Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../reminders');
    expect(router).toBeDefined();
  });
});
