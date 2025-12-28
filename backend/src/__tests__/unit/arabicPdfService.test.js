/**
 * اختبارات خدمة PDF العربية
 * Arabic PDF Service Tests
 */

const arabicPdfService = require('../../services/arabicPdfService');
const fs = require('fs');
const path = require('path');

describe('Arabic PDF Service', () => {
  
  describe('Document Creation', () => {
    test('should create a new PDF document with default options', () => {
      const doc = arabicPdfService.createDocument();
      
      expect(doc).toBeDefined();
      expect(doc.page).toBeDefined();
      expect(doc.page.size).toBe('A4');
    });

    test('should create document with custom options', () => {
      const options = {
        size: 'LETTER',
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      };
      
      const doc = arabicPdfService.createDocument(options);
      
      expect(doc).toBeDefined();
      expect(doc.page.size).toBe('LETTER');
    });
  });

  describe('Arabic Text Handling', () => {
    let doc;

    beforeEach(() => {
      doc = arabicPdfService.createDocument();
    });

    test('should add Arabic text with RTL support', () => {
      const result = arabicPdfService.addArabicText(doc, 'مرحباً بكم في BreakApp', 50, 50);
      
      expect(result).toBe(doc);
      expect(doc.y).toBeGreaterThan(50);
    });

    test('should add Arabic title with proper formatting', () => {
      const result = arabicPdfService.addArabicTitle(doc, 'تقرير الطلبات اليومية');
      
      expect(result).toBe(doc);
      expect(doc.y).toBeGreaterThan(doc.page.margins.top);
    });

    test('should handle empty text gracefully', () => {
      expect(() => {
        arabicPdfService.addArabicText(doc, '', 50, 50);
      }).not.toThrow();
    });

    test('should handle null text gracefully', () => {
      expect(() => {
        arabicPdfService.addArabicText(doc, null, 50, 50);
      }).not.toThrow();
    });
  });

  describe('Table Generation', () => {
    let doc;

    beforeEach(() => {
      doc = arabicPdfService.createDocument();
    });

    test('should create Arabic table with headers and rows', () => {
      const headers = ['رقم الطلب', 'العميل', 'المبلغ'];
      const rows = [
        ['001', 'أحمد محمد', '150 ج.م'],
        ['002', 'فاطمة علي', '200 ج.م']
      ];

      const result = arabicPdfService.addArabicTable(doc, headers, rows);
      
      expect(result).toBe(doc);
      expect(doc.y).toBeGreaterThan(doc.page.margins.top);
    });

    test('should handle empty table data', () => {
      const headers = ['العنوان'];
      const rows = [];

      expect(() => {
        arabicPdfService.addArabicTable(doc, headers, rows);
      }).not.toThrow();
    });

    test('should handle mismatched header and row lengths', () => {
      const headers = ['العنوان الأول', 'العنوان الثاني'];
      const rows = [['قيمة واحدة فقط']];

      expect(() => {
        arabicPdfService.addArabicTable(doc, headers, rows);
      }).not.toThrow();
    });
  });

  describe('Company Header', () => {
    let doc;

    beforeEach(() => {
      doc = arabicPdfService.createDocument();
    });

    test('should add company header with default info', () => {
      const result = arabicPdfService.addCompanyHeader(doc);
      
      expect(result).toBe(doc);
      expect(doc.y).toBeGreaterThan(doc.page.margins.top);
    });

    test('should add company header with custom info', () => {
      const companyInfo = {
        nameAr: 'شركة الطعام المتميز',
        address: 'القاهرة، مصر',
        phone: '+20 123 456 7890',
        email: 'info@company.com'
      };

      const result = arabicPdfService.addCompanyHeader(doc, companyInfo);
      
      expect(result).toBe(doc);
    });
  });

  describe('Page Footer', () => {
    let doc;

    beforeEach(() => {
      doc = arabicPdfService.createDocument();
    });

    test('should add default footer', () => {
      const result = arabicPdfService.addPageFooter(doc);
      
      expect(result).toBe(doc);
    });

    test('should add custom footer text', () => {
      const customFooter = 'تقرير مخصص - شركة الطعام';
      const result = arabicPdfService.addPageFooter(doc, customFooter);
      
      expect(result).toBe(doc);
    });
  });

  describe('Orders Report Generation', () => {
    test('should generate orders report with sample data', async () => {
      const sampleOrders = [
        {
          orderNumber: 'ORD-001',
          customerName: 'أحمد محمد',
          restaurant: { name: 'مطعم الأصالة' },
          status: 'DELIVERED',
          totalAmount: 150,
          createdAt: new Date('2024-01-15')
        },
        {
          orderNumber: 'ORD-002',
          customerName: 'فاطمة علي',
          restaurant: { name: 'مطعم الذوق الرفيع' },
          status: 'PENDING',
          totalAmount: 200,
          createdAt: new Date('2024-01-15')
        }
      ];

      const doc = await arabicPdfService.generateOrdersReport(sampleOrders);
      
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });

    test('should handle empty orders array', async () => {
      const doc = await arabicPdfService.generateOrdersReport([]);
      
      expect(doc).toBeDefined();
    });

    test('should include company info in report', async () => {
      const sampleOrders = [{
        orderNumber: 'ORD-001',
        customerName: 'أحمد محمد',
        restaurant: { name: 'مطعم الأصالة' },
        status: 'DELIVERED',
        totalAmount: 150,
        createdAt: new Date()
      }];

      const options = {
        companyInfo: {
          nameAr: 'شركة الطعام المتميز',
          address: 'القاهرة، مصر'
        }
      };

      const doc = await arabicPdfService.generateOrdersReport(sampleOrders, options);
      
      expect(doc).toBeDefined();
    });
  });

  describe('Invoice Generation', () => {
    test('should generate invoice with sample order data', async () => {
      const sampleOrder = {
        orderNumber: 'ORD-001',
        customerName: 'أحمد محمد',
        customerEmail: 'ahmed@example.com',
        deliveryAddress: 'شارع النيل، القاهرة',
        items: [
          { name: 'برجر لحم', quantity: 2, price: 50 },
          { name: 'بطاطس مقلية', quantity: 1, price: 25 }
        ],
        totalAmount: 125,
        notes: 'بدون بصل'
      };

      const doc = await arabicPdfService.generateInvoice(sampleOrder);
      
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });

    test('should handle order without notes', async () => {
      const sampleOrder = {
        orderNumber: 'ORD-002',
        customerName: 'فاطمة علي',
        customerEmail: 'fatima@example.com',
        deliveryAddress: 'شارع التحرير، الجيزة',
        items: [
          { name: 'سلطة خضراء', quantity: 1, price: 30 }
        ],
        totalAmount: 30
      };

      const doc = await arabicPdfService.generateInvoice(sampleOrder);
      
      expect(doc).toBeDefined();
    });

    test('should handle empty items array', async () => {
      const sampleOrder = {
        orderNumber: 'ORD-003',
        customerName: 'محمد أحمد',
        customerEmail: 'mohamed@example.com',
        deliveryAddress: 'شارع الهرم، الجيزة',
        items: [],
        totalAmount: 0
      };

      expect(() => {
        arabicPdfService.generateInvoice(sampleOrder);
      }).not.toThrow();
    });
  });

  describe('Order Status Translation', () => {
    test('should translate order statuses correctly', () => {
      expect(arabicPdfService.translateOrderStatus('PENDING')).toBe('في الانتظار');
      expect(arabicPdfService.translateOrderStatus('CONFIRMED')).toBe('مؤكد');
      expect(arabicPdfService.translateOrderStatus('PREPARING')).toBe('قيد التحضير');
      expect(arabicPdfService.translateOrderStatus('OUT_FOR_DELIVERY')).toBe('في الطريق');
      expect(arabicPdfService.translateOrderStatus('DELIVERED')).toBe('تم التوصيل');
      expect(arabicPdfService.translateOrderStatus('CANCELLED')).toBe('ملغي');
    });

    test('should return original status for unknown values', () => {
      expect(arabicPdfService.translateOrderStatus('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
      expect(arabicPdfService.translateOrderStatus('')).toBe('');
      expect(arabicPdfService.translateOrderStatus(null)).toBe(null);
    });
  });

  describe('PDF Buffer Operations', () => {
    test('should convert PDF to buffer', async () => {
      const doc = arabicPdfService.createDocument();
      arabicPdfService.addArabicText(doc, 'نص تجريبي', 50, 50);
      
      const buffer = await arabicPdfService.pdfToBuffer(doc);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('should handle empty document', async () => {
      const doc = arabicPdfService.createDocument();
      
      const buffer = await arabicPdfService.pdfToBuffer(doc);
      
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid document gracefully', () => {
      expect(() => {
        arabicPdfService.addArabicText(null, 'نص', 50, 50);
      }).toThrow();
    });

    test('should handle invalid coordinates', () => {
      const doc = arabicPdfService.createDocument();
      
      expect(() => {
        arabicPdfService.addArabicText(doc, 'نص', 'invalid', 'invalid');
      }).not.toThrow();
    });

    test('should handle very long text', () => {
      const doc = arabicPdfService.createDocument();
      const longText = 'نص طويل جداً '.repeat(1000);
      
      expect(() => {
        arabicPdfService.addArabicText(doc, longText, 50, 50);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should generate large report efficiently', async () => {
      const largeOrdersArray = Array.from({ length: 1000 }, (_, i) => ({
        orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
        customerName: `عميل رقم ${i + 1}`,
        restaurant: { name: `مطعم رقم ${(i % 10) + 1}` },
        status: ['PENDING', 'DELIVERED', 'CANCELLED'][i % 3],
        totalAmount: Math.floor(Math.random() * 500) + 50,
        createdAt: new Date()
      }));

      const startTime = Date.now();
      const doc = await arabicPdfService.generateOrdersReport(largeOrdersArray);
      const endTime = Date.now();
      
      expect(doc).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle multiple concurrent report generations', async () => {
      const sampleOrder = {
        orderNumber: 'ORD-001',
        customerName: 'أحمد محمد',
        customerEmail: 'ahmed@example.com',
        deliveryAddress: 'شارع النيل، القاهرة',
        items: [{ name: 'برجر', quantity: 1, price: 50 }],
        totalAmount: 50
      };

      const promises = Array.from({ length: 5 }, () => 
        arabicPdfService.generateInvoice(sampleOrder)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(doc => {
        expect(doc).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    test('should work with real-world Arabic text', async () => {
      const arabicText = 'مرحباً بكم في تطبيق BreakApp لطلب الطعام. نحن نقدم أفضل الخدمات لعملائنا الكرام.';
      const doc = arabicPdfService.createDocument();
      
      expect(() => {
        arabicPdfService.addArabicText(doc, arabicText, 50, 50);
      }).not.toThrow();
    });

    test('should handle mixed Arabic and English text', async () => {
      const mixedText = 'مرحباً Welcome أهلاً وسهلاً Hello مع السلامة Goodbye';
      const doc = arabicPdfService.createDocument();
      
      expect(() => {
        arabicPdfService.addArabicText(doc, mixedText, 50, 50);
      }).not.toThrow();
    });

    test('should handle Arabic numbers and dates', async () => {
      const doc = arabicPdfService.createDocument();
      const dateText = 'التاريخ: ١٥ يناير ٢٠٢٤ - الوقت: ٢:٣٠ م';
      
      expect(() => {
        arabicPdfService.addArabicText(doc, dateText, 50, 50);
      }).not.toThrow();
    });
  });
});