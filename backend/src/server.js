require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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

// بدء خدمة الجدولة (Scheduler)
const schedulerService = require('./services/schedulerService');
if (process.env.REMINDER_ENABLED === 'true') {
  console.log('⏰ Starting Scheduler Service...');
  schedulerService.start();
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BreakApp Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Version: ${API_VERSION}`);

  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
    console.log('✅ Push Notifications: Enabled');
  }
  if (process.env.SMS_ENABLED === 'true') {
    console.log('✅ SMS Notifications: Enabled');
  }
  if (process.env.SMTP_ENABLED === 'true') {
    console.log('✅ Email Notifications: Enabled');
  }
});

module.exports = app;


