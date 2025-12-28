/**
 * Load Testing Configuration
 * إعدادات اختبار الأداء والحمل
 */

module.exports = {
  config: {
    target: process.env.TEST_TARGET_URL || 'http://localhost:3000',
    phases: [
      { duration: 60, arrivalRate: 5, name: 'Warm-up' },
      { duration: 120, arrivalRate: 5, rampTo: 50, name: 'Ramp-up' },
      { duration: 300, arrivalRate: 50, name: 'Sustained' },
      { duration: 60, arrivalRate: 100, name: 'Spike' }
    ]
  },
  scenarios: [
    {
      name: 'Health Check',
      weight: 10,
      flow: [{ get: { url: '/health' } }]
    },
    {
      name: 'Authentication',
      weight: 20,
      flow: [
        {
          post: {
            url: '/api/v1/auth/login',
            json: { email: 'test@example.com', password: 'Test123456' }
          }
        }
      ]
    },
    {
      name: 'Get Menu',
      weight: 30,
      flow: [{ get: { url: '/api/v1/menu' } }]
    }
  ]
};
