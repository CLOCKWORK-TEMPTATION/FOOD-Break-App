const request = require('supertest');
const app = require('../../app');
const paymentService = require('../../services/paymentService');
const invoiceService = require('../../services/invoiceService');
const { generateToken } = require('../../utils/auth');

// Mock الخدمات
jest.mock('../../services/paymentService');
jest.mock('../../services/invoiceService');

describe('Payment Controller Tests - اختبارات معالج الدفع', () => {
  let authToken;
  let userId;

  beforeEach(() => {
    userId = 1;
    authToken = generateToken({ id: userId, email: 'test@example.com' });
    
    // إعادة تعيين جميع المحاكيات
    jest.clearAllMocks();
  });

  describe('GET /api/payment/methods - طرق الدفع', () => {
    test('يجب أن يجلب طرق الدفع بنجاح', async () => {
      const mockMethods = [
        {
          id: 1,
          type: 'credit_card',
          lastFourDigits: '1234',
          holderName: 'أحمد محمد',
          isDefault: true
        },
        {
          id: 2,
          type: 'debit_card',
          lastFourDigits: '5678',
          holderName: 'أحمد محمد',
          isDefault: false
        }
      ];

      paymentService.getUserPaymentMethods.mockResolvedValue(mockMethods);

      const response = await request(app)
        .get('/api/payment/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('بطاقة ائتمان');
      expect(paymentService.getUserPaymentMethods).toHaveBeenCalledWith(userId);
    });

    test('يجب أن يرجع خطأ عند فشل جلب طرق الدفع', async () => {
      paymentService.getUserPaymentMethods.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payment/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_METHODS_ERROR');
    });
  });

  describe('POST /api/payment/methods - إضافة طريقة دفع', () => {
    test('يجب أن يضيف طريقة دفع جديدة بنجاح', async () => {
      const newMethod = {
        type: 'credit_card',
        cardNumber: '1234567812345678',
        expiryDate: '12/25',
        holderName: 'أحمد محمد',
        isDefault: true
      };

      const mockResult = {
        id: 3,
        type: 'credit_card',
        lastFourDigits: '5678',
        holderName: 'أحمد محمد',
        isDefault: true
      };

      paymentService.addPaymentMethod.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/payment/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(newMethod);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(3);
      expect(paymentService.addPaymentMethod).toHaveBeenCalledWith(userId, expect.objectContaining({
        type: 'credit_card',
        holderName: 'أحمد محمد'
      }));
    });

    test('يجب أن يرفض بيانات غير صحيحة', async () => {
      const invalidMethod = {
        type: 'credit_card',
        cardNumber: '123', // رقم قصير
        expiryDate: '13/25', // شهر غير صحيح
        holderName: ''
      };

      const response = await request(app)
        .post('/api/payment/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(invalidMethod);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/payment/process - معالجة الدفع', () => {
    test('يجب أن يعالج الدفع بنجاح', async () => {
      const paymentData = {
        amount: 100.50,
        paymentMethodId: 1,
        description: 'دفع طلب رقم 123'
      };

      const mockPaymentMethod = {
        id: 1,
        type: 'credit_card',
        lastFourDigits: '1234'
      };

      const mockPaymentResult = {
        success: true,
        transactionId: 'TXN-123456',
        amount: 100.50,
        status: 'completed'
      };

      const mockInvoice = {
        id: 1,
        invoiceNumber: 'INV-202412-000001',
        amount: 100.50,
        tax: 15.08,
        total: 115.58,
        status: 'paid'
      };

      paymentService.getPaymentMethod.mockResolvedValue(mockPaymentMethod);
      paymentService.processPayment.mockResolvedValue(mockPaymentResult);
      invoiceService.createInvoice.mockResolvedValue(mockInvoice);

      const response = await request(app)
        .post('/api/payment/process')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.transactionId).toBe('TXN-123456');
      expect(response.body.data.invoice.invoiceNumber).toBe('INV-202412-000001');
    });

    test('يجب أن يرفض مبلغ غير صحيح', async () => {
      const paymentData = {
        amount: -50, // مبلغ سالب
        paymentMethodId: 1,
        description: 'دفع طلب'
      };

      const response = await request(app)
        .post('/api/payment/process')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });

    test('يجب أن يرفض طريقة دفع غير موجودة', async () => {
      const paymentData = {
        amount: 100,
        paymentMethodId: 999, // معرف غير موجود
        description: 'دفع طلب'
      };

      paymentService.getPaymentMethod.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payment/process')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_METHOD_NOT_FOUND');
    });

    test('يجب أن يتعامل مع فشل الدفع', async () => {
      const paymentData = {
        amount: 100,
        paymentMethodId: 1,
        description: 'دفع طلب'
      };

      const mockPaymentMethod = {
        id: 1,
        type: 'credit_card'
      };

      const mockFailedResult = {
        success: false,
        error: 'رصيد غير كافي'
      };

      paymentService.getPaymentMethod.mockResolvedValue(mockPaymentMethod);
      paymentService.processPayment.mockResolvedValue(mockFailedResult);

      const response = await request(app)
        .post('/api/payment/process')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_FAILED');
      expect(response.body.error.message).toBe('رصيد غير كافي');
    });
  });

  describe('GET /api/payment/invoices - الفواتير', () => {
    test('يجب أن يجلب قائمة الفواتير بنجاح', async () => {
      const mockInvoices = {
        data: [
          {
            id: 1,
            orderNumber: 'INV-202412-000001',
            amount: 100,
            tax: 15,
            total: 115,
            status: 'paid',
            createdAt: '2024-12-28T10:00:00Z',
            paidAt: '2024-12-28T10:05:00Z',
            items: [
              {
                id: 1,
                name: 'برجر لحم',
                quantity: 2,
                price: 50,
                total: 100
              }
            ]
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      };

      invoiceService.getUserInvoices.mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/payment/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].statusText).toBe('مدفوعة');
      expect(invoiceService.getUserInvoices).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 10,
        status: undefined
      });
    });

    test('يجب أن يدعم التصفية حسب الحالة', async () => {
      const mockInvoices = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };

      invoiceService.getUserInvoices.mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/payment/invoices?status=pending&page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(invoiceService.getUserInvoices).toHaveBeenCalledWith(userId, {
        page: 2,
        limit: 5,
        status: 'pending'
      });
    });
  });

  describe('GET /api/payment/invoices/:invoiceId - تفاصيل الفاتورة', () => {
    test('يجب أن يجلب تفاصيل الفاتورة بنجاح', async () => {
      const mockInvoice = {
        id: 1,
        orderNumber: 'INV-202412-000001',
        amount: 100,
        tax: 15,
        total: 115,
        status: 'paid',
        createdAt: '2024-12-28T10:00:00Z',
        paidAt: '2024-12-28T10:05:00Z',
        items: [
          {
            id: 1,
            name: 'برجر لحم',
            quantity: 2,
            price: 50,
            total: 100
          }
        ]
      };

      invoiceService.getInvoiceDetails.mockResolvedValue(mockInvoice);

      const response = await request(app)
        .get('/api/payment/invoices/1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe('INV-202412-000001');
      expect(response.body.data.items).toHaveLength(1);
      expect(invoiceService.getInvoiceDetails).toHaveBeenCalledWith('1', userId);
    });

    test('يجب أن يرجع خطأ للفاتورة غير الموجودة', async () => {
      invoiceService.getInvoiceDetails.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/payment/invoices/999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVOICE_NOT_FOUND');
    });
  });

  describe('GET /api/payment/invoices/:invoiceId/download - تحميل الفاتورة', () => {
    test('يجب أن يحمل الفاتورة بصيغة PDF', async () => {
      const mockInvoice = {
        id: 1,
        orderNumber: 'INV-202412-000001',
        amount: 100,
        tax: 15,
        total: 115,
        status: 'paid'
      };

      const mockPdfBuffer = Buffer.from('PDF content');

      invoiceService.getInvoiceDetails.mockResolvedValue(mockInvoice);
      invoiceService.generateInvoicePDF.mockResolvedValue(mockPdfBuffer);

      const response = await request(app)
        .get('/api/payment/invoices/1/download')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('فاتورة-INV-202412-000001.pdf');
      expect(invoiceService.generateInvoicePDF).toHaveBeenCalledWith(mockInvoice, 'ar');
    });
  });

  describe('POST /api/payment/refund/:paymentId - الاسترداد', () => {
    test('يجب أن يعالج الاسترداد بنجاح', async () => {
      const refundData = {
        reason: 'طلب العميل',
        amount: 50
      };

      const mockRefundResult = {
        success: true,
        refundId: 'REF-123456',
        amount: 50,
        status: 'completed'
      };

      paymentService.refundPayment.mockResolvedValue(mockRefundResult);
      invoiceService.updateInvoiceStatus.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/payment/refund/TXN-123456')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.refundId).toBe('REF-123456');
      expect(paymentService.refundPayment).toHaveBeenCalledWith({
        paymentId: 'TXN-123456',
        userId,
        reason: 'طلب العميل',
        amount: 50
      });
    });

    test('يجب أن يتعامل مع فشل الاسترداد', async () => {
      const refundData = {
        reason: 'طلب العميل'
      };

      const mockFailedResult = {
        success: false,
        error: 'لا يمكن استرداد هذه الدفعة'
      };

      paymentService.refundPayment.mockResolvedValue(mockFailedResult);

      const response = await request(app)
        .post('/api/payment/refund/TXN-123456')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar')
        .send(refundData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REFUND_FAILED');
    });
  });

  describe('GET /api/payment/stats - إحصائيات الدفع', () => {
    test('يجب أن يجلب إحصائيات الدفع بنجاح', async () => {
      const mockStats = {
        totalTransactions: 10,
        totalAmount: 1000,
        averageAmount: 100,
        successfulTransactions: 9,
        failedTransactions: 1,
        successRate: '90.00'
      };

      paymentService.getPaymentStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/payment/stats?period=month')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTransactions).toBe(10);
      expect(response.body.data.periodText).toBe('شهر');
      expect(paymentService.getPaymentStats).toHaveBeenCalledWith(userId, 'month');
    });
  });

  describe('Authentication Tests - اختبارات المصادقة', () => {
    test('يجب أن يرفض الطلبات بدون توكن', async () => {
      const response = await request(app)
        .get('/api/payment/methods');

      expect(response.status).toBe(401);
    });

    test('يجب أن يرفض التوكن غير الصحيح', async () => {
      const response = await request(app)
        .get('/api/payment/methods')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting Tests - اختبارات تحديد المعدل', () => {
    test('يجب أن يطبق تحديد المعدل على معالجة الدفع', async () => {
      const paymentData = {
        amount: 100,
        paymentMethodId: 1,
        description: 'اختبار تحديد المعدل'
      };

      // محاكاة عدة طلبات سريعة
      const promises = Array(12).fill().map(() =>
        request(app)
          .post('/api/payment/process')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
      );

      const responses = await Promise.all(promises);
      
      // يجب أن يكون هناك على الأقل استجابة واحدة برمز 429
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});