const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');

const notificationService = require('../services/notificationService');
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   POST /api/v1/notifications/send
 * @desc    إرسال إشعار عام
 * @access  Admin/Producer
 */
router.post(
  '/send',
  authenticateToken,
  authorizeRoles(['ADMIN', 'PRODUCER']),
  notificationController.sendBroadcast
);

/**
 * @route   GET /api/v1/notifications
 * @desc    جلب إشعارات المستخدم الحالي
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page غير صالح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit غير صالح'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly غير صالح')
  ],
  async (req, res, next) => {
    try {
      const result = await notificationService.getUserNotifications(req.user.id, req.query);
      res.json({
        success: true,
        data: result.notifications,
        meta: { pagination: result.pagination }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    تحديد إشعار كمقروء
 * @access  Private
 */
router.patch(
  '/:id/read',
  authenticateToken,
  [param('id').notEmpty().withMessage('معرف الإشعار مفقود')],
  async (req, res, next) => {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    تحديد جميع الإشعارات كمقروءة
 * @access  Private
 */
router.patch(
  '/read-all',
  authenticateToken,
  async (req, res, next) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json({
        success: true,
        data: { count: result.count }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    حذف إشعار
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  [param('id').notEmpty().withMessage('معرف الإشعار مفقود')],
  async (req, res, next) => {
    try {
      await notificationService.deleteNotification(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

