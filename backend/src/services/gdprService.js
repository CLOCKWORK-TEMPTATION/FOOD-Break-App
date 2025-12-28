const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * GDPR Compliance Service
 * خدمة الامتثال لـ GDPR
 */
class GDPRService {
  // تسجيل موافقة المستخدم
  async recordConsent(userId, consentType, status, metadata = {}) {
    try {
      return await prisma.consentRecord.create({
        data: {
          userId,
          type: consentType,
          status,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          version: metadata.version || '1.0'
        }
      });
    } catch (error) {
      logger.error('Error recording consent:', error);
      throw error;
    }
  }

  // سحب الموافقة
  async revokeConsent(userId, consentType) {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: { userId, type: consentType, status: 'GRANTED' },
        orderBy: { consentedAt: 'desc' }
      });

      if (consent) {
        await prisma.consentRecord.update({
          where: { id: consent.id },
          data: { status: 'REVOKED', revokedAt: new Date() }
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error revoking consent:', error);
      throw error;
    }
  }

  // تصدير بيانات المستخدم
  async exportUserData(userId) {
    try {
      const [user, orders, preferences, consents] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.order.findMany({ where: { userId } }),
        prisma.userPreferences.findUnique({ where: { userId } }),
        prisma.consentRecord.findMany({ where: { userId } })
      ]);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        },
        orders: orders.map(o => ({
          id: o.id,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt
        })),
        preferences,
        consents,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  // حذف بيانات المستخدم (Right to be forgotten)
  async deleteUserData(userId) {
    try {
      await prisma.$transaction([
        prisma.consentRecord.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.userPreferences.deleteMany({ where: { userId } }),
        prisma.order.updateMany({
          where: { userId },
          data: { userId: null } // Anonymize instead of delete
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            email: `deleted_${userId}@deleted.com`,
            firstName: 'Deleted',
            lastName: 'User',
            phoneNumber: null,
            isActive: false
          }
        })
      ]);

      logger.info(`User data deleted for ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  // التحقق من الموافقات
  async checkConsent(userId, consentType) {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          type: consentType,
          status: 'GRANTED'
        },
        orderBy: { consentedAt: 'desc' }
      });

      return !!consent;
    } catch (error) {
      logger.error('Error checking consent:', error);
      return false;
    }
  }
}

module.exports = new GDPRService();
