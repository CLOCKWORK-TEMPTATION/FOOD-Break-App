/**
 * Smoke Tests - Behavior Analysis Service
 */

jest.mock('@prisma/client');

describe('BehaviorAnalysisService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.userBehavior.findMany.mockResolvedValue([]);
  });

  it('should load without errors', () => {
    const service = require('../behaviorAnalysisService');
    expect(service).toBeDefined();
  });
});
