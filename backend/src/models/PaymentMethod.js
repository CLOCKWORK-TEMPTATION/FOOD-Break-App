/**
 * PaymentMethod Model
 * نموذج بيانات طرق الدفع المحفوظة
 */

const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'apple_pay', 'google_pay'],
    required: true,
  },
  providerMethodId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'],
    required: true,
  },
  last4: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\d{4}$/.test(v);
      },
      message: 'Last 4 digits must be 4 numbers',
    },
  },
  brand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover', 'paypal', 'unknown'],
  },
  expMonth: {
    type: Number,
    min: 1,
    max: 12,
  },
  expYear: {
    type: Number,
    min: 2020,
    max: 2100,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
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
  isDefault: {
    type: Boolean,
    default: false,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUsedAt: {
    type: Date,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  riskAssessment: {
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// الفهارس لتحسين الأداء
paymentMethodSchema.index({ userId: 1, isActive: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ providerMethodId: 1 });
paymentMethodSchema.index({ createdAt: -1 });

// دوال افتراضية
paymentMethodSchema.virtual('isExpired').get(function() {
  if (!this.expMonth || !this.expYear) return false;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  return this.expYear < currentYear || 
         (this.expYear === currentYear && this.expMonth < currentMonth);
});

paymentMethodSchema.virtual('displayName').get(function() {
  if (this.type === 'card' && this.last4) {
    return `${this.brand?.toUpperCase()} ****${this.last4}`;
  }
  
  if (this.type === 'paypal' && this.email) {
    return `PayPal (${this.email})`;
  }
  
  return this.type;
});

// دوال قبل الحفظ
paymentMethodSchema.pre('save', async function(next) {
  // التأكد من وجود طريقة دفع افتراضية واحدة فقط
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  
  next();
});

// دوال نموذج
paymentMethodSchema.methods = {
  /**
   * تفعيل طريقة الدفع
   */
  async activate() {
    this.isActive = true;
    return await this.save();
  },

  /**
   * تعطيل طريقة الدفع
   */
  async deactivate() {
    this.isActive = false;
    
    // إذا كانت这些方法 الافتراضية، نحدد أول طريقة أخرى كافتراضية
    if (this.isDefault) {
      this.isDefault = false;
      
      const otherMethod = await this.constructor.findOne({
        userId: this.userId,
        _id: { $ne: this._id },
        isActive: true,
      });
      
      if (otherMethod) {
        otherMethod.isDefault = true;
        await otherMethod.save();
      }
    }
    
    return await this.save();
  },

  /**
   * تعيين كطريقة دفع افتراضية
   */
  async setAsDefault() {
    this.isDefault = true;
    return await this.save();
  },

  /**
   * تحديث عدد مرات الاستخدام
   */
  async updateUsage() {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    return await this.save();
  },

  /**
   * التحقق من صلاحية طريقة الدفع
   */
  isValid() {
    return this.isActive && !this.isExpired && this.verificationStatus === 'verified';
  },

  /**
   * تشفير المعلومات الحساسة
   */
  async encryptSensitiveData() {
    // يمكن إضافة تشفير للمعلومات الحساسة هنا
    // مثل أرقام البطاقات الكاملة أو معلومات الحساب المصرفي
  },

  /**
   فك تشفير المعلومات الحساسة
   */
  async decryptSensitiveData() {
    // يمكن إضافة فك تشفير للمعلومات الحساسة هنا
  },
};

// دوال استاتيكية
paymentMethodSchema.statics = {
  /**
   * الحصول على طرق دفع المستخدم
   */
  async getUserPaymentMethods(userId, options = {}) {
    const query = { userId, isActive: true };
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.provider) {
      query.provider = options.provider;
    }

    return await this.find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0);
  },

  /**
   * الحصول على طريقة الدفع الافتراضية
   */
  async getDefaultMethod(userId) {
    return await this.findOne({ userId, isDefault: true, isActive: true });
  },

  /**
   * تعيين طريقة دفع افتراضية جديدة
   */
  async setNewDefault(userId, excludeId = null) {
    const query = { userId, isActive: true };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const newDefault = await this.findOne(query).sort({ createdAt: -1 });
    
    if (newDefault) {
      newDefault.isDefault = true;
      await newDefault.save();
    }
    
    return newDefault;
  },

  /**
   * التحقق من وجود طريقة دفع
   */
  async exists(userId, providerMethodId) {
    const count = await this.countDocuments({
      userId,
      providerMethodId,
      isActive: true,
    });
    
    return count > 0;
  },

  /**
   * تنظيف طرق الدفع المنتهية
   */
  async cleanupExpiredMethods() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const result = await this.updateMany(
      {
        type: 'card',
        $or: [
          { expYear: { $lt: currentYear } },
          { expYear: currentYear, expMonth: { $lt: currentMonth } },
        ],
        isActive: true,
      },
      { isActive: false }
    );
    
    return result.modifiedCount;
  },

  /**
   * إحصائيات استخدام طرق الدفع
   */
  async getUsageStatistics(userId) {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' },
        },
      },
    ]);

    return stats;
  },
};

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;