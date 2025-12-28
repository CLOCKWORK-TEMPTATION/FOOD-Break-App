const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OrderService {
  // إنشاء طلب جديد مع التحقق من نافذة الطلب
  async createOrder(orderData) {
    try {
      // التحقق من نافذة الطلب
      if (orderData.projectId) {
        const project = await prisma.project.findUnique({ where: { id: orderData.projectId } });
        if (project && !this.isWithinOrderWindow(project)) {
          throw new Error('نافذة الطلب مغلقة. يمكنك الطلب فقط خلال الساعة الأولى من التصوير');
        }
      }

      const items = Array.isArray(orderData.items) ? orderData.items : [];

      const order = await prisma.order.create({
        data: {
          userId: orderData.userId,
          projectId: orderData.projectId,
          restaurantId: orderData.restaurantId,
          totalAmount: orderData.totalAmount,
          status: 'PENDING',
          deliveryAddress: orderData.deliveryAddress,
          deliveryLat: orderData.deliveryLat,
          deliveryLng: orderData.deliveryLng,
          estimatedTime: orderData.estimatedTime,
          items: {
            create: items.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              price: i.price,
              specialInstructions: i.specialInstructions || null
            }))
          }
        },
        include: {
          user: true,
          restaurant: true,
          project: true,
          items: { include: { menuItem: true } }
        }
      });
      return order;
    } catch (error) {
      throw new Error(`خطأ في إنشاء الطلب: ${error.message}`);
    }
  }

  // التحقق من نافذة الطلب
  isWithinOrderWindow(project) {
    if (!project.startDate) return true;
    const now = new Date();
    const startDate = new Date(project.startDate);
    const orderWindowMinutes = project.orderWindow || 60;
    const windowEnd = new Date(startDate.getTime() + orderWindowMinutes * 60000);
    return now >= startDate && now <= windowEnd;
  }

  // الحصول على الطلبات التي لم تُقدم في المشروع
  async getNonSubmitters(projectId) {
    try {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ordersToday = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: today }
        },
        select: { userId: true }
      });

      const submittedUserIds = new Set(ordersToday.map(o => o.userId));
      const nonSubmitters = members.filter(m => !submittedUserIds.has(m.userId));

      return nonSubmitters.map(m => ({
        userId: m.userId,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName
      }));
    } catch (error) {
      throw new Error(`خطأ في جلب غير المقدمين: ${error.message}`);
    }
  }

  // تجميع الطلبات حسب المطعم
  async aggregateOrdersByRestaurant(projectId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const orders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: ['CANCELLED'] }
        },
        include: {
          restaurant: true,
          items: { include: { menuItem: true } },
          user: true
        }
      });

      const aggregated = {};
      orders.forEach(order => {
        const restId = order.restaurantId;
        if (!aggregated[restId]) {
          aggregated[restId] = {
            restaurant: order.restaurant,
            orders: [],
            totalAmount: 0,
            itemsSummary: {}
          };
        }
        aggregated[restId].orders.push(order);
        aggregated[restId].totalAmount += order.totalAmount;

        order.items.forEach(item => {
          const key = item.menuItemId;
          if (!aggregated[restId].itemsSummary[key]) {
            aggregated[restId].itemsSummary[key] = {
              menuItem: item.menuItem,
              quantity: 0,
              totalPrice: 0
            };
          }
          aggregated[restId].itemsSummary[key].quantity += item.quantity;
          aggregated[restId].itemsSummary[key].totalPrice += item.price * item.quantity;
        });
      });

      return Object.values(aggregated);
    } catch (error) {
      throw new Error(`خطأ في تجميع الطلبات: ${error.message}`);
    }
  }

  // الحصول على جميع الطلبات مع التصفية
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
          user: true,
          restaurant: true,
          project: true
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
      throw new Error(`خطأ في جلب الطلبات: ${error.message}`);
    }
  }

  // الحصول على طلب محدد
  async getOrderById(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          restaurant: true,
          project: true
        }
      });

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      return order;
    } catch (error) {
      throw new Error(`خطأ في جلب الطلب: ${error.message}`);
    }
  }

  // تحديث حالة الطلب
  async updateOrderStatus(orderId, status, updatedBy) {
    try {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('حالة الطلب غير صحيحة');
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status,
          updatedAt: new Date()
        },
        include: {
          user: true,
          restaurant: true
        }
      });

      return order;
    } catch (error) {
      throw new Error(`خطأ في تحديث حالة الطلب: ${error.message}`);
    }
  }

  // إلغاء الطلب
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
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

      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      return cancelledOrder;
    } catch (error) {
      throw new Error(`خطأ في إلغاء الطلب: ${error.message}`);
    }
  }

  // حساب إحصائيات الطلبات
  async getOrderStats(projectId, dateRange) {
    try {
      const where = { projectId };
      
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

      return stats;
    } catch (error) {
      throw new Error(`خطأ في حساب إحصائيات الطلبات: ${error.message}`);
    }
  }
}

module.exports = new OrderService();