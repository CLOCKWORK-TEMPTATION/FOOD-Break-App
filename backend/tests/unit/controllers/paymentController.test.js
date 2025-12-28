/**
 * Payment Controller Tests
 * اختبارات وحدة المدفوعات
 */

const paymentController = require('../../../src/controllers/paymentController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('../../../src/services/paymentService');
const paymentService = require('../../../src/services/paymentService');

describe('Payment Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockIntent = { id: 'pi_123', clientSecret: 'secret_123' };
      paymentService.createPaymentIntent.mockResolvedValue(mockIntent);

      req.body = { amount: 100, orderId: 'order-123' };

      await paymentController.createPaymentIntent(req, res, next);

      expect(paymentService.createPaymentIntent).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockIntent
        })
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockPayment = { id: 'pay_123', status: 'COMPLETED' };
      paymentService.confirmPayment.mockResolvedValue(mockPayment);

      req.params.paymentId = 'pay_123';

      await paymentController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPayment
        })
      );
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history', async () => {
      const mockHistory = [{ id: 'pay_1' }, { id: 'pay_2' }];
      global.mockPrisma.payment.findMany.mockResolvedValue(mockHistory);

      await paymentController.getPaymentHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockHistory
        })
      );
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      paymentService.refundPayment.mockResolvedValue({ id: 'refund_123' });

      req.params.paymentId = 'pay_123';
      req.body = { reason: 'Customer request' };

      await paymentController.refundPayment(req, res, next);

      expect(paymentService.refundPayment).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});
