/**
 * Tests for Payment Controller New
 */

jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn()
    },
    refunds: {
      create: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

jest.mock('@paypal/checkout-server-sdk');
jest.mock('../../services/paymentService');
jest.mock('../../services/invoiceService');
jest.mock('../../utils/logger');
jest.mock('@prisma/client');

const paymentController = require('../paymentControllerNew');
const paymentService = require('../../services/paymentService');
const invoiceService = require('../../services/invoiceService');
const { PrismaClient } = require('@prisma/client');

describe('Payment Controller New', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      order: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'USER' },
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      req.body = {
        amount: 100,
        currency: 'egp',
        orderId: 'order123',
        provider: 'STRIPE'
      };

      paymentService.createPayment = jest.fn().mockResolvedValue({
        id: 'payment123',
        amount: 100,
        currency: 'EGP'
      });

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should reject invalid amount', async () => {
      req.body = { amount: -10 };

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should handle errors gracefully', async () => {
      req.body = { amount: 100 };
      paymentService.createPayment = jest.fn().mockRejectedValue(new Error('Database error'));

      await paymentController.createPaymentIntent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      req.body = { paymentIntentId: 'pi_123' };

      paymentService.findPaymentByIntentId = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        provider: 'STRIPE',
        amount: 100,
        currency: 'EGP'
      });

      paymentService.updatePaymentStatus = jest.fn().mockResolvedValue({
        id: 'payment123',
        status: 'COMPLETED',
        amount: 100,
        currency: 'EGP'
      });

      await paymentController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should reject missing payment intent ID', async () => {
      req.body = {};

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject unauthorized access', async () => {
      req.body = { paymentIntentId: 'pi_123' };

      paymentService.findPaymentByIntentId = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'other_user',
        provider: 'STRIPE'
      });

      await paymentController.confirmPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getUserPayments', () => {
    it('should get user payments', async () => {
      req.query = { page: '1', limit: '10' };

      paymentService.getUserPayments = jest.fn().mockResolvedValue({
        payments: [{ id: 'payment1' }, { id: 'payment2' }],
        pagination: { page: 1, limit: 10, total: 2 }
      });

      await paymentController.getUserPayments(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      req.body = {
        paymentIntentId: 'pi_123',
        amount: 50,
        reason: 'requested_by_customer'
      };

      paymentService.findPaymentByIntentId = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        provider: 'STRIPE',
        status: 'COMPLETED',
        amount: 100
      });

      paymentService.processRefund = jest.fn().mockResolvedValue({
        id: 'payment123',
        status: 'REFUNDED'
      });

      await paymentController.processRefund(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should reject refund for non-completed payment', async () => {
      req.body = { paymentIntentId: 'pi_123' };

      paymentService.findPaymentByIntentId = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        provider: 'STRIPE',
        status: 'PENDING',
        amount: 100
      });

      await paymentController.processRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPaymentStatistics', () => {
    it('should get payment statistics', async () => {
      paymentService.getPaymentStatistics = jest.fn().mockResolvedValue({
        totalAmount: 1000,
        count: 10,
        averageAmount: 100
      });

      await paymentController.getPaymentStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('createInvoice', () => {
    it('should create invoice from order', async () => {
      req.body = {
        orderId: 'order123',
        notes: 'Test invoice'
      };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order123',
        userId: 'user123',
        totalAmount: 100,
        items: [{ id: 'item1', quantity: 2, price: 50 }]
      });

      invoiceService.createInvoice = jest.fn().mockResolvedValue({
        id: 'invoice123',
        invoiceNumber: 'INV-001',
        amount: 100
      });

      await paymentController.createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should reject when both orderId and paymentId are missing', async () => {
      req.body = { notes: 'Test' };

      await paymentController.createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getUserInvoices', () => {
    it('should get user invoices', async () => {
      req.query = { page: '1', limit: '10' };

      invoiceService.getUserInvoices = jest.fn().mockResolvedValue({
        invoices: [{ id: 'inv1' }, { id: 'inv2' }],
        pagination: { page: 1, limit: 10, total: 2 }
      });

      await paymentController.getUserInvoices(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });
});
