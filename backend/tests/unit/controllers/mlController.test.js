/**
 * Unit Tests - ML Controller
 * اختبارات وحدة متحكم التعلم الآلي
 */

const mlController = require('../../../src/controllers/mlController');
const {
  trainingDataService,
  modelTrainer,
  restaurantDiscoveryService
} = require('../../../src/services/ml');

jest.mock('../../../src/services/ml');
jest.mock('../../../src/utils/logger');

describe('ML Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  // ==========================================
  // Collect Training Data Tests
  // ==========================================
  describe('collectTrainingData', () => {
    it('should collect training data successfully', async () => {
      req.body = {
        includeWeather: true,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        location: 'Cairo'
      };

      const mockDataset = {
        metadata: {
          recordCount: 1000,
          stats: { avgOrderValue: 150, totalOrders: 500 }
        }
      };

      trainingDataService.createTrainingDataset.mockResolvedValue(mockDataset);

      await mlController.collectTrainingData(req, res);

      expect(trainingDataService.createTrainingDataset).toHaveBeenCalledWith({
        includeWeather: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        location: 'Cairo'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          metadata: mockDataset.metadata,
          stats: mockDataset.metadata.stats
        },
        message: 'ml.trainingDataCollected'
      });
    });

    it('should handle errors during data collection', async () => {
      req.body = {};
      trainingDataService.createTrainingDataset.mockRejectedValue(
        new Error('Data collection failed')
      );

      await mlController.collectTrainingData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TRAINING_DATA_COLLECTION_ERROR',
          message: 'ml.trainingDataCollectionError',
          details: 'Data collection failed'
        }
      });
    });
  });

  // ==========================================
  // Train Recommendation Model Tests
  // ==========================================
  describe('trainRecommendationModel', () => {
    it('should train recommendation model successfully', async () => {
      req.body = { epochs: 100, batchSize: 64, validationSplit: 0.3 };

      const mockResult = {
        modelId: 'model-123',
        accuracy: 0.92,
        loss: 0.15
      };

      modelTrainer.trainRecommendationModel.mockResolvedValue(mockResult);

      await mlController.trainRecommendationModel(req, res);

      expect(modelTrainer.trainRecommendationModel).toHaveBeenCalledWith({
        epochs: 100,
        batchSize: 64,
        validationSplit: 0.3
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'ml.modelTrainingSuccess'
      });
    });

    it('should use default parameters when not provided', async () => {
      req.body = {};
      modelTrainer.trainRecommendationModel.mockResolvedValue({});

      await mlController.trainRecommendationModel(req, res);

      expect(modelTrainer.trainRecommendationModel).toHaveBeenCalledWith({
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2
      });
    });

    it('should handle insufficient data', async () => {
      req.body = {};
      modelTrainer.trainRecommendationModel.mockResolvedValue(null);

      await mlController.trainRecommendationModel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: 'ml.insufficientData'
        }
      });
    });

    it('should handle training errors', async () => {
      req.body = {};
      modelTrainer.trainRecommendationModel.mockRejectedValue(
        new Error('Training failed')
      );

      await mlController.trainRecommendationModel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MODEL_TRAINING_ERROR',
          message: 'ml.modelTrainingError',
          details: 'Training failed'
        }
      });
    });
  });

  // ==========================================
  // Train Predictive Model Tests
  // ==========================================
  describe('trainPredictiveModel', () => {
    it('should train predictive model successfully', async () => {
      req.body = { epochs: 50, batchSize: 16 };

      const mockResult = { modelId: 'pred-model-123', accuracy: 0.88 };
      modelTrainer.trainPredictiveModel.mockResolvedValue(mockResult);

      await mlController.trainPredictiveModel(req, res);

      expect(modelTrainer.trainPredictiveModel).toHaveBeenCalledWith({
        epochs: 50,
        batchSize: 16
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'ml.modelTrainingSuccess'
      });
    });

    it('should handle insufficient data', async () => {
      req.body = {};
      modelTrainer.trainPredictiveModel.mockResolvedValue(null);

      await mlController.trainPredictiveModel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Train Quality Model Tests
  // ==========================================
  describe('trainQualityModel', () => {
    it('should train quality model successfully', async () => {
      req.body = { epochs: 60, batchSize: 8 };

      const mockResult = { modelId: 'quality-model-123', f1Score: 0.91 };
      modelTrainer.trainQualityModel.mockResolvedValue(mockResult);

      await mlController.trainQualityModel(req, res);

      expect(modelTrainer.trainQualityModel).toHaveBeenCalledWith({
        epochs: 60,
        batchSize: 8
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'ml.modelTrainingSuccess'
      });
    });

    it('should handle training errors', async () => {
      req.body = {};
      modelTrainer.trainQualityModel.mockRejectedValue(new Error('Quality training failed'));

      await mlController.trainQualityModel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Train All Models Tests
  // ==========================================
  describe('trainAllModels', () => {
    it('should train all models successfully', async () => {
      req.body = { epochs: 50, batchSize: 32 };

      const mockResults = {
        recommendation: { accuracy: 0.92 },
        predictive: { accuracy: 0.88 },
        quality: { f1Score: 0.91 },
        errors: []
      };

      modelTrainer.trainAllModels.mockResolvedValue(mockResults);

      await mlController.trainAllModels(req, res);

      expect(modelTrainer.trainAllModels).toHaveBeenCalledWith({
        epochs: 50,
        batchSize: 32
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults,
        message: 'ml.allModelsTrainingSuccess'
      });
    });

    it('should handle partial failures', async () => {
      req.body = {};
      const mockResults = {
        recommendation: { accuracy: 0.92 },
        errors: ['Predictive model failed', 'Quality model failed']
      };

      modelTrainer.trainAllModels.mockResolvedValue(mockResults);

      await mlController.trainAllModels(req, res);

      expect(res.status).toHaveBeenCalledWith(207); // Multi-status
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: mockResults,
        message: 'ml.allModelsTrainingPartial'
      });
    });

    it('should handle complete failure', async () => {
      req.body = {};
      modelTrainer.trainAllModels.mockRejectedValue(new Error('All training failed'));

      await mlController.trainAllModels(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Search New Restaurants Tests
  // ==========================================
  describe('searchNewRestaurants', () => {
    it('should search restaurants successfully', async () => {
      req.query = {
        latitude: '30.0444',
        longitude: '31.2357',
        radius: '10000',
        cuisineType: 'Italian'
      };

      const mockRestaurants = [
        { id: 'rest-1', name: 'Pizza Place' },
        { id: 'rest-2', name: 'Pasta House' }
      ];

      restaurantDiscoveryService.searchNewRestaurants.mockResolvedValue(mockRestaurants);

      await mlController.searchNewRestaurants(req, res);

      expect(restaurantDiscoveryService.searchNewRestaurants).toHaveBeenCalledWith(
        { latitude: 30.0444, longitude: 31.2357 },
        10000,
        'Italian'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants,
        meta: {
          count: 2,
          location: { latitude: 30.0444, longitude: 31.2357 }
        }
      });
    });

    it('should reject without coordinates', async () => {
      req.query = {};

      await mlController.searchNewRestaurants(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'ml.coordinatesRequired'
        }
      });
    });

    it('should use default radius when not provided', async () => {
      req.query = { latitude: '30.0444', longitude: '31.2357' };
      restaurantDiscoveryService.searchNewRestaurants.mockResolvedValue([]);

      await mlController.searchNewRestaurants(req, res);

      expect(restaurantDiscoveryService.searchNewRestaurants).toHaveBeenCalledWith(
        expect.any(Object),
        5000,
        null
      );
    });
  });

  // ==========================================
  // Analyze Restaurant Quality Tests
  // ==========================================
  describe('analyzeRestaurantQuality', () => {
    it('should analyze restaurant quality successfully', async () => {
      req.params = { restaurantId: 'rest-123' };

      const mockQualityScore = {
        overallScore: 4.5,
        factors: { hygiene: 5, service: 4, food: 4.5 }
      };

      restaurantDiscoveryService.analyzeRestaurantQuality.mockResolvedValue(
        mockQualityScore
      );

      await mlController.analyzeRestaurantQuality(req, res);

      expect(restaurantDiscoveryService.analyzeRestaurantQuality).toHaveBeenCalledWith(
        'rest-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockQualityScore
      });
    });

    it('should handle analysis errors', async () => {
      req.params = { restaurantId: 'rest-123' };
      restaurantDiscoveryService.analyzeRestaurantQuality.mockRejectedValue(
        new Error('Analysis failed')
      );

      await mlController.analyzeRestaurantQuality(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Suggest New Restaurants Tests
  // ==========================================
  describe('suggestNewRestaurants', () => {
    it('should suggest restaurants successfully', async () => {
      req.query = {
        latitude: '30.0444',
        longitude: '31.2357',
        minRating: '4.5',
        minReviews: '50',
        maxDistance: '3000',
        cuisineTypes: 'Italian,French,Egyptian'
      };

      const mockSuggestions = [{ id: 'rest-1', name: 'Great Restaurant' }];
      restaurantDiscoveryService.suggestNewRestaurants.mockResolvedValue(
        mockSuggestions
      );

      await mlController.suggestNewRestaurants(req, res);

      expect(restaurantDiscoveryService.suggestNewRestaurants).toHaveBeenCalledWith(
        { latitude: 30.0444, longitude: 31.2357 },
        {
          minRating: 4.5,
          minReviews: 50,
          maxDistance: 3000,
          cuisineTypes: ['Italian', 'French', 'Egyptian']
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSuggestions,
        meta: expect.objectContaining({
          count: 1
        })
      });
    });

    it('should use default criteria when not provided', async () => {
      req.query = { latitude: '30.0444', longitude: '31.2357' };
      restaurantDiscoveryService.suggestNewRestaurants.mockResolvedValue([]);

      await mlController.suggestNewRestaurants(req, res);

      expect(restaurantDiscoveryService.suggestNewRestaurants).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          minRating: 4.0,
          minReviews: 10,
          maxDistance: 5000
        })
      );
    });

    it('should reject without coordinates', async () => {
      req.query = {};

      await mlController.suggestNewRestaurants(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Create Restaurant Trial Tests
  // ==========================================
  describe('createRestaurantTrial', () => {
    it('should create trial workflow successfully', async () => {
      req.body = {
        name: 'New Restaurant',
        location: 'Cairo',
        cuisineType: 'Italian'
      };

      const mockTrial = {
        id: 'trial-123',
        restaurantId: 'rest-123',
        status: 'ACTIVE'
      };

      restaurantDiscoveryService.createTrialWorkflow.mockResolvedValue(mockTrial);

      await mlController.createRestaurantTrial(req, res);

      expect(restaurantDiscoveryService.createTrialWorkflow).toHaveBeenCalledWith(
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrial,
        message: 'ml.trialCreated'
      });
    });

    it('should handle trial creation errors', async () => {
      req.body = {};
      restaurantDiscoveryService.createTrialWorkflow.mockRejectedValue(
        new Error('Trial creation failed')
      );

      await mlController.createRestaurantTrial(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Evaluate Trial Results Tests
  // ==========================================
  describe('evaluateTrialResults', () => {
    it('should evaluate trial and pass', async () => {
      req.params = { restaurantId: 'rest-123' };

      const mockEvaluation = {
        passed: true,
        score: 4.7,
        metrics: { orders: 100, satisfaction: 0.95 }
      };

      restaurantDiscoveryService.evaluateTrialResults.mockResolvedValue(
        mockEvaluation
      );

      await mlController.evaluateTrialResults(req, res);

      expect(restaurantDiscoveryService.evaluateTrialResults).toHaveBeenCalledWith(
        'rest-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvaluation,
        message: 'ml.trialPassed'
      });
    });

    it('should evaluate trial and fail', async () => {
      req.params = { restaurantId: 'rest-123' };

      const mockEvaluation = {
        passed: false,
        score: 2.5,
        reasons: ['Low quality', 'Poor service']
      };

      restaurantDiscoveryService.evaluateTrialResults.mockResolvedValue(
        mockEvaluation
      );

      await mlController.evaluateTrialResults(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvaluation,
        message: 'ml.trialFailed'
      });
    });

    it('should handle evaluation errors', async () => {
      req.params = { restaurantId: 'rest-123' };
      restaurantDiscoveryService.evaluateTrialResults.mockRejectedValue(
        new Error('Evaluation failed')
      );

      await mlController.evaluateTrialResults(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Aggregate Ratings Tests
  // ==========================================
  describe('aggregateRatings', () => {
    it('should aggregate ratings successfully', async () => {
      req.query = {
        restaurantName: 'Pizza Place',
        latitude: '30.0444',
        longitude: '31.2357'
      };

      const mockRatings = {
        overall: 4.5,
        sources: {
          google: 4.6,
          facebook: 4.4,
          tripadvisor: 4.5
        }
      };

      restaurantDiscoveryService.aggregateMultiPlatformRatings.mockResolvedValue(
        mockRatings
      );

      await mlController.aggregateRatings(req, res);

      expect(restaurantDiscoveryService.aggregateMultiPlatformRatings).toHaveBeenCalledWith(
        'Pizza Place',
        { latitude: 30.0444, longitude: 31.2357 }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRatings
      });
    });

    it('should reject without restaurant name', async () => {
      req.query = { latitude: '30.0444', longitude: '31.2357' };

      await mlController.aggregateRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'ml.restaurantNameAndCoordinatesRequired'
        }
      });
    });

    it('should reject without coordinates', async () => {
      req.query = { restaurantName: 'Pizza Place' };

      await mlController.aggregateRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle aggregation errors', async () => {
      req.query = {
        restaurantName: 'Pizza Place',
        latitude: '30.0444',
        longitude: '31.2357'
      };
      restaurantDiscoveryService.aggregateMultiPlatformRatings.mockRejectedValue(
        new Error('Aggregation failed')
      );

      await mlController.aggregateRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
