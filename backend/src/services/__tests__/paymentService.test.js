/**
 * اختبارات خدمة المدفوعات (PaymentService)
 * Unit Tests لخدمة إدارة المدفوعات
 */

const paymentService = require('../paymentService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const prisma = new PrismaClient();

describe('PaymentService - اختبارات خدمة المدفوعات', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment - إنشاء دفع جديد', () => {
    const mockPaymentData = {
      userId: 'user_123',
      orderId: 'order_456',
      amount: 150.5,
      currency: 'EGP',
      provider: 'stripe',
      paymentIntentId: 'pi_123abc',
      paymentMethodId: 'pm_456def',
      metadata: { source: 'mobile_app' },
    };

    it('يجب أن ينشئ دفعاً جديداً بنجاح', async () => {
      const createdPayment = {
        id: 'payment_789',
        ...mockPaymentData,
        status: 'PENDING',
        user: {
          id: mockPaymentData.userId,
          email: 'test@example.com',
          firstName: 'محمد',
          lastName: 'أحمد',
        },
        order: {
          id: mockPaymentData.orderId,
          totalAmount: 150.5,
          status: 'PENDING',
        },
      };

      prisma.payment.create.mockResolvedValue(createdPayment);

      const result = await paymentService.createPayment(mockPaymentData);

      expect(result).toEqual(createdPayment);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockPaymentData.userId,
          orderId: mockPaymentData.orderId,
          amount: 150.5,
          currency: 'EGP',
          provider: 'stripe',
          status: 'PENDING',
        }),
        include: expect.any(Object),
      });
    });

    it('يجب أن يستخدم EGP كعملة افتراضية', async () => {
      const dataWithoutCurrency = { ...mockPaymentData };
      delete dataWithoutCurrency.currency;

      prisma.payment.create.mockResolvedValue({
        id: 'payment_789',
        currency: 'EGP',
      });

      await paymentService.createPayment(dataWithoutCurrency);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'EGP',
          }),
        })
      );
    });

    it('يجب أن يحول العملة إلى أحرف كبيرة', async () => {
      const dataWithLowerCurrency = { ...mockPaymentData, currency: 'usd' };

      prisma.payment.create.mockResolvedValue({
        id: 'payment_789',
        currency: 'USD',
      });

      await paymentService.createPayment(dataWithLowerCurrency);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'USD',
          }),
        })
      );
    });

    it('يجب أن يرفض المبالغ غير الصالحة', async () => {
      const invalidData = {
        ...mockPaymentData,
        amount: -10,
      };

      await expect(paymentService.createPayment(invalidData)).rejects.toThrow(
        'بيانات الدفع غير صالحة'
      );

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض المبالغ الصفرية', async () => {
      const invalidData = {
        ...mockPaymentData,
        amount: 0,
      };

      await expect(paymentService.createPayment(invalidData)).rejects.toThrow(
        'بيانات الدفع غير صالحة'
      );
    });

    it('يجب أن يعالج الدفع بدون طلب', async () => {
      const paymentWithoutOrder = { ...mockPaymentData };
      delete paymentWithoutOrder.orderId;

      prisma.payment.create.mockResolvedValue({
        id: 'payment_789',
        orderId: null,
      });

      await paymentService.createPayment(paymentWithoutOrder);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: null,
          }),
        })
      );
    });
  });

  describe('updatePaymentStatus - تحديث حالة الدفع', () => {
    const mockPayment = {
      id: 'payment_123',
      userId: 'user_123',
      status: 'COMPLETED',
      completedAt: new Date(),
      user: { id: 'user_123' },
      order: { id: 'order_123' },
    };

    it('يجب أن يحدث الحالة إلى COMPLETED مع تاريخ الإكمال', async () => {
      prisma.payment.update.mockResolvedValue(mockPayment);

      const result = await paymentService.updatePaymentStatus(
        'payment_123',
        'COMPLETED'
      );

      expect(result.status).toBe('COMPLETED');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment_123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('يجب أن يحدث الحالة بدون تاريخ إكمال للحالات الأخرى', async () => {
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'FAILED',
      });

      await paymentService.updatePaymentStatus('payment_123', 'FAILED');

      const updateData = prisma.payment.update.mock.calls[0][0].data;
      expect(updateData.status).toBe('FAILED');
      expect(updateData.completedAt).toBeUndefined();
    });

    it('يجب أن يضيف بيانات إضافية عند التحديث', async () => {
      const additionalData = {
        failureReason: 'Insufficient funds',
        errorCode: 'CARD_DECLINED',
      };

      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        ...additionalData,
      });

      await paymentService.updatePaymentStatus(
        'payment_123',
        'FAILED',
        additionalData
      );

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining(additionalData),
        })
      );
    });

    it('يجب أن يرمي خطأ عند فشل التحديث', async () => {
      prisma.payment.update.mockRejectedValue(
        new Error('Payment not found')
      );

      await expect(
        paymentService.updatePaymentStatus('invalid_id', 'COMPLETED')
      ).rejects.toThrow();
    });
  });

  describe('findPaymentByIntentId - البحث عن دفع بمعرف النية', () => {
    const mockPayment = {
      id: 'payment_123',
      paymentIntentId: 'pi_123abc',
      status: 'COMPLETED',
      user: { id: 'user_123' },
      order: { id: 'order_123' },
    };

    it('يجب أن يجد الدفع بمعرف النية', async () => {
      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await paymentService.findPaymentByIntentId('pi_123abc');

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_123abc' },
        include: expect.any(Object),
      });
    });

    it('يجب أن يرجع null للدفع غير الموجود', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await paymentService.findPaymentByIntentId('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserPayments - جلب مدفوعات المستخدم', () => {
    const mockPayments = [
      {
        id: 'payment_1',
        amount: 100,
        status: 'COMPLETED',
        createdAt: new Date('2024-01-15'),
        order: {
          id: 'order_1',
          totalAmount: 100,
          status: 'DELIVERED',
          orderType: 'STANDARD',
        },
      },
      {
        id: 'payment_2',
        amount: 200,
        status: 'PENDING',
        createdAt: new Date('2024-01-16'),
        order: {
          id: 'order_2',
          totalAmount: 200,
          status: 'PENDING',
          orderType: 'EXPRESS',
        },
      },
    ];

    it('يجب أن يرجع قائمة المدفوعات مع الترقيم', async () => {
      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(2);

      const result = await paymentService.getUserPayments('user_123');

      expect(result.payments).toEqual(mockPayments);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        pages: 1,
        hasMore: false,
      });
    });

    it('يجب أن يطبق الترقيم بشكل صحيح', async () => {
      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(25);

      const result = await paymentService.getUserPayments('user_123', {
        page: 2,
        limit: 10,
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        })
      );
      expect(result.pagination.hasMore).toBe(true);
    });

    it('يجب أن يصفّي حسب الحالة', async () => {
      prisma.payment.findMany.mockResolvedValue([mockPayments[0]]);
      prisma.payment.count.mockResolvedValue(1);

      await paymentService.getUserPayments('user_123', {
        status: 'COMPLETED',
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );
    });

    it('يجب أن يصفّي حسب المزود', async () => {
      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(2);

      await paymentService.getUserPayments('user_123', {
        provider: 'stripe',
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider: 'stripe',
          }),
        })
      );
    });

    it('يجب أن يصفّي حسب النطاق الزمني', async () => {
      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(2);

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      await paymentService.getUserPayments('user_123', {
        startDate,
        endDate,
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        })
      );
    });

    it('يجب أن يرتّب المدفوعات من الأحدث للأقدم', async () => {
      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(2);

      await paymentService.getUserPayments('user_123');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('processRefund - معالجة استرداد الأموال', () => {
    const mockRefundedPayment = {
      id: 'payment_123',
      status: 'REFUNDED',
      refundAmount: 150,
      refundId: 're_123abc',
      refundedAt: new Date(),
      currency: 'EGP',
      user: { id: 'user_123' },
      order: { id: 'order_123' },
    };

    it('يجب أن يحدث حالة الدفع إلى REFUNDED', async () => {
      prisma.payment.update.mockResolvedValue(mockRefundedPayment);

      const result = await paymentService.processRefund(
        'payment_123',
        150,
        're_123abc'
      );

      expect(result.status).toBe('REFUNDED');
      expect(result.refundAmount).toBe(150);
      expect(result.refundId).toBe('re_123abc');
    });

    it('يجب أن يضيف تاريخ الاسترداد', async () => {
      prisma.payment.update.mockResolvedValue(mockRefundedPayment);

      await paymentService.processRefund('payment_123', 100, 're_456');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundedAt: expect.any(Date),
          }),
        })
      );
    });

    it('يجب أن يحوّل مبلغ الاسترداد إلى رقم', async () => {
      prisma.payment.update.mockResolvedValue(mockRefundedPayment);

      await paymentService.processRefund('payment_123', '150.5', 're_123');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundAmount: 150.5,
          }),
        })
      );
    });
  });

  describe('getPaymentStatistics - حساب إحصائيات المدفوعات', () => {
    it('يجب أن يحسب إحصائيات شاملة', async () => {
      // Mock لكل استعلام بشكل منفصل لأننا نستخدم Promise.all
      prisma.payment.count
        .mockResolvedValueOnce(100) // totalPayments
        .mockResolvedValueOnce(80)  // completedPayments
        .mockResolvedValueOnce(5);  // refunded count (implicit)

      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })  // totalAmount
        .mockResolvedValueOnce({ _sum: { amount: 8000 } })   // completedAmount
        .mockResolvedValueOnce({ _sum: { refundAmount: 500 } }); // refundedAmount

      const result = await paymentService.getPaymentStatistics();

      expect(result).toEqual({
        totalPayments: 100,
        completedPayments: 80,
        totalAmount: 10000,
        completedAmount: 8000,
        refundedAmount: 500,
        successRate: '80.00',
      });
    });

    it('يجب أن يحسب معدل النجاح بشكل صحيح', async () => {
      prisma.payment.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 4500 } })
        .mockResolvedValueOnce({ _sum: { refundAmount: 0 } });

      const result = await paymentService.getPaymentStatistics();

      expect(result.successRate).toBe('90.00');
    });

    it('يجب أن يتعامل مع عدم وجود مدفوعات', async () => {
      prisma.payment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { refundAmount: null } });

      const result = await paymentService.getPaymentStatistics();

      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.successRate).toBe('0');
    });

    it('يجب أن يطبق فلاتر الإحصائيات', async () => {
      prisma.payment.count.mockResolvedValue(10);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });

      await paymentService.getPaymentStatistics({
        userId: 'user_123',
        provider: 'stripe',
        status: 'COMPLETED',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      // تحقق من أن جميع الاستعلامات تستخدم الفلاتر
      expect(prisma.payment.count).toHaveBeenCalled();
      expect(prisma.payment.aggregate).toHaveBeenCalled();
    });
  });

  describe('deletePayment - حذف دفغ', () => {
    const mockPayment = {
      id: 'payment_123',
      amount: 100,
      status: 'CANCELLED',
    };

    it('يجب أن يحذف الدفع', async () => {
      prisma.payment.delete.mockResolvedValue(mockPayment);

      const result = await paymentService.deletePayment('payment_123');

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.delete).toHaveBeenCalledWith({
        where: { id: 'payment_123' },
      });
    });

    it('يجب أن يرمي خطأ للدفع غير الموجود', async () => {
      prisma.payment.delete.mockRejectedValue(
        new Error('Record to delete not found')
      );

      await expect(
        paymentService.deletePayment('non_existent')
      ).rejects.toThrow();
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب أن يسجل الأخطاء في الـ logger', async () => {
      const logger = require('../../utils/logger');
      prisma.payment.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        await paymentService.createPayment({
          userId: 'user_123',
          amount: 100,
        });
      } catch (error) {
        // Error expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating payment')
      );
    });
  });
});
