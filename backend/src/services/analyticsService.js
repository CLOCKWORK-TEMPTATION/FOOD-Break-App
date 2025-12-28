const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * خدمة التحليلات والذكاء المالي
 * Analytics & Financial Intelligence Service
 */
class AnalyticsService {
  // الحصول على إحصائيات Dashboard
  async getDashboardStats(projectId = null, dateRange = null) {
    try {
      const where = {};
      if (projectId) where.projectId = projectId;
      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        };
      }

      const [totalOrders, totalSpent, activeUsers, pendingOrders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({
          where: { ...where, status: { notIn: ['CANCELLED'] } },
          _sum: { totalAmount: true }
        }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.order.count({ where: { ...where, status: 'PENDING' } })
      ]);

      return {
        totalOrders,
        totalSpent: totalSpent._sum.totalAmount || 0,
        activeUsers,
        pendingOrders
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // تقرير الإنفاق اليومي/الأسبوعي/الشهري
  async getSpendingReport(projectId, period = 'daily', limit = 30) {
    try {
      const groupBy = {
        daily: 'day',
        weekly: 'week',
        monthly: 'month'
      }[period] || 'day';

      const orders = await prisma.order.findMany({
        where: {
          projectId,
          status: { notIn: ['CANCELLED'] },
          createdAt: {
            gte: new Date(Date.now() - limit * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          totalAmount: true,
          createdAt: true,
          orderType: true
        }
      });

      const grouped = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        let key;
        
        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const week = Math.floor(date.getDate() / 7);
          key = `${date.getFullYear()}-W${week}`;
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!grouped[key]) {
          grouped[key] = { total: 0, regular: 0, exception: 0, count: 0 };
        }
        
        grouped[key].total += order.totalAmount;
        grouped[key].count++;
        if (order.orderType === 'EXCEPTION') {
          grouped[key].exception += order.totalAmount;
        } else {
          grouped[key].regular += order.totalAmount;
        }
      });

      return Object.entries(grouped).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.error('Error getting spending report:', error);
      throw error;
    }
  }

  // التنبؤ بالميزانية
  async forecastBudget(projectId, daysAhead = 30) {
    try {
      const last30Days = await this.getSpendingReport(projectId, 'daily', 30);
      
      if (last30Days.length === 0) return { forecast: [], avgDaily: 0 };

      const avgDaily = last30Days.reduce((sum, d) => sum + d.total, 0) / last30Days.length;
      
      const forecast = [];
      const today = new Date();
      
      for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        forecast.push({
          date: date.toISOString().split('T')[0],
          predicted: avgDaily,
          confidence: Math.max(0.5, 1 - (i / daysAhead) * 0.3)
        });
      }

      return {
        forecast,
        avgDaily,
        totalPredicted: avgDaily * daysAhead
      };
    } catch (error) {
      logger.error('Error forecasting budget:', error);
      throw error;
    }
  }

  // مقارنة المشاريع
  async compareProjects(projectIds, dateRange = null) {
    try {
      const comparisons = await Promise.all(
        projectIds.map(async (projectId) => {
          const where = { projectId };
          if (dateRange) {
            where.createdAt = {
              gte: new Date(dateRange.start),
              lte: new Date(dateRange.end)
            };
          }

          const [orders, totalSpent, members] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.aggregate({
              where: { ...where, status: { notIn: ['CANCELLED'] } },
              _sum: { totalAmount: true }
            }),
            prisma.projectMember.count({ where: { projectId } })
          ]);

          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true }
          });

          return {
            projectId,
            projectName: project?.name || 'Unknown',
            totalOrders: orders,
            totalSpent: totalSpent._sum.totalAmount || 0,
            avgPerOrder: orders > 0 ? (totalSpent._sum.totalAmount || 0) / orders : 0,
            members,
            avgPerMember: members > 0 ? (totalSpent._sum.totalAmount || 0) / members : 0
          };
        })
      );

      return comparisons;
    } catch (error) {
      logger.error('Error comparing projects:', error);
      throw error;
    }
  }

  // تحليل الاستثناءات
  async analyzeExceptions(projectId = null, dateRange = null) {
    try {
      const where = {};
      if (projectId) where.projectId = projectId;
      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        };
      }

      const exceptions = await prisma.order.findMany({
        where: {
          ...where,
          orderType: 'EXCEPTION'
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } }
        }
      });

      const byType = {};
      const byUser = {};
      let totalCost = 0;

      exceptions.forEach(order => {
        const type = order.exceptionType || 'UNKNOWN';
        byType[type] = (byType[type] || 0) + 1;
        
        const userId = order.userId;
        if (!byUser[userId]) {
          byUser[userId] = {
            user: order.user,
            count: 0,
            totalSpent: 0
          };
        }
        byUser[userId].count++;
        byUser[userId].totalSpent += order.totalAmount;
        
        totalCost += order.exceptionAmount || 0;
      });

      return {
        total: exceptions.length,
        byType,
        byUser: Object.values(byUser).sort((a, b) => b.totalSpent - a.totalSpent),
        totalCost,
        avgCost: exceptions.length > 0 ? totalCost / exceptions.length : 0
      };
    } catch (error) {
      logger.error('Error analyzing exceptions:', error);
      throw error;
    }
  }

  // تحليل المطاعم الأكثر طلباً
  async getTopRestaurants(projectId = null, limit = 10) {
    try {
      const where = {};
      if (projectId) where.projectId = projectId;

      const orders = await prisma.order.groupBy({
        by: ['restaurantId'],
        where: { ...where, status: { notIn: ['CANCELLED'] } },
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      });

      const restaurantIds = orders.map(o => o.restaurantId).filter(Boolean);
      const restaurants = await prisma.restaurant.findMany({
        where: { id: { in: restaurantIds } },
        select: { id: true, name: true, rating: true, cuisineType: true }
      });

      const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

      return orders.map(order => ({
        restaurant: restaurantMap.get(order.restaurantId),
        orderCount: order._count.id,
        totalRevenue: order._sum.totalAmount || 0,
        avgOrderValue: (order._sum.totalAmount || 0) / order._count.id
      }));
    } catch (error) {
      logger.error('Error getting top restaurants:', error);
      throw error;
    }
  }

  // تحليل الأطباق الأكثر طلباً
  async getTopMenuItems(projectId = null, limit = 10) {
    try {
      const where = {};
      if (projectId) {
        where.order = { projectId };
      }

      const items = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where,
        _count: { id: true },
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit
      });

      const menuItemIds = items.map(i => i.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true, name: true, nameAr: true, category: true, price: true }
      });

      const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

      return items.map(item => ({
        menuItem: menuItemMap.get(item.menuItemId),
        orderCount: item._count.id,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.price || 0
      }));
    } catch (error) {
      logger.error('Error getting top menu items:', error);
      throw error;
    }
  }

  // تصدير التقرير
  async exportReport(projectId, format = 'json', dateRange = null) {
    try {
      const [stats, spending, exceptions, topRestaurants, topItems] = await Promise.all([
        this.getDashboardStats(projectId, dateRange),
        this.getSpendingReport(projectId, 'daily', 30),
        this.analyzeExceptions(projectId, dateRange),
        this.getTopRestaurants(projectId, 10),
        this.getTopMenuItems(projectId, 10)
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        projectId,
        dateRange,
        summary: stats,
        spending,
        exceptions,
        topRestaurants,
        topItems
      };

      if (format === 'json') {
        return report;
      }

      // يمكن إضافة تصدير PDF/Excel هنا
      return report;
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
