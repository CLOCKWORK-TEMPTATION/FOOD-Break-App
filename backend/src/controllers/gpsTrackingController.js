/**
 * GPS Tracking Controller
 * إدارة endpoints تتبع التوصيل
 */

const gpsTrackingService = require('../services/gpsTrackingService');

/**
 * POST /api/tracking/create
 * إنشاء تتبع توصيل جديد
 */
const createTracking = async (req, res) => {
  try {
    const { orderId, driverInfo } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: req.__('validation.required', { field: 'orderId' })
      });
    }

    const tracking = await gpsTrackingService.createDeliveryTracking(orderId, driverInfo);

    res.status(201).json({
      success: true,
      data: tracking,
      message: req.__('tracking.trackingCreated')
    });
  } catch (error) {
    console.error('❌ خطأ في إنشاء تتبع التوصيل:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.trackingCreationFailed'),
      message: error.message
    });
  }
};

/**
 * PUT /api/tracking/:id/location
 * تحديث موقع السائق
 */
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: req.__('validation.coordinatesRequired')
      });
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null
    };

    const tracking = await gpsTrackingService.updateDriverLocation(id, locationData);

    res.json({
      success: true,
      data: tracking,
      message: req.__('tracking.locationUpdated')
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث موقع السائق:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.locationUpdateFailed'),
      message: error.message
    });
  }
};

/**
 * PUT /api/tracking/:id/status
 * تحديث حالة التوصيل
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, latitude, longitude } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: req.__('validation.required', { field: 'status' })
      });
    }

    const location = (latitude && longitude) ? {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    } : null;

    const tracking = await gpsTrackingService.updateDeliveryStatus(id, status, location, notes);

    res.json({
      success: true,
      data: tracking,
      message: req.__('tracking.statusUpdated', { status })
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة التوصيل:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.statusUpdateFailed'),
      message: error.message
    });
  }
};

/**
 * GET /api/tracking/:id
 * الحصول على معلومات التتبع
 */
const getTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const tracking = await gpsTrackingService.getTrackingInfo(id);

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('❌ خطأ في جلب معلومات التتبع:', error);
    res.status(404).json({
      success: false,
      error: req.__('tracking.trackingNotFound'),
      message: error.message
    });
  }
};

/**
 * GET /api/tracking/order/:orderId
 * الحصول على تتبع التوصيل بواسطة رقم الطلب
 */
const getTrackingByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const tracking = await gpsTrackingService.getTrackingByOrderId(orderId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: req.__('tracking.trackingNotFound')
      });
    }

    // التحقق من الصلاحية - المستخدم العادي يمكنه رؤية طلبه فقط
    if (req.user.role === 'REGULAR' && tracking.order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: req.__('tracking.trackingAccessDenied')
      });
    }

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('❌ خطأ في جلب التتبع بواسطة رقم الطلب:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.trackingFetchFailed'),
      message: error.message
    });
  }
};

/**
 * GET /api/tracking/active
 * الحصول على جميع التوصيلات النشطة (للإدارة فقط)
 */
const getActiveDeliveries = async (req, res) => {
  try {
    // التحقق من الصلاحية
    if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: req.__('tracking.activeDeliveriesAccessDenied')
      });
    }

    const deliveries = await gpsTrackingService.getActiveDeliveries();

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length
    });
  } catch (error) {
    console.error('❌ خطأ في جلب التوصيلات النشطة:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.activeDeliveriesFetchFailed'),
      message: error.message
    });
  }
};

/**
 * POST /api/tracking/:id/assign-driver
 * تعيين سائق للطلب
 */
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicle } = req.body;

    // التحقق من الصلاحية
    if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: req.__('tracking.driverAssignmentAccessDenied')
      });
    }

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: req.__('tracking.driverInfoRequired')
      });
    }

    const driverInfo = { name, phone, vehicle };
    const tracking = await gpsTrackingService.assignDriver(id, driverInfo);

    res.json({
      success: true,
      data: tracking,
      message: req.__('tracking.driverAssigned', { name })
    });
  } catch (error) {
    console.error('❌ خطأ في تعيين السائق:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.driverAssignmentFailed'),
      message: error.message
    });
  }
};

/**
 * GET /api/tracking/:id/route
 * الحصول على مسار التوصيل (للعرض على الخريطة)
 */
const getDeliveryRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const tracking = await gpsTrackingService.getTrackingInfo(id);

    // إنشاء مسار من المطعم إلى موقع التصوير
    const route = {
      origin: tracking.order.restaurant.coordinates,
      destination: tracking.order.deliveryCoords,
      currentLocation: tracking.currentLocation,
      waypoints: tracking.locationHistory.map(loc => loc.location).slice(0, 5) // آخر 5 مواقع
    };

    res.json({
      success: true,
      data: {
        route,
        tracking: {
          id: tracking.id,
          status: tracking.status,
          driverName: tracking.driverName,
          estimatedArrival: tracking.estimatedArrival,
          remainingDistance: tracking.remainingDistance
        }
      }
    });
  } catch (error) {
    console.error('❌ خطأ في جلب مسار التوصيل:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.routeFetchFailed'),
      message: error.message
    });
  }
};

/**
 * POST /api/tracking/:id/delivery-confirmation
 * تأكيد التسليم مع صورة
 */
const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientName, notes, deliveryPhoto, latitude, longitude } = req.body;

    const location = (latitude && longitude) ? {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    } : null;

    // تحديث معلومات التسليم
    const tracking = await gpsTrackingService.updateDeliveryStatus(
      id, 
      'DELIVERED', 
      location, 
      `تم التسليم للمستلم: ${recipientName || 'غير محدد'}`
    );

    // حفظ تفاصيل التسليم الإضافية
    await prisma.deliveryTracking.update({
      where: { id },
      data: {
        recipientName,
        deliveryNotes: notes,
        deliveryPhoto
      }
    });

    res.json({
      success: true,
      data: tracking,
      message: req.__('tracking.deliveryConfirmed')
    });
  } catch (error) {
    console.error('❌ خطأ في تأكيد التسليم:', error);
    res.status(500).json({
      success: false,
      error: req.__('tracking.deliveryConfirmationFailed'),
      message: error.message
    });
  }
};

module.exports = {
  createTracking,
  updateLocation,
  updateStatus,
  getTracking,
  getTrackingByOrder,
  getActiveDeliveries,
  assignDriver,
  getDeliveryRoute,
  confirmDelivery
};