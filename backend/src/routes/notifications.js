const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');

const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router;

