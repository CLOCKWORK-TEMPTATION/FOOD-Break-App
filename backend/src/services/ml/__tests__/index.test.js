/**
 * Smoke Tests - ML Index
 */

jest.mock('@prisma/client');

describe('ML Index - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const mlIndex = require('../index');
    expect(mlIndex).toBeDefined();
  });
});
