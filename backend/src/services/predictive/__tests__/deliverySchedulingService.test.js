/**
 * Smoke Tests - Delivery Scheduling Service
 */

jest.mock('@prisma/client');

describe('DeliverySchedulingService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const service = require('../deliverySchedulingService');
    expect(service).toBeDefined();
  });
});
