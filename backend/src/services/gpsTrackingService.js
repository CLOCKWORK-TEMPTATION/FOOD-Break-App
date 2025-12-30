/**
 * خدمة تتبع GPS للتوصيل
 * GPS Tracking Service for Break Delivery
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * حساب المسافة بين نقطتين جغرافيتين
 * Calculate distance between two geographic points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // المسافة بالكيلومتر
}

/**
 * تقدير وقت الوصول بناءً على المسافة والسرعة المتوسطة
 * Estimate arrival time based on distance and average speed
 */
function estimateArrivalTime(distance, averageSpeed = 30) {
  const durationHours = distance / averageSpeed;
  const durationMinutes = Math.ceil(durationHours * 60);
  
  const now = new Date();
  const estimatedArrival = new Date(now.getTime() + durationMinutes * 60000);
  
  return {
    durationMinutes,
    estimatedArrival
  };
}

/**
 * إنشاء تتبع توصيل جديد
 * Create new delivery tracking
 */
async function createDeliveryTracking(orderId, driverInfo = {}) {
  try {
    // جلب معلومات الطلب
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        project: true,
        restaurant: true
      }
    });

    if (!order) {
      throw new Error('الطلب غير موجود');
    }

    // حساب المسافة والوقت المتوقع
    let routeDistance = null;
    let routeDuration = null;
    let estimatedArrival = null;

    if (order.restaurant.coordinates && order.deliveryCoords) {
      routeDistance = calculateDistance(
        order.restaurant.coordinates.latitude,
        order.restaurant.coordinates.longitude,
        order.deliveryCoords.latitude,
        order.deliveryCoords.longitude
      );

      const timeEstimate = estimateArrivalTime(routeDistance);
      routeDuration = timeEstimate.durationMinutes;
      estimatedArrival = timeEstimate.estimatedArrival;
    }

    // إنشاء تتبع التوصيل
    const tracking = await prisma.deliveryTracking.create({
      data: {
        orderId,
        driverName: driverInfo.name || null,
        driverPhone: driverInfo.phone || null,
        vehicleInfo: driverInfo.vehicle || null,
        routeDistance,
        routeDuration,
        estimatedArrival,
        status: 'PREPARING'
      }
    });

    // إضافة أول تحديث للحالة
    await prisma.deliveryStatusUpdate.create({
      data: {
        trackingId: tracking.id,
        status: 'PREPARING',
        notes: 'تم إنشاء طلب التوصيل'
      }
    });

    return tracking;
  } catch (error) {
    console.error('خطأ في إنشاء تتبع التوصيل:', error);
    throw error;
  }
}

/**
 * تحديث موقع السائق
 * Update driver location
 */
async function updateDriverLocation(trackingId, locationData) {
  try {
    const { latitude, longitude, accuracy, speed, heading } = locationData;

    // جلب معلومات التتبع
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { id: trackingId },
      include: {
        order: {
          include: {
            project: true
          }
        }
      }
    });

    if (!tracking) {
      throw new Error('تتبع التوصيل غير موجود');
    }

    // تحديث الموقع الحالي
    const updatedTracking = await prisma.deliveryTracking.update({
      where: { id: trackingId },
      data: {
        currentLocation: {
          latitude,
          longitude
        },
        lastLocationUpdate: new Date()
      }
    });

    // إضافة الموقع لتاريخ المواقع
    await prisma.locationHistory.create({
      data: {
        trackingId,
        location: {
          latitude,
          longitude
        },
        accuracy,
        speed,
        heading
      }
    });

    // فحص إذا كان السائق قريب من الوجهة
    if (tracking.order.deliveryCoords) {
      const distanceToDestination = calculateDistance(
        latitude,
        longitude,
        tracking.order.deliveryCoords.latitude,
        tracking.order.deliveryCoords.longitude
      );

      // إذا كان السائق على بعد أقل من 500 متر
      if (distanceToDestination < 0.5 && tracking.status !== 'NEARBY' && tracking.status !== 'DELIVERED') {
        await updateDeliveryStatus(trackingId, 'NEARBY', {
          latitude,
          longitude
        }, 'السائق قريب من موقع التصوير');
      }

      // تحديث الوقت المتوقع للوصول
      if (tracking.status === 'ON_THE_WAY') {
        const timeEstimate = estimateArrivalTime(distanceToDestination);
        await prisma.deliveryTracking.update({
          where: { id: trackingId },
          data: {
            estimatedArrival: timeEstimate.estimatedArrival
          }
        });
      }
    }

    return updatedTracking;
  } catch (error) {
    console.error('خطأ في تحديث موقع السائق:', error);
    throw error;
  }
}

/**
 * تحديث حالة التوصيل
 * Update delivery status
 */
async function updateDeliveryStatus(trackingId, newStatus, location = null, notes = null) {
  try {
    // تحديث حالة التتبع
    const updatedTracking = await prisma.deliveryTracking.update({
      where: { id: trackingId },
      data: {
        status: newStatus,
        ...(newStatus === 'DRIVER_ASSIGNED' && { startedAt: new Date() }),
        ...(newStatus === 'DELIVERED' && { actualArrival: new Date() })
      }
    });

    // إضافة تحديث الحالة للتاريخ
    await prisma.deliveryStatusUpdate.create({
      data: {
        trackingId,
        status: newStatus,
        location,
        notes
      }
    });

    // تحديث حالة الطلب المرتبط
    const orderStatus = getOrderStatusFromDeliveryStatus(newStatus);
    if (orderStatus) {
      await prisma.order.update({
        where: { id: updatedTracking.orderId },
        data: { status: orderStatus }
      });
    }

    return updatedTracking;
  } catch (error) {
    console.error('خطأ في تحديث حالة التوصيل:', error);
    throw error;
  }
}

/**
 * تحويل حالة التوصيل إلى حالة الطلب
 * Convert delivery status to order status
 */
function getOrderStatusFromDeliveryStatus(deliveryStatus) {
  const statusMap = {
    'PREPARING': 'PREPARING',
    'DRIVER_ASSIGNED': 'PREPARING',
    'PICKED_UP': 'OUT_FOR_DELIVERY',
    'ON_THE_WAY': 'OUT_FOR_DELIVERY',
    'NEARBY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'FAILED': 'CANCELLED',
    'RETURNED': 'CANCELLED'
  };

  return statusMap[deliveryStatus] || null;
}

/**
 * الحصول على معلومات التتبع
 * Get tracking information
 */
async function getTrackingInfo(trackingId) {
  try {
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { id: trackingId },
      include: {
        order: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true
              }
            },
            project: {
              select: {
                name: true,
                location: true,
                coordinates: true
              }
            },
            restaurant: {
              select: {
                name: true,
                nameArabic: true,
                coordinates: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        locationHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // آخر 10 مواقع
        }
      }
    });

    if (!tracking) {
      throw new Error('تتبع التوصيل غير موجود');
    }

    // حساب المسافة المتبقية إذا كان الموقع الحالي متوفر
    let remainingDistance = null;
    let estimatedArrival = null;

    if (tracking.currentLocation && tracking.order.deliveryCoords) {
      remainingDistance = calculateDistance(
        tracking.currentLocation.latitude,
        tracking.currentLocation.longitude,
        tracking.order.deliveryCoords.latitude,
        tracking.order.deliveryCoords.longitude
      );

      if (tracking.status === 'ON_THE_WAY' || tracking.status === 'NEARBY') {
        const timeEstimate = estimateArrivalTime(remainingDistance);
        estimatedArrival = timeEstimate.estimatedArrival;
      }
    }

    return {
      ...tracking,
      remainingDistance,
      estimatedArrival: estimatedArrival || tracking.estimatedArrival
    };
  } catch (error) {
    console.error('خطأ في جلب معلومات التتبع:', error);
    throw error;
  }
}

/**
 * الحصول على تتبع التوصيل بواسطة رقم الطلب
 * Get delivery tracking by order ID
 */
async function getTrackingByOrderId(orderId) {
  try {
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { orderId },
      include: {
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!tracking) {
      return null;
    }

    return await getTrackingInfo(tracking.id);
  } catch (error) {
    console.error('خطأ في جلب التتبع بواسطة رقم الطلب:', error);
    throw error;
  }
}

/**
 * الحصول على جميع التوصيلات النشطة
 * Get all active deliveries
 */
async function getActiveDeliveries() {
  try {
    const activeStatuses = ['DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'NEARBY'];
    
    const deliveries = await prisma.deliveryTracking.findMany({
      where: {
        status: {
          in: activeStatuses
        }
      },
      include: {
        order: {
          include: {
            project: {
              select: {
                name: true,
                location: true
              }
            },
            restaurant: {
              select: {
                nameArabic: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'asc'
      }
    });

    return deliveries;
  } catch (error) {
    console.error('خطأ في جلب التوصيلات النشطة:', error);
    throw error;
  }
}

/**
 * تحديد السائق للطلب
 * Assign driver to order
 */
async function assignDriver(trackingId, driverInfo) {
  try {
    const updatedTracking = await prisma.deliveryTracking.update({
      where: { id: trackingId },
      data: {
        driverName: driverInfo.name,
        driverPhone: driverInfo.phone,
        vehicleInfo: driverInfo.vehicle,
        startedAt: new Date()
      }
    });

    await updateDeliveryStatus(trackingId, 'DRIVER_ASSIGNED', null, `تم تعيين السائق: ${driverInfo.name}`);

    return updatedTracking;
  } catch (error) {
    console.error('خطأ في تعيين السائق:', error);
    throw error;
  }
}

module.exports = {
  createDeliveryTracking,
  updateDriverLocation,
  updateDeliveryStatus,
  getTrackingInfo,
  getTrackingByOrderId,
  getActiveDeliveries,
  assignDriver,
  calculateDistance,
  estimateArrivalTime
};