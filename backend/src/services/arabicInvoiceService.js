/**
 * خدمة الفواتير العربية
 * Arabic Invoice Service with Hijri Date Support and RTL
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const arabicPdfService = require('./arabicPdfService');

const prisma = new PrismaClient();

/**
 * الشهور الهجرية
 */
const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

/**
 * الشهور الميلادية بالعربية
 */
const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

/**
 * حالات الفاتورة بالعربية
 */
const INVOICE_STATUS = {
  DRAFT: { name: 'مسودة', color: '#6B7280' },
  PENDING: { name: 'في انتظار الدفع', color: '#F59E0B' },
  PAID: { name: 'مدفوعة', color: '#10B981' },
  OVERDUE: { name: 'متأخرة', color: '#EF4444' },
  CANCELLED: { name: 'ملغاة', color: '#6B7280' },
  REFUNDED: { name: 'مستردة', color: '#8B5CF6' }
};

/**
 * تحويل التاريخ الميلادي إلى هجري
 * @param {Date} date - التاريخ الميلادي
 * @returns {Object} - التاريخ الهجري
 */
const gregorianToHijri = (date) => {
  try {
    const d = new Date(date);
    
    // خوارزمية التحويل
    const jd = Math.floor((d.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const ll = l - 10631 * n + 354;
    const j = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) + 
              Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
    const lll = ll - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - 
                Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    
    const month = Math.floor((24 * lll) / 709);
    const day = lll - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    return {
      day,
      month,
      year,
      monthName: HIJRI_MONTHS[month - 1],
      formatted: `${day} ${HIJRI_MONTHS[month - 1]} ${year} هـ`,
      shortFormatted: `${day}/${month}/${year} هـ`
    };
  } catch (error) {
    logger.error(`خطأ في تحويل التاريخ الهجري: ${error.message}`);
    return null;
  }
};

/**
 * تنسيق التاريخ بالعربية
 * @param {Date} date - التاريخ
 * @param {Object} options - خيارات التنسيق
 * @returns {Object} - التواريخ المنسقة
 */
const formatArabicDate = (date, options = {}) => {
  const d = new Date(date);
  const hijri = gregorianToHijri(d);

  const gregorianFormatted = d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(options.includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  const weekday = d.toLocaleDateString('ar-EG', { weekday: 'long' });

  return {
    gregorian: {
      formatted: gregorianFormatted,
      day: d.getDate(),
      month: d.getMonth() + 1,
      monthName: GREGORIAN_MONTHS_AR[d.getMonth()],
      year: d.getFullYear(),
      weekday
    },
    hijri,
    combined: `${gregorianFormatted} الموافق ${hijri?.formatted || ''}`
  };
};

/**
 * توليد رقم فاتورة فريد
 */
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

/**
 * تحويل الأرقام إلى الأرقام العربية
 */
const toArabicNumbers = (num) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
};

/**
 * تحويل المبلغ إلى كلمات عربية
 */
const amountToArabicWords = (amount) => {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];

  const num = Math.floor(amount);
  const decimal = Math.round((amount - num) * 100);

  if (num === 0) return 'صفر جنيه';

  let words = '';
  
  // الآلاف
  if (num >= 1000) {
    const thousandPart = Math.floor(num / 1000);
    if (thousandPart < 10) {
      words += thousands[thousandPart] + ' ';
    } else {
      words += thousandPart + ' ألف ';
    }
  }

  // المئات
  const remainder = num % 1000;
  const hundredPart = Math.floor(remainder / 100);
  if (hundredPart > 0) {
    words += hundreds[hundredPart] + ' ';
  }

  // العشرات والآحاد
  const tensRemainder = remainder % 100;
  if (tensRemainder >= 10 && tensRemainder < 20) {
    words += teens[tensRemainder - 10] + ' ';
  } else {
    const tenPart = Math.floor(tensRemainder / 10);
    const onePart = tensRemainder % 10;
    
    if (onePart > 0) {
      words += ones[onePart] + ' ';
      if (tenPart > 0) {
        words += 'و' + tens[tenPart] + ' ';
      }
    } else if (tenPart > 0) {
      words += tens[tenPart] + ' ';
    }
  }

  words += 'جنيهاً';

  if (decimal > 0) {
    words += ` و${decimal} قرشاً`;
  }

  return words.trim();
};

/**
 * إنشاء فاتورة عربية
 */
const createArabicInvoice = async (invoiceData) => {
  try {
    const {
      userId,
      orderId,
      paymentId,
      items = [],
      subtotal,
      tax = 0,
      discount = 0,
      deliveryFee = 0,
      notes,
      dueDate,
      customerInfo
    } = invoiceData;

    // التحقق من البيانات
    if (!userId || !items.length) {
      return {
        success: false,
        error: 'بيانات الفاتورة غير مكتملة'
      };
    }

    // حساب المبلغ الإجمالي
    const calculatedSubtotal = subtotal || items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const taxAmount = (calculatedSubtotal * tax) / 100;
    const discountAmount = (calculatedSubtotal * discount) / 100;
    const totalAmount = calculatedSubtotal + taxAmount - discountAmount + deliveryFee;

    // توليد رقم الفاتورة
    const invoiceNumber = await generateInvoiceNumber();

    // تنسيق التواريخ
    const currentDate = formatArabicDate(new Date());
    const formattedDueDate = dueDate ? formatArabicDate(new Date(dueDate)) : null;

    // إنشاء الفاتورة
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        orderId,
        paymentId,
        invoiceNumber,
        items: items.map(item => ({
          name: item.name,
          nameAr: item.nameAr || item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
          notes: item.notes
        })),
        subtotal: calculatedSubtotal,
        tax: taxAmount,
        taxRate: tax,
        discount: discountAmount,
        discountRate: discount,
        deliveryFee,
        totalAmount,
        currency: 'EGP',
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        metadata: {
          createdDateAr: currentDate.combined,
          hijriDate: currentDate.hijri,
          dueDateAr: formattedDueDate?.combined,
          amountInWords: amountToArabicWords(totalAmount),
          customerInfo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        order: orderId ? {
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        } : false,
        payment: paymentId ? true : false
      }
    });

    logger.info(`تم إنشاء فاتورة عربية: ${invoice.invoiceNumber}`);

    return {
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: formatInvoiceResponse(invoice)
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء الفاتورة العربية: ${error.message}`);
    return {
      success: false,
      error: 'فشل في إنشاء الفاتورة'
    };
  }
};

/**
 * تنسيق استجابة الفاتورة
 */
const formatInvoiceResponse = (invoice) => {
  const dateInfo = formatArabicDate(invoice.createdAt);
  const dueDateInfo = invoice.dueDate ? formatArabicDate(invoice.dueDate) : null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceNumberAr: toArabicNumbers(invoice.invoiceNumber.replace(/[^0-9]/g, '')),
    
    // التواريخ
    createdAt: invoice.createdAt,
    createdAtFormatted: dateInfo.gregorian.formatted,
    createdAtHijri: dateInfo.hijri?.formatted,
    createdAtCombined: dateInfo.combined,
    
    dueDate: invoice.dueDate,
    dueDateFormatted: dueDateInfo?.gregorian.formatted,
    dueDateHijri: dueDateInfo?.hijri?.formatted,
    
    // العناصر
    items: invoice.items?.map(item => ({
      ...item,
      unitPriceFormatted: `${item.unitPrice.toLocaleString('ar-EG')} ج.م`,
      totalFormatted: `${item.total.toLocaleString('ar-EG')} ج.م`
    })) || [],
    
    // المبالغ
    subtotal: invoice.subtotal,
    subtotalFormatted: `${invoice.subtotal?.toLocaleString('ar-EG') || 0} ج.م`,
    
    tax: invoice.tax,
    taxRate: invoice.taxRate,
    taxFormatted: `${invoice.tax?.toLocaleString('ar-EG') || 0} ج.م`,
    
    discount: invoice.discount,
    discountRate: invoice.discountRate,
    discountFormatted: `${invoice.discount?.toLocaleString('ar-EG') || 0} ج.م`,
    
    deliveryFee: invoice.deliveryFee,
    deliveryFeeFormatted: `${invoice.deliveryFee?.toLocaleString('ar-EG') || 0} ج.م`,
    
    totalAmount: invoice.totalAmount,
    totalAmountFormatted: `${invoice.totalAmount?.toLocaleString('ar-EG') || 0} ج.م`,
    totalAmountAr: toArabicNumbers(invoice.totalAmount?.toLocaleString('ar-EG') || '0'),
    totalAmountInWords: amountToArabicWords(invoice.totalAmount || 0),
    
    currency: invoice.currency,
    
    // الحالة
    status: invoice.status,
    statusInfo: INVOICE_STATUS[invoice.status] || { name: invoice.status, color: '#6B7280' },
    
    // معلومات إضافية
    notes: invoice.notes,
    metadata: invoice.metadata,
    
    // العلاقات
    customer: invoice.user ? {
      id: invoice.user.id,
      name: `${invoice.user.firstName} ${invoice.user.lastName}`,
      email: invoice.user.email,
      phone: invoice.user.phoneNumber
    } : null,
    
    order: invoice.order ? {
      id: invoice.order.id,
      orderNumber: invoice.order.orderNumber,
      status: invoice.order.status
    } : null,
    
    payment: invoice.payment ? {
      id: invoice.payment.id,
      status: invoice.payment.status
    } : null
  };
};

/**
 * الحصول على فواتير المستخدم بالعربية
 */
const getUserInvoicesArabic = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              provider: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      success: true,
      data: {
        invoices: invoices.map(formatInvoiceResponse),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب فواتير المستخدم: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على تفاصيل فاتورة بالعربية
 */
const getInvoiceDetailsArabic = async (invoiceId, userId = null) => {
  try {
    const where = { id: invoiceId };
    if (userId) {
      where.userId = userId;
    }

    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        user: true,
        order: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
                phoneNumber: true
              }
            }
          }
        },
        payment: true
      }
    });

    if (!invoice) {
      return {
        success: false,
        error: 'لم يتم العثور على الفاتورة'
      };
    }

    return {
      success: true,
      data: formatInvoiceResponse(invoice)
    };
  } catch (error) {
    logger.error(`خطأ في جلب تفاصيل الفاتورة: ${error.message}`);
    throw error;
  }
};

/**
 * تحديث حالة الفاتورة
 */
const updateInvoiceStatus = async (invoiceId, status, userId = null) => {
  try {
    const where = { id: invoiceId };
    if (userId) {
      where.userId = userId;
    }

    const invoice = await prisma.invoice.findFirst({ where });
    
    if (!invoice) {
      return {
        success: false,
        error: 'لم يتم العثور على الفاتورة'
      };
    }

    const updateData = { status };
    
    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        user: true,
        order: true,
        payment: true
      }
    });

    logger.info(`تم تحديث حالة الفاتورة ${invoiceId} إلى ${status}`);

    return {
      success: true,
      message: `تم تحديث حالة الفاتورة إلى: ${INVOICE_STATUS[status]?.name || status}`,
      data: formatInvoiceResponse(updatedInvoice)
    };
  } catch (error) {
    logger.error(`خطأ في تحديث حالة الفاتورة: ${error.message}`);
    throw error;
  }
};

/**
 * إنشاء PDF للفاتورة العربية
 */
const generateArabicInvoicePdf = async (invoiceId, userId = null) => {
  try {
    const result = await getInvoiceDetailsArabic(invoiceId, userId);
    
    if (!result.success) {
      return result;
    }

    const invoice = result.data;

    // إنشاء مستند PDF
    const doc = arabicPdfService.createDocument();

    // إضافة معلومات الشركة
    arabicPdfService.addCompanyHeader(doc, {
      nameAr: 'بريك آب',
      name: 'BreakApp',
      address: 'القاهرة، مصر',
      phone: '+20 XXX XXX XXXX',
      email: 'info@breakapp.com'
    });

    // عنوان الفاتورة
    arabicPdfService.addArabicTitle(doc, 'فاتورة ضريبية');

    // معلومات الفاتورة
    doc.moveDown(0.5);
    arabicPdfService.addArabicText(doc, `رقم الفاتورة: ${invoice.invoiceNumber}`, doc.page.margins.left, doc.y);
    arabicPdfService.addArabicText(doc, `التاريخ: ${invoice.createdAtCombined}`, doc.page.margins.left, doc.y);
    
    if (invoice.dueDateFormatted) {
      arabicPdfService.addArabicText(doc, `تاريخ الاستحقاق: ${invoice.dueDateFormatted}`, doc.page.margins.left, doc.y);
    }

    doc.moveDown(1);

    // معلومات العميل
    arabicPdfService.addArabicText(doc, 'معلومات العميل:', doc.page.margins.left, doc.y, { font: 'ArabicBold', fontSize: 14 });
    if (invoice.customer) {
      arabicPdfService.addArabicText(doc, `الاسم: ${invoice.customer.name}`, doc.page.margins.left, doc.y);
      arabicPdfService.addArabicText(doc, `البريد: ${invoice.customer.email}`, doc.page.margins.left, doc.y);
      if (invoice.customer.phone) {
        arabicPdfService.addArabicText(doc, `الهاتف: ${invoice.customer.phone}`, doc.page.margins.left, doc.y);
      }
    }

    doc.moveDown(1);

    // جدول العناصر
    const headers = ['البند', 'الكمية', 'سعر الوحدة', 'الإجمالي'];
    const rows = invoice.items.map(item => [
      item.nameAr || item.name,
      item.quantity.toString(),
      item.unitPriceFormatted,
      item.totalFormatted
    ]);

    arabicPdfService.addArabicTable(doc, headers, rows);

    doc.moveDown(1);

    // ملخص الفاتورة
    const summaryX = doc.page.width - 250;
    arabicPdfService.addArabicText(doc, `المجموع الفرعي: ${invoice.subtotalFormatted}`, summaryX, doc.y, { align: 'right', width: 200 });
    
    if (invoice.tax > 0) {
      arabicPdfService.addArabicText(doc, `الضريبة (${invoice.taxRate}%): ${invoice.taxFormatted}`, summaryX, doc.y, { align: 'right', width: 200 });
    }
    
    if (invoice.discount > 0) {
      arabicPdfService.addArabicText(doc, `الخصم (${invoice.discountRate}%): -${invoice.discountFormatted}`, summaryX, doc.y, { align: 'right', width: 200 });
    }
    
    if (invoice.deliveryFee > 0) {
      arabicPdfService.addArabicText(doc, `رسوم التوصيل: ${invoice.deliveryFeeFormatted}`, summaryX, doc.y, { align: 'right', width: 200 });
    }

    doc.moveDown(0.5);
    arabicPdfService.addArabicText(doc, `الإجمالي: ${invoice.totalAmountFormatted}`, summaryX, doc.y, { 
      align: 'right', 
      width: 200, 
      font: 'ArabicBold', 
      fontSize: 16 
    });

    // المبلغ بالكلمات
    doc.moveDown(0.5);
    arabicPdfService.addArabicText(doc, `فقط ${invoice.totalAmountInWords} لا غير`, doc.page.margins.left, doc.y, { fontSize: 10 });

    // الملاحظات
    if (invoice.notes) {
      doc.moveDown(1);
      arabicPdfService.addArabicText(doc, 'ملاحظات:', doc.page.margins.left, doc.y, { font: 'ArabicBold' });
      arabicPdfService.addArabicText(doc, invoice.notes, doc.page.margins.left, doc.y);
    }

    // التذييل
    arabicPdfService.addPageFooter(doc, `فاتورة رقم ${invoice.invoiceNumber} - تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')}`);

    // تحويل إلى Buffer
    const pdfBuffer = await arabicPdfService.pdfToBuffer(doc);

    return {
      success: true,
      data: {
        buffer: pdfBuffer,
        filename: `فاتورة-${invoice.invoiceNumber}.pdf`,
        invoiceNumber: invoice.invoiceNumber
      }
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء PDF الفاتورة: ${error.message}`);
    return {
      success: false,
      error: 'فشل في إنشاء ملف PDF'
    };
  }
};

/**
 * إحصائيات الفواتير
 */
const getInvoiceStatisticsArabic = async (userId = null, filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const where = {
      ...(userId && { userId }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [
      totalCount,
      paidCount,
      pendingCount,
      overdueCount,
      totalAmount,
      paidAmount,
      pendingAmount
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({ where, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { totalAmount: true } })
    ]);

    return {
      success: true,
      data: {
        counts: {
          total: totalCount,
          paid: paidCount,
          pending: pendingCount,
          overdue: overdueCount,
          cancelled: totalCount - paidCount - pendingCount - overdueCount
        },
        amounts: {
          total: totalAmount._sum.totalAmount || 0,
          totalFormatted: `${(totalAmount._sum.totalAmount || 0).toLocaleString('ar-EG')} ج.م`,
          paid: paidAmount._sum.totalAmount || 0,
          paidFormatted: `${(paidAmount._sum.totalAmount || 0).toLocaleString('ar-EG')} ج.م`,
          pending: pendingAmount._sum.totalAmount || 0,
          pendingFormatted: `${(pendingAmount._sum.totalAmount || 0).toLocaleString('ar-EG')} ج.م`
        },
        paymentRate: totalCount > 0 
          ? `${((paidCount / totalCount) * 100).toFixed(1)}%`
          : '0%'
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب إحصائيات الفواتير: ${error.message}`);
    throw error;
  }
};

module.exports = {
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
  generateArabicInvoicePdf,
  getInvoiceStatisticsArabic
};
