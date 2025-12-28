/**
 * Notification Controller Unit Tests
 * اختبارات وحدة متحكم الإشعارات
 */

const notificationController = require('../../../src/controllers/notificationController');
const notificationService = require('../../../src/services/notificationService');

jest.mock('../../../src/services/notificationService');

describe('Notification Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'ORDER_CONFIRMED',
          title: 'تم تأكيد طلبك',
          isRead: false
        },
        {
          id: 'notif-2',
          type: 'ORDER_DELIVERED',
          title: 'تم توصيل طلبك',
          isRead: true
        }
      ];

      notificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      await notificationController.getNotifications(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications
      });
    });

    it('should filter unread notifications when requested', async () => {
      mockReq.query.unread = 'true';

      notificationService.getUnreadNotifications.mockResolvedValue([]);

      await notificationController.getNotifications(mockReq, mockRes, mockNext);

      expect(notificationService.getUnreadNotifications).toHaveBeenCalledWith('test-user-id');
    });

    it('should paginate results', async () => {
      mockReq.query.page = '2';
      mockReq.query.limit = '20';

      notificationService.getUserNotifications.mockResolvedValue([]);

      await notificationController.getNotifications(mockReq, mockRes, mockNext);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        'test-user-id',
        2,
        20
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

      mockReq.params.id = 'notif-1';

      notificationService.markAsRead.mockResolvedValue(mockNotification);

      await notificationController.markAsRead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification
      });
    });

    it('should return 404 for non-existent notification', async () => {
      mockReq.params.id = 'non-existent';

      notificationService.markAsRead.mockResolvedValue(null);

      await notificationController.markAsRead(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationService.markAllAsRead.mockResolvedValue(5);

      await notificationController.markAllAsRead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تحديد 5 إشعارات كمقروءة'
      });
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'test-user-id',
        type: 'SYSTEM',
        title: 'تنبيه النظام',
        message: 'صيانة مقررة'
      };

      mockReq.body = {
        type: 'SYSTEM',
        title: 'تنبيه النظام',
        message: 'صيانة مقررة'
      };

      notificationService.createNotification.mockResolvedValue(mockNotification);

      await notificationController.createNotification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = {}; // Missing required fields

      await notificationController.createNotification(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockReq.params.id = 'notif-1';

      notificationService.deleteNotification.mockResolvedValue(true);

      await notificationController.deleteNotification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف الإشعار'
      });
    });

    it('should handle not found error', async () => {
      mockReq.params.id = 'non-existent';

      notificationService.deleteNotification.mockResolvedValue(false);

      await notificationController.deleteNotification(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification', async () => {
      mockReq.params.id = 'notif-1';

      notificationService.sendPushNotification.mockResolvedValue(true);

      await notificationController.sendPushNotification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إرسال الإشعار'
      });
    });

    it('should handle push send failure', async () => {
      mockReq.params.id = 'notif-1';

      notificationService.sendPushNotification.mockResolvedValue(false);

      await notificationController.sendPushNotification(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return notification preferences', async () => {
      const mockPrefs = {
        enablePush: true,
        enableEmail: false,
        enableSMS: false
      };

      notificationService.getPreferences.mockResolvedValue(mockPrefs);

      await notificationController.getNotificationPreferences(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPrefs
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const mockPrefs = {
        enablePush: false,
        enableEmail: true,
        enableSMS: false
      };

      mockReq.body = {
        enablePush: false,
        enableEmail: true
      };

      notificationService.updatePreferences.mockResolvedValue(mockPrefs);

      await notificationController.updateNotificationPreferences(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPrefs
      });
    });
  });
});
