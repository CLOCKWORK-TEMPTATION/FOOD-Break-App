/**
 * Smoke Tests - Scheduler Service
 */

jest.mock('node-cron');
jest.mock('@prisma/client');

const schedulerService = require('../schedulerService');

describe('SchedulerService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const cron = require('node-cron');
    cron.schedule.mockReturnValue({ stop: jest.fn() });
  });

  it('should handle init', async () => {
    if (schedulerService.init) {
      await expect(schedulerService.init()).resolves.not.toThrow();
    }
  });

  it('should handle stop', () => {
    if (schedulerService.stop) {
      expect(() => schedulerService.stop()).not.toThrow();
    }
  });
});
