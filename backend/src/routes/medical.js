/**
 * Medical Routes - مسارات التنبيهات الطبية
 * Feature #24: Allergy & Medical Alerts
 */

const express = require('express');
const medicalController = require('../controllers/medicalController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

const router = express.Router();

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * إنشاء أو تحديث الملف الطبي
 * POST /api/medical/profile
 */
router.post('/profile',
  [
    body('allergies').optional().isArray(),
    body('chronicConditions').optional().isArray(),
    body('medications').optional().isArray(),
    body('emergencyContact').optional().isObject(),
    body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('medicalNotes').optional().isString(),
    body('consentGiven').isBoolean().withMessage('الموافقة على معالجة البيانات الطبية مطلوبة')
  ],
  validateRequest,
  medicalController.createOrUpdateMedicalProfile
);

/**
 * الحصول على الملف الطبي
 * GET /api/medical/profile
 */
router.get('/profile',
  medicalController.getMedicalProfile
);

/**
 * فحص عنصر للتحذيرات الطبية
 * POST /api/medical/check-item
 */
router.post('/check-item',
  [
    body('menuItemId').optional().isUUID(),
    body('ingredients').optional().isArray()
  ],
  validateRequest,
  medicalController.checkItemForMedicalAlerts
);

/**
 * تسجيل حادثة طبية
 * POST /api/medical/incidents
 */
router.post('/incidents',
  [
    body('incidentType').isIn(['ALLERGIC_REACTION', 'FOOD_POISONING', 'MEDICATION_INTERACTION', 'OTHER']).withMessage('نوع الحادثة غير صحيح'),
    body('severity').isIn(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']).withMessage('درجة الخطورة غير صحيحة'),
    body('description').notEmpty().withMessage('وصف الحادثة مطلوب'),
    body('menuItemId').optional().isUUID(),
    body('symptoms').optional().isArray(),
    body('actionTaken').optional().isString(),
    body('location').optional().isString()
  ],
  validateRequest,
  medicalController.reportMedicalIncident
);

/**
 * الحصول على تاريخ الحوادث الطبية
 * GET /api/medical/incidents
 */
router.get('/incidents',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('severity').optional().isIn(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  medicalController.getMedicalIncidents
);

/**
 * تحديث موافقة معالجة البيانات الطبية
 * POST /api/medical/consent
 */
router.post('/consent',
  [
    body('consentType').isIn(['DATA_PROCESSING', 'EMERGENCY_SHARING', 'RESEARCH_PARTICIPATION']).withMessage('نوع الموافقة غير صحيح'),
    body('granted').isBoolean().withMessage('حالة الموافقة مطلوبة'),
    body('version').optional().isString()
  ],
  validateRequest,
  medicalController.updateMedicalConsent
);

/**
 * الحصول على حالة الموافقات الطبية
 * GET /api/medical/consent
 */
router.get('/consent',
  medicalController.getMedicalConsent
);

/**
 * إضافة مكون جديد (Admin only)
 * POST /api/medical/ingredients
 */
router.post('/ingredients',
  authorizeRoles('ADMIN'),
  [
    body('name').notEmpty().withMessage('اسم المكون مطلوب'),
    body('nameArabic').optional().isString(),
    body('category').notEmpty().withMessage('فئة المكون مطلوبة'),
    body('commonAllergens').optional().isArray(),
    body('medicalWarnings').optional().isArray(),
    body('nutritionalInfo').optional().isObject()
  ],
  validateRequest,
  medicalController.addIngredient
);

/**
 * البحث في المكونات
 * GET /api/medical/ingredients/search
 */
router.get('/ingredients/search',
  [
    query('query').notEmpty().withMessage('نص البحث مطلوب'),
    query('category').optional().isString(),
    query('allergen').optional().isString()
  ],
  validateRequest,
  medicalController.searchIngredients
);

/**
 * تصدير البيانات الطبية (GDPR Compliance)
 * GET /api/medical/export
 */
router.get('/export',
  medicalController.exportMedicalData
);

/**
 * حذف البيانات الطبية (GDPR Right to be Forgotten)
 * DELETE /api/medical/profile
 */
router.delete('/profile',
  [
    body('confirmDeletion').isBoolean().withMessage('تأكيد الحذف مطلوب')
  ],
  validateRequest,
  medicalController.deleteMedicalData
);

module.exports = router;