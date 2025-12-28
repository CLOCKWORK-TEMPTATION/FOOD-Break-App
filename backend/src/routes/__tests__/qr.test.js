/**
 * Smoke Tests - QR Routes
 */

jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

describe('QR Routes - Smoke Tests', () => {
  it('should load without errors', () => {
    const router = require('../qr');
    expect(router).toBeDefined();
  });
});
