const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * الحصول على إحصائيات لوحة التحكم
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      usersCount,
      ordersCount,
      restaurantsCount,
      revenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.restaurant.count(),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'COMPLETED'
        }
      })
    ]);

    // Active orders (Pending or Preparing)
    const activeOrders = await prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'PREPARING', 'CONFIRMED']
        }
      }
    });

    res.json({
      success: true,
      data: {
        usersCount,
        ordersCount,
        restaurantsCount,
        activeOrders,
        totalRevenue: revenue._sum.amount || 0
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب إحصائيات لوحة التحكم'
    });
  }
};

/**
 * الحصول على أحدث الطلبات
 */
const getRecentOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب أحدث الطلبات'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders
};
