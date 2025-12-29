/**
 * Smoke Tests - Food Label Service
 */

jest.mock('@prisma/client');

describe('FoodLabelService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const service = require('../foodLabelService');
    expect(service).toBeDefined();
  });
});
