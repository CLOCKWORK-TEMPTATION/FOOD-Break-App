/**
 * مسارات الحمية الغذائية
 * Dietary Routes - API routes for dietary management
 */

const express = require('express');
const router = express.Router();
const dietaryController = require('../controllers/dietaryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * ==========================================
 * Dietary Profile Routes
 * ==========================================
 */

// الحصول على الملف الشخصي للحمية
router.get('/profile', authenticateToken, dietaryController.getDietaryProfile);

// تحديث الملف الشخصي للحمية
router.post('/profile', authenticateToken, dietaryController.updateDietaryProfile);

// حذف الملف الشخصي للحمية
router.delete('/profile', authenticateToken, dietaryController.deleteDietaryProfile);

// الحصول على الحميات النشطة
router.get('/active-diets', authenticateToken, dietaryController.getActiveDiets);

// الحصول على أنواع الحميات المتاحة (عام)
router.get('/diet-types', dietaryController.getAvailableDietTypes);

/**
 * ==========================================
 * Allergy Profile Routes
 * ==========================================
 */

// الحصول على ملف الحساسية
router.get('/allergies', authenticateToken, dietaryController.getAllergyProfile);

// تحديث ملف الحساسية
router.post('/allergies', authenticateToken, dietaryController.updateAllergyProfile);

// الحصول على الحساسيات النشطة
router.get('/allergies/active', authenticateToken, dietaryController.getActiveAllergies);

// الحصول على مسببات الحساسية المتاحة (عام)
router.get('/allergens', dietaryController.getAvailableAllergens);

// فحص عنصر للحساسية
router.get('/check-item/:menuItemId', authenticateToken, dietaryController.checkItemForAllergies);

/**
 * ==========================================
 * Menu Filtering Routes
 * ==========================================
 */

// فلترة عناصر القائمة
router.post('/filter-menu', authenticateToken, dietaryController.filterMenuItems);

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
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
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
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.updateFoodLabel
);

// التحقق من تسمية (للمسؤولين فقط)
router.post(
  '/labels/:menuItemId/verify',
  authenticateToken,
  authorizeRoles(['ADMIN']),
  dietaryController.verifyFoodLabel
);

// إلغاء التحقق من تسمية (للمسؤولين فقط)
router.post(
  '/labels/:menuItemId/unverify',
  authenticateToken,
  authorizeRoles(['ADMIN']),
  dietaryController.unverifyFoodLabel
);

/**
 * ==========================================
 * Custom Order Message Routes
 * ==========================================
 */

// إنشاء رسالة مخصصة
router.post('/messages', authenticateToken, dietaryController.createOrderMessage);

// إنشاء رسائل تلقائية للطلب
router.post('/messages/auto/:orderId', authenticateToken, dietaryController.createAutoMessages);

// إحصائيات رسائل المطعم
router.get(
  '/messages/stats/:restaurantId',
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getMessageStats
);

// الحصول على الرسائل العاجلة للمطعم
router.get(
  '/messages/urgent/:restaurantId',
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getUrgentMessages
);

// الحصول على رسائل طلب
router.get('/messages/order/:orderId', authenticateToken, dietaryController.getOrderMessages);

// الحصول على رسائل المطعم
router.get(
  '/messages/restaurant/:restaurantId',
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.getRestaurantMessages
);

// إقرار رسالة
router.post(
  '/messages/:messageId/acknowledge',
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.acknowledgeMessage
);

// الرد على رسالة
router.post(
  '/messages/:messageId/reply',
  authenticateToken,
  authorizeRoles(['ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER']),
  dietaryController.replyToMessage
);

module.exports = router;
