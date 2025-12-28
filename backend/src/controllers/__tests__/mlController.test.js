/**
 * Tests for ML Controller
 */

jest.mock('../../services/ml');

const mlController = require('../mlController');
const mlService = require('../../services/ml');

describe('ML Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('trainModel', () => {
    it('should train ML model successfully', async () => {
      req.body = {
        modelType: 'RECOMMENDATION',
        datasetId: 'dataset123'
      };

      mlService.trainModel = jest.fn().mockResolvedValue({
        modelId: 'model123',
        accuracy: 0.92,
        status: 'TRAINED'
      });

      await mlController.trainModel(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should handle training errors', async () => {
      req.body = { modelType: 'RECOMMENDATION' };

      mlService.trainModel = jest.fn().mockRejectedValue(
        new Error('Training failed')
      );

      await mlController.trainModel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('predict', () => {
    it('should make predictions', async () => {
      req.body = {
        modelId: 'model123',
        input: { userId: 'user123', features: [1, 2, 3] }
      };

      mlService.predict = jest.fn().mockResolvedValue({
        predictions: [
          { itemId: 'item1', score: 0.95 },
          { itemId: 'item2', score: 0.87 }
        ]
      });

      await mlController.predict(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getModelInfo', () => {
    it('should get model information', async () => {
      req.params = { modelId: 'model123' };

      mlService.getModelInfo = jest.fn().mockResolvedValue({
        id: 'model123',
        type: 'RECOMMENDATION',
        accuracy: 0.92,
        trainedAt: new Date(),
        version: '1.0'
      });

      await mlController.getModelInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getModelMetrics', () => {
    it('should get model performance metrics', async () => {
      req.params = { modelId: 'model123' };

      mlService.getModelMetrics = jest.fn().mockResolvedValue({
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91
      });

      await mlController.getModelMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('updateModel', () => {
    it('should update ML model', async () => {
      req.params = { modelId: 'model123' };
      req.body = { isActive: true };

      mlService.updateModel = jest.fn().mockResolvedValue({
        id: 'model123',
        isActive: true
      });

      await mlController.updateModel(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getDiscoveryRecommendations', () => {
    it('should get restaurant discovery recommendations', async () => {
      mlService.getRestaurantDiscovery = jest.fn().mockResolvedValue([
        { restaurantId: 'r1', name: 'Restaurant 1', score: 0.95 },
        { restaurantId: 'r2', name: 'Restaurant 2', score: 0.88 }
      ]);

      await mlController.getDiscoveryRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('feedbackOnPrediction', () => {
    it('should record feedback on prediction', async () => {
      req.body = {
        predictionId: 'pred123',
        feedback: 'POSITIVE',
        actualOutcome: 'ORDERED'
      };

      mlService.recordFeedback = jest.fn().mockResolvedValue({
        id: 'feedback123',
        ...req.body
      });

      await mlController.feedbackOnPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});
