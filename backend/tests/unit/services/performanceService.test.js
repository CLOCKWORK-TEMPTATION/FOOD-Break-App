/**
 * Performance Service Tests
 * اختبارات خدمة الأداء
 */

const performanceService = require('../../../src/services/performanceService');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Performance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.mockPrisma.performanceMetric = {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn()
    };
  });

  describe('recordMetric', () => {
    it('should record performance metric', async () => {
      const mockMetric = {
        id: 'metric-123',
        name: 'api_response_time',
        value: 150,
        unit: 'ms',
        timestamp: new Date()
      };

      global.mockPrisma.performanceMetric.create.mockResolvedValue(mockMetric);

      const result = await performanceService.recordMetric('api_response_time', 150, 'ms');

      expect(result).toEqual(mockMetric);
      expect(global.mockPrisma.performanceMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'api_response_time',
          value: 150,
          unit: 'ms'
        })
      });
    });

    it('should handle missing unit parameter', async () => {
      const mockMetric = {
        id: 'metric-123',
        name: 'cpu_usage',
        value: 75,
        unit: null
      };

      global.mockPrisma.performanceMetric.create.mockResolvedValue(mockMetric);

      const result = await performanceService.recordMetric('cpu_usage', 75);

      expect(result).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics for a given period', async () => {
      const mockMetrics = [
        { id: '1', name: 'api_response_time', value: 150, timestamp: new Date() },
        { id: '2', name: 'api_response_time', value: 200, timestamp: new Date() }
      ];

      global.mockPrisma.performanceMetric.findMany.mockResolvedValue(mockMetrics);

      const result = await performanceService.getMetrics('api_response_time', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result).toEqual(mockMetrics);
      expect(global.mockPrisma.performanceMetric.findMany).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      global.mockPrisma.performanceMetric.findMany.mockResolvedValue([]);

      const result = await performanceService.getMetrics('non_existent_metric');

      expect(result).toEqual([]);
    });
  });

  describe('getAverageMetric', () => {
    it('should calculate average metric value', async () => {
      global.mockPrisma.performanceMetric.aggregate.mockResolvedValue({
        _avg: { value: 175.5 }
      });

      const result = await performanceService.getAverageMetric('api_response_time');

      expect(result).toBe(175.5);
      expect(global.mockPrisma.performanceMetric.aggregate).toHaveBeenCalled();
    });

    it('should return null when no data available', async () => {
      global.mockPrisma.performanceMetric.aggregate.mockResolvedValue({
        _avg: { value: null }
      });

      const result = await performanceService.getAverageMetric('api_response_time');

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      global.mockPrisma.performanceMetric.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        performanceService.recordMetric('test_metric', 100)
      ).rejects.toThrow('DB Error');
    });
  });
});
