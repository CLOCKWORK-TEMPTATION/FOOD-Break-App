require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const logger = require('./utils/logger');
const { startJobs } = require('./jobs');
const { initMonitoring } = require('./utils/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Monitoring (Sentry) - اختياري عبر env
initMonitoring();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !process.env.CORS_ALLOW_ALL) {
      // In development, you might want to allow all, but strictly:
      // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
      // For now, let's be permissive if dev
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

app.use(`/api/${API_VERSION}`, routes);

// معالجة المسارات غير الموجودة
app.use(notFound);

// معالجة الأخطاء المركزية
app.use(errorHandler);

// تهيئة نظام التذكيرات النصف ساعية
const reminderScheduler = require('./services/reminderSchedulerService');

// بدء خدمة الجدولة (Scheduler)
const schedulerService = require('./services/schedulerService');
if (process.env.REMINDER_ENABLED === 'true') {
  logger.info('Starting Scheduler Service...');
  schedulerService.start();
}

// Start server
app.listen(PORT, async () => {
  logger.info(`BreakApp Backend Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Version: ${API_VERSION}`);

  // تشغيل الوظائف المجدولة
  startJobs();

  // تشغيل نظام التذكيرات
  try {
    await reminderScheduler.initialize();
    logger.info('نظام التذكيرات النصف ساعية تم تشغيله بنجاح');
  } catch (error) {
    logger.error('فشل تشغيل نظام التذكيرات:', error);
  }

  // عرض حالة خدمات الإشعارات
  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
    logger.info('Push Notifications: Enabled');
  }
  if (process.env.SMS_ENABLED === 'true') {
    logger.info('SMS Notifications: Enabled');
  }
  if (process.env.SMTP_ENABLED === 'true') {
    logger.info('Email Notifications: Enabled');
  }
});

// معالجة إيقاف التطبيق بشكل صحيح
process.on('SIGTERM', () => {
  logger.warn('إيقاف التطبيق...');
  reminderScheduler.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.warn('إيقاف التطبيق...');
  reminderScheduler.stopAll();
  process.exit(0);
});

module.exports = app;


