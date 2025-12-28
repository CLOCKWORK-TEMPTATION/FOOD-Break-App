/**
 * نظام التسجيل المركزي للأخطاء والأحداث
 */

const logLevel = process.env.LOG_LEVEL || 'info';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * تسجيل رسالة
 * @param {string} level - مستوى الرسالة
 * @param {*} message - الرسالة
 */
const log = (level, message) => {
  const levelNum = levels[level] || 2;
  const configLevelNum = levels[logLevel] || 2;

  if (levelNum <= configLevelNum) {
    const timestamp = new Date().toISOString();
    const logData = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    
    console.log(`[${timestamp}] [${level.toUpperCase()}]: ${logData}`);
  }
};

const logger = {
  error: (message) => log('error', message),
  warn: (message) => log('warn', message),
  info: (message) => log('info', message),
  debug: (message) => log('debug', message)
};

module.exports = logger;
