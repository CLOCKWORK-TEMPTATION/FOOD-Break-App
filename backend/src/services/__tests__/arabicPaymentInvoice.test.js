/**
 * اختبارات نظام الدفع والفواتير العربي
 * Arabic Payment and Invoice System Tests
 */

const {
  PAYMENT_MESSAGES,
  LOCAL_PAYMENT_METHODS,
  getAvailablePaymentMethods,
  calculateProcessingFee,
  createArabicPayment,
  verifyWalletOtp,
  confirmReferencePayment,
  processArabicRefund,
  getUserPaymentsArabic,
  getPaymentDetailsArabic,
  generatePaymentReference
} = require('../arabicPaymentService');

const {
  HIJRI_MONTHS,
  GREGORIAN_MONTHS_AR,
  INVOICE_STATUS,
  gregorianToHijri,
  formatArabicDate,
  generateInvoiceNumber,
  toArabicNumbers,
  amountToArabicWords,
  createArabicInvoice,
  formatInvoiceResponse,
  getUserInvoicesArabic,
  getInvoiceDetailsArabic,
  updateInvoiceStatus,
  getInvoiceStatisticsArabic
} = require('../arabicInvoiceService');

// =====================================================
// اختبارات خدمة الدفع العربية
// =====================================================

describe('خدمة الدفع العربية - Arabic Payment Service', () => {
  
  // اختبار رسائل الدفع
  describe('رسائل الدفع بالعربية', () => {
    test('يجب أن تحتوي على رسائل النجاح بالعربية', () => {
      expect(PAYMENT_MESSAGES.success.paymentCreated).toBe('تم إنشاء عملية الدفع بنجاح');
      expect(PAYMENT_MESSAGES.success.paymentCompleted).toBe('تمت عملية الدفع بنجاح');
      expect(PAYMENT_MESSAGES.success.refundProcessed).toBe('تم استرداد المبلغ بنجاح');
    });

    test('يجب أن تحتوي على رسائل الأخطاء بالعربية', () => {
      expect(PAYMENT_MESSAGES.errors.invalidAmount).toContain('المبلغ غير صالح');
      expect(PAYMENT_MESSAGES.errors.paymentNotFound).toBe('لم يتم العثور على عملية الدفع');
      expect(PAYMENT_MESSAGES.errors.cardDeclined).toContain('تم رفض البطاقة');
      expect(PAYMENT_MESSAGES.errors.insufficientFunds).toContain('الرصيد غير كافي');
    });

    test('يجب أن تحتوي على حالات الدفع بالعربية', () => {
      expect(PAYMENT_MESSAGES.status.PENDING).toBe('في انتظار الدفع');
      expect(PAYMENT_MESSAGES.status.COMPLETED).toBe('تم الدفع');
      expect(PAYMENT_MESSAGES.status.REFUNDED).toBe('تم الاسترداد');
    });
  });

  // اختبار طرق الدفع المحلية
  describe('طرق الدفع المحلية المصرية', () => {
    test('يجب أن تدعم فودافون كاش', () => {
      expect(LOCAL_PAYMENT_METHODS.VODAFONE_CASH).toBeDefined();
      expect(LOCAL_PAYMENT_METHODS.VODAFONE_CASH.name).toBe('فودافون كاش');
      expect(LOCAL_PAYMENT_METHODS.VODAFONE_CASH.requiresOtp).toBe(true);
    });

    test('يجب أن تدعم أورانج موني', () => {
      expect(LOCAL_PAYMENT_METHODS.ORANGE_MONEY).toBeDefined();
      expect(LOCAL_PAYMENT_METHODS.ORANGE_MONEY.name).toBe('أورانج موني');
    });

    test('يجب أن تدعم فوري', () => {
      expect(LOCAL_PAYMENT_METHODS.FAWRY).toBeDefined();
      expect(LOCAL_PAYMENT_METHODS.FAWRY.name).toBe('فوري');
      expect(LOCAL_PAYMENT_METHODS.FAWRY.requiresReference).toBe(true);
    });

    test('يجب أن تدعم الدفع عند الاستلام', () => {
      expect(LOCAL_PAYMENT_METHODS.CASH_ON_DELIVERY).toBeDefined();
      expect(LOCAL_PAYMENT_METHODS.CASH_ON_DELIVERY.name).toBe('الدفع عند الاستلام');
    });

    test('يجب أن تدعم البطاقات البنكية', () => {
      expect(LOCAL_PAYMENT_METHODS.CARD).toBeDefined();
      expect(LOCAL_PAYMENT_METHODS.CARD.types).toContain('VISA');
      expect(LOCAL_PAYMENT_METHODS.CARD.types).toContain('MASTERCARD');
      expect(LOCAL_PAYMENT_METHODS.CARD.types).toContain('MEEZA');
    });

    test('يجب أن تحدد حدود المبالغ لكل طريقة', () => {
      Object.values(LOCAL_PAYMENT_METHODS).forEach(method => {
        expect(method.minAmount).toBeDefined();
        expect(method.maxAmount).toBeDefined();
        expect(method.minAmount).toBeLessThan(method.maxAmount);
      });
    });
  });

  // اختبار حساب رسوم المعالجة
  describe('حساب رسوم المعالجة', () => {
    test('يجب أن يحسب رسوم البطاقة كنسبة مئوية', () => {
      const fee = calculateProcessingFee(1000, 'CARD');
      expect(fee).toBe(25); // 2.5%
    });

    test('يجب أن يحسب رسوم فوري كرسوم ثابتة', () => {
      const fee = calculateProcessingFee(1000, 'FAWRY');
      expect(fee).toBe(2.5);
    });

    test('يجب أن تكون رسوم المحافظ الإلكترونية صفر', () => {
      expect(calculateProcessingFee(1000, 'VODAFONE_CASH')).toBe(0);
      expect(calculateProcessingFee(1000, 'ORANGE_MONEY')).toBe(0);
    });

    test('يجب أن يعيد صفر لطريقة دفع غير معروفة', () => {
      const fee = calculateProcessingFee(1000, 'UNKNOWN_METHOD');
      expect(fee).toBe(0);
    });
  });

  // اختبار توليد الرقم المرجعي
  describe('توليد الرقم المرجعي', () => {
    test('يجب أن يبدأ بـ PAY-', () => {
      const ref = generatePaymentReference();
      expect(ref).toMatch(/^PAY-/);
    });

    test('يجب أن يكون فريداً', () => {
      const ref1 = generatePaymentReference();
      const ref2 = generatePaymentReference();
      expect(ref1).not.toBe(ref2);
    });
  });
});

// =====================================================
// اختبارات خدمة الفواتير العربية
// =====================================================

describe('خدمة الفواتير العربية - Arabic Invoice Service', () => {

  // اختبار الشهور الهجرية
  describe('الشهور الهجرية', () => {
    test('يجب أن تحتوي على 12 شهراً', () => {
      expect(HIJRI_MONTHS).toHaveLength(12);
    });

    test('يجب أن تبدأ بمحرم وتنتهي بذو الحجة', () => {
      expect(HIJRI_MONTHS[0]).toBe('محرم');
      expect(HIJRI_MONTHS[11]).toBe('ذو الحجة');
    });

    test('يجب أن تحتوي على رمضان', () => {
      expect(HIJRI_MONTHS).toContain('رمضان');
      expect(HIJRI_MONTHS.indexOf('رمضان')).toBe(8);
    });
  });

  // اختبار الشهور الميلادية بالعربية
  describe('الشهور الميلادية بالعربية', () => {
    test('يجب أن تحتوي على 12 شهراً', () => {
      expect(GREGORIAN_MONTHS_AR).toHaveLength(12);
    });

    test('يجب أن تبدأ بيناير وتنتهي بديسمبر', () => {
      expect(GREGORIAN_MONTHS_AR[0]).toBe('يناير');
      expect(GREGORIAN_MONTHS_AR[11]).toBe('ديسمبر');
    });
  });

  // اختبار حالات الفاتورة
  describe('حالات الفاتورة', () => {
    test('يجب أن تحتوي على جميع الحالات', () => {
      expect(INVOICE_STATUS.PENDING).toBeDefined();
      expect(INVOICE_STATUS.PAID).toBeDefined();
      expect(INVOICE_STATUS.OVERDUE).toBeDefined();
      expect(INVOICE_STATUS.CANCELLED).toBeDefined();
    });

    test('يجب أن تكون الحالات بالعربية', () => {
      expect(INVOICE_STATUS.PENDING.name).toBe('في انتظار الدفع');
      expect(INVOICE_STATUS.PAID.name).toBe('مدفوعة');
      expect(INVOICE_STATUS.OVERDUE.name).toBe('متأخرة');
    });

    test('يجب أن تحتوي على ألوان', () => {
      Object.values(INVOICE_STATUS).forEach(status => {
        expect(status.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  // اختبار تحويل التاريخ الهجري
  describe('تحويل التاريخ الهجري', () => {
    test('يجب أن يحول تاريخ معروف بشكل صحيح', () => {
      const date = new Date('2024-01-01');
      const hijri = gregorianToHijri(date);
      
      expect(hijri).toBeDefined();
      expect(hijri.year).toBeGreaterThan(1445);
      expect(hijri.month).toBeGreaterThanOrEqual(1);
      expect(hijri.month).toBeLessThanOrEqual(12);
      expect(hijri.day).toBeGreaterThanOrEqual(1);
      expect(hijri.day).toBeLessThanOrEqual(30);
    });

    test('يجب أن يتضمن اسم الشهر الهجري', () => {
      const date = new Date();
      const hijri = gregorianToHijri(date);
      
      expect(hijri.monthName).toBeDefined();
      expect(HIJRI_MONTHS).toContain(hijri.monthName);
    });

    test('يجب أن يوفر تنسيقات متعددة', () => {
      const date = new Date();
      const hijri = gregorianToHijri(date);
      
      expect(hijri.formatted).toContain('هـ');
      expect(hijri.shortFormatted).toMatch(/\d+\/\d+\/\d+ هـ/);
    });
  });

  // اختبار تنسيق التاريخ العربي
  describe('تنسيق التاريخ العربي', () => {
    test('يجب أن يوفر التاريخ الميلادي والهجري', () => {
      const date = new Date();
      const formatted = formatArabicDate(date);
      
      expect(formatted.gregorian).toBeDefined();
      expect(formatted.hijri).toBeDefined();
      expect(formatted.combined).toBeDefined();
    });

    test('يجب أن يتضمن يوم الأسبوع', () => {
      const date = new Date();
      const formatted = formatArabicDate(date);
      
      expect(formatted.gregorian.weekday).toBeDefined();
    });

    test('يجب أن يدعم إضافة الوقت', () => {
      const date = new Date();
      const formatted = formatArabicDate(date, { includeTime: true });
      
      expect(formatted.gregorian.formatted).toBeDefined();
    });
  });

  // اختبار تحويل الأرقام العربية
  describe('تحويل الأرقام العربية', () => {
    test('يجب أن يحول الأرقام بشكل صحيح', () => {
      expect(toArabicNumbers('0')).toBe('٠');
      expect(toArabicNumbers('1')).toBe('١');
      expect(toArabicNumbers('5')).toBe('٥');
      expect(toArabicNumbers('9')).toBe('٩');
    });

    test('يجب أن يحول سلسلة أرقام', () => {
      expect(toArabicNumbers('123')).toBe('١٢٣');
      expect(toArabicNumbers('2024')).toBe('٢٠٢٤');
    });

    test('يجب أن يحافظ على النص غير الرقمي', () => {
      expect(toArabicNumbers('مبلغ: 100')).toBe('مبلغ: ١٠٠');
    });
  });

  // اختبار تحويل المبلغ لكلمات
  describe('تحويل المبلغ لكلمات عربية', () => {
    test('يجب أن يحول صفر', () => {
      expect(amountToArabicWords(0)).toBe('صفر جنيه');
    });

    test('يجب أن يحول الآحاد', () => {
      const result = amountToArabicWords(5);
      expect(result).toContain('خمسة');
      expect(result).toContain('جنيه');
    });

    test('يجب أن يحول العشرات', () => {
      const result = amountToArabicWords(25);
      expect(result).toContain('خمسة');
      expect(result).toContain('عشرون');
    });

    test('يجب أن يحول المئات', () => {
      const result = amountToArabicWords(100);
      expect(result).toContain('مائة');
    });

    test('يجب أن يحول الآلاف', () => {
      const result = amountToArabicWords(1000);
      expect(result).toContain('ألف');
    });

    test('يجب أن يتعامل مع الكسور (القروش)', () => {
      const result = amountToArabicWords(100.50);
      expect(result).toContain('قرش');
    });
  });
});

// =====================================================
// اختبارات التكامل
// =====================================================

describe('اختبارات تكامل الدفع والفواتير', () => {
  
  describe('تدفق الدفع الكامل', () => {
    test('يجب أن تكون طرق الدفع متوافقة مع عملة EGP', () => {
      Object.values(LOCAL_PAYMENT_METHODS).forEach(method => {
        expect(method.currency).toBe('EGP');
      });
    });

    test('يجب أن تكون حالات الفاتورة متوافقة مع حالات الدفع', () => {
      // الفاتورة المدفوعة تتوافق مع الدفع المكتمل
      expect(INVOICE_STATUS.PAID).toBeDefined();
      expect(PAYMENT_MESSAGES.status.COMPLETED).toBeDefined();
      
      // الفاتورة المستردة تتوافق مع الدفع المسترد
      expect(INVOICE_STATUS.REFUNDED).toBeDefined();
      expect(PAYMENT_MESSAGES.status.REFUNDED).toBeDefined();
    });
  });

  describe('التاريخ الهجري في الفواتير', () => {
    test('يجب أن يكون التاريخ الهجري صحيحاً في الفواتير', () => {
      const currentDate = new Date();
      const dateInfo = formatArabicDate(currentDate);
      
      expect(dateInfo.hijri).toBeDefined();
      expect(dateInfo.hijri.year).toBeGreaterThan(1445);
      expect(dateInfo.combined).toContain('الموافق');
    });
  });

  describe('رسائل الخطأ بالعربية', () => {
    test('يجب أن تكون جميع رسائل الخطأ بالعربية', () => {
      Object.values(PAYMENT_MESSAGES.errors).forEach(message => {
        // التحقق من وجود حروف عربية
        expect(/[\u0600-\u06FF]/.test(message)).toBe(true);
      });
    });

    test('يجب أن تكون رسائل الحالات بالعربية', () => {
      Object.values(PAYMENT_MESSAGES.status).forEach(status => {
        expect(/[\u0600-\u06FF]/.test(status)).toBe(true);
      });
    });
  });
});

// =====================================================
// اختبارات الأداء
// =====================================================

describe('اختبارات الأداء', () => {
  
  test('يجب أن يكون تحويل التاريخ الهجري سريعاً', () => {
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      gregorianToHijri(new Date());
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // أقل من ثانية لـ 1000 تحويل
  });

  test('يجب أن يكون تحويل المبلغ لكلمات سريعاً', () => {
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      amountToArabicWords(Math.random() * 10000);
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('يجب أن يكون توليد الرقم المرجعي سريعاً', () => {
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      generatePaymentReference();
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});

// =====================================================
// اختبارات الحدود
// =====================================================

describe('اختبارات الحدود', () => {
  
  describe('حدود المبالغ', () => {
    test('يجب أن ترفض المبالغ السالبة', () => {
      const fee = calculateProcessingFee(-100, 'CARD');
      expect(fee).toBeLessThanOrEqual(0);
    });

    test('يجب أن تتعامل مع المبالغ الكبيرة', () => {
      const result = amountToArabicWords(999999);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('يجب أن تتعامل مع المبالغ الصغيرة جداً', () => {
      const result = amountToArabicWords(0.01);
      expect(result).toContain('قرش');
    });
  });

  describe('حدود التواريخ', () => {
    test('يجب أن يتعامل مع تواريخ قديمة', () => {
      const oldDate = new Date('1900-01-01');
      const result = gregorianToHijri(oldDate);
      expect(result).toBeDefined();
    });

    test('يجب أن يتعامل مع تواريخ مستقبلية', () => {
      const futureDate = new Date('2100-01-01');
      const result = gregorianToHijri(futureDate);
      expect(result).toBeDefined();
    });
  });
});

console.log('✅ تم تحميل اختبارات نظام الدفع والفواتير العربي');
