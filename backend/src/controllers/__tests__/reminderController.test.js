/**
 * Tests for Reminder Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/reminderSchedulerService');
jest.mock('../../services/notificationService');

const reminderController = require('../reminderController');
const { PrismaClient } = require('@prisma/client');
const reminderScheduler = require('../../services/reminderSchedulerService');
const notificationService = require('../../services/notificationService');

describe('Reminder Controller', () => {
  let req, res;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      projectReminderSettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn()
      },
      userReminderPreferences: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn()
      },
      reminderLog: {
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        groupBy: jest.fn()
      },
      notification: {
        createMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getProjectReminderSettings', () => {
    it('should get existing project reminder settings', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.projectReminderSettings.findUnique.mockResolvedValue({
        id: 'settings123',
        projectId: 'project123',
        enableReminders: true,
        reminderInterval: 30
      });

      await reminderController.getProjectReminderSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should create default settings if none exist', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.projectReminderSettings.findUnique.mockResolvedValue(null);
      mockPrisma.projectReminderSettings.create.mockResolvedValue({
        id: 'settings123',
        projectId: 'project123',
        enableReminders: true,
        reminderInterval: 30
      });

      await reminderController.getProjectReminderSettings(req, res);

      expect(mockPrisma.projectReminderSettings.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should handle errors', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.projectReminderSettings.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await reminderController.getProjectReminderSettings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProjectReminderSettings', () => {
    it('should update project reminder settings', async () => {
      req.params = { projectId: 'project123' };
      req.body = {
        enableReminders: false,
        reminderInterval: 60
      };

      mockPrisma.projectReminderSettings.upsert.mockResolvedValue({
        id: 'settings123',
        projectId: 'project123',
        ...req.body
      });

      await reminderController.updateProjectReminderSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getUserReminderPreferences', () => {
    it('should get existing user preferences', async () => {
      mockPrisma.userReminderPreferences.findUnique.mockResolvedValue({
        id: 'pref123',
        userId: 'user123',
        enableReminders: true
      });

      await reminderController.getUserReminderPreferences(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should create default preferences if none exist', async () => {
      mockPrisma.userReminderPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.userReminderPreferences.create.mockResolvedValue({
        id: 'pref123',
        userId: 'user123',
        enableReminders: true
      });

      await reminderController.getUserReminderPreferences(req, res);

      expect(mockPrisma.userReminderPreferences.create).toHaveBeenCalled();
    });
  });

  describe('updateUserReminderPreferences', () => {
    it('should update user preferences', async () => {
      req.body = {
        enableReminders: false,
        preferredChannels: ['email']
      };

      mockPrisma.userReminderPreferences.upsert.mockResolvedValue({
        id: 'pref123',
        userId: 'user123',
        ...req.body
      });

      await reminderController.updateUserReminderPreferences(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getUserReminderLogs', () => {
    it('should get user reminder logs with pagination', async () => {
      req.query = { page: '1', limit: '20' };

      mockPrisma.reminderLog.findMany.mockResolvedValue([
        { id: 'log1', userId: 'user123' },
        { id: 'log2', userId: 'user123' }
      ]);

      mockPrisma.reminderLog.count.mockResolvedValue(2);

      await reminderController.getUserReminderLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object)
        })
      );
    });

    it('should filter by projectId', async () => {
      req.query = { projectId: 'project123' };

      mockPrisma.reminderLog.findMany.mockResolvedValue([]);
      mockPrisma.reminderLog.count.mockResolvedValue(0);

      await reminderController.getUserReminderLogs(req, res);

      expect(mockPrisma.reminderLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
            projectId: 'project123'
          })
        })
      );
    });
  });

  describe('markReminderAsRead', () => {
    it('should mark reminder as read', async () => {
      req.params = { reminderId: 'reminder123' };

      mockPrisma.reminderLog.updateMany.mockResolvedValue({ count: 1 });

      await reminderController.markReminderAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('recordReminderAction', () => {
    it('should record reminder action', async () => {
      req.params = { reminderId: 'reminder123' };
      req.body = { actionType: 'ordered' };

      mockPrisma.reminderLog.updateMany.mockResolvedValue({ count: 1 });

      await reminderController.recordReminderAction(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('sendImmediateReminder', () => {
    it('should send immediate reminder for admin', async () => {
      req.user.role = 'ADMIN';
      req.params = { projectId: 'project123' };

      notificationService.sendImmediateProjectReminder = jest.fn().mockResolvedValue({
        sent: 5,
        users: ['user1', 'user2', 'user3', 'user4', 'user5']
      });

      await reminderController.sendImmediateReminder(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should send immediate reminder for producer', async () => {
      req.user.role = 'PRODUCER';
      req.params = { projectId: 'project123' };

      notificationService.sendImmediateProjectReminder = jest.fn().mockResolvedValue({
        sent: 3
      });

      await reminderController.sendImmediateReminder(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should reject for non-admin/producer', async () => {
      req.user.role = 'USER';
      req.params = { projectId: 'project123' };

      await reminderController.sendImmediateReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getReminderSystemStatus', () => {
    it('should get system status for admin', async () => {
      req.user.role = 'ADMIN';

      reminderScheduler.getStatus = jest.fn().mockReturnValue({
        isRunning: true,
        lastRun: new Date()
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrisma.reminderLog.count
        .mockResolvedValueOnce(10)  // remindersToday
        .mockResolvedValueOnce(8)   // remindersSent
        .mockResolvedValueOnce(2);  // remindersFailed

      await reminderController.getReminderSystemStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            system: expect.any(Object),
            stats: expect.any(Object)
          })
        })
      );
    });

    it('should reject for non-admin', async () => {
      req.user.role = 'USER';

      await reminderController.getReminderSystemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getProjectReminderStats', () => {
    it('should get project reminder statistics', async () => {
      req.params = { projectId: 'project123' };
      req.query = {};

      mockPrisma.reminderLog.groupBy.mockResolvedValue([
        { status: 'SENT', _count: { id: 8 } },
        { status: 'FAILED', _count: { id: 2 } }
      ]);

      mockPrisma.reminderLog.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(6);  // actedUpon

      await reminderController.getProjectReminderStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            byStatus: expect.any(Array),
            total: 10,
            actedUpon: 6,
            responseRate: expect.any(String)
          })
        })
      );
    });

    it('should filter by date range', async () => {
      req.params = { projectId: 'project123' };
      req.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-07'
      };

      mockPrisma.reminderLog.groupBy.mockResolvedValue([]);
      mockPrisma.reminderLog.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await reminderController.getProjectReminderStats(req, res);

      expect(mockPrisma.reminderLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project123',
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });
});
