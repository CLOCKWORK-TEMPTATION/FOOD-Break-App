const logger = require('./logger');

let sentry = null;
let sentryEnabled = false;

/**
 * Why: تكامل فعلي مع نظام تتبع أخطاء (Sentry) عبر DSN من env،
 * بدون كسر التطبيق إذا كانت الإعدادات غير متاحة.
 */
const initMonitoring = () => {
  try {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;

    // eslint-disable-next-line global-require
    sentry = require('@sentry/node');

    sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.APP_RELEASE || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0)
    });

    sentryEnabled = true;
    logger.info('Sentry monitoring enabled');
  } catch (error) {
    sentryEnabled = false;
    sentry = null;
    logger.warn(`تعذر تهيئة Sentry: ${error.message}`);
  }
};

const captureException = (error, context = {}) => {
  try {
    if (!sentryEnabled || !sentry) return;
    sentry.captureException(error, { extra: context });
  } catch (_) {
    // تجاهل
  }
};

module.exports = {
  initMonitoring,
  captureException
};

