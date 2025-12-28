const { PrismaClient } = require('@prisma/client');
const notificationService = require('./notificationService');
const prisma = new PrismaClient();

/**
 * خدمة إدارة الطلبات
 * تشمل: إنشاء الطلبات، تحديث الحالة، التجميع، الإحصائيات
 */
class OrderService {
  // ============================================
  // إدارة الطلبات (Order Management)
  // ============================================

  /**
   * إنشاء طلب جديد
   */
  async createOrder(orderData) {
    try {
      // حساب المبلغ الإجمالي
      const totalAmount = orderData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      const order = await prisma.order.create({
        data: {
          userId: orderData.userId,
          projectId: orderData.projectId,
          restaurantId: orderData.restaurantId,
          totalAmount,
          status: 'PENDING',
          orderType: orderData.orderType || 'REGULAR',
          deliveryAddress: orderData.deliveryAddress,
          deliveryLat: orderData.deliveryLat,
          deliveryLng: orderData.deliveryLng,
          items: {
            create: orderData.items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              specialInstructions: item.specialInstructions
            }))
          }
        },
        include: {
          user: true,
          restaurant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // إرسال إشعار تأكيد
      try {
        await notificationService.sendOrderConfirmation(order);
      } catch (notifError) {
        console.error('❌ خطأ في إرسال إشعار التأكيد:', notifError.message);
      }

      return order;
    } catch (error) {
      console.error('❌ خطأ في إنشاء الطلب:', error);
      throw new Error(`خطأ في إنشاء الطلب: ${error.message}`);
    }
  }

  /**
   * الحصول على جميع الطلبات مع التصفية
   */
  async getOrders(filters = {}) {
    try {
      const { userId, projectId, status, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      const where = {};
      if (userId) where.userId = userId;
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;

      const orders = await prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true
            }
          },
          restaurant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.order.count({ where });

      return {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ خطأ في جلب الطلبات:', error);
      throw new Error(`خطأ في جلب الطلبات: ${error.message}`);
    }
  }

  /**
   * الحصول على طلب محدد
   */
  async getOrderById(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true
            }
          },
          restaurant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      return order;
    } catch (error) {
      console.error('❌ خطأ في جلب الطلب:', error);
      throw new Error(`خطأ في جلب الطلب: ${error.message}`);
    }
  }

  /**
   * تحديث حالة الطلب مع إرسال الإشعارات (Task 21)
   */
  async updateOrderStatus(orderId, status, updatedBy, additionalData = {}) {
    try {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

      if (!validStatuses.includes(status)) {
        throw new Error('حالة الطلب غير صحيحة');
      }

      // تحديث الحالة في قاعدة البيانات
      const updateData = {
        status,
        updatedAt: new Date()
      };

      // إضافة وقت التسليم عند اكتمال الطلب
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: true,
          restaurant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // إرسال إشعار تحديث الحالة
      try {
        await notificationService.sendOrderStatusUpdate(orderId, status, additionalData);
        console.log(`✓ تم تحديث حالة الطلب ${orderId} إلى ${status}`);
      } catch (notifError) {
        console.error('❌ خطأ في إرسال إشعار تحديث الحالة:', notifError.message);
      }

      return order;
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      throw new Error(`خطأ في تحديث حالة الطلب: ${error.message}`);
    }
  }

  /**
   * إلغاء الطلب
   */
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true
        }
      });

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      if (order.userId !== userId) {
        throw new Error('غير مصرح لك بإلغاء هذا الطلب');
      }

      if (order.status === 'DELIVERED') {
        throw new Error('لا يمكن إلغاء طلب تم تسليمه');
      }

      const cancelledOrder = await this.updateOrderStatus(
        orderId,
        'CANCELLED',
        userId,
        { cancellationReason: reason }
      );

      return cancelledOrder;
    } catch (error) {
      console.error('❌ خطأ في إلغاء الطلب:', error);
      throw new Error(`خطأ في إلغاء الطلب: ${error.message}`);
    }
  }

  // ============================================
  // تجميع الطلبات (Order Aggregation - Task 18)
  // ============================================

  /**
   * تجميع طلبات الفريق حسب المشروع
   * يجمع جميع الطلبات ويقدم إحصائيات مفصلة للفريق الإنتاجي
   */
  async aggregateTeamOrders(projectId, options = {}) {
    try {
      const { date, status } = options;

      // تحديد نطاق التاريخ
      let dateRange = {};
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        dateRange = {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        };
      }

      // بناء الفلتر
      const where = {
        projectId,
        ...dateRange
      };

      if (status) {
        where.status = status;
      }

      // جلب جميع الطلبات
      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          restaurant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // تجميع البيانات
      const aggregation = {
        projectId,
        date: date || new Date().toISOString().split('T')[0],
        totalOrders: orders.length,
        totalAmount: 0,
        byRestaurant: {},
        byUser: {},
        byStatus: {},
        itemsSummary: {},
        statistics: {
          averageOrderValue: 0,
          mostOrderedItems: [],
          topRestaurants: []
        }
      };

      // معالجة كل طلب
      orders.forEach(order => {
        // إجمالي المبلغ
        aggregation.totalAmount += order.totalAmount;

        // التجميع حسب المطعم
        const restaurantId = order.restaurantId;
        if (!aggregation.byRestaurant[restaurantId]) {
          aggregation.byRestaurant[restaurantId] = {
            restaurantId,
            restaurantName: order.restaurant?.name || 'غير محدد',
            ordersCount: 0,
            totalAmount: 0,
            items: []
          };
        }
        aggregation.byRestaurant[restaurantId].ordersCount++;
        aggregation.byRestaurant[restaurantId].totalAmount += order.totalAmount;

        // التجميع حسب المستخدم
        const userId = order.userId;
        if (!aggregation.byUser[userId]) {
          aggregation.byUser[userId] = {
            userId,
            userName: `${order.user.firstName} ${order.user.lastName}`,
            role: order.user.role,
            ordersCount: 0,
            totalAmount: 0
          };
        }
        aggregation.byUser[userId].ordersCount++;
        aggregation.byUser[userId].totalAmount += order.totalAmount;

        // التجميع حسب الحالة
        if (!aggregation.byStatus[order.status]) {
          aggregation.byStatus[order.status] = {
            status: order.status,
            count: 0,
            totalAmount: 0
          };
        }
        aggregation.byStatus[order.status].count++;
        aggregation.byStatus[order.status].totalAmount += order.totalAmount;

        // تجميع العناصر
        order.items.forEach(item => {
          const itemKey = item.menuItemId;
          if (!aggregation.itemsSummary[itemKey]) {
            aggregation.itemsSummary[itemKey] = {
              menuItemId: item.menuItemId,
              itemName: item.menuItem.name,
              restaurantName: order.restaurant?.name,
              quantity: 0,
              totalAmount: 0,
              ordersCount: 0
            };
          }
          aggregation.itemsSummary[itemKey].quantity += item.quantity;
          aggregation.itemsSummary[itemKey].totalAmount += item.price * item.quantity;
          aggregation.itemsSummary[itemKey].ordersCount++;

          // إضافة للمطعم
          aggregation.byRestaurant[restaurantId].items.push({
            name: item.menuItem.name,
            quantity: item.quantity,
            price: item.price
          });
        });
      });

      // حساب الإحصائيات
      if (aggregation.totalOrders > 0) {
        aggregation.statistics.averageOrderValue =
          aggregation.totalAmount / aggregation.totalOrders;

        // أكثر العناصر طلباً
        aggregation.statistics.mostOrderedItems = Object.values(aggregation.itemsSummary)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        // أفضل المطاعم
        aggregation.statistics.topRestaurants = Object.values(aggregation.byRestaurant)
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5);
      }

      // تحويل الكائنات إلى مصفوفات
      aggregation.byRestaurant = Object.values(aggregation.byRestaurant);
      aggregation.byUser = Object.values(aggregation.byUser);
      aggregation.byStatus = Object.values(aggregation.byStatus);
      aggregation.itemsSummary = Object.values(aggregation.itemsSummary);

      // إرسال إشعار للمنتجين والإداريين
      try {
        await notificationService.sendOrderAggregationNotification(projectId, {
          totalOrders: aggregation.totalOrders,
          totalAmount: aggregation.totalAmount,
          items: aggregation.statistics.mostOrderedItems
        });
      } catch (notifError) {
        console.error('❌ خطأ في إرسال إشعار التجميع:', notifError.message);
      }

      console.log(`✓ تم تجميع ${aggregation.totalOrders} طلب للمشروع ${projectId}`);
      return aggregation;
    } catch (error) {
      console.error('❌ خطأ في تجميع طلبات الفريق:', error);
      throw new Error(`خطأ في تجميع طلبات الفريق: ${error.message}`);
    }
  }

  /**
   * الحصول على ملخص طلبات اليوم للمشروع
   */
  async getTodayOrdersSummary(projectId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await this.aggregateTeamOrders(projectId, {
        date: today.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('❌ خطأ في جلب ملخص طلبات اليوم:', error);
      throw new Error(`خطأ في جلب ملخص طلبات اليوم: ${error.message}`);
    }
  }

  /**
   * تصدير تقرير تجميع الطلبات
   */
  async exportAggregationReport(projectId, options = {}) {
    try {
      const aggregation = await this.aggregateTeamOrders(projectId, options);

      // يمكن هنا إضافة منطق لتصدير التقرير بصيغ مختلفة (PDF, Excel, etc.)
      const report = {
        generatedAt: new Date().toISOString(),
        project: projectId,
        summary: {
          totalOrders: aggregation.totalOrders,
          totalAmount: aggregation.totalAmount,
          averageOrderValue: aggregation.statistics.averageOrderValue
        },
        details: aggregation
      };

      return report;
    } catch (error) {
      console.error('❌ خطأ في تصدير تقرير التجميع:', error);
      throw new Error(`خطأ في تصدير تقرير التجميع: ${error.message}`);
    }
  }

  // ============================================
  // الإحصائيات (Statistics)
  // ============================================

  /**
   * حساب إحصائيات الطلبات
   */
  async getOrderStats(projectId, dateRange) {
    try {
      const where = {};

      if (projectId) {
        where.projectId = projectId;
      }

      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        };
      }

      const stats = await prisma.order.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      });

      const totalOrders = stats.reduce((sum, stat) => sum + stat._count.id, 0);
      const totalRevenue = stats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0);

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        byStatus: stats.map(stat => ({
          status: stat.status,
          count: stat._count.id,
          totalAmount: stat._sum.totalAmount || 0
        }))
      };
    } catch (error) {
      console.error('❌ خطأ في حساب إحصائيات الطلبات:', error);
      throw new Error(`خطأ في حساب إحصائيات الطلبات: ${error.message}`);
    }
  }

  /**
   * الحصول على المستخدمين الذين لم يطلبوا اليوم
   */
  async getUsersWithoutOrdersToday(projectId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // جلب جميع المستخدمين النشطين
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true
        }
      });

      // جلب المستخدمين الذين طلبوا اليوم
      const usersWithOrders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        select: { userId: true },
        distinct: ['userId']
      });

      const userIdsWithOrders = new Set(usersWithOrders.map(o => o.userId));
      const usersWithoutOrders = allUsers.filter(u => !userIdsWithOrders.has(u.id));

      return usersWithoutOrders;
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين بدون طلبات:', error);
      throw new Error(`خطأ في جلب المستخدمين بدون طلبات: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
