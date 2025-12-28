const paymentService = require('../../paymentService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('PaymentService', () => {
  let testUser, testOrder;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'payment@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' }
    });
    testOrder = await prisma.order.create({
      data: { userId: testUser.id, totalAmount: 100, status: 'PENDING' }
    });
  });

  afterAll(async () => {
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'payment@test.com' } });
    await prisma.$disconnect();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const payment = await paymentService.createPayment({
        userId: testUser.id,
        orderId: testOrder.id,
        amount: 100,
        currency: 'EGP',
        provider: 'STRIPE',
        paymentIntentId: 'pi_test_123'
      });

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(100);
      expect(payment.status).toBe('PENDING');
    });

    it('should throw error for invalid amount', async () => {
      await expect(paymentService.createPayment({
        userId: testUser.id,
        amount: -100
      })).rejects.toThrow();
    });

    it('should throw error for missing userId', async () => {
      await expect(paymentService.createPayment({
        amount: 100
      })).rejects.toThrow();
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const payment = await paymentService.createPayment({
        userId: testUser.id,
        amount: 50,
        paymentIntentId: 'pi_test_456'
      });

      const updated = await paymentService.updatePaymentStatus(payment.id, 'COMPLETED');
      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('findPaymentByIntentId', () => {
    it('should find payment by intent id', async () => {
      const created = await paymentService.createPayment({
        userId: testUser.id,
        amount: 75,
        paymentIntentId: 'pi_test_789'
      });

      const found = await paymentService.findPaymentByIntentId('pi_test_789');
      expect(found.id).toBe(created.id);
    });

    it('should return null for non-existent intent', async () => {
      const found = await paymentService.findPaymentByIntentId('pi_nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('getUserPayments', () => {
    it('should return user payments with pagination', async () => {
      const result = await paymentService.getUserPayments(testUser.id, { page: 1, limit: 10 });
      expect(result).toHaveProperty('payments');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.payments)).toBe(true);
    });

    it('should filter by status', async () => {
      await paymentService.createPayment({
        userId: testUser.id,
        amount: 25,
        paymentIntentId: 'pi_test_completed'
      });

      const result = await paymentService.getUserPayments(testUser.id, { status: 'PENDING' });
      expect(result.payments.every(p => p.status === 'PENDING')).toBe(true);
    });
  });

  describe('processRefund', () => {
    it('should process refund', async () => {
      const payment = await paymentService.createPayment({
        userId: testUser.id,
        amount: 100,
        paymentIntentId: 'pi_test_refund'
      });

      await paymentService.updatePaymentStatus(payment.id, 'COMPLETED');
      const refunded = await paymentService.processRefund(payment.id, 100, 're_test_123');

      expect(refunded.status).toBe('REFUNDED');
      expect(refunded.refundAmount).toBe(100);
      expect(refunded.refundedAt).toBeDefined();
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return payment statistics', async () => {
      const stats = await paymentService.getPaymentStatistics({ userId: testUser.id });
      expect(stats).toHaveProperty('totalPayments');
      expect(stats).toHaveProperty('completedPayments');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('successRate');
    });
  });
});
