/**
 * تصدير جميع خدمات التعلم الآلي
 * ML Services Index
 */

const trainingDataService = require('./trainingDataService');
const modelTrainer = require('./modelTrainer');
const restaurantDiscoveryService = require('./restaurantDiscoveryService');

module.exports = {
  trainingDataService,
  modelTrainer,
  restaurantDiscoveryService
};
