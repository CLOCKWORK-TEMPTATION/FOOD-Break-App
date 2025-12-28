const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');
const orderService = require('./orderService');
const logger = require('../utils/logger');

/**
 * خدمة التكامل مع الإنتاج
 * Production Integration Service
 */
class ProductionIntegrationService {
  // مزامنة جدول التصوير
  async syncShootingSchedule(projectId, scheduleData) {
    try {
      logger.info(`Syncing shooting schedule for project ${projectId}`);

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // تحديث تواريخ المشروع
      if (scheduleData.startDate) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            startDate: new Date(scheduleData.startDate),
            endDate: scheduleData.endDate ? new Date(scheduleData.endDate) : null
          }
        });
      }

      // إشعار الفريق بالتغييرات
      if (scheduleData.changed) {
        await this.notifyScheduleChange(projectId, scheduleData);
      }

      return { success: true, message: 'Schedule synced successfully' };
    } catch (error) {
      logger.error('Error syncing schedule:', error);
      throw error;
    }
  }

  // إشعار تغيير الجدول
  async notifyScheduleChange(projectId, scheduleData) {
    try {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
      });

      for (const member of members) {
        await notificationService.sendPushNotification(
          member.userId,
          'تغيير في جدول التصوير',
          `تم تحديث جدول التصوير. ${scheduleData.reason || ''}`,
          { projectId, type: 'SCHEDULE_CHANGE' }
        );
      }

      logger.info(`Notified ${members.length} members about schedule change`);
    } catch (error) {
      logger.error('Error notifying schedule change:', error);
    }
  }

  // تعديل أوقات التوصيل تلقائياً
  async adjustDeliveryTimes(projectId, delay) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] }
        }
      });

      for (const order of orders) {
        if (order.estimatedTime) {
          const newTime = new Date(order.estimatedTime);
          newTime.setMinutes(newTime.getMinutes() + delay);

          await prisma.order.update({
            where: { id: order.id },
            data: { estimatedTime: newTime }
          });
        }
      }

      logger.info(`Adjusted delivery times for ${orders.length} orders by ${delay} minutes`);
      return { adjusted: orders.length };
    } catch (error) {
      logger.error('Error adjusting delivery times:', error);
      throw error;
    }
  }

  // معالجة تغييرات الجدول
  async handleScheduleChange(projectId, changeType, data) {
    try {
      const actions = {
        DELAY: async () => {
          await this.adjustDeliveryTimes(projectId, data.delayMinutes);
          return { message: `Delayed by ${data.delayMinutes} minutes` };
        },
        CANCELLATION: async () => {
          await this.cancelTodayOrders(projectId, data.reason);
          return { message: 'Orders cancelled' };
        },
        TIME_MODIFICATION: async () => {
          await this.modifyOrderTimes(projectId, data.newTime);
          return { message: 'Times modified' };
        }
      };

      const action = actions[changeType];
      if (!action) {
        throw new Error(`Unknown change type: ${changeType}`);
      }

      const result = await action();
      await this.notifyScheduleChange(projectId, { ...data, changeType });

      return result;
    } catch (error) {
      logger.error('Error handling schedule change:', error);
      throw error;
    }
  }

  // إلغاء طلبات اليوم
  async cancelTodayOrders(projectId, reason) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await prisma.order.updateMany({
        where: {
          projectId,
          createdAt: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        data: { status: 'CANCELLED' }
      });

      logger.info(`Cancelled ${result.count} orders for project ${projectId}`);
      return result.count;
    } catch (error) {
      logger.error('Error cancelling orders:', error);
      throw error;
    }
  }

  // تعديل أوقات الطلبات
  async modifyOrderTimes(projectId, newTime) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] }
        }
      });

      for (const order of orders) {
        await prisma.order.update({
          where: { id: order.id },
          data: { estimatedTime: new Date(newTime) }
        });
      }

      return orders.length;
    } catch (error) {
      logger.error('Error modifying order times:', error);
      throw error;
    }
  }

  // تكامل الحضور
  async syncAttendance(projectId, attendanceData) {
    try {
      logger.info(`Syncing attendance for project ${projectId}`);

      const { date, attendees, absentees } = attendanceData;

      // إلغاء طلبات الغائبين
      if (absentees && absentees.length > 0) {
        const cancelled = await this.cancelOrdersForAbsentees(projectId, absentees, date);
        logger.info(`Cancelled ${cancelled} orders for absent members`);
      }

      // تفعيل طلبات الحاضرين
      if (attendees && attendees.length > 0) {
        await this.activateOrdersForAttendees(projectId, attendees, date);
      }

      return {
        success: true,
        cancelled: absentees?.length || 0,
        activated: attendees?.length || 0
      };
    } catch (error) {
      logger.error('Error syncing attendance:', error);
      throw error;
    }
  }

  // إلغاء طلبات الغائبين
  async cancelOrdersForAbsentees(projectId, absenteeIds, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const result = await prisma.order.updateMany({
        where: {
          projectId,
          userId: { in: absenteeIds },
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        data: { status: 'CANCELLED' }
      });

      return result.count;
    } catch (error) {
      logger.error('Error cancelling orders for absentees:', error);
      throw error;
    }
  }

  // تفعيل طلبات الحاضرين
  async activateOrdersForAttendees(projectId, attendeeIds, date) {
    try {
      // يمكن إضافة منطق تفعيل الطلبات هنا
      logger.info(`Activated orders for ${attendeeIds.length} attendees`);
    } catch (error) {
      logger.error('Error activating orders:', error);
    }
  }

  // ربط تسجيل الدخول بتفعيل الطلب
  async linkCheckInToOrder(userId, projectId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const order = await prisma.order.findFirst({
        where: {
          userId,
          projectId,
          createdAt: { gte: today },
          status: 'PENDING'
        }
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED' }
        });

        logger.info(`Order ${order.id} confirmed via check-in`);
        return order;
      }

      return null;
    } catch (error) {
      logger.error('Error linking check-in to order:', error);
      throw error;
    }
  }

  // تقرير الحضور والوجبات المدمج
  async getCombinedAttendanceReport(projectId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const [members, orders] = await Promise.all([
        prisma.projectMember.findMany({
          where: { projectId },
          include: { user: true }
        }),
        prisma.order.findMany({
          where: {
            projectId,
            createdAt: { gte: startDate, lte: endDate }
          },
          include: { user: true }
        })
      ]);

      const report = members.map(member => {
        const userOrders = orders.filter(o => o.userId === member.userId);
        const hasOrder = userOrders.length > 0;
        const orderStatus = hasOrder ? userOrders[0].status : null;

        return {
          userId: member.userId,
          name: `${member.user.firstName} ${member.user.lastName}`,
          role: member.role,
          hasOrder,
          orderStatus,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((sum, o) => sum + o.totalAmount, 0)
        };
      });

      return report;
    } catch (error) {
      logger.error('Error getting combined report:', error);
      throw error;
    }
  }

  // تحليل أنماط الغياب
  async analyzeAbsencePatterns(projectId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
      });

      const patterns = await Promise.all(
        members.map(async (member) => {
          const orders = await prisma.order.findMany({
            where: {
              userId: member.userId,
              projectId,
              createdAt: { gte: startDate }
            }
          });

          const totalDays = days;
          const orderedDays = new Set(
            orders.map(o => o.createdAt.toISOString().split('T')[0])
          ).size;
          const absentDays = totalDays - orderedDays;
          const absenceRate = (absentDays / totalDays) * 100;

          return {
            userId: member.userId,
            name: `${member.user.firstName} ${member.user.lastName}`,
            totalDays,
            orderedDays,
            absentDays,
            absenceRate: parseFloat(absenceRate.toFixed(2))
          };
        })
      );

      return patterns.sort((a, b) => b.absenceRate - a.absenceRate);
    } catch (error) {
      logger.error('Error analyzing absence patterns:', error);
      throw error;
    }
  }
}

module.exports = new ProductionIntegrationService();
