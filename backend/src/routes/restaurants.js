const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

/**
 * @route   GET /api/v1/restaurants/nearby
 * @desc    الحصول على المطاعم القريبة
 * @access  Private
 */
router.get('/nearby', 
  authenticateToken,
  [
    query('latitude').isFloat().withMessage('خط العرض غير صالح'),
    query('longitude').isFloat().withMessage('خط الطول غير صالح'),
    query('radius').optional().isFloat({ min: 0.5, max: 10 }).withMessage('نصف القطر يجب أن يكون بين 0.5 و 10 كم')
  ],
  restaurantController.getNearbyRestaurants
);

/**
 * @route   GET /api/v1/restaurants
 * @desc    الحصول على جميع المطاعم
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  restaurantController.getAllRestaurants
);

/**
 * @route   GET /api/v1/restaurants/:id
 * @desc    الحصول على مطعم محدد
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  restaurantController.getRestaurantById
);

/**
 * @route   POST /api/v1/restaurants
 * @desc    إنشاء مطعم جديد
 * @access  Admin/Producer
 */
router.post('/', 
  authenticateToken,
  requireAdminOrProducer,
  [
    body('name').trim().notEmpty().withMessage('اسم المطعم مطلوب'),
    body('address').trim().notEmpty().withMessage('عنوان المطعم مطلوب'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صالح'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صالح'),
    body('phoneNumber').optional().isMobilePhone().withMessage('رقم الهاتف غير صالح'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('cuisineType').optional().trim(),
    body('isPartner').optional().isBoolean().withMessage('isPartner يجب أن يكون قيمة منطقية'),
    body('isActive').optional().isBoolean().withMessage('isActive يجب أن يكون قيمة منطقية')
  ],
  restaurantController.createRestaurant
);

/**
 * @route   PUT /api/v1/restaurants/:id
 * @desc    تحديث مطعم
 * @access  Admin/Producer
 */
router.put('/:id', 
  authenticateToken,
  requireAdminOrProducer,
  [
    body('name').optional().trim().notEmpty().withMessage('اسم المطعم لا يمكن أن يكون فارغاً'),
    body('address').optional().trim().notEmpty().withMessage('عنوان المطعم لا يمكن أن يكون فارغاً'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صالح'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صالح'),
    body('phoneNumber').optional().isMobilePhone().withMessage('رقم الهاتف غير صالح'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('isPartner').optional().isBoolean().withMessage('isPartner يجب أن يكون قيمة منطقية'),
    body('isActive').optional().isBoolean().withMessage('isActive يجب أن يكون قيمة منطقية'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('التقييم يجب أن يكون بين 0 و 5')
  ],
  restaurantController.updateRestaurant
);

/**
 * @route   DELETE /api/v1/restaurants/:id
 * @desc    حذف مطعم
 * @access  Admin/Producer
 */
router.delete('/:id', 
  authenticateToken,
  requireAdminOrProducer,
  restaurantController.deleteRestaurant
);

module.exports = router;
