/**
 * Tests for Payment Model
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');

describe('Payment Model', () => {
  let mockPrisma;
  const Payment = require('../Payment');

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        userId: 'user123',
        orderId: 'order123',
        amount: 500,
        currency: 'EGP',
        provider: 'STRIPE',
        paymentIntentId: 'pi_123'
      };

      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment123',
        ...paymentData,
        status: 'PENDING',
        createdAt: new Date()
      });

      const payment = await Payment.create(paymentData);

      expect(payment).toHaveProperty('id');
      expect(payment.amount).toBe(500);
      expect(payment.provider).toBe('STRIPE');
      expect(payment.status).toBe('PENDING');
    });
  });

  describe('findById', () => {
    it('should find payment by ID', async () => {
      const paymentId = 'payment123';

      mockPrisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        amount: 500,
        status: 'COMPLETED'
      });

      const payment = await Payment.findById(paymentId);

      expect(payment.id).toBe(paymentId);
    });

    it('should return null if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      const payment = await Payment.findById('invalid_id');

      expect(payment).toBeNull();
    });
  });

  describe('findByIntentId', () => {
    it('should find payment by payment intent ID', async () => {
      const intentId = 'pi_123';

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        paymentIntentId: intentId,
        amount: 500
      });

      const payment = await Payment.findByIntentId(intentId);

      expect(payment.paymentIntentId).toBe(intentId);
    });
  });

  describe('findByUser', () => {
    it('should find all payments for user', async () => {
      const userId = 'user123';

      mockPrisma.payment.findMany.mockResolvedValue([
        { id: 'payment1', userId, amount: 500 },
        { id: 'payment2', userId, amount: 300 }
      ]);

      const payments = await Payment.findByUser(userId);

      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBe(2);
    });

    it('should filter by status', async () => {
      const userId = 'user123';
      const status = 'COMPLETED';

      mockPrisma.payment.findMany.mockResolvedValue([
        { id: 'payment1', userId, status, amount: 500 }
      ]);

      const payments = await Payment.findByUser(userId, { status });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            status
          })
        })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      const paymentId = 'payment123';
      const newStatus = 'COMPLETED';

      mockPrisma.payment.update.mockResolvedValue({
        id: paymentId,
        status: newStatus
      });

      const updated = await Payment.updateStatus(paymentId, newStatus);

      expect(updated.status).toBe(newStatus);
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const paymentId = 'payment123';
      const refundAmount = 250;
      const refundId = 'refund_123';

      mockPrisma.payment.update.mockResolvedValue({
        id: paymentId,
        status: 'REFUNDED',
        refundAmount,
        refundId
      });

      const refunded = await Payment.processRefund(
        paymentId,
        refundAmount,
        refundId
      );

      expect(refunded.status).toBe('REFUNDED');
      expect(refunded.refundAmount).toBe(refundAmount);
    });
  });

  describe('isCompleted', () => {
    it('should return true if payment is completed', () => {
      const completedPayment = { status: 'COMPLETED' };

      expect(Payment.isCompleted(completedPayment)).toBe(true);
    });

    it('should return false if payment is not completed', () => {
      const pendingPayment = { status: 'PENDING' };

      expect(Payment.isCompleted(pendingPayment)).toBe(false);
    });
  });

  describe('isRefunded', () => {
    it('should return true if payment is refunded', () => {
      const refundedPayment = { status: 'REFUNDED' };

      expect(Payment.isRefunded(refundedPayment)).toBe(true);
    });

    it('should return false if payment is not refunded', () => {
      const completedPayment = { status: 'COMPLETED' };

      expect(Payment.isRefunded(completedPayment)).toBe(false);
    });
  });

  describe('canRefund', () => {
    it('should return true if payment can be refunded', () => {
      const completedPayment = {
        status: 'COMPLETED',
        refundId: null
      };

      expect(Payment.canRefund(completedPayment)).toBe(true);
    });

    it('should return false if payment is not completed', () => {
      const pendingPayment = { status: 'PENDING' };

      expect(Payment.canRefund(pendingPayment)).toBe(false);
    });

    it('should return false if already refunded', () => {
      const refundedPayment = {
        status: 'REFUNDED',
        refundId: 'refund_123'
      };

      expect(Payment.canRefund(refundedPayment)).toBe(false);
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should get payments within date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrisma.payment.findMany.mockResolvedValue([
        { id: 'payment1', createdAt: new Date('2025-01-15') },
        { id: 'payment2', createdAt: new Date('2025-01-20') }
      ]);

      const payments = await Payment.getByDateRange(startDate, endDate);

      expect(Array.isArray(payments)).toBe(true);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate
            })
          })
        })
      );
    });
  });

  describe('calculateTotalAmount', () => {
    it('should calculate total amount from payments', () => {
      const payments = [
        { amount: 100 },
        { amount: 200 },
        { amount: 300 }
      ];

      const total = Payment.calculateTotalAmount(payments);

      expect(total).toBe(600);
    });

    it('should handle empty array', () => {
      const total = Payment.calculateTotalAmount([]);

      expect(total).toBe(0);
    });
  });
});
