/**
 * Logger Utils Unit Tests
 * اختبارات مسجل السجلات
 */

const loadLoggerWithLevel = (level) => {
  jest.resetModules();
  process.env.LOG_LEVEL = level;
  return require('../../../src/utils/logger');
};

describe('Logger Utils', () => {
  const originalEnv = process.env;
  let consoleSpy;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should skip debug logs when level is info', () => {
    const logger = loadLoggerWithLevel('info');

    logger.debug('Hidden debug message');

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should log debug when level is debug', () => {
    const logger = loadLoggerWithLevel('debug');

    logger.debug('Visible debug message');

    expect(consoleSpy).toHaveBeenCalled();
    const loggedMessage = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain('[DEBUG]');
  });

  it('should stringify object messages', () => {
    const logger = loadLoggerWithLevel('info');

    logger.info({ action: 'test', success: true });

    const loggedMessage = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain('"action": "test"');
    expect(loggedMessage).toContain('"success": true');
  });
});
