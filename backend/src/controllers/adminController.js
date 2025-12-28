/**
 * Admin Controller
 * معالجة طلبات لوحة التحكم الإدارية
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * الحصول على إحصائيات Dashboard الرئيسية
 */
const getDashboardStats = async (req, res) => {
  try {
    // الحصول على إحصائيات متوازية
    const [
      totalUsers,
      totalOrders,
      totalRestaurants,
      totalRevenue,
      activeProjects,
      recentOrders
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count(),
      
      // إجمالي الطلبات
      prisma.order.count(),
      
      // إجمالي المطاعم
      prisma.restaurant.count({ where: { isActive: true } }),
      
      // إجمالي الإيرادات
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalAmount: true }
      }),
      
      // المشاريع النشطة
      prisma.project.count({ where: { isActive: true } }),
      
      // آخر 10 طلبات
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
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
      })
    ]);

    // حساب معدل النمو (مقارنة بالشهر الماضي)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [lastMonthOrders, lastMonthUsers] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: lastMonth } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastMonth } }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalRestaurants,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          activeProjects
        },
        growth: {
          ordersLastMonth: lastMonthOrders,
          usersLastMonth: lastMonthUsers
        },
        recentOrders
      }
    });
  } catch (error) {
    logger.error(`خطأ في جلب إحصائيات Dashboard: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_STATS_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * الحصول على جميع المستخدمين
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`خطأ في جلب المستخدمين: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'USERS_FETCH_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * تحديث دور المستخدم
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'الدور غير صالح'
        }
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    logger.info(`تم تحديث دور المستخدم ${userId} إلى ${role}`);

    res.json({
      success: true,
      data: user,
      message: 'تم تحديث الدور بنجاح'
    });
  } catch (error) {
    logger.error(`خطأ في تحديث دور المستخدم: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_UPDATE_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * تفعيل/تعطيل مستخدم
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'المستخدم غير موجود'
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    logger.info(`تم ${updatedUser.isActive ? 'تفعيل' : 'تعطيل'} المستخدم ${userId}`);

    res.json({
      success: true,
      data: updatedUser,
      message: `تم ${updatedUser.isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`
    });
  } catch (error) {
    logger.error(`خطأ في تغيير حالة المستخدم: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_STATUS_UPDATE_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * الحصول على جميع الطلبات
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, restaurantId } = req.query;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
      ...(restaurantId && { restaurantId })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          },
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: orders,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`خطأ في جلب الطلبات: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_FETCH_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * الحصول على تقارير المبيعات
 */
const getSalesReports = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // إحصائيات عامة
    const [totalSales, orderCount, avgOrderValue] = await Promise.all([
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _avg: { totalAmount: true }
      })
    ]);

    // أكثر المطاعم مبيعاً
    const topRestaurants = await prisma.order.groupBy({
      by: ['restaurantId'],
      where,
      _sum: { totalAmount: true },
      _count: true,
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    // جلب تفاصيل المطاعم
    const restaurantIds = topRestaurants.map(r => r.restaurantId).filter(Boolean);
    const restaurants = await prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true, name: true }
    });

    const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]));

    const topRestaurantsWithNames = topRestaurants.map(r => ({
      restaurantId: r.restaurantId,
      restaurantName: r.restaurantId ? restaurantMap.get(r.restaurantId) : 'N/A',
      totalSales: r._sum.totalAmount,
      orderCount: r._count
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalSales: totalSales._sum.totalAmount || 0,
          orderCount,
          avgOrderValue: avgOrderValue._avg.totalAmount || 0
        },
        topRestaurants: topRestaurantsWithNames
      }
    });
  } catch (error) {
    logger.error(`خطأ في جلب تقارير المبيعات: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SALES_REPORT_FAILED',
        message: error.message
      }
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllOrders,
  getSalesReports
};
