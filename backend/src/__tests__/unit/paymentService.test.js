const paymentService = require('../../services/paymentService');
const db = require('../../config/database');
const { generateTransactionId } = require('../../utils/helpers');

// Mock قاعدة البيانات والمساعدات
jest.mock('../../config/database');
jest.mock('../../utils/helpers');

describe('Payment Service Tests - اختبارات خدمة الدفع', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPaymentMethods - طرق الدفع للمستخدم', () => {
    test('يجب أن يجلب طرق الدفع بنجاح', async () => {
      const mockMethods = [
        {
          id: 1,
          type: 'credit_card',
          cardNumber: '1234',
          expiryDate: '12/25',
          holderName: 'أحمد محمد',
          isDefault: 1,
          createdAt: new Date()
        },
        {
          id: 2,
          type: 'debit_card',
          cardNumber: '5678',
          expiryDate: '06/26',
          holderName: 'أحمد محمد',
          isDefault: 0,
          createdAt: new Date()
        }
      ];

      db.query.mockResolvedValue(mockMethods);

      const result = await paymentService.getUserPaymentMethods(1);

      expect(result).toHaveLength(2);
      expect(result[0].lastFourDigits).toBe('1234');
      expect(result[0].cardNumber).toBeUndefined();
      expect(result[1].lastFourDigits).toBe('5678');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    test('يجب أن يتعامل مع الأخطاء', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(paymentService.getUserPaymentMethods(1))
        .rejects.toThrow('Database error');
    });
  });

  describe('addPaymentMethod - إضافة طريقة دفع', () => {
    test('يجب أن يضيف طريقة دفع جديدة', async () => {
      const methodData = {
        type: 'credit_card',
        cardNumber: '1234567812345678',
        expiryDate: '12/25',
        holderName: 'أحمد محمد',
        isDefault: true
      };

      // محاكاة تحديث الطرق الافتراضية
      db.query.mockResolvedValueOnce([]);
      // محاكاة إدراج الطريقة الجديدة
      db.query.mockResolvedValueOnce({ insertId: 3 });

      const result = await paymentService.addPaymentMethod(1, methodData);

      expect(result.id).toBe(3);
      expect(result.type).toBe('credit_card');
      expect(result.lastFourDigits).toBe('5678');
      expect(result.holderName).toBe('أحمد محمد');
      expect(result.isDefault).toBe(true);

      // التحقق من استدعاء تحديث الطرق الافتراضية
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
        [1]
      );

      // التحقق من استدعاء إدراج الطريقة الجديدة
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_methods'),
        expect.arrayContaining([1, 'credit_card', '5678', '12/25', 'أحمد محمد', 1])
      );
    });

    test('يجب ألا يحدث الطرق الافتراضية إذا لم تكن الطريقة الجديدة افتراضية', async () => {
      const methodData = {
        type: 'debit_card',
        cardNumber: '9876543210987654',
        expiryDate: '06/26',
        holderName: 'سارة أحمد',
        isDefault: false
      };

      db.query.mockResolvedValueOnce({ insertId: 4 });

      const result = await paymentService.addPaymentMethod(2, methodData);

      expect(result.isDefault).toBe(false);
      
      // التحقق من عدم استدعاء تحديث الطرق الافتراضية
      expect(db.query).not.toHaveBeenCalledWith(
        'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
        [2]
      );
    });
  });

  describe('processPayment - معالجة الدفع', () => {
    test('يجب أن يعالج الدفع بنجاح', async () => {
      const paymentData = {
        userId: 1,
        amount: 100,
        paymentMethodId: 1,
        description: 'دفع طلب',
        orderId: 'ORD-123'
      };

      const mockPaymentMethod = {
        id: 1,
        type: 'credit_card',
        cardNumber: '1234',
        holderName: 'أحمد محمد'
      };

      const mockTransactionId = 'TXN-123456';

      generateTransactionId.mockReturnValue(mockTransactionId);
      
      // محاكاة جلب طريقة الدفع
      db.query.mockResolvedValueOnce([mockPaymentMethod]);
      
      // محاكاة حفظ المعاملة
      db.query.mockResolvedValueOnce([]);

      // محاكاة نجاح معالجة الدفع
      jest.spyOn(paymentService, 'simulatePaymentProcessing')
        .mockResolvedValue({
          success: true,
          transactionId: mockTransactionId,
          gatewayResponse: { code: '00', message: 'Approved' }
        });

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(mockTransactionId);
      expect(result.amount).toBe(100);
      expect(result.status).toBe('completed');

      // التحقق من حفظ المعاملة
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payments'),
        expect.arrayContaining([
          mockTransactionId,
          1,
          1,
          100,
          'دفع طلب',
          'ORD-123'
        ])
      );
    });

    test('يجب أن يتعامل مع فشل الدفع', async () => {
      const paymentData = {
        userId: 1,
        amount: 100,
        paymentMethodId: 1,
        description: 'دفع طلب'
      };

      const mockPaymentMethod = {
        id: 1,
        type: 'credit_card'
      };

      const mockTransactionId = 'TXN-123456';

      generateTransactionId.mockReturnValue(mockTransactionId);
      db.query.mockResolvedValueOnce([mockPaymentMethod]);
      db.query.mockResolvedValueOnce([]);

      // محاكاة فشل معالجة الدفع
      jest.spyOn(paymentService, 'simulatePaymentProcessing')
        .mockResolvedValue({
          success: false,
          error: 'رصيد غير كافي'
        });

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('رصيد غير كافي');

      // التحقق من حفظ المعاملة الفاشلة
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payments'),
        expect.arrayContaining([
          mockTransactionId,
          1,
          1,
          100,
          'دفع طلب',
          null,
          'رصيد غير كافي'
        ])
      );
    });

    test('يجب أن يرفض طريقة دفع غير موجودة', async () => {
      const paymentData = {
        userId: 1,
        amount: 100,
        paymentMethodId: 999
      };

      // محاكاة عدم وجود طريقة الدفع
      db.query.mockResolvedValueOnce([]);

      await expect(paymentService.processPayment(paymentData))
        .rejects.toThrow('طريقة الدفع غير موجودة');
    });
  });

  describe('simulatePaymentProcessing - محاكاة معالجة الدفع', () => {
    test('يجب أن ترجع نجاح في معظم الحالات', async () => {
      // محاكاة Math.random لإرجاع قيمة تؤدي للنجاح
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const result = await paymentService.simulatePaymentProcessing({
        amount: 100,
        paymentMethod: { type: 'credit_card' },
        transactionId: 'TXN-123'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('TXN-123');
      expect(result.gatewayResponse.code).toBe('00');

      Math.random.mockRestore();
    });

    test('يجب أن ترجع فشل أحياناً', async () => {
      // محاكاة Math.random لإرجاع قيمة تؤدي للفشل
      jest.spyOn(Math, 'random').mockReturnValue(0.01);

      const result = await paymentService.simulatePaymentProcessing({
        amount: 100,
        paymentMethod: { type: 'credit_card' },
        transactionId: 'TXN-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');

      Math.random.mockRestore();
    });
  });

  describe('refundPayment - استرداد الدفع', () => {
    test('يجب أن يعالج الاسترداد بنجاح', async () => {
      const refundData = {
        paymentId: 'TXN-123456',
        userId: 1,
        reason: 'طلب العميل',
        amount: 50
      };

      const mockPayment = {
        id: 'TXN-123456',
        user_id: 1,
        amount: 100,
        status: 'completed'
      };

      const mockRefundId = 'REF-123456';

      generateTransactionId.mockReturnValue(mockRefundId);

      // محاكاة جلب الدفعة الأصلية
      db.query.mockResolvedValueOnce([mockPayment]);
      
      // محاكاة حفظ الاسترداد
      db.query.mockResolvedValueOnce([]);
      
      // محاكاة تحديث حالة الدفعة
      db.query.mockResolvedValueOnce([]);

      // محاكاة نجاح معالجة الاسترداد
      jest.spyOn(paymentService, 'simulateRefundProcessing')
        .mockResolvedValue({
          success: true,
          refundId: mockRefundId,
          gatewayResponse: { code: '00', message: 'Refund Approved' }
        });

      const result = await paymentService.refundPayment(refundData);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe(mockRefundId);
      expect(result.amount).toBe(50);
      expect(result.status).toBe('completed');

      // التحقق من حفظ الاسترداد
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refunds'),
        expect.arrayContaining([
          mockRefundId,
          'TXN-123456',
          1,
          50,
          'طلب العميل'
        ])
      );

      // التحقق من تحديث حالة الدفعة
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments'),
        ['TXN-123456']
      );
    });

    test('يجب أن يرفض استرداد مبلغ أكبر من المبلغ الأصلي', async () => {
      const refundData = {
        paymentId: 'TXN-123456',
        userId: 1,
        reason: 'طلب العميل',
        amount: 150 // أكبر من المبلغ الأصلي
      };

      const mockPayment = {
        id: 'TXN-123456',
        user_id: 1,
        amount: 100,
        status: 'completed'
      };

      db.query.mockResolvedValueOnce([mockPayment]);

      await expect(paymentService.refundPayment(refundData))
        .rejects.toThrow('مبلغ الاسترداد أكبر من المبلغ الأصلي');
    });

    test('يجب أن يرفض استرداد دفعة غير موجودة', async () => {
      const refundData = {
        paymentId: 'TXN-999999',
        userId: 1,
        reason: 'طلب العميل'
      };

      db.query.mockResolvedValueOnce([]);

      await expect(paymentService.refundPayment(refundData))
        .rejects.toThrow('الدفعة غير موجودة أو لا يمكن استردادها');
    });
  });

  describe('getPaymentStats - إحصائيات الدفع', () => {
    test('يجب أن يجلب إحصائيات الشهر الحالي', async () => {
      const mockStats = {
        totalTransactions: 10,
        totalAmount: 1000,
        averageAmount: 100,
        successfulTransactions: 9,
        failedTransactions: 1,
        refundedTransactions: 0
      };

      db.query.mockResolvedValueOnce([mockStats]);

      const result = await paymentService.getPaymentStats(1, 'month');

      expect(result.totalTransactions).toBe(10);
      expect(result.totalAmount).toBe(1000);
      expect(result.successRate).toBe('90.00');
      expect(result.period).toBe('month');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('MONTH(created_at) = MONTH(NOW())'),
        [1]
      );
    });

    test('يجب أن يدعم فترات مختلفة', async () => {
      const mockStats = {
        totalTransactions: 5,
        totalAmount: 500,
        averageAmount: 100,
        successfulTransactions: 5,
        failedTransactions: 0,
        refundedTransactions: 0
      };

      db.query.mockResolvedValueOnce([mockStats]);

      const result = await paymentService.getPaymentStats(1, 'week');

      expect(result.period).toBe('week');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_SUB(NOW(), INTERVAL 7 DAY)'),
        [1]
      );
    });
  });

  describe('Card Validation - التحقق من البطاقات', () => {
    describe('isValidCardNumber - التحقق من رقم البطاقة', () => {
      test('يجب أن يقبل أرقام البطاقات الصحيحة', () => {
        // رقم بطاقة اختبار صحيح (Visa)
        expect(paymentService.isValidCardNumber('4532015112830366')).toBe(true);
        
        // رقم بطاقة اختبار صحيح (MasterCard)
        expect(paymentService.isValidCardNumber('5555555555554444')).toBe(true);
      });

      test('يجب أن يرفض أرقام البطاقات غير الصحيحة', () => {
        expect(paymentService.isValidCardNumber('1234567890123456')).toBe(false);
        expect(paymentService.isValidCardNumber('123')).toBe(false);
        expect(paymentService.isValidCardNumber('abcd1234')).toBe(false);
      });

      test('يجب أن يتعامل مع المسافات في رقم البطاقة', () => {
        expect(paymentService.isValidCardNumber('4532 0151 1283 0366')).toBe(true);
      });
    });

    describe('isValidExpiryDate - التحقق من تاريخ الانتهاء', () => {
      test('يجب أن يقبل تواريخ صحيحة في المستقبل', () => {
        expect(paymentService.isValidExpiryDate('12/25')).toBe(true);
        expect(paymentService.isValidExpiryDate('06/26')).toBe(true);
      });

      test('يجب أن يرفض تواريخ منتهية الصلاحية', () => {
        expect(paymentService.isValidExpiryDate('12/20')).toBe(false);
        expect(paymentService.isValidExpiryDate('01/23')).toBe(false);
      });

      test('يجب أن يرفض تنسيقات غير صحيحة', () => {
        expect(paymentService.isValidExpiryDate('13/25')).toBe(false);
        expect(paymentService.isValidExpiryDate('00/25')).toBe(false);
        expect(paymentService.isValidExpiryDate('12/2025')).toBe(false);
        expect(paymentService.isValidExpiryDate('12-25')).toBe(false);
      });
    });

    describe('isValidCVV - التحقق من CVV', () => {
      test('يجب أن يقبل CVV صحيح', () => {
        expect(paymentService.isValidCVV('123')).toBe(true);
        expect(paymentService.isValidCVV('1234')).toBe(true);
      });

      test('يجب أن يرفض CVV غير صحيح', () => {
        expect(paymentService.isValidCVV('12')).toBe(false);
        expect(paymentService.isValidCVV('12345')).toBe(false);
        expect(paymentService.isValidCVV('abc')).toBe(false);
      });
    });

    describe('validateCardData - التحقق الشامل من البطاقة', () => {
      test('يجب أن يقبل بيانات بطاقة صحيحة', () => {
        const cardData = {
          cardNumber: '4532015112830366',
          expiryDate: '12/25',
          cvv: '123'
        };

        const result = paymentService.validateCardData(cardData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('يجب أن يرفض بيانات بطاقة غير صحيحة', () => {
        const cardData = {
          cardNumber: '1234567890123456',
          expiryDate: '13/20',
          cvv: '12'
        };

        const result = paymentService.validateCardData(cardData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain('رقم البطاقة غير صحيح');
        expect(result.errors).toContain('تاريخ انتهاء البطاقة غير صحيح');
        expect(result.errors).toContain('رمز الأمان غير صحيح');
      });
    });
  });
});