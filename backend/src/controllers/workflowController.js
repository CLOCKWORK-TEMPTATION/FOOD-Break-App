/**
 * Workflow Controller
 * يتحكم في آلية عمل التطبيق من الطلب إلى التوصيل
 */

const { PrismaClient } = require('@prisma/client');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');
const gpsTrackingService = require('../services/gpsTrackingService');
const qrCodeService = require('../services/qrCodeService');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * 1. التحقق من صحة رمز QR الخاص بالمشروع
 * POST /api/v1/workflow/validate-qr
 */
const validateProjectQR = async (req, res, next) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QR', message: 'رمز QR مفقود' }
      });
    }

    // التحقق من رمز QR
    const validation = await qrCodeService.validateQRCode(qrCode);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_QR', message: 'رمز QR غير صحيح' }
      });
    }

    // تحديث آخر وقت وصول المستخدم للمشروع
    await prisma.project.update({
      where: { id: validation.projectId },
      data: { lastAccessedAt: new Date() }
    });

    res.json({
      success: true,
      data: {
        projectId: validation.projectId,
        projectName: validation.projectName,
        expiresAt: validation.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. تقديم طلب جديد من قبل المستخدم
 * POST /api/v1/workflow/orders
 */
const submitOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId, projectId, restaurantId, menuItems, notes, deliveryAddress } = req.body;

    // التحقق من وجود المشروع
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'المشروع غير موجود' }
      });
    }

    // التحقق من نافذة الطلب (الساعة الأولى من التصوير)
    const now = new Date();
    const projectStartTime = new Date(project.startDate);
    const orderWindow = new Date(projectStartTime.getTime() + 60 * 60 * 1000); // ساعة واحدة

    if (now > orderWindow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_WINDOW_CLOSED',
          message: 'انتهت فترة تقديم الطلبات',
          window: { start: projectStartTime, end: orderWindow }
        }
      });
    }

    // حساب المجموع
    let totalAmount = 0;
    const orderItems = [];

    for (const item of menuItems) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: { code: 'MENU_ITEM_NOT_FOUND', message: `العنصر ${item.menuItemId} غير موجود` }
        });
      }

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // إنشاء الطلب
    const order = await prisma.order.create({
      data: {
        userId,
        projectId,
        restaurantId,
        totalAmount,
        status: 'PENDING',
        orderType: 'REGULAR',
        deliveryAddress: deliveryAddress || project.location,
        items: {
          create: orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        user: true,
        restaurant: true,
        items: { include: { menuItem: true } }
      }
    });

    // إرسال إشعار بتأكيد الطلب
    await notificationService.sendOrderConfirmation(order);

    // إرسال إشعار للفريق الإنتاجي
    await notificationService.notifyProducersNewOrder(order);

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        message: 'تم تقديم الطلب بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. تأكيد الطلب من قبل المستخدم
 * PATCH /api/v1/workflow/orders/:orderId/confirm
 */
const confirmOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { confirmed } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, restaurant: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' }
      });
    }

    if (confirmed) {
      // تأكيد الطلب
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' }
      });

      // إرسال إشعار بالتأكيد
      await notificationService.sendOrderStatus(updatedOrder, 'تم تأكيد طلبك');

      res.json({
        success: true,
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          message: 'تم تأكيد الطلب'
        }
      });
    } else {
      // إلغاء الطلب
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      res.json({
        success: true,
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          message: 'تم إلغاء الطلب'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 4. جلب الطلبات الخاصة بالمستخدم
 * GET /api/v1/workflow/orders?projectId=:projectId&status=:status
 */
const getUserOrders = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { projectId, status, page = 1, limit = 10 } = req.query;

    const where = { userId };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        restaurant: true,
        items: { include: { menuItem: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. تجميع الطلبات لفريق الإنتاج
 * GET /api/v1/workflow/projects/:projectId/aggregated-orders
 */
const getAggregatedOrders = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // التحقق من أن المستخدم منتج
    if (req.user.role !== 'PRODUCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مصرح لك بالوصول' }
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        projectId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: {
        user: true,
        restaurant: true,
        items: { include: { menuItem: true } }
      }
    });

    // تجميع الطلبات حسب المطعم
    const aggregated = {};
    let totalAmount = 0;
    let totalOrders = 0;

    orders.forEach(order => {
      const restaurantId = order.restaurantId;

      if (!aggregated[restaurantId]) {
        aggregated[restaurantId] = {
          restaurant: order.restaurant,
          items: {},
          orders: [],
          totalAmount: 0
        };
      }

      aggregated[restaurantId].orders.push(order.id);
      aggregated[restaurantId].totalAmount += order.totalAmount;
      totalAmount += order.totalAmount;
      totalOrders++;

      // تجميع العناصر
      order.items.forEach(item => {
        const itemKey = item.menuItemId;
        if (!aggregated[restaurantId].items[itemKey]) {
          aggregated[restaurantId].items[itemKey] = {
            menuItem: item.menuItem,
            quantity: 0,
            totalPrice: 0
          };
        }
        aggregated[restaurantId].items[itemKey].quantity += item.quantity;
        aggregated[restaurantId].items[itemKey].totalPrice += item.price * item.quantity;
      });
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalAmount,
          restaurantCount: Object.keys(aggregated).length
        },
        aggregatedByRestaurant: aggregated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. تحديث حالة الطلب (من قبل المطعم/المسؤول)
 * PATCH /api/v1/workflow/orders/:orderId/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'حالة غير صحيحة' }
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // إرسال إشعار للمستخدم بتحديث الحالة
    await notificationService.sendOrderStatus(order, `تم تحديث حالة طلبك إلى: ${status}`);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        message: 'تم تحديث حالة الطلب'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. إرسال تذكيرات نصف ساعية للمستخدمين الذين لم يقدموا طلبات
 * POST /api/v1/workflow/send-reminders
 */
const sendOrderReminders = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    // التحقق من أن المستخدم منتج
    if (req.user.role !== 'PRODUCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مصرح' }
      });
    }

    // جلب جميع مستخدمي المشروع
    const projectUsers = await prisma.user.findMany({
      where: {
        // يمكن إضافة علاقة مشروع-مستخدم في قاعدة البيانات
      }
    });

    // جلب المستخدمين الذين لم يقدموا طلبات
    const usersWithOrders = await prisma.order.groupBy({
      by: ['userId'],
      where: { projectId }
    });

    const usersWithOrderIds = usersWithOrders.map(o => o.userId);
    const usersWithoutOrders = projectUsers.filter(u => !usersWithOrderIds.includes(u.id));

    // إرسال تذكيرات
    let remindersSent = 0;
    for (const user of usersWithoutOrders) {
      await notificationService.sendReminder(user.id, projectId, 'ساعة واحدة');
      remindersSent++;
    }

    res.json({
      success: true,
      data: {
        remindersSent,
        usersReminded: usersWithoutOrders.length,
        message: 'تم إرسال التذكيرات'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. جلب موقع التوصيل في الوقت الفعلي
 * GET /api/v1/workflow/orders/:orderId/tracking
 */
const getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        user: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' }
      });
    }

    // جلب بيانات التتبع من خدمة GPS
    const tracking = await gpsTrackingService.getOrderTracking(orderId);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        restaurant: {
          name: order.restaurant.name,
          location: {
            latitude: order.restaurant.latitude,
            longitude: order.restaurant.longitude
          }
        },
        deliveryLocation: {
          latitude: order.deliveryLat,
          longitude: order.deliveryLng,
          address: order.deliveryAddress
        },
        tracking: tracking,
        estimatedTime: order.estimatedTime
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. تحديث موقع التوصيل (من قبل سائق التوصيل)
 * PATCH /api/v1/workflow/orders/:orderId/location
 */
const updateDeliveryLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_LOCATION', message: 'الموقع مفقود' }
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryLat: latitude,
        deliveryLng: longitude,
        status: 'OUT_FOR_DELIVERY'
      }
    });

    // حساب ETA
    const eta = await gpsTrackingService.calculateETA(orderId, { latitude, longitude });

    // إرسال تحديث موقع للمستخدم
    await notificationService.sendLocationUpdate(orderId, { latitude, longitude, eta });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        location: { latitude, longitude },
        eta: eta,
        message: 'تم تحديث الموقع'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. تسليم الطلب
 * PATCH /api/v1/workflow/orders/:orderId/deliver
 */
const deliverOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      }
    });

    // إرسال إشعار بالتسليم
    await notificationService.sendDeliveryNotification(order);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        deliveredAt: order.deliveredAt,
        message: 'تم تسليم الطلب بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateProjectQR,
  submitOrder,
  confirmOrder,
  getUserOrders,
  getAggregatedOrders,
  updateOrderStatus,
  sendOrderReminders,
  getOrderTracking,
  updateDeliveryLocation,
  deliverOrder
};
