/**
 * Predictive Controller Tests
 * اختبارات وحدة التحليل التنبؤي
 */

const predictiveController = require('../../../src/controllers/predictiveController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Predictive Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123', role: 'ADMIN' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('predictDemand', () => {
    it('should predict demand for menu items', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([
        { menuItemId: '1', quantity: 5 },
        { menuItemId: '1', quantity: 3 }
      ]);

      req.query = { days: '7' };

      await predictiveController.predictDemand(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('predictInventoryNeeds', () => {
    it('should predict inventory needs', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([]);

      await predictiveController.predictInventoryNeeds(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('predictPeakHours', () => {
    it('should predict peak hours', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([
        { createdAt: new Date('2024-01-01T12:00:00') },
        { createdAt: new Date('2024-01-01T13:00:00') }
      ]);

      await predictiveController.predictPeakHours(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('predictUserChurn', () => {
    it('should predict user churn risk', async () => {
      global.mockPrisma.user.findMany.mockResolvedValue([
        { id: '1', lastOrderDate: new Date('2024-01-01') }
      ]);

      await predictiveController.predictUserChurn(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getPredictionAccuracy', () => {
    it('should return prediction accuracy metrics', async () => {
      global.mockPrisma.prediction.findMany.mockResolvedValue([
        { predicted: 100, actual: 95 },
        { predicted: 50, actual: 52 }
      ]);

      await predictiveController.getPredictionAccuracy(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accuracy: expect.any(Number)
          })
        })
      );
    });
  });
});
