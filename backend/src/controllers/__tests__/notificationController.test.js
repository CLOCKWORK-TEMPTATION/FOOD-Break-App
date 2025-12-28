/**
 * Tests for Notification Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/notificationService');

const notificationController = require('../notificationController');
const { PrismaClient } = require('@prisma/client');
const notificationService = require('../../services/notificationService');

describe('Notification Controller', () => {
  let req, res;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn()
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

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      req.query = { page: '1', limit: '20' };

      mockPrisma.notification.findMany.mockResolvedValue([
        { id: 'notif1', title: 'Order Update', isRead: false },
        { id: 'notif2', title: 'Promotion', isRead: true }
      ]);

      mockPrisma.notification.count.mockResolvedValue(2);

      await notificationController.getUserNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notifications: expect.any(Array),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should filter by read status', async () => {
      req.query = { isRead: 'false' };

      mockPrisma.notification.findMany.mockResolvedValue([
        { id: 'notif1', isRead: false }
      ]);

      mockPrisma.notification.count.mockResolvedValue(1);

      await notificationController.getUserNotifications(req, res);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
            isRead: false
          })
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      req.params = { notificationId: 'notif123' };

      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif123',
        isRead: true,
        readAt: new Date()
      });

      await notificationController.markAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await notificationController.markAllAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            updated: 5
          })
        })
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      req.params = { notificationId: 'notif123' };

      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif123',
        userId: 'user123'
      });

      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif123'
      });

      await notificationController.deleteNotification(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should reject unauthorized deletion', async () => {
      req.params = { notificationId: 'notif123' };

      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif123',
        userId: 'other_user'
      });

      await notificationController.deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all user notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      await notificationController.deleteAllNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deleted: 10
          })
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      await notificationController.getUnreadCount(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            count: 5
          })
        })
      );
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user', async () => {
      req.body = {
        userId: 'user456',
        type: 'ORDER_UPDATE',
        title: 'Order Delivered',
        message: 'Your order has been delivered'
      };

      notificationService.sendNotification = jest.fn().mockResolvedValue({
        id: 'notif123',
        ...req.body
      });

      await notificationController.sendNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getNotificationSettings', () => {
    it('should get user notification settings', async () => {
      notificationService.getUserNotificationSettings = jest.fn().mockResolvedValue({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      });

      await notificationController.getNotificationSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings', async () => {
      req.body = {
        emailNotifications: false,
        pushNotifications: true
      };

      notificationService.updateNotificationSettings = jest.fn().mockResolvedValue({
        ...req.body
      });

      await notificationController.updateNotificationSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});
