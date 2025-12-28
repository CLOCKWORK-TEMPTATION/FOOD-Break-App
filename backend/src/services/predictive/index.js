/**
 * تصدير جميع خدمات التنبؤ
 * Predictive Services Index
 */

const behaviorAnalysisService = require('./behaviorAnalysisService');
const patternRecognitionService = require('./patternRecognitionService');
const quantityForecastService = require('./quantityForecastService');
const autoOrderSuggestionService = require('./autoOrderSuggestionService');
const deliverySchedulingService = require('./deliverySchedulingService');
const demandForecastReportService = require('./demandForecastReportService');

module.exports = {
  behaviorAnalysisService,
  patternRecognitionService,
  quantityForecastService,
  autoOrderSuggestionService,
  deliverySchedulingService,
  demandForecastReportService
};
