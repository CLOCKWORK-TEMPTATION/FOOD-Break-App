/**
 * Unit Tests - Payment Controller
 * اختبارات وحدة متحكم المدفوعات
 */

jest.mock('stripe');
jest.mock('../../../src/utils/logger');

const paymentController = require('../../../src/controllers/paymentController');
const stripe = require('stripe');

describe('Payment Controller', () => {
  let req, res, next, mockPrisma, mockStripe;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key) // Mock translation function
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Get the mocked Prisma client
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();

    // Setup Stripe mock
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        confirm: jest.fn(),
        retrieve: jest.fn()
      },
      refunds: {
        create: jest.fn()
      }
    };
    stripe.mockReturnValue(mockStripe);

    jest.clearAllMocks();
  });

  // ==========================================
  // Create Payment Intent Tests
  // ==========================================
  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      req.body = { amount: 10000, currency: 'egp' };

      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'egp',
        status: 'requires_payment_method'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-123',
        userId: 'user-123',
        paymentIntentId: 'pi_test123',
        amount: 100,
        currency: 'EGP',
        status: 'PENDING'
      });

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'egp',
        metadata: { userId: 'user-123' }
      });
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'pi_test123',
          clientSecret: 'pi_test123_secret'
        })
      });
    });

    it('should reject invalid amount (zero)', async () => {
      req.body = { amount: 0 };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.invalidAmount'
      });
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should reject negative amount', async () => {
      req.body = { amount: -1000 };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.invalidAmount'
      });
    });

    it('should use default currency when not provided', async () => {
      req.body = { amount: 5000 };

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'secret',
        amount: 5000,
        currency: 'egp',
        status: 'requires_payment_method'
      });
      mockPrisma.payment.create.mockResolvedValue({});

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'egp' })
      );
    });

    it('should handle Stripe errors gracefully', async () => {
      req.body = { amount: 10000 };
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe error'));

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.paymentIntentCreateFailed'
      });
    });
  });

  // ==========================================
  // Confirm Payment Tests
  // ==========================================
  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      req.body = {
        paymentMethodId: 'pm_test123',
        paymentIntentId: 'pi_test123'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        client_secret: 'secret'
      });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123', {
        payment_method: 'pm_test123'
      });
      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          paymentMethodId: 'pm_test123'
        })
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentIntentId: 'pi_test123',
          status: 'succeeded'
        })
      });
    });

    it('should reject confirmation without payment method', async () => {
      req.body = { paymentIntentId: 'pi_test123' };

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.paymentInfoIncomplete'
      });
    });

    it('should reject confirmation without payment intent ID', async () => {
      req.body = { paymentMethodId: 'pm_test123' };

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle payment not found in database', async () => {
      req.body = {
        paymentMethodId: 'pm_test123',
        paymentIntentId: 'pi_test123'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded'
      });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 0 });

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.paymentInfoNotFound'
      });
    });

    it('should handle requires_action status', async () => {
      req.body = {
        paymentMethodId: 'pm_test123',
        paymentIntentId: 'pi_test123'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_action',
        client_secret: 'secret'
      });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'requires_action',
          requiresAction: true
        })
      });
    });

    it('should update payment to FAILED on error', async () => {
      req.body = {
        paymentMethodId: 'pm_test123',
        paymentIntentId: 'pi_test123'
      };

      mockStripe.paymentIntents.confirm.mockRejectedValue(new Error('Card declined'));

      await paymentController.confirmPayment(req, res, next);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Card declined'
        })
      });
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Get User Invoices Tests
  // ==========================================
  describe('getUserInvoices', () => {
    it('should get user invoices successfully', async () => {
      req.query = { page: '1', limit: '10' };

      const mockInvoices = [
        {
          id: 'inv-1',
          orderId: 'order-1',
          amount: 100,
          currency: 'EGP',
          status: 'PAID',
          createdAt: new Date(),
          pdfUrl: 'https://example.com/invoice1.pdf',
          order: { id: 'order-1', status: 'DELIVERED' }
        },
        {
          id: 'inv-2',
          orderId: 'order-2',
          amount: 200,
          currency: 'EGP',
          status: 'PENDING',
          createdAt: new Date(),
          pdfUrl: null,
          order: { id: 'order-2', status: 'PENDING' }
        }
      ];

      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrisma.invoice.count.mockResolvedValue(2);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { order: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          invoices: expect.arrayContaining([
            expect.objectContaining({ id: 'inv-1' }),
            expect.objectContaining({ id: 'inv-2' })
          ]),
          pagination: expect.objectContaining({
            total: 2,
            page: 1,
            pages: 1
          })
        })
      });
    });

    it('should filter invoices by status', async () => {
      req.query = { status: 'PAID' };

      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', status: 'PAID' }
        })
      );
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: '2', limit: '5' };

      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(15);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          pagination: expect.objectContaining({
            total: 15,
            page: 2,
            pages: 3
          })
        })
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.invoice.findMany.mockRejectedValue(new Error('Database error'));

      await paymentController.getUserInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.invoicesFetchFailed'
      });
    });
  });

  // ==========================================
  // Process Refund Tests
  // ==========================================
  describe('processRefund', () => {
    it('should process full refund successfully', async () => {
      req.body = { paymentIntentId: 'pi_test123' };

      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        paymentIntentId: 'pi_test123',
        amount: 100,
        status: 'COMPLETED'
      };

      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue({
        id: 'ref_test123',
        amount: 10000,
        currency: 'egp',
        status: 'succeeded'
      });
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED'
      });

      await paymentController.processRefund(req, res, next);

      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123', userId: 'user-123' }
      });
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 10000,
        reason: 'requested_by_customer'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          refundId: 'ref_test123',
          amount: 100
        })
      });
    });

    it('should process partial refund', async () => {
      req.body = { paymentIntentId: 'pi_test123', amount: 5000 };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-123',
        userId: 'user-123',
        status: 'COMPLETED',
        amount: 100
      });
      mockStripe.refunds.create.mockResolvedValue({
        id: 'ref_test123',
        amount: 5000,
        currency: 'egp',
        status: 'succeeded'
      });
      mockPrisma.payment.update.mockResolvedValue({});

      await paymentController.processRefund(req, res, next);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5000 })
      );
    });

    it('should reject refund without payment intent ID', async () => {
      req.body = {};

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.paymentIntentIdRequired'
      });
    });

    it('should reject refund for non-existent payment', async () => {
      req.body = { paymentIntentId: 'pi_nonexistent' };
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.paymentNotFound'
      });
    });

    it('should reject refund for incomplete payment', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-123',
        userId: 'user-123',
        status: 'PENDING',
        amount: 100
      });

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.cannotRefundIncompletePayment'
      });
    });

    it('should handle Stripe refund errors', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-123',
        userId: 'user-123',
        status: 'COMPLETED',
        amount: 100
      });
      mockStripe.refunds.create.mockRejectedValue(new Error('Refund failed'));

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'payments.refundProcessFailed'
      });
    });
  });
});
