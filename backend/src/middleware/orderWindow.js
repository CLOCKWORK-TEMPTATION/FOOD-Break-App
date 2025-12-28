/**
 * Order Window Middleware
 * 'D*-BB EF F'A0) 'D7D( DDE41H9
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 'D*-BB EF #F F'A0) 'D7D( EA*H-)
 * J3*./E E9 routes *B/JE 'D7D('*
 */
const checkOrderWindow = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'Project ID is required'
        }
      });
    }

    // ,D( E9DHE'* 'DE41H9
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    if (!project.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PROJECT_INACTIVE',
          message: 'Project is inactive'
        }
      });
    }

    // -3'( F'A0) 'D7D(
    const now = new Date();
    const projectStart = new Date(project.startDate);
    const orderWindowEnd = new Date(projectStart.getTime() + project.orderWindow * 60 * 1000);

    const isOrderWindowOpen = now >= projectStart && now <= orderWindowEnd;

    if (!isOrderWindowOpen) {
      const timeUntilStart = projectStart - now;
      const timeAfterEnd = now - orderWindowEnd;

      let message = 'Order window closed';
      let details = {};

      if (timeUntilStart > 0) {
        // Project has not started yet
        message = 'Order window has not started yet';
        details = {
          startsIn: Math.ceil(timeUntilStart / (60 * 1000)), // ('D/B'&B
          startsAt: projectStart
        };
      } else if (timeAfterEnd > 0) {
        // Project ended
        message = 'Order window has ended';
        details = {
          endedAt: orderWindowEnd,
          minutesAgo: Math.ceil(timeAfterEnd / (60 * 1000))
        };
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'ORDER_WINDOW_CLOSED',
          message,
          details,
          orderWindow: {
            start: projectStart,
            end: orderWindowEnd
          }
        }
      });
    }

    // -3'( 'DHB* 'DE*(BJ
    const timeRemaining = orderWindowEnd - now;
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

    // %6'A) E9DHE'* 'DE41H9 HF'A0) 'D7D( %DI request
    req.project = project;
    req.orderWindow = {
      isOpen: true,
      start: projectStart,
      end: orderWindowEnd,
      timeRemainingMs: timeRemaining,
      minutesRemaining
    };

    next();
  } catch (error) {
    console.error('Error in checkOrderWindow middleware:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_WINDOW_CHECK_FAILED',
        message: 'Error checking order window'
      }
    });
  }
};

/**
 * 'D*-BB EF #F 'DE3*./E DE JB/E 7D( E3(B'K AJ G0' 'DE41H9 ('DJHE)
 * JEF9 'D7D('* 'DEC11)
 */
const checkDuplicateOrder = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    // 'D*-BB EF H,H/ 7D( DG0' 'DE3*./E AJ FA3 'DE41H9 'DJHE
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        projectId,
        createdAt: {
          gte: today
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ORDER',
          message: 'Duplicate order for this project today',
          existingOrder: {
            id: existingOrder.id,
            status: existingOrder.status,
            createdAt: existingOrder.createdAt
          }
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkDuplicateOrder middleware:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DUPLICATE_CHECK_FAILED',
        message: 'Error checking duplicate orders'
      }
    });
  }
};

/**
 * %13'D *0CJ1 DDE3*./EJF 'D0JF DE JB/EH' 7D('*
 * J3*./E C@ scheduled job
 */
const sendOrderReminders = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // ,D( ,EJ9 'DE3*./EJF 'DF47JF
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['REGULAR', 'VIP']
        }
      }
    });

    // ,D( 'DE3*./EJF 'D0JF B/EH' 7D('*
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await prisma.order.findMany({
      where: {
        projectId,
        createdAt: {
          gte: today
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        userId: true
      }
    });

    const usersWithOrders = new Set(ordersToday.map(o => o.userId));

    // 'DE3*./EHF (/HF 7D('*
    const usersWithoutOrders = allUsers.filter(user => !usersWithOrders.has(user.id));

    // %13'D %49'1'* (JECF '3*./'E notificationService)
    const remindersSent = [];
    for (const user of usersWithoutOrders) {
      // TODO: '3*./'E notificationService.sendReminder
      remindersSent.push({
        userId: user.id,
        email: user.email,
        sentAt: new Date()
      });
    }

    return {
      success: true,
      totalUsers: allUsers.length,
      usersWithOrders: usersWithOrders.size,
      usersWithoutOrders: usersWithoutOrders.length,
      remindersSent: remindersSent.length
    };
  } catch (error) {
    console.error('Error sending order reminders:', error);
    throw error;
  }
};

module.exports = {
  checkOrderWindow,
  checkDuplicateOrder,
  sendOrderReminders
};
