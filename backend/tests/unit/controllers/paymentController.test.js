/**
 * Unit Tests - Payment Controller
 * اختبارات وحدة متحكم المدفوعات
 */

const paymentController = require('../../../src/controllers/paymentController');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../src/utils/logger');

jest.mock('@prisma/client');
jest.mock('../../../src/utils/logger');
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn()
    },
    refunds: {
      create: jest.fn()
    }
  }));
});

describe('Payment Controller', () => {
  let req, res, next, mockPrisma, mockStripe;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' },
      __: (key) => key
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    mockPrisma = {
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn()
      },
      invoice: {
        findMany: jest.fn(),
        count: jest.fn()
      },
      order: {
        findMany: jest.fn()
      }
    };

    const PrismaClientMock = jest.fn(() => mockPrisma);
    PrismaClientMock.prototype = mockPrisma;
    require('@prisma/client').PrismaClient = PrismaClientMock;

    const stripe = require('stripe');
    mockStripe = stripe();
  });

  // ==========================================
  // createPaymentIntent Tests
  // ==========================================
  describe('createPaymentIntent', () => {
    const validPaymentData = {
      amount: 5000, // 50.00 in cents
      currency: 'egp'
    };

    it('should create payment intent successfully', async () => {
      req.body = validPaymentData;
      const mockPaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'egp',
        status: 'requires_payment_method',
        client_secret: 'secret_123'
      };
      const mockPayment = {
        id: 'pay-123',
        userId: 'user-123',
        paymentIntentId: 'pi_123',
        amount: 50,
        currency: 'EGP',
        status: 'PENDING'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'pi_123',
            clientSecret: 'secret_123',
            amount: 5000
          })
        })
      );
    });

    it('should return 400 for invalid amount (negative)', async () => {
      req.body = { amount: -100, currency: 'egp' };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 for zero amount', async () => {
      req.body = { amount: 0, currency: 'egp' };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when amount is missing', async () => {
      req.body = { currency: 'egp' };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should use default currency EGP when not provided', async () => {
      req.body = { amount: 5000 };
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-123' });

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'egp'
        })
      );
    });

    it('should convert amount from dollars to cents correctly', async () => {
      req.body = { amount: 5000, currency: 'egp' };
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123', amount: 5000 });
      mockPrisma.payment.create.mockImplementation(({ data }) => {
        expect(data.amount).toBe(50); // Should be stored as 50.00
        return Promise.resolve({ id: 'pay-123' });
      });

      await paymentController.createPaymentIntent(req, res, next);
    });

    it('should include userId in payment intent metadata', async () => {
      req.body = validPaymentData;
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-123' });

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123'
          })
        })
      );
    });

    it('should save payment record to database', async () => {
      req.body = validPaymentData;
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123', amount: 5000 });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-123' });

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            paymentIntentId: 'pi_123',
            status: 'PENDING',
            provider: 'STRIPE'
          })
        })
      );
    });

    it('should handle Stripe API errors', async () => {
      req.body = validPaymentData;
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe API error'));

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should handle database errors when saving payment', async () => {
      req.body = validPaymentData;
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });
      mockPrisma.payment.create.mockRejectedValue(new Error('Database error'));

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should accept different currencies', async () => {
      req.body = { amount: 1000, currency: 'USD' };
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123', currency: 'usd' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-123', currency: 'USD' });

      await paymentController.createPaymentIntent(req, res, next);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd'
        })
      );
    });

    it('should log successful payment intent creation', async () => {
      req.body = validPaymentData;
      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-123' });

      await paymentController.createPaymentIntent(req, res, next);

      expect(logger.info).toHaveBeenCalled();
    });
  });

  // ==========================================
  // confirmPayment Tests
  // ==========================================
  describe('confirmPayment', () => {
    const confirmData = {
      paymentMethodId: 'pm_123',
      paymentIntentId: 'pi_123'
    };

    it('should confirm payment successfully', async () => {
      req.body = confirmData;
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded'
      };
      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paymentIntentId: 'pi_123',
            status: 'succeeded'
          })
        })
      );
    });

    it('should return 400 when paymentMethodId is missing', async () => {
      req.body = { paymentIntentId: 'pi_123' };

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when paymentIntentId is missing', async () => {
      req.body = { paymentMethodId: 'pm_123' };

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when payment record not found', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockResolvedValue({ id: 'pi_123' });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 0 });

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should update payment status to COMPLETED on success', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockResolvedValue({ id: 'pi_123', status: 'succeeded' });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { paymentIntentId: 'pi_123' },
          data: expect.objectContaining({
            status: 'COMPLETED'
          })
        })
      );
    });

    it('should update payment status to FAILED on failure', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockResolvedValue({ id: 'pi_123', status: 'failed' });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED'
          })
        })
      );
    });

    it('should set requiresAction when payment requires additional action', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_123',
        status: 'requires_action',
        client_secret: 'secret_123'
      });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requiresAction: true
          })
        })
      );
    });

    it('should handle Stripe confirmation errors', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockRejectedValue(new Error('Confirmation failed'));

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should update payment with error message on failure', async () => {
      req.body = confirmData;
      const error = new Error('Payment failed');
      mockStripe.paymentIntents.confirm.mockRejectedValue(error);
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: error.message
          })
        })
      );
    });

    it('should save payment method ID', async () => {
      req.body = confirmData;
      mockStripe.paymentIntents.confirm.mockResolvedValue({ id: 'pi_123', status: 'succeeded' });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentController.confirmPayment(req, res, next);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethodId: 'pm_123'
          })
        })
      );
    });
  });

  // ==========================================
  // getUserInvoices Tests
  // ==========================================
  describe('getUserInvoices', () => {
    it('should return user invoices with pagination', async () => {
      req.query = { page: 1, limit: 10 };
      const mockInvoices = [
        {
          id: 'inv-1',
          orderId: 'order-1',
          amount: 100,
          currency: 'EGP',
          status: 'PAID',
          createdAt: new Date(),
          pdfUrl: 'https://example.com/inv1.pdf',
          order: { id: 'order-1', status: 'DELIVERED' }
        }
      ];
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrisma.invoice.count.mockResolvedValue(1);

      await paymentController.getUserInvoices(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            invoices: expect.any(Array),
            pagination: expect.objectContaining({
              total: 1,
              page: 1,
              pages: 1
            })
          })
        })
      );
    });

    it('should filter invoices by status when provided', async () => {
      req.query = { status: 'PAID', page: 1, limit: 10 };
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            status: 'PAID'
          })
        })
      );
    });

    it('should include order information in response', async () => {
      req.query = {};
      const mockInvoices = [
        {
          id: 'inv-1',
          orderId: 'order-1',
          amount: 100,
          currency: 'EGP',
          status: 'PAID',
          createdAt: new Date(),
          pdfUrl: 'https://example.com/inv1.pdf',
          order: { id: 'order-1', status: 'DELIVERED' }
        }
      ];
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrisma.invoice.count.mockResolvedValue(1);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            order: expect.any(Object)
          })
        })
      );
    });

    it('should use default pagination values when not provided', async () => {
      req.query = {};
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      req.query = { page: 2, limit: 5 };
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(12);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5
        })
      );
    });

    it('should handle database errors when fetching invoices', async () => {
      req.query = {};
      mockPrisma.invoice.findMany.mockRejectedValue(new Error('Database error'));

      await paymentController.getUserInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should order invoices by creation date descending', async () => {
      req.query = {};
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });

    it('should only fetch invoices for authenticated user', async () => {
      req.query = {};
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await paymentController.getUserInvoices(req, res, next);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123'
          })
        })
      );
    });
  });

  // ==========================================
  // processRefund Tests
  // ==========================================
  describe('processRefund', () => {
    const refundData = {
      paymentIntentId: 'pi_123',
      amount: 5000
    };

    it('should process full refund successfully', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = {
        id: 'pay-123',
        paymentIntentId: 'pi_123',
        userId: 'user-123',
        amount: 50,
        status: 'COMPLETED'
      };
      const mockRefund = {
        id: 're_123',
        amount: 5000,
        currency: 'egp',
        status: 'succeeded'
      };

      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });

      await paymentController.processRefund(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            refundId: 're_123',
            amount: 50,
            status: 'succeeded'
          })
        })
      );
    });

    it('should process partial refund successfully', async () => {
      req.body = refundData;
      const mockPayment = {
        id: 'pay-123',
        paymentIntentId: 'pi_123',
        userId: 'user-123',
        amount: 100,
        status: 'COMPLETED'
      };
      const mockRefund = {
        id: 're_123',
        amount: 5000,
        currency: 'egp',
        status: 'succeeded'
      };

      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockResolvedValue({});

      await paymentController.processRefund(req, res, next);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000
        })
      );
    });

    it('should return 400 when paymentIntentId is missing', async () => {
      req.body = {};

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when payment not found', async () => {
      req.body = { paymentIntentId: 'non-existent' };
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when payment is not completed', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = {
        id: 'pay-123',
        status: 'PENDING'
      };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should verify payment belongs to authenticated user', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await paymentController.processRefund(req, res, next);

      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123'
          })
        })
      );
    });

    it('should update payment status to REFUNDED', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = {
        id: 'pay-123',
        amount: 50,
        status: 'COMPLETED'
      };
      const mockRefund = { id: 're_123', amount: 5000, currency: 'egp' };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockResolvedValue({});

      await paymentController.processRefund(req, res, next);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REFUNDED',
            refundId: 're_123',
            refundAmount: 50
          })
        })
      );
    });

    it('should set refundedAt timestamp', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = { id: 'pay-123', status: 'COMPLETED' };
      const mockRefund = { id: 're_123', amount: 5000 };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockImplementation(({ data }) => {
        expect(data.refundedAt).toBeInstanceOf(Date);
        return Promise.resolve({});
      });

      await paymentController.processRefund(req, res, next);
    });

    it('should handle Stripe refund errors', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = { id: 'pay-123', status: 'COMPLETED' };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockRejectedValue(new Error('Refund failed'));

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle database errors when updating payment', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = { id: 'pay-123', status: 'COMPLETED' };
      const mockRefund = { id: 're_123', amount: 5000 };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockRejectedValue(new Error('Database error'));

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use reason requested_by_customer for refund', async () => {
      req.body = { paymentIntentId: 'pi_123' };
      const mockPayment = { id: 'pay-123', status: 'COMPLETED' };
      const mockRefund = { id: 're_123', amount: 5000 };
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockPrisma.payment.update.mockResolvedValue({});

      await paymentController.processRefund(req, res, next);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'requested_by_customer'
        })
      );
    });
  });
});
