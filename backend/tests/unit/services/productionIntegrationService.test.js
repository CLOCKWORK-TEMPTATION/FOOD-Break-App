/**
 * Production Integration Service Tests
 * اختبارات خدمة التكامل الإنتاجي
 */

const productionIntegrationService = require('../../../src/services/productionIntegrationService');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Production Integration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.mockPrisma.productionEvent = {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    };

    global.mockPrisma.project = {
      findUnique: jest.fn(),
      update: jest.fn()
    };
  });

  describe('createProductionEvent', () => {
    it('should create production event', async () => {
      const eventData = {
        projectId: 'project-123',
        type: 'FILMING_START',
        description: 'Production started',
        metadata: { crew: 50 }
      };

      const mockEvent = {
        id: 'event-123',
        ...eventData,
        createdAt: new Date()
      };

      global.mockPrisma.productionEvent.create.mockResolvedValue(mockEvent);

      const result = await productionIntegrationService.createProductionEvent(eventData);

      expect(result).toEqual(mockEvent);
      expect(global.mockPrisma.productionEvent.create).toHaveBeenCalledWith({
        data: eventData
      });
    });

    it('should handle missing metadata', async () => {
      const eventData = {
        projectId: 'project-123',
        type: 'FILMING_END'
      };

      const mockEvent = {
        id: 'event-123',
        ...eventData,
        metadata: null
      };

      global.mockPrisma.productionEvent.create.mockResolvedValue(mockEvent);

      const result = await productionIntegrationService.createProductionEvent(eventData);

      expect(result).toBeDefined();
    });
  });

  describe('getProjectEvents', () => {
    it('should return events for a project', async () => {
      const projectId = 'project-123';
      const mockEvents = [
        { id: 'event-1', type: 'FILMING_START', createdAt: new Date() },
        { id: 'event-2', type: 'BREAK_TIME', createdAt: new Date() }
      ];

      global.mockPrisma.productionEvent.findMany.mockResolvedValue(mockEvents);

      const result = await productionIntegrationService.getProjectEvents(projectId);

      expect(result).toEqual(mockEvents);
      expect(global.mockPrisma.productionEvent.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter events by type', async () => {
      const projectId = 'project-123';
      const eventType = 'FILMING_START';

      global.mockPrisma.productionEvent.findMany.mockResolvedValue([]);

      await productionIntegrationService.getProjectEvents(projectId, eventType);

      expect(global.mockPrisma.productionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId,
            type: eventType
          })
        })
      );
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const projectId = 'project-123';
      const status = 'ACTIVE';

      const mockProject = {
        id: projectId,
        status,
        updatedAt: new Date()
      };

      global.mockPrisma.project.update.mockResolvedValue(mockProject);

      const result = await productionIntegrationService.updateProjectStatus(projectId, status);

      expect(result).toEqual(mockProject);
      expect(global.mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { status }
      });
    });

    it('should handle invalid status', async () => {
      const projectId = 'project-123';
      const status = 'INVALID_STATUS';

      global.mockPrisma.project.update.mockRejectedValue(new Error('Invalid status'));

      await expect(
        productionIntegrationService.updateProjectStatus(projectId, status)
      ).rejects.toThrow('Invalid status');
    });
  });

  describe('getProductionStats', () => {
    it('should return production statistics', async () => {
      const projectId = 'project-123';

      global.mockPrisma.productionEvent.findMany.mockResolvedValue([
        { type: 'FILMING_START' },
        { type: 'BREAK_TIME' },
        { type: 'FILMING_START' }
      ]);

      const result = await productionIntegrationService.getProductionStats(projectId);

      expect(result).toBeDefined();
      expect(result.totalEvents).toBe(3);
    });

    it('should handle projects with no events', async () => {
      const projectId = 'project-123';

      global.mockPrisma.productionEvent.findMany.mockResolvedValue([]);

      const result = await productionIntegrationService.getProductionStats(projectId);

      expect(result.totalEvents).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const eventData = {
        projectId: 'project-123',
        type: 'TEST_EVENT'
      };

      global.mockPrisma.productionEvent.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        productionIntegrationService.createProductionEvent(eventData)
      ).rejects.toThrow('DB Error');
    });
  });
});
