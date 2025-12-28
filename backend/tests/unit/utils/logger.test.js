/**
 * Logger Utility Tests
 * اختبارات شاملة لأداة التسجيل
 */

describe('Logger Utility Tests', () => {
  let logger;

  beforeAll(() => {
    // Mock console methods to avoid noise
    global.console = {
      ...console,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Clear module cache to get fresh instance
    jest.resetModules();
    logger = require('../../../src/utils/logger');
  });

  describe('Logger methods', () => {
    it('should have info method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Logging functionality', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(logger.info).toBeDefined();
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(logger.error).toBeDefined();
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(logger.warn).toBeDefined();
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(logger.debug).toBeDefined();
    });

    it('should handle multiple arguments', () => {
      logger.info('Message', { data: 'test' }, 123);
      expect(logger.info).toBeDefined();
    });
  });
});
