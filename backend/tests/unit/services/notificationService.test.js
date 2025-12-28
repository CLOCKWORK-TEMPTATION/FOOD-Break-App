/**
 * Notification Service Unit Tests
 * اختبارات وحدة خدمة الإشعارات
 */

const notificationService = require('../../../src/services/notificationService');
const { prisma } = require('@prisma/client');

jest.mock('@prisma/client');

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'ORDER_CONFIRMED',
          isRead: false
        }
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications('user-1', 1, 10);

      expect(result).toEqual(mockNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          skip: 0
        })
      );
    });

    it('should filter by unread status', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await notificationService.getUnreadNotifications('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            isRead: false
          }
        })
      );
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'SYSTEM',
        title: 'Test',
        message: 'Test message'
      };

      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification({
        userId: 'user-1',
        type: 'SYSTEM',
        title: 'Test',
        message: 'Test message'
      });

      expect(result).toEqual(mockNotification);
    });

    it('should link to order if orderId provided', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        orderId: 'order-1'
      };

      prisma.notification.create.mockResolvedValue(mockNotification);

      await notificationService.createNotification({
        userId: 'user-1',
        orderId: 'order-1',
        type: 'ORDER_CONFIRMED',
        title: 'Order confirmed',
        message: 'Your order is confirmed'
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-1'
          })
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        isRead: true,
        readAt: new Date()
      };

      prisma.notification.update.mockResolvedValue(mockNotification);

      const result = await notificationService.markAsRead('notif-1', 'user-1');

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: {
            isRead: true,
            readAt: expect.any(Date)
          }
        })
      );
    });

    it('should return null if notification not found', async () => {
      prisma.notification.update.mockRejectedValue(new Error('Record not found'));

      const result = await notificationService.markAsRead('non-existent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const count = await notificationService.markAllAsRead('user-1');

      expect(count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            isRead: false
          },
          data: {
            isRead: true,
            readAt: expect.any(Date)
          }
        })
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      prisma.notification.delete.mockResolvedValue({ id: 'notif-1' });

      const result = await notificationService.deleteNotification('notif-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      prisma.notification.delete.mockRejectedValue(new Error('Not found'));

      const result = await notificationService.deleteNotification('non-existent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Test',
        message: 'Test message',
        type: 'ORDER_CONFIRMED'
      };

      prisma.notification.findUnique.mockResolvedValue(mockNotification);

      const result = await notificationService.sendPushNotification('notif-1');

      expect(result).toBe(true);
    });

    it('should return false if notification not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      const result = await notificationService.sendPushNotification('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences with defaults', async () => {
      const mockPrefs = {
        userId: 'user-1',
        enablePush: true,
        enableEmail: false,
        enableSMS: false
      };

      prisma.userReminderPreferences.findUnique.mockResolvedValue(mockPrefs);

      const result = await notificationService.getPreferences('user-1');

      expect(result).toEqual(mockPrefs);
    });

    it('should return default preferences if none exist', async () => {
      prisma.userReminderPreferences.findUnique.mockResolvedValue(null);

      const result = await notificationService.getPreferences('user-1');

      expect(result).toEqual({
        enablePush: true,
        enableEmail: false,
        enableSMS: false
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const mockPrefs = {
        id: 'prefs-1',
        userId: 'user-1',
        enablePush: false
      };

      prisma.userReminderPreferences.upsert.mockResolvedValue(mockPrefs);

      const result = await notificationService.updatePreferences('user-1', {
        enablePush: false
      });

      expect(result).toEqual(mockPrefs);
    });
  });
});
