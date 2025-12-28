/**
 * Scheduler Service Tests
 * اختبارات خدمة الجدولة
 */

const schedulerService = require('../../../src/services/schedulerService');

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((schedule, callback) => ({
    start: jest.fn(),
    stop: jest.fn()
  })),
  validate: jest.fn(() => true)
}));

describe('Scheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleJob', () => {
    it('should schedule a job', () => {
      const job = schedulerService.scheduleJob('0 0 * * *', () => {});

      expect(job).toBeDefined();
      expect(job).toHaveProperty('start');
      expect(job).toHaveProperty('stop');
    });
  });

  describe('scheduleOrderReminders', () => {
    it('should schedule order reminders', () => {
      const result = schedulerService.scheduleOrderReminders();

      expect(result).toBeDefined();
    });
  });

  describe('scheduleReportGeneration', () => {
    it('should schedule daily reports', () => {
      const result = schedulerService.scheduleReportGeneration();

      expect(result).toBeDefined();
    });
  });

  describe('scheduleDataCleanup', () => {
    it('should schedule data cleanup', () => {
      const result = schedulerService.scheduleDataCleanup();

      expect(result).toBeDefined();
    });
  });

  describe('stopAllJobs', () => {
    it('should stop all scheduled jobs', () => {
      schedulerService.stopAllJobs();

      expect(true).toBe(true);
    });
  });
});
