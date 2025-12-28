/**
 * Admin Controller - لوحة التحكم الإدارية
 * يوفر endpoints للـ Dashboard الأمامي
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * جلب إحصائيات لوحة التحكم
 * GET /admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // بناء فلتر التاريخ
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(endDate) };
    }

    // إحصائيات الطلبات
    const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({ where: dateFilter }),
      prisma.order.count({ where: { ...dateFilter, status: 'PENDING' } }),
      prisma.order.count({ where: { ...dateFilter, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...dateFilter, status: 'CANCELLED' } })
    ]);

    // إحصائيات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFilter = { createdAt: { gte: today } };

    const [todayOrders, todayOrdersData] = await Promise.all([
      prisma.order.count({ where: todayFilter }),
      prisma.order.findMany({
        where: todayFilter,
        select: { totalAmount: true }
      })
    ]);

    const todayRevenue = todayOrdersData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // إجمالي الإيرادات ومتوسط قيمة الطلب
    const allOrders = await prisma.order.findMany({
      where: { ...dateFilter, status: 'DELIVERED' },
      select: { totalAmount: true }
    });
    
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    // متوسط وقت التوصيل (تقديري)
    const avgDeliveryTime = 32; // يمكن حسابه من بيانات التتبع الفعلية لاحقاً

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        avgOrderValue,
        avgDeliveryTime,
        todayOrders,
        todayRevenue
      }
    });
  } catch (error) {
    logger.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FETCH_FAILED', message: req.__('admin.statsFetchFailed') }
    });
  }
};

/**
 * جلب جميع الطلبات (للإدارة)
 * GET /admin/orders
 */
const getAdminOrders = async (req, res) => {
  try {
    const { status, restaurantId, page = 1, limit = 20, search } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (restaurantId) where.restaurantId = restaurantId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, phoneNumber: true }
          },
          restaurant: {
            select: { id: true, name: true }
          },
          items: {
            include: {
              menuItem: { select: { id: true, name: true, price: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    // تحويل البيانات للشكل المتوقع من Frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.id.slice(-6).toUpperCase(),
      userId: order.userId,
      restaurantId: order.restaurantId,
      restaurant: order.restaurant,
      user: order.user ? {
        id: order.user.id,
        name: `${order.user.firstName} ${order.user.lastName}`,
        phone: order.user.phoneNumber || ''
      } : null,
      items: order.items.map(item => ({
        id: item.id,
        name: item.menuItem?.name || 'غير محدد',
        quantity: item.quantity,
        price: item.price,
        notes: item.specialInstructions
      })),
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryFee: 0,
      deliveryAddress: order.deliveryAddress || '',
      estimatedDeliveryTime: 30,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('خطأ في جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDERS_FETCH_FAILED', message: req.__('orders.ordersFetchFailed') }
    });
  }
};

/**
 * جلب طلب محدد
 * GET /admin/orders/:orderId
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true } },
        restaurant: true,
        items: {
          include: { menuItem: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: req.__('orders.orderNotFound') }
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('خطأ في جلب الطلب:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_FETCH_FAILED', message: req.__('orders.ordersFetchFailed') }
    });
  }
};

/**
 * تحديث حالة الطلب
 * PATCH /admin/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        restaurant: { select: { name: true } }
      }
    });

    logger.info(`تم تحديث حالة الطلب ${orderId} إلى ${status}`);

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('خطأ في تحديث حالة الطلب:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: req.__('orders.orderStatusUpdateFailed') }
    });
  }
};

/**
 * جلب الطلبات المعلقة
 * GET /admin/orders/pending
 */
const getPendingOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { firstName: true, lastName: true, phoneNumber: true } },
        restaurant: { select: { name: true } },
        items: { include: { menuItem: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('خطأ في جلب الطلبات المعلقة:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PENDING_ORDERS_FETCH_FAILED', message: req.__('admin.pendingOrdersFetchFailed') }
    });
  }
};

/**
 * جلب جميع المطاعم
 * GET /admin/restaurants
 */
const getRestaurants = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20, search } = req.query;
    
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cuisineType: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.restaurant.count({ where })
    ]);

    // جلب إحصائيات اليوم لكل مطعم
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const restaurantsWithStats = await Promise.all(
      restaurants.map(async (restaurant) => {
        const todayOrders = await prisma.order.findMany({
          where: {
            restaurantId: restaurant.id,
            createdAt: { gte: today }
          },
          select: { totalAmount: true }
        });

        return {
          ...restaurant,
          cuisine: restaurant.cuisineType ? [restaurant.cuisineType] : [],
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          totalOrders: 0,
          totalRevenue: 0,
          openingHours: '08:00',
          closingHours: '22:00'
        };
      })
    );

    res.json({
      success: true,
      data: {
        restaurants: restaurantsWithStats,
        total
      }
    });
  } catch (error) {
    logger.error('خطأ في جلب المطاعم:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RESTAURANTS_FETCH_FAILED', message: req.__('admin.restaurantsFetchFailed') }
    });
  }
};

/**
 * تبديل حالة المطعم
 * PATCH /admin/restaurants/:restaurantId/toggle-status
 */
const toggleRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESTAURANT_NOT_FOUND', message: req.__('admin.restaurantNotFound') }
      });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive: !restaurant.isActive }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('خطأ في تبديل حالة المطعم:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TOGGLE_FAILED', message: req.__('admin.toggleFailed') }
    });
  }
};

/**
 * جلب قائمة مطعم
 * GET /admin/restaurants/:restaurantId/menu
 */
const getRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json({ success: true, data: menuItems });
  } catch (error) {
    logger.error('خطأ في جلب قائمة المطعم:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MENU_FETCH_FAILED', message: req.__('admin.menuFetchFailed') }
    });
  }
};

/**
 * تحديث عنصر في القائمة
 * PUT /admin/menu/:menuItemId
 */
const updateMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const updateData = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: updateData
    });

    res.json({ success: true, data: menuItem });
  } catch (error) {
    logger.error('خطأ في تحديث عنصر القائمة:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MENU_UPDATE_FAILED', message: req.__('admin.menuUpdateFailed') }
    });
  }
};

/**
 * تبديل توفر عنصر
 * PATCH /admin/menu/:menuItemId/toggle-availability
 */
const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: req.__('admin.itemNotFound') }
      });
    }

    const updated = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable: !item.isAvailable }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('خطأ في تبديل توفر العنصر:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TOGGLE_FAILED', message: req.__('admin.toggleFailed') }
    });
  }
};

/**
 * إرسال إشعار
 * POST /admin/notifications/send
 */
const sendNotification = async (req, res) => {
  try {
    const { type, recipients, title, message, restaurantId, userIds } = req.body;
    
    let targetUsers = [];

    if (recipients === 'all') {
      targetUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });
    } else if (recipients === 'active_orders') {
      const activeOrders = await prisma.order.findMany({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] } },
        select: { userId: true },
        distinct: ['userId']
      });
      targetUsers = activeOrders.map(o => ({ id: o.userId }));
    } else if (recipients === 'specific' && userIds) {
      targetUsers = userIds.map((id) => ({ id }));
    }

    // إنشاء الإشعارات
    const notifications = await prisma.notification.createMany({
      data: targetUsers.map(user => ({
        userId: user.id,
        type: 'SYSTEM',
        title,
        message,
        data: { notificationType: type }
      }))
    });

    logger.info(`تم إرسال ${targetUsers.length} إشعار`);

    res.json({
      success: true,
      data: { sent: targetUsers.length },
      message: req.__('admin.notificationsSent', { count: targetUsers.length })
    });
  } catch (error) {
    logger.error('خطأ في إرسال الإشعارات:', error);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_SEND_FAILED', message: req.__('admin.notificationSendFailed') }
    });
  }
};

module.exports = {
  getDashboardStats,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
  getPendingOrders,
  getRestaurants,
  toggleRestaurantStatus,
  getRestaurantMenu,
  updateMenuItem,
  toggleMenuItemAvailability,
  sendNotification
};
