const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

/**
 * @route   GET /api/v1/menus/core
 * @desc    الحصول على القائمة الأساسية (Core Menu)
 * @access  Private
 */
router.get('/core', 
  authenticateToken,
  menuController.getCoreMenu
);

/**
 * @route   GET /api/v1/menus/geographic
 * @desc    الحصول على القائمة الجغرافية
 * @access  Private
 */
router.get('/geographic', 
  authenticateToken,
  [
    query('latitude').isFloat().withMessage('خط العرض غير صالح'),
    query('longitude').isFloat().withMessage('خط الطول غير صالح'),
    query('radius').optional().isFloat({ min: 0.5, max: 10 }).withMessage('نصف القطر يجب أن يكون بين 0.5 و 10 كم')
  ],
  menuController.getGeographicMenu
);

/**
 * @route   GET /api/v1/menus/search
 * @desc    البحث في القوائم
 * @access  Private
 */
router.get('/search', 
  authenticateToken,
  [
    query('q').trim().notEmpty().withMessage('نص البحث مطلوب'),
    query('menuType').optional().isIn(['CORE', 'GEOGRAPHIC']).withMessage('نوع القائمة غير صالح'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('الحد الأدنى للسعر غير صالح'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('الحد الأقصى للسعر غير صالح')
  ],
  menuController.searchMenuItems
);

/**
 * @route   GET /api/v1/menus
 * @desc    الحصول على جميع عناصر القائمة
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  menuController.getAllMenuItems
);

/**
 * @route   GET /api/v1/menus/:id
 * @desc    الحصول على عنصر قائمة محدد
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  menuController.getMenuItemById
);

/**
 * @route   POST /api/v1/menus
 * @desc    إنشاء عنصر قائمة جديد
 * @access  Admin/Producer
 */
router.post('/', 
  authenticateToken,
  requireAdminOrProducer,
  [
    body('restaurantId').isUUID().withMessage('معرف المطعم غير صالح'),
    body('name').trim().notEmpty().withMessage('اسم الطبق مطلوب'),
    body('nameAr').optional().trim(),
    body('description').optional().trim(),
    body('descriptionAr').optional().trim(),
    body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً'),
    body('category').optional().trim(),
    body('imageUrl').optional().isURL().withMessage('رابط الصورة غير صالح'),
    body('menuType').isIn(['CORE', 'GEOGRAPHIC']).withMessage('نوع القائمة غير صالح'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable يجب أن يكون قيمة منطقية'),
    body('qualityScore').optional().isFloat({ min: 0, max: 5 }).withMessage('درجة الجودة يجب أن تكون بين 0 و 5')
  ],
  menuController.createMenuItem
);

/**
 * @route   PUT /api/v1/menus/:id
 * @desc    تحديث عنصر قائمة
 * @access  Admin/Producer
 */
router.put('/:id', 
  authenticateToken,
  requireAdminOrProducer,
  [
    body('name').optional().trim().notEmpty().withMessage('اسم الطبق لا يمكن أن يكون فارغاً'),
    body('price').optional().isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً'),
    body('category').optional().trim(),
    body('imageUrl').optional().isURL().withMessage('رابط الصورة غير صالح'),
    body('menuType').optional().isIn(['CORE', 'GEOGRAPHIC']).withMessage('نوع القائمة غير صالح'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable يجب أن يكون قيمة منطقية'),
    body('qualityScore').optional().isFloat({ min: 0, max: 5 }).withMessage('درجة الجودة يجب أن تكون بين 0 و 5')
  ],
  menuController.updateMenuItem
);

/**
 * @route   DELETE /api/v1/menus/:id
 * @desc    حذف عنصر قائمة
 * @access  Admin/Producer
 */
router.delete('/:id', 
  authenticateToken,
  requireAdminOrProducer,
  menuController.deleteMenuItem
);

module.exports = router;
