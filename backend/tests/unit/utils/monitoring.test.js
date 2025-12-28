/**
 * Monitoring Utils Unit Tests
 * اختبارات المراقبة والتتبع
 */

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn()
}));

const logger = require('../../../src/utils/logger');

describe('Monitoring Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize Sentry and capture exception when enabled', () => {
    const sentryMock = {
      init: jest.fn(),
      captureException: jest.fn()
    };

    jest.doMock('@sentry/node', () => sentryMock);
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    process.env.NODE_ENV = 'test';

    const monitoring = require('../../../src/utils/monitoring');

    monitoring.initMonitoring();

    expect(sentryMock.init).toHaveBeenCalledWith({
      dsn: process.env.SENTRY_DSN,
      environment: 'test',
      release: undefined,
      tracesSampleRate: 0
    });
    expect(logger.info).toHaveBeenCalledWith('Sentry monitoring enabled');

    const error = new Error('Failure');
    monitoring.captureException(error, { requestId: 'req-1' });

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      extra: { requestId: 'req-1' }
    });
  });

  it('should skip initialization when DSN is missing', () => {
    const sentryMock = {
      init: jest.fn(),
      captureException: jest.fn()
    };

    jest.doMock('@sentry/node', () => sentryMock);
    delete process.env.SENTRY_DSN;

    const monitoring = require('../../../src/utils/monitoring');

    monitoring.initMonitoring();
    monitoring.captureException(new Error('No DSN'));

    expect(sentryMock.init).not.toHaveBeenCalled();
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });

  it('should log warning when Sentry initialization fails', () => {
    const sentryMock = {
      init: jest.fn(() => {
        throw new Error('Init failed');
      }),
      captureException: jest.fn()
    };

    jest.doMock('@sentry/node', () => sentryMock);
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';

    const monitoring = require('../../../src/utils/monitoring');

    monitoring.initMonitoring();
    monitoring.captureException(new Error('After failure'));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('تعذر تهيئة Sentry')
    );
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });
});
