/**
 * خدمة إنشاء PDF العربية
 * Arabic PDF Generation Service with RTL support
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ArabicPdfService {
  constructor() {
    // مسار الخطوط العربية
    this.arabicFontPath = path.join(__dirname, '../assets/fonts/NotoSansArabic-Regular.ttf');
    this.arabicBoldFontPath = path.join(__dirname, '../assets/fonts/NotoSansArabic-Bold.ttf');
    
    // إعدادات افتراضية
    this.defaultOptions = {
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      rtl: true,
      language: 'ar'
    };
  }

  /**
   * إنشاء مستند PDF جديد
   */
  createDocument(options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    const doc = new PDFDocument({
      size: config.size,
      margins: config.margins,
      bufferPages: true
    });

    // تسجيل الخطوط العربية
    try {
      if (fs.existsSync(this.arabicFontPath)) {
        doc.registerFont('Arabic', this.arabicFontPath);
      }
      if (fs.existsSync(this.arabicBoldFontPath)) {
        doc.registerFont('ArabicBold', this.arabicBoldFontPath);
      }
    } catch (error) {
      console.warn('تحذير: لم يتم العثور على الخطوط العربية، سيتم استخدام الخط الافتراضي');
    }

    return doc;
  }

  /**
   * إضافة نص عربي مع دعم RTL
   */
  addArabicText(doc, text, x, y, options = {}) {
    const defaultOptions = {
      font: 'Arabic',
      fontSize: 12,
      align: 'right',
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      rtl: true
    };

    const textOptions = { ...defaultOptions, ...options };

    // تطبيق الخط العربي إذا كان متوفراً
    if (doc._registeredFonts && doc._registeredFonts['Arabic']) {
      doc.font('Arabic');
    }

    // إضافة النص
    doc.fontSize(textOptions.fontSize)
       .text(text, x, y, {
         width: textOptions.width,
         align: textOptions.align,
         rtl: textOptions.rtl
       });

    return doc;
  }

  /**
   * إضافة عنوان عربي
   */
  addArabicTitle(doc, title, options = {}) {
    const defaultOptions = {
      font: 'ArabicBold',
      fontSize: 18,
      align: 'center',
      color: '#333333'
    };

    const titleOptions = { ...defaultOptions, ...options };

    if (doc._registeredFonts && doc._registeredFonts['ArabicBold']) {
      doc.font('ArabicBold');
    }

    doc.fontSize(titleOptions.fontSize)
       .fillColor(titleOptions.color)
       .text(title, doc.page.margins.left, doc.y, {
         width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
         align: titleOptions.align
       });

    doc.moveDown(1);
    return doc;
  }

  /**
   * إضافة جدول عربي
   */
  addArabicTable(doc, headers, rows, options = {}) {
    const defaultOptions = {
      headerFont: 'ArabicBold',
      bodyFont: 'Arabic',
      headerFontSize: 12,
      bodyFontSize: 10,
      headerColor: '#ffffff',
      headerBgColor: '#4a5568',
      borderColor: '#e2e8f0',
      cellPadding: 8,
      rowHeight: 30
    };

    const tableOptions = { ...defaultOptions, ...options };
    
    const startX = doc.page.margins.left;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = tableWidth / headers.length;
    
    let currentY = doc.y;

    // رسم رأس الجدول
    doc.rect(startX, currentY, tableWidth, tableOptions.rowHeight)
       .fillAndStroke(tableOptions.headerBgColor, tableOptions.borderColor);

    // إضافة نصوص رأس الجدول
    if (doc._registeredFonts && doc._registeredFonts['ArabicBold']) {
      doc.font('ArabicBold');
    }
    
    doc.fontSize(tableOptions.headerFontSize)
       .fillColor(tableOptions.headerColor);

    headers.forEach((header, index) => {
      const cellX = startX + (headers.length - 1 - index) * columnWidth; // RTL
      doc.text(header, cellX + tableOptions.cellPadding, currentY + tableOptions.cellPadding, {
        width: columnWidth - (tableOptions.cellPadding * 2),
        align: 'center'
      });
    });

    currentY += tableOptions.rowHeight;

    // رسم صفوف الجدول
    if (doc._registeredFonts && doc._registeredFonts['Arabic']) {
      doc.font('Arabic');
    }
    
    doc.fontSize(tableOptions.bodyFontSize)
       .fillColor('#000000');

    rows.forEach((row, rowIndex) => {
      // رسم خلفية الصف
      const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f7fafc';
      doc.rect(startX, currentY, tableWidth, tableOptions.rowHeight)
         .fillAndStroke(bgColor, tableOptions.borderColor);

      // إضافة نصوص الصف
      row.forEach((cell, cellIndex) => {
        const cellX = startX + (row.length - 1 - cellIndex) * columnWidth; // RTL
        doc.text(String(cell), cellX + tableOptions.cellPadding, currentY + tableOptions.cellPadding, {
          width: columnWidth - (tableOptions.cellPadding * 2),
          align: 'center'
        });
      });

      currentY += tableOptions.rowHeight;
    });

    doc.y = currentY + 10;
    return doc;
  }

  /**
   * إضافة معلومات الشركة
   */
  addCompanyHeader(doc, companyInfo) {
    const defaultCompanyInfo = {
      name: 'BreakApp',
      nameAr: 'بريك آب',
      address: 'العنوان',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      website: 'الموقع الإلكتروني'
    };

    const info = { ...defaultCompanyInfo, ...companyInfo };

    // شعار الشركة (إذا كان متوفراً)
    if (info.logo && fs.existsSync(info.logo)) {
      doc.image(info.logo, doc.page.margins.left, doc.y, { width: 100 });
    }

    // معلومات الشركة
    doc.fontSize(16)
       .text(info.nameAr, doc.page.width - 200, doc.y, {
         width: 150,
         align: 'right'
       });

    doc.fontSize(10)
       .text(info.address, doc.page.width - 200, doc.y + 5, {
         width: 150,
         align: 'right'
       })
       .text(`هاتف: ${info.phone}`, doc.page.width - 200, doc.y + 5, {
         width: 150,
         align: 'right'
       })
       .text(`بريد: ${info.email}`, doc.page.width - 200, doc.y + 5, {
         width: 150,
         align: 'right'
       });

    doc.moveDown(2);
    return doc;
  }

  /**
   * إضافة تذييل الصفحة
   */
  addPageFooter(doc, footerText = null) {
    const defaultFooter = `تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')} - BreakApp`;
    const footer = footerText || defaultFooter;

    doc.fontSize(8)
       .fillColor('#666666')
       .text(footer, doc.page.margins.left, doc.page.height - doc.page.margins.bottom, {
         width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
         align: 'center'
       });

    return doc;
  }

  /**
   * إنشاء تقرير الطلبات
   */
  async generateOrdersReport(orders, options = {}) {
    const doc = this.createDocument();
    
    // إضافة رأس الشركة
    this.addCompanyHeader(doc, options.companyInfo);
    
    // إضافة عنوان التقرير
    this.addArabicTitle(doc, 'تقرير الطلبات');
    
    // إضافة معلومات التقرير
    const reportDate = new Date().toLocaleDateString('ar-EG');
    this.addArabicText(doc, `تاريخ التقرير: ${reportDate}`, doc.page.margins.left, doc.y);
    this.addArabicText(doc, `عدد الطلبات: ${orders.length}`, doc.page.margins.left, doc.y + 5);
    
    doc.moveDown(1);

    // إضافة جدول الطلبات
    const headers = ['رقم الطلب', 'العميل', 'المطعم', 'الحالة', 'المبلغ', 'التاريخ'];
    const rows = orders.map(order => [
      order.orderNumber,
      order.customerName,
      order.restaurant?.name || 'غير محدد',
      this.translateOrderStatus(order.status),
      `${order.totalAmount} ج.م`,
      new Date(order.createdAt).toLocaleDateString('ar-EG')
    ]);

    this.addArabicTable(doc, headers, rows);

    // إضافة إحصائيات
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgAmount = orders.length > 0 ? totalAmount / orders.length : 0;

    doc.moveDown(1);
    this.addArabicText(doc, `إجمالي المبلغ: ${totalAmount.toLocaleString('ar-EG')} ج.م`, doc.page.margins.left, doc.y);
    this.addArabicText(doc, `متوسط قيمة الطلب: ${avgAmount.toFixed(2)} ج.م`, doc.page.margins.left, doc.y + 5);

    // إضافة التذييل
    this.addPageFooter(doc);

    return doc;
  }

  /**
   * إنشاء فاتورة
   */
  async generateInvoice(order, options = {}) {
    const doc = this.createDocument();
    
    // إضافة رأس الشركة
    this.addCompanyHeader(doc, options.companyInfo);
    
    // إضافة عنوان الفاتورة
    this.addArabicTitle(doc, 'فاتورة');
    
    // معلومات الفاتورة
    const invoiceDate = new Date().toLocaleDateString('ar-EG');
    this.addArabicText(doc, `رقم الفاتورة: ${order.orderNumber}`, doc.page.margins.left, doc.y);
    this.addArabicText(doc, `تاريخ الفاتورة: ${invoiceDate}`, doc.page.margins.left, doc.y + 5);
    
    doc.moveDown(1);

    // معلومات العميل
    this.addArabicText(doc, 'معلومات العميل:', doc.page.margins.left, doc.y, { fontSize: 14, font: 'ArabicBold' });
    this.addArabicText(doc, `الاسم: ${order.customerName}`, doc.page.margins.left, doc.y + 5);
    this.addArabicText(doc, `البريد: ${order.customerEmail}`, doc.page.margins.left, doc.y + 5);
    this.addArabicText(doc, `العنوان: ${order.deliveryAddress}`, doc.page.margins.left, doc.y + 5);
    
    doc.moveDown(1);

    // جدول العناصر
    const headers = ['الصنف', 'الكمية', 'السعر', 'الإجمالي'];
    const rows = order.items.map(item => [
      item.name,
      item.quantity.toString(),
      `${item.price} ج.م`,
      `${(item.quantity * item.price).toFixed(2)} ج.م`
    ]);

    this.addArabicTable(doc, headers, rows);

    // إجمالي الفاتورة
    doc.moveDown(1);
    this.addArabicText(doc, `الإجمالي: ${order.totalAmount.toLocaleString('ar-EG')} ج.م`, 
      doc.page.width - 200, doc.y, { fontSize: 16, font: 'ArabicBold', align: 'right' });

    // ملاحظات
    if (order.notes) {
      doc.moveDown(1);
      this.addArabicText(doc, 'ملاحظات:', doc.page.margins.left, doc.y, { fontSize: 12, font: 'ArabicBold' });
      this.addArabicText(doc, order.notes, doc.page.margins.left, doc.y + 5);
    }

    // إضافة التذييل
    this.addPageFooter(doc);

    return doc;
  }

  /**
   * ترجمة حالة الطلب
   */
  translateOrderStatus(status) {
    const statusMap = {
      'PENDING': 'في الانتظار',
      'CONFIRMED': 'مؤكد',
      'PREPARING': 'قيد التحضير',
      'OUT_FOR_DELIVERY': 'في الطريق',
      'DELIVERED': 'تم التوصيل',
      'CANCELLED': 'ملغي'
    };
    return statusMap[status] || status;
  }

  /**
   * حفظ PDF في ملف
   */
  async savePdfToFile(doc, filePath) {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc.end();
      
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * تحويل PDF إلى Buffer
   */
  async pdfToBuffer(doc) {
    return new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      doc.end();
    });
  }
}

module.exports = new ArabicPdfService();