const db = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { formatArabicNumber, formatArabicDate } = require('../utils/arabicFormatters');

/**
 * خدمة إدارة الفواتير
 */
class InvoiceService {
  /**
   * إنشاء فاتورة جديدة
   */
  async createInvoice(invoiceData) {
    try {
      const {
        userId,
        orderId,
        amount,
        tax,
        total,
        paymentId,
        status = 'pending',
        items = []
      } = invoiceData;

      // إنشاء رقم فاتورة فريد
      const invoiceNumber = await this.generateInvoiceNumber();

      const query = `
        INSERT INTO invoices 
        (invoice_number, user_id, order_id, amount, tax, total, payment_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.query(query, [
        invoiceNumber,
        userId,
        orderId,
        amount,
        tax,
        total,
        paymentId,
        status
      ]);

      const invoiceId = result.insertId;

      // إضافة عناصر الفاتورة
      if (items.length > 0) {
        await this.addInvoiceItems(invoiceId, items);
      }

      return {
        id: invoiceId,
        invoiceNumber,
        userId,
        orderId,
        amount,
        tax,
        total,
        status,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('خطأ في إنشاء الفاتورة:', error);
      throw error;
    }
  }

  /**
   * إضافة عناصر الفاتورة
   */
  async addInvoiceItems(invoiceId, items) {
    try {
      const query = `
        INSERT INTO invoice_items 
        (invoice_id, name, description, quantity, price, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (const item of items) {
        await db.query(query, [
          invoiceId,
          item.name,
          item.description || '',
          item.quantity,
          item.price,
          item.quantity * item.price
        ]);
      }
    } catch (error) {
      logger.error('خطأ في إضافة عناصر الفاتورة:', error);
      throw error;
    }
  }

  /**
   * الحصول على فواتير المستخدم
   */
  async getUserInvoices(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;

      let whereConditions = ['user_id = ?'];
      let queryParams = [userId];

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      const whereClause = whereConditions.join(' AND ');

      // جلب الفواتير
      const query = `
        SELECT 
          id,
          invoice_number as orderNumber,
          amount,
          tax,
          total,
          status,
          created_at as createdAt,
          paid_at as paidAt
        FROM invoices 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const invoices = await db.query(query, queryParams);

      // جلب العدد الإجمالي
      const countQuery = `
        SELECT COUNT(*) as total
        FROM invoices 
        WHERE ${whereClause}
      `;

      const [{ total }] = await db.query(countQuery, queryParams.slice(0, -2));

      // جلب عناصر كل فاتورة
      for (const invoice of invoices) {
        invoice.items = await this.getInvoiceItems(invoice.id);
      }

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('خطأ في جلب فواتير المستخدم:', error);
      throw error;
    }
  }

  /**
   * الحصول على تفاصيل فاتورة محددة
   */
  async getInvoiceDetails(invoiceId, userId) {
    try {
      const query = `
        SELECT 
          id,
          invoice_number as orderNumber,
          user_id as userId,
          order_id as orderId,
          amount,
          tax,
          total,
          payment_id as paymentId,
          status,
          created_at as createdAt,
          paid_at as paidAt
        FROM invoices 
        WHERE id = ? AND user_id = ?
      `;

      const [invoice] = await db.query(query, [invoiceId, userId]);
      if (!invoice) return null;

      // جلب عناصر الفاتورة
      invoice.items = await this.getInvoiceItems(invoiceId);

      return invoice;
    } catch (error) {
      logger.error('خطأ في جلب تفاصيل الفاتورة:', error);
      throw error;
    }
  }

  /**
   * الحصول على عناصر الفاتورة
   */
  async getInvoiceItems(invoiceId) {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          quantity,
          price,
          total
        FROM invoice_items 
        WHERE invoice_id = ?
        ORDER BY id
      `;

      return await db.query(query, [invoiceId]);
    } catch (error) {
      logger.error('خطأ في جلب عناصر الفاتورة:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة الفاتورة
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      const query = `
        UPDATE invoices 
        SET status = ?, 
            paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
            updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [status, status, invoiceId]);
      return true;
    } catch (error) {
      logger.error('خطأ في تحديث حالة الفاتورة:', error);
      throw error;
    }
  }

  /**
   * إنشاء PDF للفاتورة
   */
  async generateInvoicePDF(invoice, language = 'ar') {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `فاتورة رقم ${invoice.orderNumber}`,
            Author: 'BreakApp',
            Subject: 'فاتورة',
            Keywords: 'فاتورة, دفع, BreakApp'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // إعداد الخط العربي
        const arabicFontPath = path.join(__dirname, '../../assets/fonts/NotoSansArabic-Regular.ttf');
        if (fs.existsSync(arabicFontPath)) {
          doc.registerFont('Arabic', arabicFontPath);
          doc.font('Arabic');
        }

        // رأس الفاتورة
        this.addInvoiceHeader(doc, invoice);

        // معلومات الفاتورة
        this.addInvoiceInfo(doc, invoice);

        // جدول العناصر
        this.addInvoiceItemsTable(doc, invoice);

        // المجاميع
        this.addInvoiceTotals(doc, invoice);

        // تذييل الفاتورة
        this.addInvoiceFooter(doc, invoice);

        doc.end();
      });
    } catch (error) {
      logger.error('خطأ في إنشاء PDF الفاتورة:', error);
      throw error;
    }
  }

  /**
   * إضافة رأس الفاتورة
   */
  addInvoiceHeader(doc, invoice) {
    // شعار الشركة (إذا كان متوفراً)
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 100 });
    }

    // معلومات الشركة
    doc.fontSize(20)
       .text('BreakApp', 400, 50, { align: 'right' })
       .fontSize(12)
       .text('تطبيق توصيل الطعام', 400, 80, { align: 'right' })
       .text('المملكة العربية السعودية', 400, 95, { align: 'right' })
       .text('الرقم الضريبي: 123456789', 400, 110, { align: 'right' });

    // عنوان الفاتورة
    doc.fontSize(24)
       .text('فاتورة', 50, 150, { align: 'center' });

    // خط فاصل
    doc.moveTo(50, 180)
       .lineTo(550, 180)
       .stroke();
  }

  /**
   * إضافة معلومات الفاتورة
   */
  addInvoiceInfo(doc, invoice) {
    const startY = 200;

    // معلومات الفاتورة - الجانب الأيمن
    doc.fontSize(12)
       .text(`رقم الفاتورة: ${formatArabicNumber(invoice.orderNumber)}`, 350, startY, { align: 'right' })
       .text(`تاريخ الإصدار: ${formatArabicDate(invoice.createdAt)}`, 350, startY + 20, { align: 'right' });

    if (invoice.paidAt) {
      doc.text(`تاريخ الدفع: ${formatArabicDate(invoice.paidAt)}`, 350, startY + 40, { align: 'right' });
    }

    // حالة الفاتورة
    const statusText = this.getStatusText(invoice.status);
    doc.text(`الحالة: ${statusText}`, 350, startY + 60, { align: 'right' });

    // معلومات العميل - الجانب الأيسر
    doc.text('بيانات العميل:', 50, startY)
       .text(`رقم العميل: ${formatArabicNumber(invoice.userId)}`, 50, startY + 20);
  }

  /**
   * إضافة جدول العناصر
   */
  addInvoiceItemsTable(doc, invoice) {
    const startY = 320;
    const tableTop = startY;
    const itemHeight = 25;

    // رأس الجدول
    doc.fontSize(12)
       .text('المجموع', 50, tableTop, { width: 80, align: 'center' })
       .text('السعر', 140, tableTop, { width: 80, align: 'center' })
       .text('الكمية', 230, tableTop, { width: 60, align: 'center' })
       .text('الوصف', 300, tableTop, { width: 250, align: 'right' });

    // خط تحت الرأس
    doc.moveTo(50, tableTop + 20)
       .lineTo(550, tableTop + 20)
       .stroke();

    // عناصر الفاتورة
    let currentY = tableTop + 30;
    invoice.items.forEach((item, index) => {
      doc.text(formatArabicNumber(item.total.toFixed(2)), 50, currentY, { width: 80, align: 'center' })
         .text(formatArabicNumber(item.price.toFixed(2)), 140, currentY, { width: 80, align: 'center' })
         .text(formatArabicNumber(item.quantity), 230, currentY, { width: 60, align: 'center' })
         .text(item.name, 300, currentY, { width: 250, align: 'right' });

      currentY += itemHeight;

      // خط فاصل بين العناصر
      if (index < invoice.items.length - 1) {
        doc.moveTo(50, currentY - 5)
           .lineTo(550, currentY - 5)
           .strokeOpacity(0.3)
           .stroke()
           .strokeOpacity(1);
      }
    });

    return currentY;
  }

  /**
   * إضافة المجاميع
   */
  addInvoiceTotals(doc, invoice) {
    const startY = 500;

    // خط فاصل
    doc.moveTo(350, startY)
       .lineTo(550, startY)
       .stroke();

    // المبلغ الأساسي
    doc.fontSize(12)
       .text('المبلغ الأساسي:', 450, startY + 20, { align: 'right' })
       .text(`${formatArabicNumber(invoice.amount.toFixed(2))} ريال`, 350, startY + 20, { align: 'right' });

    // الضريبة
    doc.text('ضريبة القيمة المضافة (15%):', 450, startY + 40, { align: 'right' })
       .text(`${formatArabicNumber(invoice.tax.toFixed(2))} ريال`, 350, startY + 40, { align: 'right' });

    // خط فاصل قبل المجموع
    doc.moveTo(350, startY + 60)
       .lineTo(550, startY + 60)
       .stroke();

    // المجموع الكلي
    doc.fontSize(14)
       .text('المجموع الكلي:', 450, startY + 80, { align: 'right' })
       .text(`${formatArabicNumber(invoice.total.toFixed(2))} ريال`, 350, startY + 80, { align: 'right' });
  }

  /**
   * إضافة تذييل الفاتورة
   */
  addInvoiceFooter(doc, invoice) {
    const footerY = 700;

    // خط فاصل
    doc.moveTo(50, footerY)
       .lineTo(550, footerY)
       .stroke();

    // نص التذييل
    doc.fontSize(10)
       .text('شكراً لاستخدامكم تطبيق BreakApp', 50, footerY + 20, { align: 'center' })
       .text('للاستفسارات: support@breakapp.com | 920000000', 50, footerY + 35, { align: 'center' });

    // QR Code للفاتورة (اختياري)
    const qrText = `Invoice: ${invoice.orderNumber}, Amount: ${invoice.total} SAR`;
    doc.text(`QR: ${qrText}`, 50, footerY + 55, { align: 'center', fontSize: 8 });
  }

  /**
   * إنشاء رقم فاتورة فريد
   */
  async generateInvoiceNumber() {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // الحصول على آخر رقم فاتورة لهذا الشهر
      const query = `
        SELECT MAX(CAST(SUBSTRING(invoice_number, -6) AS UNSIGNED)) as lastNumber
        FROM invoices 
        WHERE invoice_number LIKE ?
      `;
      
      const prefix = `INV-${year}${month}`;
      const [result] = await db.query(query, [`${prefix}%`]);
      
      const nextNumber = (result.lastNumber || 0) + 1;
      const paddedNumber = String(nextNumber).padStart(6, '0');
      
      return `${prefix}-${paddedNumber}`;
    } catch (error) {
      logger.error('خطأ في إنشاء رقم الفاتورة:', error);
      // رقم احتياطي في حالة الخطأ
      return `INV-${Date.now()}`;
    }
  }

  /**
   * الحصول على نص الحالة
   */
  getStatusText(status) {
    const statusMap = {
      pending: 'في الانتظار',
      paid: 'مدفوعة',
      failed: 'فشلت',
      refunded: 'مستردة',
      cancelled: 'ملغية'
    };
    return statusMap[status] || status;
  }

  /**
   * الحصول على إحصائيات الفواتير
   */
  async getInvoiceStats(userId, period = 'month') {
    try {
      let dateCondition = '';
      
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
          COUNT(*) as totalInvoices,
          SUM(total) as totalAmount,
          AVG(total) as averageAmount,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidInvoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingInvoices,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedInvoices,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refundedInvoices
        FROM invoices 
        WHERE user_id = ? AND ${dateCondition}
      `;

      const [stats] = await db.query(query, [userId]);

      return {
        ...stats,
        paymentRate: stats.totalInvoices > 0 
          ? (stats.paidInvoices / stats.totalInvoices * 100).toFixed(2)
          : 0,
        period
      };
    } catch (error) {
      logger.error('خطأ في جلب إحصائيات الفواتير:', error);
      throw error;
    }
  }

  /**
   * البحث في الفواتير
   */
  async searchInvoices(userId, searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          id,
          invoice_number as orderNumber,
          amount,
          tax,
          total,
          status,
          created_at as createdAt,
          paid_at as paidAt
        FROM invoices 
        WHERE user_id = ? AND (
          invoice_number LIKE ? OR
          order_id LIKE ? OR
          CAST(total AS CHAR) LIKE ?
        )
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const invoices = await db.query(query, [
        userId,
        searchPattern,
        searchPattern,
        searchPattern,
        limit,
        offset
      ]);

      // جلب العدد الإجمالي
      const countQuery = `
        SELECT COUNT(*) as total
        FROM invoices 
        WHERE user_id = ? AND (
          invoice_number LIKE ? OR
          order_id LIKE ? OR
          CAST(total AS CHAR) LIKE ?
        )
      `;

      const [{ total }] = await db.query(countQuery, [
        userId,
        searchPattern,
        searchPattern,
        searchPattern
      ]);

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('خطأ في البحث في الفواتير:', error);
      throw error;
    }
  }
}

module.exports = new InvoiceService();