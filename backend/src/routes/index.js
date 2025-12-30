const express = require('express');
const router = express.Router();

// استيراد Routes
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const menuRoutes = require('./menus');
const restaurantRoutes = require('./restaurants');
const exceptionRoutes = require('./exceptions');
const workflowRoutes = require('./workflow');
const recommendationRoutes = require('./recommendations');
const predictiveRoutes = require('./predictive');
// const paymentRoutes = require('./payments');
// const paymentSystemRoutes = require('./payment');
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
// const analyticsRoutes = require('./analytics');
const productionIntegrationRoutes = require('./production');
// const arabicReportsRoutes = require('./arabicReports');
const productionReadinessRoutes = require('./productionReadiness');

// Phase 4 Innovation Routes - مسارات المرحلة الرابعة المتقدمة
const emergencyRoutes = require('./emergency');
const medicalRoutes = require('./medical');
const voiceRoutes = require('./voice');

// GPS Tracking Routes - مسارات تتبع التوصيل
const gpsTrackingRoutes = require('./gpsTrackingRoutes');

// Schedule Integration Routes - مسارات تكامل جداول التصوير
const scheduleRoutes = require('./scheduleRoutes');

// ربط Routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/menus', menuRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/exceptions', exceptionRoutes);
router.use('/workflow', workflowRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/predictive', predictiveRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/payment', paymentSystemRoutes);
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
// // router.use('/analytics', analyticsRoutes);
router.use('/production-integration', productionIntegrationRoutes);
// router.use('/arabic-reports', arabicReportsRoutes);
router.use('/production-readiness', productionReadinessRoutes);

// Phase 4 Innovation Routes - مسارات المرحلة الرابعة المتقدمة
router.use('/emergency', emergencyRoutes);
router.use('/medical', medicalRoutes);
router.use('/voice', voiceRoutes);

// GPS Tracking Routes - مسارات تتبع التوصيل
router.use('/tracking', gpsTrackingRoutes);

// Schedule Integration Routes - مسارات تكامل جداول التصوير
router.use('/schedules', scheduleRoutes);

// Route رئيسي
router.get('/', (req, res) => {
  res.json({
    message: 'BreakApp API Routes',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      admin: '/admin',
      menus: '/menus',
      restaurants: '/restaurants',
      exceptions: '/exceptions',
      workflow: '/workflow',
      recommendations: '/recommendations',
      predictive: '/predictive',
      // payments: '/payments',
      // payment: '/payment',
      nutrition: '/nutrition',
      dietary: '/dietary',
      emotion: '/emotion',
      production: '/production',
      notifications: '/notifications',
      qr: '/qr',
      orders: '/orders',
      projects: '/projects',
      ml: '/ml',
      reminders: '/reminders',
      // analytics: '/analytics',
      productionIntegration: '/production-integration',
      // arabicReports: '/arabic-reports',
      productionReadiness: '/production-readiness',
      // Phase 4 Innovation Features - المميزات المتقدمة للمرحلة الرابعة
      emergency: '/emergency',
      medical: '/medical',
      voice: '/voice',
      // GPS Tracking Features - مميزات تتبع التوصيل
      tracking: '/tracking',
      // Schedule Integration Features - مميزات تكامل جداول التصوير
      schedules: '/schedules'
    },
    phase4Features: {
      emergency: 'وضع الطوارئ - Emergency Mode',
      medical: 'التنبيهات الطبية - Medical Alerts',
      voice: 'الطلب الصوتي - Voice Ordering',
      gpsTracking: 'تتبع التوصيل GPS - GPS Delivery Tracking',
      scheduleIntegration: 'تكامل جداول التصوير - Schedule Integration',
      productionReadiness: 'تقارير جاهزية الإنتاج - Production Readiness Reports'
    }
  });
});

module.exports = router;


