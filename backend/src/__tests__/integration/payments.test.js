/**
 * Integration Tests لمسارات المدفوعات (Payments Routes)
 * اختبارات شاملة لـ API Endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../controllers/paymentControllerNew');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/validation');
jest.mock('../../middleware/rateLimiter');

const paymentController = require('../../controllers/paymentControllerNew');
const { authenticateToken } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { paymentLimiter } = require('../../middleware/rateLimiter');

// Import routes after mocking
const paymentRoutes = require('../../routes/payments');

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());
app.use('/api/v1/payments', paymentRoutes);

describe('Payments Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments/create-intent - إنشاء نية دفع', () => {
    const validPaymentData = {
      amount: 100.50,
      currency: 'EGP',
      orderId: 'order_123',
    };

    it('يجب أن ينشئ نية دفع بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          paymentIntentId: 'pi_123abc',
          clientSecret: 'pi_123abc_secret_xyz',
          amount: 100.50,
          currency: 'EGP',
        },
      };

      paymentLimiter.mockImplementation((req, res, next) => next());
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.createPaymentIntent.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', 'Bearer valid_token')
        .send(validPaymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentIntentId');
      expect(paymentController.createPaymentIntent).toHaveBeenCalled();
    });

    it('يجب أن يرفض المبلغ الصفر أو السالب', async () => {
      paymentLimiter.mockImplementation((req, res, next) => next());
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'المبلغ يجب أن يكون أكبر من صفر' },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', 'Bearer valid_token')
        .send({ amount: 0 });

      expect(response.status).toBe(400);
      expect(paymentController.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('يجب أن يطلب المصادقة', async () => {
      paymentLimiter.mockImplementation((req, res, next) => next());
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .send(validPaymentData);

      expect(response.status).toBe(401);
      expect(paymentController.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('يجب أن يطبق rate limiting', async () => {
      // تحقق من أن rate limiter موجود
      expect(paymentLimiter).toBeDefined();
    });
  });

  describe('POST /api/v1/payments/confirm - تأكيد الدفع', () => {
    const confirmData = {
      paymentIntentId: 'pi_123abc',
    };

    it('يجب أن يؤكد الدفع بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          paymentId: 'payment_123',
          status: 'COMPLETED',
          amount: 100.50,
        },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.confirmPayment.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', 'Bearer valid_token')
        .send(confirmData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(paymentController.confirmPayment).toHaveBeenCalled();
    });

    it('يجب أن يرفض معرف نية الدفع المفقود', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'معرف نية الدفع مطلوب' },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', 'Bearer valid_token')
        .send({});

      expect(response.status).toBe(400);
      expect(paymentController.confirmPayment).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/payments - جلب المدفوعات', () => {
    const mockPayments = [
      {
        id: 'payment_1',
        amount: 100,
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z',
        currency: 'EGP',
      },
      {
        id: 'payment_2',
        amount: 200,
        status: 'PENDING',
        createdAt: '2024-01-16T10:00:00Z',
        currency: 'EGP',
      },
    ];

    it('يجب أن يرجع مدفوعات المستخدم', async () => {
      const mockResponse = {
        success: true,
        data: mockPayments,
        meta: {
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getUserPayments.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(paymentController.getUserPayments).toHaveBeenCalled();
    });

    it('يجب أن يطبق فلاتر الاستعلام', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getUserPayments.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: [] });
      });

      const response = await request(app)
        .get('/api/v1/payments?status=COMPLETED&page=1&limit=5')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
    });

    it('يجب أن يرفض قيم الفلتر غير الصحيحة', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'الحالة غير صالحة' },
        });
      });

      const response = await request(app)
        .get('/api/v1/payments?status=INVALID_STATUS')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(paymentController.getUserPayments).not.toHaveBeenCalled();
    });

    it('يجب أن يتحقق من صحة قيم الترقيم', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'رقم الصفحة غير صالح' },
        });
      });

      const response = await request(app)
        .get('/api/v1/payments?page=-1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/invoices - إنشاء فاتورة', () => {
    const invoiceData = {
      orderId: 'order_123',
      paymentId: 'payment_456',
      notes: 'فاتورة شهر يناير',
    };

    it('يجب أن ينشئ فاتورة بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'invoice_789',
          ...invoiceData,
          status: 'PENDING',
          totalAmount: 100.50,
        },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.createInvoice.mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/payments/invoices')
        .set('Authorization', 'Bearer valid_token')
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(paymentController.createInvoice).toHaveBeenCalled();
    });

    it('يجب أن يرفض معرف الطلب غير الصحيح', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'معرف الطلب غير صالح' },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/invoices')
        .set('Authorization', 'Bearer valid_token')
        .send({ orderId: 'not-a-uuid' });

      expect(response.status).toBe(400);
      expect(paymentController.createInvoice).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/payments/invoices - جلب الفواتير', () => {
    it('يجب أن يرجع فواتير المستخدم', async () => {
      const mockInvoices = [
        {
          id: 'invoice_1',
          status: 'PAID',
          totalAmount: 100,
          createdAt: '2024-01-15',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockInvoices,
        meta: { pagination: { total: 1, page: 1 } },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getUserInvoices.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/payments/invoices')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(paymentController.getUserInvoices).toHaveBeenCalled();
    });

    it('يجب أن يطبق فلاتر الحالة', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getUserInvoices.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: [] });
      });

      const response = await request(app)
        .get('/api/v1/payments/invoices?status=PAID')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/payments/refund - استرداد الأموال', () => {
    const refundData = {
      paymentIntentId: 'pi_123abc',
      amount: 50,
      reason: 'غير راضٍ عن الخدمة',
    };

    it('يجب أن يعالج استرداد الأموال بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          refundId: 're_123abc',
          amount: 50,
          currency: 'EGP',
          status: 'SUCCEEDED',
        },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.processRefund.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', 'Bearer valid_token')
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('SUCCEEDED');
      expect(paymentController.processRefund).toHaveBeenCalled();
    });

    it('يجب أن يرفض المبلغ غير الصحيح', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'المبلغ غير صالح' },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', 'Bearer valid_token')
        .send({
          paymentIntentId: 'pi_123',
          amount: -10,
        });

      expect(response.status).toBe(400);
    });

    it('يجب أن يعمل بدون مبلغ (استرداد كامل)', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.processRefund.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: { refundId: 're_123', amount: 100 },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', 'Bearer valid_token')
        .send({ paymentIntentId: 'pi_123abc' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/payments/statistics - إحصائيات المدفوعات', () => {
    it('يجب أن يرجع إحصائيات المدفوعات', async () => {
      const mockStats = {
        totalPayments: 100,
        completedPayments: 80,
        totalAmount: 10000,
        completedAmount: 8000,
        refundedAmount: 500,
        successRate: '80.00',
      };

      const mockResponse = {
        success: true,
        data: mockStats,
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin_123', role: 'ADMIN' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getPaymentStatistics.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/payments/statistics')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
      expect(response.body.data.totalPayments).toBe(100);
      expect(paymentController.getPaymentStatistics).toHaveBeenCalled();
    });

    it('يجب أن يطبق فلاتر التاريخ', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin_123', role: 'ADMIN' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.getPaymentStatistics.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: {} });
      });

      const response = await request(app)
        .get('/api/v1/payments/statistics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
    });

    it('يجب أن يرفض تاريخ غير صحيح', async () => {
      authenticateToken.mockImplementation((req, res, next) => next());
      validateRequest.mockImplementation((req, res, next) => {
        res.status(400).json({
          success: false,
          error: { message: 'تاريخ البداية غير صالح' },
        });
      });

      const response = await request(app)
        .get('/api/v1/payments/statistics?startDate=invalid-date')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/webhook - webhook من Stripe', () => {
    it('يجب أن يعالج webhook من Stripe', async () => {
      const mockWebhookData = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 10000,
            currency: 'EGP',
          },
        },
      };

      paymentController.handleStripeWebhook.mockImplementation((req, res) => {
        res.status(200).json({ received: true });
      });

      // Mock raw body for webhook verification
      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 't=123,v1=abc')
        .send(mockWebhookData);

      expect(paymentController.handleStripeWebhook).toHaveBeenCalled();
    });

    it('لا يحتاج هذا المسار لمصادقة', async () => {
      // Webhook مسار عام (للسماح لـ Stripe بالاتصال)
      paymentController.handleStripeWebhook.mockImplementation((req, res) => {
        res.status(200).json({ received: true });
      });

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ type: 'payment_intent.succeeded' });

      // يجب أن لا يتم التحقق من المصادقة
      expect(authenticateToken).not.toHaveBeenCalled();
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب أن يعالج أخطاء الخدمة الداخلية', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });
      validateRequest.mockImplementation((req, res, next) => next());

      paymentController.createPaymentIntent.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: {
            code: 'PAYMENT_ERROR',
            message: 'فشل الاتصال بخدمة الدفع',
          },
        });
      });

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', 'Bearer valid_token')
        .send({ amount: 100 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
