/**
 * Emergency Service - خدمة وضع الطوارئ
 * يوفر جميع العمليات المتعلقة بوضع الطوارئ
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * تفعيل وضع الطوارئ للمشروع
 */
async function activateEmergencyMode({ projectId, emergencyType, reason, estimatedDuration, activatedBy }) {
  try {
    // التحقق من عدم وجود جلسة طوارئ نشطة
    const existingSession = await prisma.emergencySession.findFirst({
      where: {
        projectId,
        isActive: true
      }
    });

    if (existingSession) {
      throw new Error('يوجد بالفعل جلسة طوارئ نشطة لهذا المشروع');
    }

    // إنشاء جلسة طوارئ جديدة
    const emergencySession = await prisma.emergencySession.create({
      data: {
        projectId,
        emergencyType,
        reason,
        estimatedDuration,
        activatedBy,
        activatedAt: new Date(),
        isActive: true
      },
      include: {
        project: {
          select: { name: true }
        },
        activatedByUser: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // تسجيل الحدث
    await prisma.emergencyLog.create({
      data: {
        sessionId: emergencySession.id,
        action: 'ACTIVATED',
        performedBy: activatedBy,
        details: {
          emergencyType,
          reason,
          estimatedDuration
        }
      }
    });

    logger.info(`Emergency mode activated for project ${projectId} by user ${activatedBy}`);
    return emergencySession;
  } catch (error) {
    logger.error('Error activating emergency mode:', error);
    throw error;
  }
}

/**
 * إنشاء طلب طوارئ سريع
 */
async function createEmergencyOrder({ projectId, userId, urgencyLevel, specialInstructions, deliveryLocation, sessionId }) {
  try {
    // إنشاء طلب طوارئ
    const emergencyOrder = await prisma.emergencyOrder.create({
      data: {
        projectId,
        userId,
        sessionId,
        urgencyLevel,
        specialInstructions,
        deliveryLocation,
        status: 'URGENT_PENDING',
        createdAt: new Date()
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, phoneNumber: true }
        },
        project: {
          select: { name: true }
        }
      }
    });

    // تسجيل الحدث
    await prisma.emergencyLog.create({
      data: {
        sessionId,
        action: 'ORDER_CREATED',
        performedBy: userId,
        details: {
          orderId: emergencyOrder.id,
          urgencyLevel,
          deliveryLocation
        }
      }
    });

    return emergencyOrder;
  } catch (error) {
    logger.error('Error creating emergency order:', error);
    throw error;
  }
}

/**
 * الحصول على جلسة الطوارئ النشطة
 */
async function getActiveEmergencySession(projectId) {
  try {
    return await prisma.emergencySession.findFirst({
      where: {
        projectId,
        isActive: true
      },
      include: {
        project: true,
        activatedByUser: {
          select: { firstName: true, lastName: true }
        }
      }
    });
  } catch (error) {
    logger.error('Error getting active emergency session:', error);
    throw error;
  }
}

/**
 * الحصول على المطاعم المتاحة للطوارئ
 */
async function getEmergencyRestaurants({ latitude, longitude, radius }) {
  try {
    // البحث عن المطاعم المتاحة للطوارئ في النطاق المحدد
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        emergencyAvailable: true,
        // حساب المسافة باستخدام Haversine formula
        AND: [
          {
            latitude: {
              gte: latitude - (radius / 111000), // تحويل المتر إلى درجات
              lte: latitude + (radius / 111000)
            }
          },
          {
            longitude: {
              gte: longitude - (radius / (111000 * Math.cos(latitude * Math.PI / 180))),
              lte: longitude + (radius / (111000 * Math.cos(latitude * Math.PI / 180)))
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        latitude: true,
        longitude: true,
        emergencyContactPerson: true,
        emergencyContactPhone: true,
        emergencyMenuItems: true,
        averagePreparationTime: true,
        rating: true
      },
      orderBy: {
        rating: 'desc'
      }
    });

    // حساب المسافة الفعلية لكل مطعم
    const restaurantsWithDistance = restaurants.map(restaurant => {
      const distance = calculateDistance(
        latitude, longitude,
        restaurant.latitude, restaurant.longitude
      );
      
      return {
        ...restaurant,
        distance: Math.round(distance),
        estimatedDeliveryTime: Math.round(distance / 30 * 60) + restaurant.averagePreparationTime // تقدير الوقت
      };
    });

    return restaurantsWithDistance.filter(r => r.distance <= radius);
  } catch (error) {
    logger.error('Error getting emergency restaurants:', error);
    throw error;
  }
}

/**
 * إشعار المطاعم المتاحة للطوارئ
 */
async function notifyEmergencyRestaurants(projectId, emergencyOrder) {
  try {
    // الحصول على المطاعم القريبة
    const restaurants = await getEmergencyRestaurants({
      latitude: emergencyOrder.deliveryLocation?.latitude || 0,
      longitude: emergencyOrder.deliveryLocation?.longitude || 0,
      radius: 5000
    });

    // إرسال إشعارات للمطاعم
    const notifications = await Promise.all(
      restaurants.slice(0, 5).map(async (restaurant) => {
        return await prisma.emergencyRestaurantNotification.create({
          data: {
            restaurantId: restaurant.id,
            orderId: emergencyOrder.id,
            notificationType: 'EMERGENCY_ORDER',
            message: `طلب طوارئ جديد - مستوى الأولوية: ${emergencyOrder.urgencyLevel}`,
            sentAt: new Date()
          }
        });
      })
    );

    logger.info(`Emergency notifications sent to ${notifications.length} restaurants`);
    return notifications;
  } catch (error) {
    logger.error('Error notifying emergency restaurants:', error);
    throw error;
  }
}

/**
 * تحديث حالة طلب الطوارئ
 */
async function updateEmergencyOrderStatus(orderId, status, metadata = {}) {
  try {
    const updatedOrder = await prisma.emergencyOrder.update({
      where: { id: orderId },
      data: {
        status,
        estimatedDeliveryTime: metadata.estimatedDeliveryTime,
        notes: metadata.notes,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        session: {
          select: { id: true, projectId: true }
        }
      }
    });

    // تسجيل تحديث الحالة
    await prisma.emergencyLog.create({
      data: {
        sessionId: updatedOrder.session.id,
        action: 'ORDER_STATUS_UPDATED',
        performedBy: updatedOrder.userId,
        details: {
          orderId,
          oldStatus: updatedOrder.status,
          newStatus: status,
          metadata
        }
      }
    });

    return updatedOrder;
  } catch (error) {
    logger.error('Error updating emergency order status:', error);
    throw error;
  }
}

/**
 * الحصول على المخزون المُعد مسبقاً
 */
async function getPrePreparedInventory(projectId) {
  try {
    const inventory = await prisma.prePreparedInventory.findMany({
      where: {
        projectId,
        quantity: { gt: 0 },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        addedByUser: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return inventory;
  } catch (error) {
    logger.error('Error getting pre-prepared inventory:', error);
    throw error;
  }
}

/**
 * إضافة عنصر للمخزون المُعد مسبقاً
 */
async function addToPrePreparedInventory({ projectId, itemName, quantity, expiryDate, storageLocation, addedBy }) {
  try {
    const inventoryItem = await prisma.prePreparedInventory.create({
      data: {
        projectId,
        itemName,
        quantity,
        expiryDate,
        storageLocation,
        addedBy,
        createdAt: new Date()
      },
      include: {
        addedByUser: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return inventoryItem;
  } catch (error) {
    logger.error('Error adding to pre-prepared inventory:', error);
    throw error;
  }
}

/**
 * إلغاء تفعيل وضع الطوارئ
 */
async function deactivateEmergencyMode(projectId, deactivatedBy, reason) {
  try {
    // العثور على الجلسة النشطة
    const activeSession = await prisma.emergencySession.findFirst({
      where: {
        projectId,
        isActive: true
      }
    });

    if (!activeSession) {
      throw new Error('لا توجد جلسة طوارئ نشطة لهذا المشروع');
    }

    // إلغاء تفعيل الجلسة
    const deactivatedSession = await prisma.emergencySession.update({
      where: { id: activeSession.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy,
        deactivationReason: reason
      }
    });

    // تسجيل الحدث
    await prisma.emergencyLog.create({
      data: {
        sessionId: activeSession.id,
        action: 'DEACTIVATED',
        performedBy: deactivatedBy,
        details: {
          reason,
          duration: new Date() - activeSession.activatedAt
        }
      }
    });

    return deactivatedSession;
  } catch (error) {
    logger.error('Error deactivating emergency mode:', error);
    throw error;
  }
}

/**
 * الحصول على تاريخ حالات الطوارئ
 */
async function getEmergencyHistory({ projectId, startDate, endDate, page, limit }) {
  try {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.activatedAt = {};
      if (startDate) where.activatedAt.gte = startDate;
      if (endDate) where.activatedAt.lte = endDate;
    }

    const [sessions, total] = await Promise.all([
      prisma.emergencySession.findMany({
        where,
        include: {
          project: { select: { name: true } },
          activatedByUser: { select: { firstName: true, lastName: true } },
          deactivatedByUser: { select: { firstName: true, lastName: true } },
          orders: {
            select: {
              id: true,
              urgencyLevel: true,
              status: true,
              createdAt: true
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { activatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.emergencySession.count({ where })
    ]);

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting emergency history:', error);
    throw error;
  }
}

/**
 * إرسال تنبيه تغيير الجدولة
 */
async function notifyScheduleChange({ projectId, changeType, newSchedule, reason, affectedMeals, notifiedBy }) {
  try {
    const notification = await prisma.scheduleChangeNotification.create({
      data: {
        projectId,
        changeType,
        newSchedule,
        reason,
        affectedMeals,
        notifiedBy,
        createdAt: new Date()
      },
      include: {
        project: { select: { name: true } },
        notifiedByUser: { select: { firstName: true, lastName: true } }
      }
    });

    return notification;
  } catch (error) {
    logger.error('Error creating schedule change notification:', error);
    throw error;
  }
}

/**
 * حساب المسافة بين نقطتين (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // نصف قطر الأرض بالمتر
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // المسافة بالمتر
}

module.exports = {
  activateEmergencyMode,
  createEmergencyOrder,
  getActiveEmergencySession,
  getEmergencyRestaurants,
  notifyEmergencyRestaurants,
  updateEmergencyOrderStatus,
  getPrePreparedInventory,
  addToPrePreparedInventory,
  deactivateEmergencyMode,
  getEmergencyHistory,
  notifyScheduleChange
};