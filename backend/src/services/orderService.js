const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OrderService {
  // إنشاء طلب جديد
  async createOrder(orderData) {
    try {
      const order = await prisma.order.create({
        data: {
          userId: orderData.userId,
          projectId: orderData.projectId,
          restaurantId: orderData.restaurantId,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          status: 'PENDING',
          deliveryAddress: orderData.deliveryAddress,
          notes: orderData.notes
        },
        include: {
          user: true,
          restaurant: true,
          project: true
        }
      });
      return order;
    } catch (error) {
      throw new Error(`خطأ في إنشاء الطلب: ${error.message}`);
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
          notes: `${order.notes || ''}\nسبب الإلغاء: ${reason}`,
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