/**
 * ML Controller - نقطة تحكم للتعلم الآلي
 * Handles all ML-related endpoints
 *
 * Endpoints for:
 * - Training data collection
 * - Model training
 * - Restaurant discovery
 */

const {
  trainingDataService,
  modelTrainer,
  restaurantDiscoveryService
} = require('../services/ml');
const logger = require('../utils/logger');

/**
 * جمع بيانات التدريب
 * Collect training data
 */
const collectTrainingData = async (req, res) => {
  try {
    const {
      includeWeather = false,
      startDate,
      endDate,
      location
    } = req.body;

    logger.info('بدء جمع بيانات التدريب...');

    const dataset = await trainingDataService.createTrainingDataset({
      includeWeather,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location
    });

    res.json({
      success: true,
      data: {
        metadata: dataset.metadata,
        stats: dataset.metadata.stats
      },
      message: req.t('ml.trainingDataCollected')
    });
  } catch (error) {
    logger.error(`خطأ في جمع بيانات التدريب: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRAINING_DATA_COLLECTION_ERROR',
        message: req.t('ml.trainingDataCollectionError'),
        details: error.message
      }
    });
  }
};

/**
 * تدريب نموذج التوصيات
 * Train recommendation model
 */
const trainRecommendationModel = async (req, res) => {
  try {
    const { epochs, batchSize, validationSplit } = req.body;

    logger.info('بدء تدريب نموذج التوصيات...');

    const result = await modelTrainer.trainRecommendationModel({
      epochs: epochs || 50,
      batchSize: batchSize || 32,
      validationSplit: validationSplit || 0.2
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: req.t('ml.insufficientData')
        }
      });
    }

    res.json({
      success: true,
      data: result,
      message: req.t('ml.modelTrainingSuccess')
    });
  } catch (error) {
    logger.error(`خطأ في تدريب نموذج التوصيات: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODEL_TRAINING_ERROR',
        message: req.t('ml.modelTrainingError'),
        details: error.message
      }
    });
  }
};

/**
 * تدريب نموذج التنبؤ
 * Train predictive model
 */
const trainPredictiveModel = async (req, res) => {
  try {
    const { epochs, batchSize } = req.body;

    logger.info('بدء تدريب نموذج التنبؤ...');

    const result = await modelTrainer.trainPredictiveModel({
      epochs: epochs || 30,
      batchSize: batchSize || 32
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: req.t('ml.insufficientData')
        }
      });
    }

    res.json({
      success: true,
      data: result,
      message: req.t('ml.modelTrainingSuccess')
    });
  } catch (error) {
    logger.error(`خطأ في تدريب نموذج التنبؤ: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODEL_TRAINING_ERROR',
        message: req.t('ml.modelTrainingError'),
        details: error.message
      }
    });
  }
};

/**
 * تدريب نموذج جودة المطاعم
 * Train quality model
 */
const trainQualityModel = async (req, res) => {
  try {
    const { epochs, batchSize } = req.body;

    logger.info('بدء تدريب نموذج الجودة...');

    const result = await modelTrainer.trainQualityModel({
      epochs: epochs || 40,
      batchSize: batchSize || 16
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: req.t('ml.insufficientData')
        }
      });
    }

    res.json({
      success: true,
      data: result,
      message: req.t('ml.modelTrainingSuccess')
    });
  } catch (error) {
    logger.error(`خطأ في تدريب نموذج الجودة: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODEL_TRAINING_ERROR',
        message: req.t('ml.modelTrainingError'),
        details: error.message
      }
    });
  }
};

/**
 * تدريب جميع النماذج
 * Train all models
 */
const trainAllModels = async (req, res) => {
  try {
    const { epochs, batchSize } = req.body;

    logger.info('بدء تدريب جميع النماذج...');

    const results = await modelTrainer.trainAllModels({
      epochs: epochs || 50,
      batchSize: batchSize || 32
    });

    const hasErrors = results.errors && results.errors.length > 0;

    res.status(hasErrors ? 207 : 200).json({
      success: !hasErrors,
      data: results,
      message: hasErrors
        ? req.t('ml.allModelsTrainingPartial')
        : req.t('ml.allModelsTrainingSuccess')
    });
  } catch (error) {
    logger.error(`خطأ في تدريب جميع النماذج: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODELS_TRAINING_ERROR',
        message: req.t('ml.allModelsTrainingError'),
        details: error.message
      }
    });
  }
};

/**
 * البحث عن مطاعم جديدة
 * Search for new restaurants
 */
const searchNewRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, radius, cuisineType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: req.t('ml.coordinatesRequired')
        }
      });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const restaurants = await restaurantDiscoveryService.searchNewRestaurants(
      location,
      radius ? parseInt(radius) : 5000,
      cuisineType || null
    );

    res.json({
      success: true,
      data: restaurants,
      meta: {
        count: restaurants.length,
        location
      }
    });
  } catch (error) {
    logger.error(`خطأ في البحث عن المطاعم: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESTAURANT_SEARCH_ERROR',
        message: req.t('ml.restaurantSearchError'),
        details: error.message
      }
    });
  }
};

/**
 * تحليل جودة مطعم
 * Analyze restaurant quality
 */
const analyzeRestaurantQuality = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const qualityScore = await restaurantDiscoveryService.analyzeRestaurantQuality(
      restaurantId
    );

    res.json({
      success: true,
      data: qualityScore
    });
  } catch (error) {
    logger.error(`خطأ في تحليل جودة المطعم: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'QUALITY_ANALYSIS_ERROR',
        message: req.t('ml.qualityAnalysisError'),
        details: error.message
      }
    });
  }
};

/**
 * اقتراح مطاعم جديدة
 * Suggest new restaurants
 */
const suggestNewRestaurants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      minRating,
      minReviews,
      maxDistance,
      cuisineTypes
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: req.t('ml.coordinatesRequired')
        }
      });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const criteria = {
      minRating: minRating ? parseFloat(minRating) : 4.0,
      minReviews: minReviews ? parseInt(minReviews) : 10,
      maxDistance: maxDistance ? parseInt(maxDistance) : 5000,
      cuisineTypes: cuisineTypes ? cuisineTypes.split(',') : null
    };

    const suggestions = await restaurantDiscoveryService.suggestNewRestaurants(
      location,
      criteria
    );

    res.json({
      success: true,
      data: suggestions,
      meta: {
        count: suggestions.length,
        criteria
      }
    });
  } catch (error) {
    logger.error(`خطأ في اقتراح المطاعم: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESTAURANT_SUGGESTION_ERROR',
        message: req.t('ml.restaurantSuggestionError'),
        details: error.message
      }
    });
  }
};

/**
 * إنشاء سير عمل تجريبي لمطعم جديد
 * Create trial workflow for new restaurant
 */
const createRestaurantTrial = async (req, res) => {
  try {
    const restaurantData = req.body;

    const trial = await restaurantDiscoveryService.createTrialWorkflow(
      restaurantData
    );

    res.status(201).json({
      success: true,
      data: trial,
      message: req.t('ml.trialCreated')
    });
  } catch (error) {
    logger.error(`خطأ في إنشاء سير عمل التجريب: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRIAL_CREATION_ERROR',
        message: req.t('ml.trialCreationError'),
        details: error.message
      }
    });
  }
};

/**
 * تقييم نتائج التجربة
 * Evaluate trial results
 */
const evaluateTrialResults = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const evaluation = await restaurantDiscoveryService.evaluateTrialResults(
      restaurantId
    );

    res.json({
      success: true,
      data: evaluation,
      message: evaluation.passed
        ? req.t('ml.trialPassed')
        : req.t('ml.trialFailed')
    });
  } catch (error) {
    logger.error(`خطأ في تقييم التجربة: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRIAL_EVALUATION_ERROR',
        message: req.t('ml.trialEvaluationError'),
        details: error.message
      }
    });
  }
};

/**
 * تجميع تقييمات من منصات متعددة
 * Aggregate multi-platform ratings
 */
const aggregateRatings = async (req, res) => {
  try {
    const { restaurantName, latitude, longitude } = req.query;

    if (!restaurantName || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: req.t('ml.restaurantNameAndCoordinatesRequired')
        }
      });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const ratings = await restaurantDiscoveryService.aggregateMultiPlatformRatings(
      restaurantName,
      location
    );

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    logger.error(`خطأ في تجميع التقييمات: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'RATING_AGGREGATION_ERROR',
        message: req.t('ml.ratingAggregationError'),
        details: error.message
      }
    });
  }
};

module.exports = {
  // Training data
  collectTrainingData,

  // Model training
  trainRecommendationModel,
  trainPredictiveModel,
  trainQualityModel,
  trainAllModels,

  // Restaurant discovery
  searchNewRestaurants,
  analyzeRestaurantQuality,
  suggestNewRestaurants,
  createRestaurantTrial,
  evaluateTrialResults,
  aggregateRatings
};
