const express = require('express');
const router = express.Router();

// استيراد Routes
const authRoutes = require('./auth');
const menuRoutes = require('./menus');
const restaurantRoutes = require('./restaurants');
const exceptionRoutes = require('./exceptions');
const workflowRoutes = require('./workflow');
const recommendationRoutes = require('./recommendations');
const predictiveRoutes = require('./predictive');
const paymentRoutes = require('./payments');
const nutritionRoutes = require('./nutrition');
const dietaryRoutes = require('./dietary');
const emotionRoutes = require('./emotion');
const productionRoutes = require('./productionRoutes');
const notificationRoutes = require('./notifications');
const qrRoutes = require('./qr');
const orderRoutes = require('./orders');
const projectRoutes = require('./projects');
const mlRoutes = require('./mlRoutes');
const reminderRoutes = require('./reminders');

// ربط Routes
router.use('/auth', authRoutes);
router.use('/menus', menuRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/exceptions', exceptionRoutes);
router.use('/workflow', workflowRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/predictive', predictiveRoutes);
router.use('/payments', paymentRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/dietary', dietaryRoutes);
router.use('/emotion', emotionRoutes);
router.use('/production', productionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/qr', qrRoutes);
router.use('/orders', orderRoutes);
router.use('/projects', projectRoutes);
router.use('/ml', mlRoutes);
router.use('/reminders', reminderRoutes);

// Route رئيسي
router.get('/', (req, res) => {
  res.json({
    message: 'BreakApp API Routes',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      menus: '/menus',
      restaurants: '/restaurants',
      exceptions: '/exceptions',
      workflow: '/workflow',
      recommendations: '/recommendations',
      predictive: '/predictive',
      nutrition: '/nutrition',
      dietary: '/dietary',
      emotion: '/emotion',
      production: '/production',
      notifications: '/notifications',
      qr: '/qr',
      orders: '/orders',
      projects: '/projects',
      ml: '/ml',
      reminders: '/reminders'
    }
  });
});

module.exports = router;


