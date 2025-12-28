/**
 * Smoke Tests - Custom Order Message Service
 */

jest.mock('@prisma/client');

describe('CustomOrderMessageService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const service = require('../customOrderMessageService');
    expect(service).toBeDefined();
  });
});
