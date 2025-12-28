const db = require('../config/database');
const logger = require('../utils/logger');
const { generateTransactionId } = require('../utils/helpers');

/**
 * خدمة معالجة المدفوعات
 */
class PaymentService {
  /**
   * الحصول على طرق الدفع للمستخدم
   */
  async getUserPaymentMethods(userId) {
    try {
      const query = `
        SELECT 
          id,
          type,
          card_number as cardNumber,
          expiry_date as expiryDate,
          holder_name as holderName,
          is_default as isDefault,
          created_at as createdAt
        FROM payment_methods 
        WHERE user_id = ? AND is_active = 1
        ORDER BY is_default DESC, created_at DESC
      `;
      
      const methods = await db.query(query, [userId]);
      
      return methods.map(method => ({
        ...method,
        lastFourDigits: method.cardNumber ? method.cardNumber.slice(-4) : null,
        cardNumber: undefined // إزالة رقم البطاقة الكامل من الاستجابة
      }));
    } catch (error) {
      logger.error('خطأ في جلب طرق الدفع:', error);
      throw error;
    }
  }

  /**
   * إضافة طريقة دفع جديدة
   */
  async addPaymentMethod(userId, methodData) {
    try {
      const { type, cardNumber, expiryDate, holderName, isDefault } = methodData;

      // إذا كانت هذه الطريقة افتراضية، قم بإلغاء الافتراضية من الطرق الأخرى
      if (isDefault) {
        await db.query(
          'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const query = `
        INSERT INTO payment_methods 
        (user_id, type, card_number, expiry_date, holder_name, is_default, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `;

      const result = await db.query(query, [
        userId,
        type,
        this.encryptCardNumber(cardNumber), // تشفير رقم البطاقة
        expiryDate,
        holderName,
        isDefault ? 1 : 0
      ]);

      return {
        id: result.insertId,
        type,
        lastFourDigits: cardNumber.slice(-4),
        holderName,
        isDefault,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('خطأ في إضافة طريقة الدفع:', error);
      throw error;
    }
  }

  /**
   * الحصول على طريقة دفع محددة
   */
  async getPaymentMethod(methodId, userId) {
    try {
      const query = `
        SELECT 
          id,
          type,
          card_number as cardNumber,
          expiry_date as expiryDate,
          holder_name as holderName,
          is_default as isDefault
        FROM payment_methods 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `;
      
      const [method] = await db.query(query, [methodId, userId]);
      return method;
    } catch (error) {
      logger.error('خطأ في جلب طريقة الدفع:', error);
      throw error;
    }
  }

  /**
   * معالجة دفعة جديدة
   */
  async processPayment(paymentData) {
    try {
      const { userId, amount, paymentMethodId, description, orderId } = paymentData;
      
      // إنشاء معرف المعاملة
      const transactionId = generateTransactionId();
      
      // الحصول على طريقة الدفع
      const paymentMethod = await this.getPaymentMethod(paymentMethodId, userId);
      if (!paymentMethod) {
        throw new Error('طريقة الدفع غير موجودة');
      }

      // محاكاة معالجة الدفع (في التطبيق الحقيقي، ستتم المعالجة مع بوابة الدفع)
      const paymentResult = await this.simulatePaymentProcessing({
        amount,
        paymentMethod,
        transactionId
      });

      if (paymentResult.success) {
        // حفظ المعاملة في قاعدة البيانات
        const query = `
          INSERT INTO payments 
          (id, user_id, payment_method_id, amount, status, description, order_id, created_at)
          VALUES (?, ?, ?, ?, 'completed', ?, ?, NOW())
        `;

        await db.query(query, [
          transactionId,
          userId,
          paymentMethodId,
          amount,
          description,
          orderId
        ]);

        return {
          success: true,
          transactionId,
          amount,
          status: 'completed',
          message: 'تم الدفع بنجاح'
        };
      } else {
        // حفظ المعاملة الفاشلة
        const query = `
          INSERT INTO payments 
          (id, user_id, payment_method_id, amount, status, description, order_id, error_message, created_at)
          VALUES (?, ?, ?, ?, 'failed', ?, ?, ?, NOW())
        `;

        await db.query(query, [
          transactionId,
          userId,
          paymentMethodId,
          amount,
          description,
          orderId,
          paymentResult.error
        ]);

        return {
          success: false,
          transactionId,
          error: paymentResult.error
        };
      }
    } catch (error) {
      logger.error('خطأ في معالجة الدفع:', error);
      throw error;
    }
  }

  /**
   * محاكاة معالجة الدفع
   */
  async simulatePaymentProcessing({ amount, paymentMethod, transactionId }) {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 1000));

    // محاكاة نسبة نجاح 95%
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        transactionId,
        gatewayResponse: {
          code: '00',
          message: 'Approved'
        }
      };
    } else {
      const errors = [
        'رصيد غير كافي',
        'البطاقة منتهية الصلاحية',
        'رقم البطاقة غير صحيح',
        'تم رفض المعاملة من البنك'
      ];
      
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }
  }

  /**
   * استرداد دفعة
   */
  async refundPayment({ paymentId, userId, reason, amount }) {
    try {
      // الحصول على تفاصيل الدفعة الأصلية
      const query = `
        SELECT * FROM payments 
        WHERE id = ? AND user_id = ? AND status = 'completed'
      `;
      
      const [payment] = await db.query(query, [paymentId, userId]);
      if (!payment) {
        throw new Error('الدفعة غير موجودة أو لا يمكن استردادها');
      }

      const refundAmount = amount || payment.amount;
      if (refundAmount > payment.amount) {
        throw new Error('مبلغ الاسترداد أكبر من المبلغ الأصلي');
      }

      // إنشاء معرف الاسترداد
      const refundId = generateTransactionId();

      // محاكاة معالجة الاسترداد
      const refundResult = await this.simulateRefundProcessing({
        originalPayment: payment,
        refundAmount,
        refundId
      });

      if (refundResult.success) {
        // حفظ الاسترداد في قاعدة البيانات
        const insertQuery = `
          INSERT INTO refunds 
          (id, payment_id, user_id, amount, reason, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'completed', NOW())
        `;

        await db.query(insertQuery, [
          refundId,
          paymentId,
          userId,
          refundAmount,
          reason
        ]);

        // تحديث حالة الدفعة الأصلية
        const updateQuery = `
          UPDATE payments 
          SET status = 'refunded', updated_at = NOW()
          WHERE id = ?
        `;

        await db.query(updateQuery, [paymentId]);

        return {
          success: true,
          refundId,
          amount: refundAmount,
          status: 'completed',
          message: 'تم الاسترداد بنجاح'
        };
      } else {
        return {
          success: false,
          error: refundResult.error
        };
      }
    } catch (error) {
      logger.error('خطأ في استرداد الدفعة:', error);
      throw error;
    }
  }

  /**
   * محاكاة معالجة الاسترداد
   */
  async simulateRefundProcessing({ originalPayment, refundAmount, refundId }) {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 800));

    // محاكاة نسبة نجاح 98%
    const success = Math.random() > 0.02;

    if (success) {
      return {
        success: true,
        refundId,
        gatewayResponse: {
          code: '00',
          message: 'Refund Approved'
        }
      };
    } else {
      return {
        success: false,
        error: 'فشل في معالجة الاسترداد من البنك'
      };
    }
  }

  /**
   * الحصول على إحصائيات الدفع
   */
  async getPaymentStats(userId, period = 'month') {
    try {
      let dateCondition = '';
      const now = new Date();
      
      switch (period) {
        case 'day':
          dateCondition = 'DATE(created_at) = CURDATE()';
          break;
        case 'week':
          dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateCondition = 'MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())';
          break;
        case 'year':
          dateCondition = 'YEAR(created_at) = YEAR(NOW())';
          break;
        default:
          dateCondition = '1=1';
      }

      const query = `
        SELECT 
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as totalAmount,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as averageAmount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successfulTransactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedTransactions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refundedTransactions
        FROM payments 
        WHERE user_id = ? AND ${dateCondition}
      `;

      const [stats] = await db.query(query, [userId]);

      return {
        ...stats,
        successRate: stats.totalTransactions > 0 
          ? (stats.successfulTransactions / stats.totalTransactions * 100).toFixed(2)
          : 0,
        period
      };
    } catch (error) {
      logger.error('خطأ في جلب إحصائيات الدفع:', error);
      throw error;
    }
  }

  /**
   * الحصول على سجل المعاملات
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = options;
      const offset = (page - 1) * limit;

      let whereConditions = ['user_id = ?'];
      let queryParams = [userId];

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (startDate) {
        whereConditions.push('created_at >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('created_at <= ?');
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      // جلب المعاملات
      const query = `
        SELECT 
          p.*,
          pm.type as paymentMethodType,
          pm.holder_name as holderName
        FROM payments p
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const transactions = await db.query(query, queryParams);

      // جلب العدد الإجمالي
      const countQuery = `
        SELECT COUNT(*) as total
        FROM payments 
        WHERE ${whereClause}
      `;

      const [{ total }] = await db.query(countQuery, queryParams.slice(0, -2));

      return {
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('خطأ في جلب سجل المعاملات:', error);
      throw error;
    }
  }

  /**
   * تشفير رقم البطاقة (تنفيذ مبسط)
   */
  encryptCardNumber(cardNumber) {
    // في التطبيق الحقيقي، استخدم تشفير قوي مثل AES
    // هنا نحفظ فقط آخر 4 أرقام لأغراض العرض
    return cardNumber.slice(-4);
  }

  /**
   * فك تشفير رقم البطاقة
   */
  decryptCardNumber(encryptedCardNumber) {
    // في التطبيق الحقيقي، فك التشفير هنا
    return `**** **** **** ${encryptedCardNumber}`;
  }

  /**
   * التحقق من صحة بيانات البطاقة
   */
  validateCardData(cardData) {
    const { cardNumber, expiryDate, cvv } = cardData;
    const errors = [];

    // التحقق من رقم البطاقة (خوارزمية Luhn)
    if (!this.isValidCardNumber(cardNumber)) {
      errors.push('رقم البطاقة غير صحيح');
    }

    // التحقق من تاريخ الانتهاء
    if (!this.isValidExpiryDate(expiryDate)) {
      errors.push('تاريخ انتهاء البطاقة غير صحيح');
    }

    // التحقق من CVV
    if (!this.isValidCVV(cvv)) {
      errors.push('رمز الأمان غير صحيح');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * التحقق من صحة رقم البطاقة باستخدام خوارزمية Luhn
   */
  isValidCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * التحقق من صحة تاريخ الانتهاء
   */
  isValidExpiryDate(expiryDate) {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

    return true;
  }

  /**
   * التحقق من صحة CVV
   */
  isValidCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }
}

module.exports = new PaymentService();