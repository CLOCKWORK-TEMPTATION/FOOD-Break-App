/**
 * Payment Model
 * نموذج بيانات المدفوعات
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  paymentMethodId: {
    type: String,
    index: true,
  },
  amount: {
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
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'apple_pay', 'google_pay'],
    required: true,
  },
  type: {
    type: String,
    enum: ['order_payment', 'subscription', 'refund', 'commission'],
    default: 'order_payment',
  },
  description: {
    type: String,
    maxlength: 500,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  error: {
    message: String,
    code: String,
  },
  refundId: {
    type: String,
    index: true,
  },
  refundAmount: {
    type: Number,
    min: 0,
  },
  refundedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  fraudCheck: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    checks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  commission: {
    amount: {
      type: Number,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
  },
  tax: {
    amount: {
      type: Number,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    taxId: String,
  },
  fees: {
    processing: {
      type: Number,
      min: 0,
    },
    gateway: {
      type: Number,
      min: 0,
    },
    total: {
      type: Number,
      min: 0,
    },
  },
  billingDetails: {
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
  shippingDetails: {
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
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1, status: 1 });

// دوال مساعدة
paymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'completed' && !this.refundId;
});

paymentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

paymentSchema.virtual('netAmount').get(function() {
  return this.amount - (this.fees?.total || 0) - (this.commission?.amount || 0);
});

// دوال قبل الحفظ
paymentSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (this.status === 'refunded' && !this.refundedAt) {
    this.refundedAt = new Date();
  }
  
  next();
});

// دوال بعد الحفظ
paymentSchema.post('save', function(doc) {
  // تسجيل تغييرات الحالة
  if (doc.isModified('status')) {
    logger.info(`Payment ${doc.id} status changed to: ${doc.status}`);
  }
});

// دوال نموذج
paymentSchema.methods = {
  /**
   * تحديث حالة الدفع
   */
  async updateStatus(newStatus, options = {}) {
    this.status = newStatus;
    
    if (options.error) {
      this.error = options.error;
    }
    
    if (options.metadata) {
      this.metadata = { ...this.metadata, ...options.metadata };
    }
    
    return await this.save();
  },

  /**
   * معالجة الاسترداد
   */
  async processRefund(refundAmount, refundId) {
    this.status = 'refunded';
    this.refundAmount = refundAmount;
    this.refundId = refundId;
    this.refundedAt = new Date();
    
    return await this.save();
  },

  /**
   * التحقق من صلاحية الدفع للاسترداد
   */
  canRefund() {
    return this.status === 'completed' && !this.refundId && !this.isExpired;
  },

  /**
   * حساب المبلغ القابل للاسترداد
   */
  getRefundableAmount() {
    if (!this.canRefund()) {
      return 0;
    }
    
    // يمكن استرداد المبلغ الكامل أو جزء منه حسب السياسة
    return this.amount - (this.refundAmount || 0);
  },
};

// دوال استاتيكية
paymentSchema.statics = {
  /**
   * الحصول على إحصائيات المدفوعات
   */
  async getStatistics(filters = {}) {
    const matchStage = { isActive: true, ...filters };
    
    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commission.amount' },
          totalTax: { $sum: '$tax.amount' },
          totalFees: { $sum: '$fees.total' },
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          refundedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
        },
      },
    ]);

    return stats[0] || {
      totalAmount: 0,
      totalCommission: 0,
      totalTax: 0,
      totalFees: 0,
      count: 0,
      completedCount: 0,
      refundedCount: 0,
      failedCount: 0,
    };
  },

  /**
   * الحصول على المدفوعات حسب الحالة
   */
  async getByStatus(status, options = {}) {
    const query = { status, isActive: true };
    
    if (options.userId) {
      query.userId = options.userId;
    }
    
    if (options.dateRange) {
      query.createdAt = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end,
      };
    }

    return await this.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0);
  },

  /**
   * البحث عن المدفوعات
   */
  async search(searchCriteria, options = {}) {
    const query = { isActive: true };
    
    if (searchCriteria.userId) {
      query.userId = searchCriteria.userId;
    }
    
    if (searchCriteria.status) {
      query.status = searchCriteria.status;
    }
    
    if (searchCriteria.provider) {
      query.provider = searchCriteria.provider;
    }
    
    if (searchCriteria.amountRange) {
      query.amount = {
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
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0);
  },
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;