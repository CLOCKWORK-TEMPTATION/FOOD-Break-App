/**
 * Smoke Tests - Predictive Index
 */

jest.mock('@prisma/client');

describe('Predictive Index - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const predictiveIndex = require('../index');
    expect(predictiveIndex).toBeDefined();
  });
});
