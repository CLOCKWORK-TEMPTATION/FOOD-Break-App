const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * خدمة القوائم - الحصول على جميع عناصر القائمة
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Array>} - عناصر القائمة
 */
const getAllMenuItems = async (filters = {}) => {
  try {
    const { restaurantId, menuType, category, isAvailable, page = 1, limit = 20 } = filters;

    const where = {
      ...(restaurantId && { restaurantId }),
      ...(menuType && { menuType }),
      ...(category && { category }),
      ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' })
    };

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { qualityScore: 'desc' }
    });

    const total = await prisma.menuItem.count({ where });

    return {
      menuItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب عناصر القائمة: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - الحصول على عنصر قائمة محدد
 * @param {string} menuItemId - معرف عنصر القائمة
 * @returns {Promise<Object>} - عنصر القائمة
 */
const getMenuItemById = async (menuItemId) => {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        restaurant: true
      }
    });

    if (!menuItem) {
      throw new Error('عنصر القائمة غير موجود');
    }

    return menuItem;
  } catch (error) {
    logger.error(`خطأ في جلب عنصر القائمة: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - إنشاء عنصر قائمة جديد
 * @param {Object} menuItemData - بيانات عنصر القائمة
 * @returns {Promise<Object>} - عنصر القائمة الجديد
 */
const createMenuItem = async (menuItemData) => {
  try {
    const menuItem = await prisma.menuItem.create({
      data: menuItemData,
      include: {
        restaurant: true
      }
    });

    logger.info(`تم إنشاء عنصر قائمة جديد: ${menuItem.name}`);

    return menuItem;
  } catch (error) {
    logger.error(`خطأ في إنشاء عنصر القائمة: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - تحديث عنصر قائمة
 * @param {string} menuItemId - معرف عنصر القائمة
 * @param {Object} updateData - البيانات المحدثة
 * @returns {Promise<Object>} - عنصر القائمة المحدث
 */
const updateMenuItem = async (menuItemId, updateData) => {
  try {
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: updateData,
      include: {
        restaurant: true
      }
    });

    logger.info(`تم تحديث عنصر القائمة: ${menuItem.name}`);

    return menuItem;
  } catch (error) {
    logger.error(`خطأ في تحديث عنصر القائمة: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - حذف عنصر قائمة
 * @param {string} menuItemId - معرف عنصر القائمة
 * @returns {Promise<void>}
 */
const deleteMenuItem = async (menuItemId) => {
  try {
    await prisma.menuItem.delete({
      where: { id: menuItemId }
    });

    logger.info(`تم حذف عنصر القائمة: ${menuItemId}`);
  } catch (error) {
    logger.error(`خطأ في حذف عنصر القائمة: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - الحصول على القائمة الأساسية (Core Menu)
 * @returns {Promise<Array>} - عناصر القائمة الأساسية
 */
const getCoreMenu = async () => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        menuType: 'CORE',
        isAvailable: true,
        restaurant: {
          isPartner: true,
          isActive: true
        }
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true,
            cuisineType: true
          }
        }
      },
      orderBy: [
        { qualityScore: 'desc' },
        { restaurant: { rating: 'desc' } }
      ]
    });

    // تجميع حسب الفئة
    const categorizedMenu = menuItems.reduce((acc, item) => {
      const category = item.category || 'أخرى';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return {
      totalItems: menuItems.length,
      categories: Object.keys(categorizedMenu).length,
      menu: categorizedMenu
    };
  } catch (error) {
    logger.error(`خطأ في جلب القائمة الأساسية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة القوائم - الحصول على القائمة الجغرافية
 * @param {number} latitude - خط العرض
 * @param {number} longitude - خط الطول
 * @param {number} radius - نصف القطر (افتراضي 3 كم)
 * @returns {Promise<Object>} - القائمة الجغرافية
 */
const getGeographicMenu = async (latitude, longitude, radius = 3) => {
  try {
    const restaurantService = require('./restaurantService');
    
    // الحصول على المطاعم القريبة
    const nearbyRestaurants = await restaurantService.getNearbyRestaurants(
      latitude,
      longitude,
      radius
    );

    const restaurantIds = nearbyRestaurants.map(r => r.id);

    if (restaurantIds.length === 0) {
      return {
        message: 'لا توجد مطاعم قريبة في نطاق البحث',
        restaurants: [],
        menuItems: []
      };
    }

    // الحصول على عناصر القائمة من المطاعم القريبة
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: { in: restaurantIds },
        menuType: 'GEOGRAPHIC',
        isAvailable: true
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true,
            address: true
          }
        }
      }
    });

    // إضافة المسافة لكل عنصر
    const menuItemsWithDistance = menuItems.map(item => {
      const restaurant = nearbyRestaurants.find(r => r.id === item.restaurantId);
      return {
        ...item,
        distance: restaurant?.distance || null,
        estimatedDeliveryTime: calculateEstimatedDeliveryTime(restaurant?.distance || 0)
      };
    }).sort((a, b) => a.distance - b.distance);

    return {
      location: { latitude, longitude },
      searchRadius: radius,
      totalRestaurants: nearbyRestaurants.length,
      totalMenuItems: menuItemsWithDistance.length,
      restaurants: nearbyRestaurants,
      menuItems: menuItemsWithDistance
    };
  } catch (error) {
    logger.error(`خطأ في جلب القائمة الجغرافية: ${error.message}`);
    throw error;
  }
};

/**
 * حساب وقت التوصيل التقديري
 * @param {number} distance - المسافة بالكيلومتر
 * @returns {number} - الوقت بالدقائق
 */
const calculateEstimatedDeliveryTime = (distance) => {
  // افتراض: 2 كم/ساعة = 30 دقيقة لكل كم + 15 دقيقة للإعداد
  const preparationTime = 15;
  const deliveryTime = distance * 30;
  return Math.round(preparationTime + deliveryTime);
};

/**
 * خدمة القوائم - البحث في القوائم
 * @param {string} searchQuery - نص البحث
 * @param {Object} filters - فلاتر إضافية
 * @returns {Promise<Array>} - نتائج البحث
 */
const searchMenuItems = async (searchQuery, filters = {}) => {
  try {
    const { menuType, minPrice, maxPrice } = filters;

    const menuItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        ...(menuType && { menuType }),
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { nameAr: { contains: searchQuery } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { descriptionAr: { contains: searchQuery } },
          { category: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      },
      take: 50
    });

    return menuItems;
  } catch (error) {
    logger.error(`خطأ في البحث عن عناصر القائمة: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCoreMenu,
  getGeographicMenu,
  searchMenuItems,
  calculateEstimatedDeliveryTime
};
