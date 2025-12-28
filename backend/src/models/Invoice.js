/**
 * Invoice Model
 * نموذج بيانات الفواتير
 */

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ['food', 'delivery', 'tax', 'service', 'discount'],
    default: 'food',
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft',
    index: true,
  },
  type: {
    type: String,
    enum: ['order', 'subscription', 'refund', 'commission'],
    default: 'order',
    index: true,
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 14, // 14% VAT in Egypt
    },
    breakdown: [{
      type: {
        type: String,
        enum: ['vat', 'service', 'other'],
      },
      rate: Number,
      amount: Number,
      description: String,
    }],
  },
  discount: {
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    code: String,
    description: String,
  },
  deliveryFee: {
    type: Number,
    min: 0,
    default: 0,
  },
  serviceCharge: {
    type: Number,
    min: 0,
    default: 0,
  },
  commission: {
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 2.5, // 2.5% commission rate
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'EGP',
    uppercase: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'cash', 'bank_transfer'],
  },
  paymentReference: {
    type: String,
    index: true,
  },
  dueDate: {
    type: Date,
    index: true,
  },
  paidAt: {
    type: Date,
    index: true,
  },
  refundedAt: {
    type: Date,
  },
  billingAddress: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },
  shippingAddress: {
    name: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
  termsAndConditions: {
    type: String,
    maxlength: 2000,
  },
  pdfUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid PDF URL',
    },
  },
  pdfGeneratedAt: {
    type: Date,
  },
  sentAt: {
    type: Date,
  },
  viewedAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    },
    startDate: Date,
    endDate: Date,
    nextBillingDate: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// الفهارس لتحسين الأداء
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

// دوال افتراضية
invoiceSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status === 'sent';
});

invoiceSchema.virtual('isPaid').get(function() {
  return this.status === 'paid' || this.paymentStatus === 'paid';
});

invoiceSchema.virtual('balanceDue').get(function() {
  if (this.isPaid) return 0;
  return this.totalAmount - (this.paidAmount || 0);
});

invoiceSchema.virtual('paidAmount').get(function() {
  // سيتم حسابها من سجل المدفوعات
  return 0; // سيتم تحديثها لاحقاً
});

// دوال قبل الحفظ
invoiceSchema.pre('save', async function(next) {
  // إنشاء رقم الفاتورة إذا لم يكن موجوداً
  if (!this.invoiceNumber) {
    this.invoiceNumber = await this.constructor.generateInvoiceNumber();
  }
  
  // حساب المجموع الكلي
  this.calculateTotal();
  
  // تحديد تاريخ الاستحقاق إذا لم يكن موجوداً
  if (!this.dueDate && this.status === 'sent') {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days default
    this.dueDate = dueDate;
  }
  
  next();
});

// دوال نموذج
invoiceSchema.methods = {
  /**
   * حساب المجموع الكلي
   */
  calculateTotal() {
    let total = this.subtotal;
    
    // إضافة الضريبة
    if (this.tax.rate > 0) {
      this.tax.amount = (this.subtotal * this.tax.rate) / 100;
      total += this.tax.amount;
    }
    
    // إضافة رسوم التوصيل
    total += this.deliveryFee;
    
    // إضافة رسوم الخدمة
    total += this.serviceCharge;
    
    // خصم الخصم
    if (this.discount.percentage > 0) {
      this.discount.amount = (total * this.discount.percentage) / 100;
    }
    total -= this.discount.amount;
    
    // إضافة العمولة
    if (this.commission.percentage > 0) {
      this.commission.amount = (this.subtotal * this.commission.percentage) / 100;
      total += this.commission.amount;
    }
    
    this.totalAmount = Math.round(total * 100) / 100; // Round to 2 decimal places
    return this.totalAmount;
  },

  /**
   * إرسال الفاتورة
   */
  async send() {
    this.status = 'sent';
    this.sentAt = new Date();
    
    if (!this.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      this.dueDate = dueDate;
    }
    
    return await this.save();
  },

  /**
   * دفع الفاتورة
   */
  async markAsPaid(paymentReference, paymentMethod) {
    this.status = 'paid';
    this.paymentStatus = 'paid';
    this.paymentReference = paymentReference;
    this.paymentMethod = paymentMethod;
    this.paidAt = new Date();
    
    return await this.save();
  },

  /**
   * استرداد الفاتورة
   */
  async markAsRefunded() {
    this.status = 'refunded';
    this.paymentStatus = 'refunded';
    this.refundedAt = new Date();
    
    return await this.save();
  },

  /**
   * إلغاء الفاتورة
   */
  async cancel(reason) {
    this.status = 'cancelled';
    if (reason) {
      this.notes = `${this.notes || ''}\nCancelled: ${reason}`;
    }
    
    return await this.save();
  },

  /**
   * توليد PDF الفاتورة
   */
  async generatePDF() {
    // سيتم تنفيذها لاحقاً باستخدام مكتبة PDF
    // يمكن استخدام مكتبات مثل puppeteer, pdfkit, أو html-pdf
    
    // مؤقتاً، نقوم بتحديث التاريخ فقط
    this.pdfGeneratedAt = new Date();
    
    // في المستقبل، سيتم توليد ملف PDF حقيقي وحفظه
    // this.pdfUrl = generatedPdfUrl;
    
    return await this.save();
  },

  /**
   * تحديث تاريخ المشاهدة
   */
  async markAsViewed() {
    if (!this.viewedAt) {
      this.viewedAt = new Date();
      return await this.save();
    }
    return this;
  },

  /**
   * إضافة ملاحظة
   */
  async addNote(note) {
    const timestamp = new Date().toLocaleString('ar-EG');
    this.notes = `${this.notes || ''}\n[${timestamp}] ${note}`;
    return await this.save();
  },
};

// دوال استاتيكية
invoiceSchema.statics = {
  /**
   * توليد رقم فاتورة فريد
   */
  async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // الحصول على عدد الفواتير في هذا الشهر
    const count = await this.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1),
      },
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  },

  /**
   * الحصول على فواتير المستخدم
   */
  async getUserInvoices(userId, options = {}) {
    const query = { userId, isActive: true };
    
    if (options.status) {
      query.status = options.status;
    }
    
    if (options.paymentStatus) {
      query.paymentStatus = options.paymentStatus;
    }
    
    if (options.dateRange) {
      query.createdAt = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end,
      };
    }

    return await this.find(query)
      .populate('orderId', 'orderNumber status totalAmount')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(options.limit || 20)
      .skip(options.skip || 0);
  },

  /**
   * الحصول على الفواتير المستحقة
   */
  async getOverdueInvoices() {
    const now = new Date();
    
    return await this.find({
      status: 'sent',
      dueDate: { $lt: now },
      isActive: true,
    })
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber')
      .sort({ dueDate: 1 });
  },

  /**
   * إحصائيات الفواتير
   */
  async getStatistics(filters = {}) {
    const matchStage = { isActive: true, ...filters };
    
    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalTax: { $sum: '$tax.amount' },
          totalCommission: { $sum: '$commission.amount' },
          totalDelivery: { $sum: '$deliveryFee' },
          count: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'sent'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
        },
      },
    ]);

    return stats[0] || {
      totalAmount: 0,
      totalTax: 0,
      totalCommission: 0,
      totalDelivery: 0,
      count: 0,
      paidCount: 0,
      overdueCount: 0,
    };
  },

  /**
   * البحث عن الفواتير
   */
  async search(searchCriteria, options = {}) {
    const query = { isActive: true };
    
    if (searchCriteria.userId) {
      query.userId = searchCriteria.userId;
    }
    
    if (searchCriteria.status) {
      query.status = searchCriteria.status;
    }
    
    if (searchCriteria.invoiceNumber) {
      query.invoiceNumber = { $regex: searchCriteria.invoiceNumber, $options: 'i' };
    }
    
    if (searchCriteria.amountRange) {
      query.totalAmount = {
        $gte: searchCriteria.amountRange.min,
        $lte: searchCriteria.amountRange.max,
      };
    }
    
    if (searchCriteria.dateRange) {
      query.createdAt = {
        $gte: searchCriteria.dateRange.start,
        $lte: searchCriteria.dateRange.end,
      };
    }

    return await this.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber status')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0);
  },
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;