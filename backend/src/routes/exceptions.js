const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const exceptionController = require('../controllers/exceptionController');
const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

/**
 * @route   GET /api/v1/exceptions/eligibility
 * @desc    التحقق من أهلية المستخدم للاستثناء
 * @access  Private
 */
router.get('/eligibility', 
  authenticateToken,
  [
    query('exceptionType')
      .isIn(['FULL', 'LIMITED', 'SELF_PAID'])
      .withMessage('نوع الاستثناء غير صالح')
  ],
  exceptionController.checkEligibility
);

/**
 * @route   GET /api/v1/exceptions/my-exceptions
 * @desc    الحصول على استثناءات المستخدم الحالي
 * @access  Private
 */
router.get('/my-exceptions', 
  authenticateToken,
  exceptionController.getMyExceptions
);

/**
 * @route   POST /api/v1/exceptions/calculate-cost
 * @desc    حساب تكلفة الاستثناء
 * @access  Private
 */
router.post('/calculate-cost', 
  authenticateToken,
  [
    body('exceptionType')
      .isIn(['FULL', 'LIMITED', 'SELF_PAID'])
      .withMessage('نوع الاستثناء غير صالح'),
    body('orderTotal')
      .isFloat({ min: 0 })
      .withMessage('إجمالي الطلب يجب أن يكون رقماً موجباً'),
    body('standardMealCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('تكلفة الوجبة القياسية يجب أن تكون رقماً موجباً')
  ],
  exceptionController.calculateCost
);

/**
 * @route   POST /api/v1/exceptions
 * @desc    إنشاء استثناء جديد
 * @access  Private
 */
router.post('/', 
  authenticateToken,
  [
    body('orderId')
      .optional()
      .isUUID()
      .withMessage('معرف الطلب غير صالح'),
    body('exceptionType')
      .isIn(['FULL', 'LIMITED', 'SELF_PAID'])
      .withMessage('نوع الاستثناء غير صالح'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('المبلغ يجب أن يكون رقماً موجباً')
  ],
  exceptionController.createException
);

/**
 * @route   GET /api/v1/exceptions
 * @desc    الحصول على جميع الاستثناءات (للإداريين)
 * @access  Admin/Producer
 */
router.get('/', 
  authenticateToken,
  requireAdminOrProducer,
  exceptionController.getAllExceptions
);

/**
 * @route   POST /api/v1/exceptions/financial-report
 * @desc    إنشاء تقرير مالي
 * @access  Admin/Producer
 */
router.post('/financial-report', 
  authenticateToken,
  requireAdminOrProducer,
  [
    body('startDate')
      .isISO8601()
      .withMessage('تاريخ البداية غير صالح'),
    body('endDate')
      .isISO8601()
      .withMessage('تاريخ النهاية غير صالح')
  ],
  exceptionController.generateFinancialReport
);

module.exports = router;
