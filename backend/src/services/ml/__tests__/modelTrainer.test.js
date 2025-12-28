/**
 * Smoke Tests - Model Trainer
 */

jest.mock('@prisma/client');

describe('ModelTrainer - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load without errors', () => {
    const trainer = require('../modelTrainer');
    expect(trainer).toBeDefined();
  });
});
