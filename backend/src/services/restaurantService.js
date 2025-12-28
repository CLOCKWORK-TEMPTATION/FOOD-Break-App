const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * خدمة المطاعم - الحصول على جميع المطاعم
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Array>} - قائمة المطاعم
 */
const getAllRestaurants = async (filters = {}) => {
  try {
    const { isActive, isPartner, cuisineType, page = 1, limit = 20 } = filters;

    const where = {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(isPartner !== undefined && { isPartner: isPartner === 'true' }),
      ...(cuisineType && { cuisineType })
    };

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        menuItems: {
          where: { isAvailable: true },
          take: 5
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
            reviews: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rating: 'desc' }
    });

    const total = await prisma.restaurant.count({ where });

    return {
      restaurants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب المطاعم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المطاعم - الحصول على مطعم محدد
 * @param {string} restaurantId - معرف المطعم
 * @returns {Promise<Object>} - بيانات المطعم
 */
const getRestaurantById = async (restaurantId) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuItems: {
          where: { isAvailable: true }
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    if (!restaurant) {
      throw new Error('المطعم غير موجود');
    }

    return restaurant;
  } catch (error) {
    logger.error(`خطأ في جلب المطعم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المطاعم - إنشاء مطعم جديد
 * @param {Object} restaurantData - بيانات المطعم
 * @returns {Promise<Object>} - المطعم الجديد
 */
const createRestaurant = async (restaurantData) => {
  try {
    const restaurant = await prisma.restaurant.create({
      data: restaurantData
    });

    logger.info(`تم إنشاء مطعم جديد: ${restaurant.name}`);

    return restaurant;
  } catch (error) {
    logger.error(`خطأ في إنشاء المطعم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المطاعم - تحديث مطعم
 * @param {string} restaurantId - معرف المطعم
 * @param {Object} updateData - البيانات المحدثة
 * @returns {Promise<Object>} - المطعم المحدث
 */
const updateRestaurant = async (restaurantId, updateData) => {
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData
    });

    logger.info(`تم تحديث المطعم: ${restaurant.name}`);

    return restaurant;
  } catch (error) {
    logger.error(`خطأ في تحديث المطعم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المطاعم - حذف مطعم
 * @param {string} restaurantId - معرف المطعم
 * @returns {Promise<void>}
 */
const deleteRestaurant = async (restaurantId) => {
  try {
    await prisma.restaurant.delete({
      where: { id: restaurantId }
    });

    logger.info(`تم حذف المطعم: ${restaurantId}`);
  } catch (error) {
    logger.error(`خطأ في حذف المطعم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المطاعم - البحث عن المطاعم القريبة جغرافياً
 * @param {number} latitude - خط العرض
 * @param {number} longitude - خط الطول
 * @param {number} radius - نصف القطر بالكيلومتر (افتراضي 3 كم)
 * @returns {Promise<Array>} - المطاعم القريبة
 */
const getNearbyRestaurants = async (latitude, longitude, radius = 3) => {
  try {
    // حساب تقريبي للإحداثيات (1 درجة ≈ 111 كم)
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));

    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta
        }
      },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
            menuType: 'GEOGRAPHIC'
          }
        }
      }
    });

    // حساب المسافة الفعلية لكل مطعم
    const restaurantsWithDistance = restaurants.map(restaurant => {
      const distance = calculateDistance(
        latitude,
        longitude,
        restaurant.latitude,
        restaurant.longitude
      );

      return {
        ...restaurant,
        distance: parseFloat(distance.toFixed(2))
      };
    }).filter(r => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return restaurantsWithDistance;
  } catch (error) {
    logger.error(`خطأ في البحث عن المطاعم القريبة: ${error.message}`);
    throw error;
  }
};

/**
 * حساب المسافة بين نقطتين جغرافيتين (Haversine formula)
 * @param {number} lat1 - خط عرض النقطة الأولى
 * @param {number} lon1 - خط طول النقطة الأولى
 * @param {number} lat2 - خط عرض النقطة الثانية
 * @param {number} lon2 - خط طول النقطة الثانية
 * @returns {number} - المسافة بالكيلومتر
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * خدمة المطاعم - تحديث تقييم المطعم
 * @param {string} restaurantId - معرف المطعم
 * @returns {Promise<Object>} - المطعم المحدث
 */
const updateRestaurantRating = async (restaurantId) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return null;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { rating: parseFloat(averageRating.toFixed(2)) }
    });

    return restaurant;
  } catch (error) {
    logger.error(`خطأ في تحديث تقييم المطعم: ${error.message}`);
    throw error;
  }
};

/**
 * نظام المراجعة الدورية للمطاعم (شهري/ربع سنوي)
 * Why: جودة البيانات (القائمة/التوفر) تتدهور بدون حوكمة زمنية.
 */
const getRestaurantsDueForReview = async (frequency = 'monthly') => {
  const normalized = String(frequency || 'monthly').toLowerCase();
  const days = normalized === 'quarterly' ? 90 : 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const restaurants = await prisma.restaurant.findMany({
    where: {
      isActive: true,
      OR: [{ lastReviewed: null }, { lastReviewed: { lt: cutoff } }]
    },
    orderBy: [{ lastReviewed: 'asc' }, { createdAt: 'asc' }]
  });

  return {
    frequency: normalized,
    cutoff,
    total: restaurants.length,
    restaurants
  };
};

const markRestaurantReviewed = async (restaurantId) => {
  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { lastReviewed: new Date() }
  });
  return updated;
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getNearbyRestaurants,
  updateRestaurantRating,
  calculateDistance,
  getRestaurantsDueForReview,
  markRestaurantReviewed
};
