/**
 * Medical Controller - متحكم التنبيهات الطبية
 * Feature #24: Allergy & Medical Alerts (تتبع الحساسية والطوارئ الطبية)
 * 
 * يوفر نظام شامل للتعامل مع:
 * - Medical profile system
 * - Red alert system for allergen detection
 * - Medical emergency hotline integration
 * - Ingredient cross-checking system
 * - HIPAA/GDPR compliance
 */

const medicalService = require('../services/medicalService');
const allergyService = require('../services/dietary/allergyService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * إنشاء أو تحديث الملف الطبي
 * POST /api/medical/profile
 */
const createOrUpdateMedicalProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      allergies,
      chronicConditions,
      medications,
      emergencyContact,
      bloodType,
      medicalNotes,
      consentGiven
    } = req.body;

    if (!consentGiven) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'يجب الموافقة على معالجة البيانات الطبية'
        }
      });
    }

    const medicalProfile = await medicalService.createOrUpdateMedicalProfile(userId, {
      allergies,
      chronicConditions,
      medications,
      emergencyContact,
      bloodType,
      medicalNotes,
      consentGiven,
      consentDate: new Date()
    });

    res.json({
      success: true,
      data: medicalProfile,
      message: req.__('medical.profileUpdated')
    });
  } catch (error) {
    logger.error('Error creating/updating medical profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MEDICAL_PROFILE_ERROR',
        message: req.__('medical.profileUpdateFailed')
      }
    });
  }
};

/**
 * الحصول على الملف الطبي
 * GET /api/medical/profile
 */
const getMedicalProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await medicalService.getMedicalProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEDICAL_PROFILE_NOT_FOUND',
          message: req.__('medical.profileNotFound')
        }
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting medical profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MEDICAL_PROFILE_FETCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * فحص عنصر قائمة للحساسية والتحذيرات الطبية
 * POST /api/medical/check-item
 */
const checkItemForMedicalAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId, ingredients } = req.body;

    if (!menuItemId && !ingredients) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ITEM_DATA',
          message: 'يجب توفير معرف العنصر أو قائمة المكونات'
        }
      });
    }

    const alertResult = await medicalService.checkItemForMedicalAlerts(userId, {
      menuItemId,
      ingredients
    });

    // إذا كان هناك تحذير أحمر، إرسال إشعار فوري
    if (alertResult.alertLevel === 'RED') {
      await notificationService.sendMedicalAlert(userId, {
        type: 'SEVERE_ALLERGY_WARNING',
        itemName: alertResult.itemName,
        allergens: alertResult.detectedAllergens,
        message: req.__('emergency.allergyAlertTriggered')
      });

      // إشعار جهة الاتصال الطارئة إذا كانت متوفرة
      if (alertResult.emergencyContact) {
        await medicalService.notifyEmergencyContact(
          alertResult.emergencyContact,
          userId,
          alertResult
        );
      }
    }

    res.json({
      success: true,
      data: alertResult
    });
  } catch (error) {
    logger.error('Error checking item for medical alerts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MEDICAL_CHECK_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * تسجيل حادثة طبية
 * POST /api/medical/incidents
 */
const reportMedicalIncident = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      incidentType,
      severity,
      description,
      menuItemId,
      symptoms,
      actionTaken,
      location
    } = req.body;

    if (!incidentType || !severity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.__('validation.required')
        }
      });
    }

    const incident = await medicalService.reportMedicalIncident(userId, {
      incidentType,
      severity,
      description,
      menuItemId,
      symptoms,
      actionTaken,
      location,
      reportedAt: new Date()
    });

    // إذا كانت الحادثة شديدة، إرسال تنبيه فوري
    if (severity === 'SEVERE' || severity === 'CRITICAL') {
      await medicalService.triggerEmergencyProtocol(userId, incident);
    }

    res.status(201).json({
      success: true,
      data: incident,
      message: req.__('medical.incidentReported')
    });
  } catch (error) {
    logger.error('Error reporting medical incident:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INCIDENT_REPORT_ERROR',
        message: req.__('medical.incidentReportFailed')
      }
    });
  }
};

/**
 * الحصول على تاريخ الحوادث الطبية
 * GET /api/medical/incidents
 */
const getMedicalIncidents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, severity, page = 1, limit = 20 } = req.query;

    const incidents = await medicalService.getMedicalIncidents(userId, {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      severity,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    logger.error('Error getting medical incidents:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INCIDENTS_FETCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * تحديث موافقة معالجة البيانات الطبية
 * POST /api/medical/consent
 */
const updateMedicalConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { consentType, granted, version } = req.body;

    if (!consentType || typeof granted !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONSENT_DATA',
          message: 'بيانات الموافقة غير صحيحة'
        }
      });
    }

    const consent = await medicalService.updateMedicalConsent(userId, {
      consentType,
      granted,
      version,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: consent,
      message: req.__('medical.consentUpdated')
    });
  } catch (error) {
    logger.error('Error updating medical consent:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSENT_UPDATE_ERROR',
        message: req.__('medical.consentUpdateFailed')
      }
    });
  }
};

/**
 * الحصول على حالة الموافقات الطبية
 * GET /api/medical/consent
 */
const getMedicalConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const consents = await medicalService.getMedicalConsent(userId);

    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    logger.error('Error getting medical consent:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSENT_FETCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * إضافة مكون جديد لقاعدة بيانات المكونات
 * POST /api/medical/ingredients (Admin only)
 */
const addIngredient = async (req, res) => {
  try {
    const {
      name,
      nameArabic,
      category,
      commonAllergens,
      medicalWarnings,
      nutritionalInfo
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.__('validation.required')
        }
      });
    }

    const ingredient = await medicalService.addIngredient({
      name,
      nameArabic,
      category,
      commonAllergens,
      medicalWarnings,
      nutritionalInfo,
      addedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: ingredient,
      message: req.__('medical.ingredientAdded')
    });
  } catch (error) {
    logger.error('Error adding ingredient:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INGREDIENT_ADD_ERROR',
        message: req.__('medical.ingredientAddFailed')
      }
    });
  }
};

/**
 * البحث في المكونات
 * GET /api/medical/ingredients/search
 */
const searchIngredients = async (req, res) => {
  try {
    const { query, category, allergen } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_QUERY_REQUIRED',
          message: req.__('validation.searchQueryRequired')
        }
      });
    }

    const ingredients = await medicalService.searchIngredients({
      query,
      category,
      allergen
    });

    res.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    logger.error('Error searching ingredients:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INGREDIENT_SEARCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * تصدير البيانات الطبية (GDPR Compliance)
 * GET /api/medical/export
 */
const exportMedicalData = async (req, res) => {
  try {
    const userId = req.user.id;
    const exportData = await medicalService.exportUserMedicalData(userId);

    res.json({
      success: true,
      data: exportData,
      message: req.__('medical.dataExported')
    });
  } catch (error) {
    logger.error('Error exporting medical data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATA_EXPORT_ERROR',
        message: req.__('medical.dataExportFailed')
      }
    });
  }
};

/**
 * حذف البيانات الطبية (GDPR Right to be Forgotten)
 * DELETE /api/medical/profile
 */
const deleteMedicalData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmDeletion } = req.body;

    if (!confirmDeletion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DELETION_NOT_CONFIRMED',
          message: 'يجب تأكيد حذف البيانات الطبية'
        }
      });
    }

    await medicalService.deleteMedicalData(userId);

    res.json({
      success: true,
      message: req.__('medical.dataDeleted')
    });
  } catch (error) {
    logger.error('Error deleting medical data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATA_DELETION_ERROR',
        message: req.__('medical.dataDeletionFailed')
      }
    });
  }
};

module.exports = {
  createOrUpdateMedicalProfile,
  getMedicalProfile,
  checkItemForMedicalAlerts,
  reportMedicalIncident,
  getMedicalIncidents,
  updateMedicalConsent,
  getMedicalConsent,
  addIngredient,
  searchIngredients,
  exportMedicalData,
  deleteMedicalData
};