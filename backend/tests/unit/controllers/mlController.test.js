/**
 * ML Controller Tests
 * اختبارات وحدة تحكم التعلم الآلي
 */

const mlController = require('../../../src/controllers/mlController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      dataSync: jest.fn().mockReturnValue([0.8, 0.2])
    })
  }),
  tensor2d: jest.fn().mockReturnValue({
    dispose: jest.fn()
  })
}));

describe('ML Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('predictOrderPreferences', () => {
    it('should predict user order preferences', async () => {
      const mockHistory = [
        { menuItemId: '1', quantity: 2 },
        { menuItemId: '2', quantity: 1 }
      ];
      global.mockPrisma.order.findMany.mockResolvedValue(mockHistory);

      await mlController.predictOrderPreferences(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            predictions: expect.any(Array)
          })
        })
      );
    });

    it('should handle errors', async () => {
      global.mockPrisma.order.findMany.mockRejectedValue(new Error('DB error'));

      await mlController.predictOrderPreferences(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('predictDemand', () => {
    it('should predict demand for menu items', async () => {
      req.params.menuItemId = 'item-123';
      global.mockPrisma.order.findMany.mockResolvedValue([]);

      await mlController.predictDemand(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getRecommendations', () => {
    it('should get ML-based recommendations', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([]);
      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]);

      await mlController.getRecommendations(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('trainModel', () => {
    it('should train ML model with new data', async () => {
      req.body = {
        modelType: 'RECOMMENDATION',
        trainingData: []
      };

      await mlController.trainModel(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });
  });

  describe('getModelMetrics', () => {
    it('should return model performance metrics', async () => {
      req.params.modelId = 'model-123';
      global.mockPrisma.mlModel.findUnique.mockResolvedValue({
        id: 'model-123',
        accuracy: 0.85,
        precision: 0.80
      });

      await mlController.getModelMetrics(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('analyzeUserBehavior', () => {
    it('should analyze user behavior patterns', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([]);

      await mlController.analyzeUserBehavior(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            patterns: expect.any(Array)
          })
        })
      );
    });
  });
});
