/**
 * مسارات الحمية الغذائية
 * Dietary Routes - API routes for dietary management
 */

const express = require('express');
const router = express.Router();
const dietaryController = require('../controllers/dietaryController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * ==========================================
 * Dietary Profile Routes
 * ==========================================
 */

// الحصول على الملف الشخصي للحمية
router.get('/profile', authenticate, dietaryController.getDietaryProfile);

// تحديث الملف الشخصي للحمية
router.post('/profile', authenticate, dietaryController.updateDietaryProfile);

// حذف الملف الشخصي للحمية
router.delete('/profile', authenticate, dietaryController.deleteDietaryProfile);

// الحصول على الحميات النشطة
router.get('/active-diets', authenticate, dietaryController.getActiveDiets);

// الحصول على أنواع الحميات المتاحة (عام)
router.get('/diet-types', dietaryController.getAvailableDietTypes);

/**
 * ==========================================
 * Allergy Profile Routes
 * ==========================================
 */

// الحصول على ملف الحساسية
router.get('/allergies', authenticate, dietaryController.getAllergyProfile);

// تحديث ملف الحساسية
router.post('/allergies', authenticate, dietaryController.updateAllergyProfile);

// الحصول على الحساسيات النشطة
router.get('/allergies/active', authenticate, dietaryController.getActiveAllergies);

// الحصول على مسببات الحساسية المتاحة (عام)
router.get('/allergens', dietaryController.getAvailableAllergens);

// فحص عنصر للحساسية
router.get('/check-item/:menuItemId', authenticate, dietaryController.checkItemForAllergies);

/**
 * ==========================================
 * Menu Filtering Routes
 * ==========================================
 */

// فلترة عناصر القائمة
router.post('/filter-menu', authenticate, dietaryController.filterMenuItems);

// البحث عن عناصر متوافقة
router.get('/compatible-items/:restaurantId', dietaryController.findCompatibleItems);

/**
 * ==========================================
 * Food Label Routes
 * ==========================================
 */

// الحصول على أنواع التسميات المتاحة (عام)
router.get('/label-types', dietaryController.getAvailableLabelTypes);

// إحصائيات تسميات المطعم
router.get(
  '/labels/stats/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getRestaurantLabelStats
);

// الحصول على تسمية عنصر
router.get('/labels/:menuItemId', dietaryController.getFoodLabel);

// الحصول على التسميات النشطة لعنصر
router.get('/labels/:menuItemId/active', dietaryController.getActiveLabels);

// معلومات الحساسية لعنصر
router.get('/allergen-info/:menuItemId', dietaryController.getAllergenInfo);

// إنشاء أو تحديث تسمية (للمطاعم فقط)
router.post(
  '/labels/:menuItemId',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.updateFoodLabel
);

// التحقق من تسمية (للمسؤولين فقط)
router.post(
  '/labels/:menuItemId/verify',
  authenticate,
  authorize(['ADMIN']),
  dietaryController.verifyFoodLabel
);

// إلغاء التحقق من تسمية (للمسؤولين فقط)
router.post(
  '/labels/:menuItemId/unverify',
  authenticate,
  authorize(['ADMIN']),
  dietaryController.unverifyFoodLabel
);

/**
 * ==========================================
 * Custom Order Message Routes
 * ==========================================
 */

// إنشاء رسالة مخصصة
router.post('/messages', authenticate, dietaryController.createOrderMessage);

// إنشاء رسائل تلقائية للطلب
router.post('/messages/auto/:orderId', authenticate, dietaryController.createAutoMessages);

// إحصائيات رسائل المطعم
router.get(
  '/messages/stats/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getMessageStats
);

// الحصول على الرسائل العاجلة للمطعم
router.get(
  '/messages/urgent/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getUrgentMessages
);

// الحصول على رسائل طلب
router.get('/messages/order/:orderId', authenticate, dietaryController.getOrderMessages);

// الحصول على رسائل المطعم
router.get(
  '/messages/restaurant/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getRestaurantMessages
);

// إقرار رسالة
router.post(
  '/messages/:messageId/acknowledge',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.acknowledgeMessage
);

// الرد على رسالة
router.post(
  '/messages/:messageId/reply',
  authenticate,
  authorize(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.replyToMessage
);

module.exports = router;
