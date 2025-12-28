/**
 * Dietary Routes Tests
 * اختبارات مسارات النظام الغذائي
 */

describe('Dietary Routes', () => {
  it('should load dietary routes module', () => {
    const dietaryRoutes = require('../../../src/routes/dietary');
    expect(dietaryRoutes).toBeDefined();
  });

  it('should be an Express router', () => {
    const dietaryRoutes = require('../../../src/routes/dietary');
    expect(dietaryRoutes.stack || dietaryRoutes.route || typeof dietaryRoutes === 'function').toBeTruthy();
  });
});
