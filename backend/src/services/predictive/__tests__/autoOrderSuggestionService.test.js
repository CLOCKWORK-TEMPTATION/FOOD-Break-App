/**
 * Smoke Tests - Auto Order Suggestion Service
 */

jest.mock('@prisma/client');

describe('AutoOrderSuggestionService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.order.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../autoOrderSuggestionService');
    expect(service).toBeDefined();
  });
});
