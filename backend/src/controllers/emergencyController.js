/**
 * Emergency Controller - متحكم وضع الطوارئ
 * Feature #23: Emergency Mode (وضع الطوارئ)
 * 
 * يوفر نظام طلبات سريع للحالات الطارئة مع:
 * - Fast-track ordering system
 * - Emergency restaurant network
 * - Schedule change notifications
 * - Pre-prepared meal inventory
 * - Emergency protocol workflows
 */

const emergencyService = require('../services/emergencyService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * تفعيل وضع الطوارئ للمشروع
 * POST /api/emergency/activate
 */
const activateEmergencyMode = async (req, res) => {
  try {
    const { projectId, emergencyType, reason, estimatedDuration } = req.body;
    const activatedBy = req.user.id;

    if (!projectId || !emergencyType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.t('validation.required')
        }
      });
    }

    const emergencySession = await emergencyService.activateEmergencyMode({
      projectId,
      emergencyType,
      reason,
      estimatedDuration,
      activatedBy
    });

    // إشعار فوري لجميع أعضاء الفريق
    await notificationService.sendEmergencyAlert(projectId, {
      type: 'EMERGENCY_ACTIVATED',
      message: req.t('emergency.emergencyProtocolActivated'),
      emergencyType,
      sessionId: emergencySession.id
    });

    res.status(201).json({
      success: true,
      data: emergencySession,
      message: req.t('emergency.emergencyProtocolActivated')
    });
  } catch (error) {
    logger.error('Error activating emergency mode:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMERGENCY_ACTIVATION_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * إنشاء طلب طوارئ سريع
 * POST /api/emergency/orders
 */
const createEmergencyOrder = async (req, res) => {
  try {
    const { projectId, urgencyLevel, specialInstructions, deliveryLocation } = req.body;
    const userId = req.user.id;

    if (!projectId || !urgencyLevel) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.t('validation.required')
        }
      });
    }

    // التحقق من وجود جلسة طوارئ نشطة
    const activeSession = await emergencyService.getActiveEmergencySession(projectId);
    if (!activeSession) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ACTIVE_EMERGENCY_SESSION',
          message: 'لا توجد جلسة طوارئ نشطة لهذا المشروع'
        }
      });
    }

    const emergencyOrder = await emergencyService.createEmergencyOrder({
      projectId,
      userId,
      urgencyLevel,
      specialInstructions,
      deliveryLocation,
      sessionId: activeSession.id
    });

    // إشعار المطاعم المتاحة للطوارئ
    await emergencyService.notifyEmergencyRestaurants(projectId, emergencyOrder);

    res.status(201).json({
      success: true,
      data: emergencyOrder,
      message: req.t('emergency.emergencyOrderCreated')
    });
  } catch (error) {
    logger.error('Error creating emergency order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMERGENCY_ORDER_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * الحصول على المطاعم المتاحة للطوارئ
 * GET /api/emergency/restaurants
 */
const getEmergencyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COORDINATES_REQUIRED',
          message: req.t('validation.coordinatesRequired')
        }
      });
    }

    const restaurants = await emergencyService.getEmergencyRestaurants({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseInt(radius)
    });

    res.json({
      success: true,
      data: restaurants,
      meta: {
        count: restaurants.length,
        radius
      }
    });
  } catch (error) {
    logger.error('Error getting emergency restaurants:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMERGENCY_RESTAURANTS_FETCH_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * تحديث حالة طلب الطوارئ
 * PATCH /api/emergency/orders/:orderId/status
 */
const updateEmergencyOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, estimatedDeliveryTime, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'STATUS_REQUIRED',
          message: req.t('orders.orderStatusRequired')
        }
      });
    }

    const updatedOrder = await emergencyService.updateEmergencyOrderStatus(
      orderId,
      status,
      { estimatedDeliveryTime, notes }
    );

    // إشعار المستخدم بتحديث الحالة
    await notificationService.sendOrderStatusUpdate(updatedOrder.userId, {
      orderId,
      status,
      isEmergency: true,
      estimatedDeliveryTime
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: req.t('orders.orderStatusUpdated', { status })
    });
  } catch (error) {
    logger.error('Error updating emergency order status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: req.t('orders.orderStatusUpdateFailed')
      }
    });
  }
};

/**
 * الحصول على المخزون المُعد مسبقاً
 * GET /api/emergency/inventory
 */
const getPrePreparedInventory = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROJECT_ID_REQUIRED',
          message: 'معرف المشروع مطلوب'
        }
      });
    }

    const inventory = await emergencyService.getPrePreparedInventory(projectId);

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    logger.error('Error getting pre-prepared inventory:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_FETCH_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * إضافة عنصر للمخزون المُعد مسبقاً
 * POST /api/emergency/inventory
 */
const addToPrePreparedInventory = async (req, res) => {
  try {
    const { projectId, itemName, quantity, expiryDate, storageLocation } = req.body;
    const addedBy = req.user.id;

    if (!projectId || !itemName || !quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.t('validation.required')
        }
      });
    }

    const inventoryItem = await emergencyService.addToPrePreparedInventory({
      projectId,
      itemName,
      quantity,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      storageLocation,
      addedBy
    });

    res.status(201).json({
      success: true,
      data: inventoryItem,
      message: 'تم إضافة العنصر للمخزون بنجاح'
    });
  } catch (error) {
    logger.error('Error adding to inventory:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_ADD_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * إلغاء تفعيل وضع الطوارئ
 * POST /api/emergency/deactivate
 */
const deactivateEmergencyMode = async (req, res) => {
  try {
    const { projectId, reason } = req.body;
    const deactivatedBy = req.user.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROJECT_ID_REQUIRED',
          message: 'معرف المشروع مطلوب'
        }
      });
    }

    const result = await emergencyService.deactivateEmergencyMode(
      projectId,
      deactivatedBy,
      reason
    );

    // إشعار الفريق بإلغاء وضع الطوارئ
    await notificationService.sendEmergencyAlert(projectId, {
      type: 'EMERGENCY_DEACTIVATED',
      message: 'تم إلغاء تفعيل وضع الطوارئ',
      reason
    });

    res.json({
      success: true,
      data: result,
      message: 'تم إلغاء تفعيل وضع الطوارئ بنجاح'
    });
  } catch (error) {
    logger.error('Error deactivating emergency mode:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMERGENCY_DEACTIVATION_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * الحصول على تاريخ حالات الطوارئ
 * GET /api/emergency/history
 */
const getEmergencyHistory = async (req, res) => {
  try {
    const { projectId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const history = await emergencyService.getEmergencyHistory({
      projectId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting emergency history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_FETCH_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

/**
 * إرسال تنبيه تغيير الجدولة
 * POST /api/emergency/schedule-change
 */
const notifyScheduleChange = async (req, res) => {
  try {
    const { projectId, changeType, newSchedule, reason, affectedMeals } = req.body;
    const notifiedBy = req.user.id;

    if (!projectId || !changeType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.t('validation.required')
        }
      });
    }

    const notification = await emergencyService.notifyScheduleChange({
      projectId,
      changeType,
      newSchedule,
      reason,
      affectedMeals,
      notifiedBy
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'تم إرسال تنبيه تغيير الجدولة بنجاح'
    });
  } catch (error) {
    logger.error('Error notifying schedule change:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_NOTIFICATION_FAILED',
        message: req.t('general.serverError')
      }
    });
  }
};

module.exports = {
  activateEmergencyMode,
  createEmergencyOrder,
  getEmergencyRestaurants,
  updateEmergencyOrderStatus,
  getPrePreparedInventory,
  addToPrePreparedInventory,
  deactivateEmergencyMode,
  getEmergencyHistory,
  notifyScheduleChange
};