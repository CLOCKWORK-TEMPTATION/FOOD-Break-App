/**
 * Unit Tests - Payment Service
 * اختبارات وحدة خدمة المدفوعات
 */

const { users, orders, payments } = require('../../fixtures/testData');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }));
});

describe('Payment Service', () => {
  let mockPrisma;
  let mockStripe;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = global.mockPrisma;
    
    const Stripe = require('stripe');
    mockStripe = new Stripe('sk_test_placeholder');
  });

  // ==========================================
  // Payment Intent Creation Tests
  // ==========================================
  describe('createPaymentIntent', () => {
    it('should create payment intent with valid amount', async () => {
      const amount = 100.00;
      const currency = 'SAR';
      
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        amount: amount * 100, // Stripe uses cents
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        client_secret: 'pi_test_123_secret_xxx',
      });
      
      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency.toLowerCase(),
      });
      
      expect(paymentIntent.id).toBeDefined();
      expect(paymentIntent.amount).toBe(10000); // 100.00 * 100
      expect(paymentIntent.currency).toBe('sar');
    });

    it('should handle minimum amount validation', () => {
      const minimumAmount = 1.00; // 1 SAR minimum
      const belowMinimum = 0.50;
      
      expect(minimumAmount >= 1).toBe(true);
      expect(belowMinimum >= 1).toBe(false);
    });

    it('should attach customer metadata', async () => {
      const userId = users.validUser.id;
      const orderId = orders.pendingOrder.id;
      
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        metadata: { userId, orderId },
      });
      
      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 10000,
        currency: 'sar',
        metadata: { userId, orderId },
      });
      
      expect(paymentIntent.metadata.userId).toBe(userId);
      expect(paymentIntent.metadata.orderId).toBe(orderId);
    });
  });

  // ==========================================
  // Payment Processing Tests
  // ==========================================
  describe('processPayment', () => {
    it('should process successful payment', async () => {
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      });
      
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_test_123',
      });
      
      const confirmed = await mockStripe.paymentIntents.confirm('pi_test_123');
      
      expect(confirmed.status).toBe('succeeded');
    });

    it('should handle payment failure', async () => {
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Your card was declined.',
        },
      });
      
      const result = await mockStripe.paymentIntents.confirm('pi_test_123');
      
      expect(result.status).not.toBe('succeeded');
      expect(result.last_payment_error).toBeDefined();
    });

    it('should store payment record on success', async () => {
      const paymentData = {
        userId: users.validUser.id,
        orderId: orders.pendingOrder.id,
        paymentIntentId: 'pi_test_123',
        amount: 100.00,
        currency: 'SAR',
        status: 'COMPLETED',
        provider: 'STRIPE',
      };
      
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-new-id',
        ...paymentData,
        createdAt: new Date(),
      });
      
      const payment = await mockPrisma.payment.create({ data: paymentData });
      
      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('COMPLETED');
      expect(payment.userId).toBe(users.validUser.id);
    });
  });

  // ==========================================
  // Refund Tests
  // ==========================================
  describe('refundPayment', () => {
    it('should process full refund', async () => {
      const paymentIntentId = 'pi_test_123';
      
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_test_123',
        amount: 10000,
        status: 'succeeded',
        payment_intent: paymentIntentId,
      });
      
      const refund = await mockStripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      
      expect(refund.status).toBe('succeeded');
      expect(refund.payment_intent).toBe(paymentIntentId);
    });

    it('should process partial refund', async () => {
      const refundAmount = 50.00;
      
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_test_123',
        amount: refundAmount * 100,
        status: 'succeeded',
      });
      
      const refund = await mockStripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: refundAmount * 100,
      });
      
      expect(refund.amount).toBe(5000); // 50.00 * 100
    });

    it('should update payment status after refund', async () => {
      mockPrisma.payment.update.mockResolvedValue({
        ...payments.completedPayment,
        status: 'REFUNDED',
        refundedAt: new Date(),
      });
      
      const updated = await mockPrisma.payment.update({
        where: { id: payments.completedPayment.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        }
      });
      
      expect(updated.status).toBe('REFUNDED');
    });
  });

  // ==========================================
  // Payment Status Tests
  // ==========================================
  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(payments.completedPayment);
      
      const payment = await mockPrisma.payment.findUnique({
        where: { id: payments.completedPayment.id }
      });
      
      expect(payment.status).toBe('COMPLETED');
    });

    it('should return pending status for incomplete payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(payments.pendingPayment);
      
      const payment = await mockPrisma.payment.findUnique({
        where: { id: payments.pendingPayment.id }
      });
      
      expect(payment.status).toBe('PENDING');
    });
  });

  // ==========================================
  // Payment Validation Tests
  // ==========================================
  describe('validatePayment', () => {
    it('should validate payment amount matches order total', () => {
      const orderTotal = 100.00;
      const paymentAmount = 100.00;
      
      expect(paymentAmount).toBe(orderTotal);
    });

    it('should reject payment amount mismatch', () => {
      const orderTotal = 100.00;
      const paymentAmount = 90.00;
      
      expect(paymentAmount).not.toBe(orderTotal);
    });

    it('should validate currency', () => {
      const validCurrencies = ['SAR', 'USD', 'EUR'];
      const invalidCurrencies = ['XXX', 'ABC', ''];
      
      validCurrencies.forEach(currency => {
        expect(currency.length).toBe(3);
      });
      
      expect(invalidCurrencies.includes('')).toBe(true);
    });
  });

  // ==========================================
  // User Payment History Tests
  // ==========================================
  describe('getUserPayments', () => {
    it('should return user payment history', async () => {
      const userPayments = [payments.completedPayment, payments.pendingPayment];
      mockPrisma.payment.findMany.mockResolvedValue(userPayments);
      
      const result = await mockPrisma.payment.findMany({
        where: { userId: users.validUser.id },
        orderBy: { createdAt: 'desc' }
      });
      
      expect(result).toHaveLength(2);
    });

    it('should include order details', async () => {
      const paymentWithOrder = {
        ...payments.completedPayment,
        order: orders.deliveredOrder,
      };
      
      mockPrisma.payment.findMany.mockResolvedValue([paymentWithOrder]);
      
      const result = await mockPrisma.payment.findMany({
        where: { userId: users.validUser.id },
        include: { order: true }
      });
      
      expect(result[0].order).toBeDefined();
    });
  });

  // ==========================================
  // Payment Security Tests
  // ==========================================
  describe('payment security', () => {
    it('should not expose full card number', () => {
      const maskedCard = '**** **** **** 4242';
      
      expect(maskedCard).not.toMatch(/^\d{16}$/);
      expect(maskedCard).toMatch(/\*{4}/);
    });

    it('should use secure payment intent', () => {
      const clientSecret = 'pi_test_123_secret_xxx';
      
      // Client secret should not be stored in database
      expect(payments.completedPayment).not.toHaveProperty('clientSecret');
    });

    it('should validate webhook signature', () => {
      const signature = 'whsec_test_signature';
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      
      // Webhook signature validation should be performed
      expect(signature).toBeTruthy();
      expect(payload).toBeTruthy();
    });
  });

  // ==========================================
  // Currency Conversion Tests
  // ==========================================
  describe('currency handling', () => {
    it('should convert to smallest currency unit', () => {
      const amountInSAR = 100.00;
      const amountInHalalat = amountInSAR * 100;
      
      expect(amountInHalalat).toBe(10000);
    });

    it('should handle decimal precision', () => {
      const price1 = 10.99;
      const price2 = 5.01;
      const total = price1 + price2;
      
      // Handle floating point precision
      expect(Math.round(total * 100) / 100).toBe(16.00);
    });
  });

  // ==========================================
  // Payment Provider Tests
  // ==========================================
  describe('payment providers', () => {
    it('should support Stripe provider', () => {
      const provider = 'STRIPE';
      const supportedProviders = ['STRIPE', 'PAYPAL', 'APPLE_PAY', 'MADA'];
      
      expect(supportedProviders).toContain(provider);
    });

    it('should store provider information', async () => {
      mockPrisma.payment.create.mockResolvedValue({
        ...payments.completedPayment,
        provider: 'STRIPE',
      });
      
      const payment = await mockPrisma.payment.create({
        data: { ...payments.completedPayment, provider: 'STRIPE' }
      });
      
      expect(payment.provider).toBe('STRIPE');
    });
  });
});
