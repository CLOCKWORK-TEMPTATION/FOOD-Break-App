/**
 * مسارات تقارير جاهزية الإنتاج
 * Production Readiness Reports Routes
 */

const express = require('express');
const router = express.Router();
const productionReadinessController = require('../controllers/productionReadinessController');

// ملاحظة: يمكن إضافة middleware للمصادقة والتفويض هنا
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * معاينة تقرير جاهزية الإنتاج (بدون حفظ)
 * POST /api/production-readiness/reports/preview
 * 
 * Body:
 * {
 *   "productionData": { ... },
 *   "reportDate": "2024-01-15"  // اختياري
 * }
 */
router.post('/reports/preview', productionReadinessController.previewReport);

/**
 * إنشاء تقرير جاهزية إنتاج جديد
 * POST /api/production-readiness/reports
 * 
 * Body:
 * {
 *   "productionData": {
 *     "facilityName": "مصنع الإنتاج الرئيسي",
 *     "projectName": "مشروع التوسع 2024",
 *     "reportingPeriod": "الربع الأول 2024",
 *     "equipment": {
 *       "availabilityRate": 85,
 *       "maintenancePending": true,
 *       "technicalIssues": ["عطل في الخط 3"]
 *     },
 *     "humanResources": {
 *       "staffingLevel": 90,
 *       "trainingCompleted": 75
 *     },
 *     "materials": {
 *       "stockLevel": 60,
 *       "supplyChainIssues": false
 *     },
 *     "qualitySafety": {
 *       "qualityIssues": false,
 *       "safetyViolations": false
 *     },
 *     "infrastructure": {
 *       "facilityCondition": "good"
 *     }
 *   },
 *   "reportDate": "2024-01-15"  // اختياري
 * }
 */
router.post('/reports', productionReadinessController.createReport);

/**
 * الحصول على قائمة التقارير
 * GET /api/production-readiness/reports
 * 
 * Query params:
 * - facilityName: تصفية باسم المنشأة
 * - projectName: تصفية باسم المشروع
 * - overallRating: تصفية بالتقييم العام (FULLY_READY, READY_WITH_NOTES, etc.)
 * - approvalStatus: تصفية بحالة الموافقة (PENDING, APPROVED, REJECTED, UNDER_REVIEW)
 * - startDate: تاريخ البداية
 * - endDate: تاريخ النهاية
 * - limit: عدد النتائج (افتراضي: 50)
 * - offset: الإزاحة للصفحات (افتراضي: 0)
 */
router.get('/reports', productionReadinessController.listReports);

/**
 * الحصول على تقرير محدد
 * GET /api/production-readiness/reports/:reportId
 */
router.get('/reports/:reportId', productionReadinessController.getReport);

/**
 * الحصول على نص التقرير فقط (markdown)
 * GET /api/production-readiness/reports/:reportId/text
 */
router.get('/reports/:reportId/text', productionReadinessController.getReportText);

/**
 * تحديث حالة الموافقة على التقرير
 * PATCH /api/production-readiness/reports/:reportId/approval
 * 
 * Body:
 * {
 *   "status": "APPROVED"  // PENDING, APPROVED, REJECTED, UNDER_REVIEW
 * }
 */
router.patch('/reports/:reportId/approval', productionReadinessController.updateApprovalStatus);

/**
 * حذف تقرير
 * DELETE /api/production-readiness/reports/:reportId
 */
router.delete('/reports/:reportId', productionReadinessController.deleteReport);

module.exports = router;
