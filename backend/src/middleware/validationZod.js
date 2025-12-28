const { z } = require('zod');

// مخططات التحقق من البيانات
const userSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين').max(100, 'الاسم طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'VIP', 'ADMIN', 'PROJECT_MANAGER']).optional()
});

const orderSchema = z.object({
  projectId: z.string().uuid('معرف المشروع غير صحيح'),
  restaurantId: z.string().uuid('معرف المطعم غير صحيح'),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().min(1, 'الكمية يجب أن تكون على الأقل 1'),
    price: z.number().positive('السعر يجب أن يكون موجباً'),
    notes: z.string().optional()
  })).min(1, 'يجب اختيار عنصر واحد على الأقل'),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون موجباً'),
  deliveryAddress: z.string().min(10, 'عنوان التوصيل مطلوب'),
  notes: z.string().optional()
});

const restaurantSchema = z.object({
  name: z.string().min(2, 'اسم المطعم مطلوب'),
  description: z.string().optional(),
  address: z.string().min(10, 'عنوان المطعم مطلوب'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  latitude: z.number().min(-90).max(90, 'خط العرض غير صحيح'),
  longitude: z.number().min(-180).max(180, 'خط الطول غير صحيح'),
  cuisine: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional()
});

const exceptionSchema = z.object({
  projectId: z.string().uuid('معرف المشروع غير صحيح'),
  reason: z.string().min(10, 'سبب الاستثناء مطلوب ويجب أن يكون مفصلاً'),
  requestedItems: z.array(z.object({
    restaurantId: z.string().uuid(),
    itemName: z.string(),
    quantity: z.number().min(1),
    estimatedPrice: z.number().positive()
  })).min(1, 'يجب تحديد العناصر المطلوبة'),
  additionalCost: z.number().min(0, 'التكلفة الإضافية لا يمكن أن تكون سالبة'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
});

const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
});

// دالة مساعدة للتحقق من البيانات
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'بيانات غير صحيحة',
            details: errors
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'خطأ في التحقق من البيانات'
        }
      });
    }
  };
};

// التحقق من معرف UUID
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: `معرف ${paramName} غير صحيح`
        }
      });
    }
    
    next();
  };
};

// التحقق من صحة البريد الإلكتروني
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'البريد الإلكتروني غير صحيح'
      }
    });
  }
  
  next();
};

// التحقق من قوة كلمة المرور
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return next();
  }
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`كلمة المرور يجب أن تكون على الأقل ${minLength} أحرف`);
  }
  
  if (!hasUpperCase) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!hasLowerCase) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!hasNumbers) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!hasSpecialChar) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'كلمة المرور ضعيفة',
        details: errors
      }
    });
  }
  
  next();
};

// التحقق من معايير الترقيم (Pagination)
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAGE',
        message: 'رقم الصفحة يجب أن يكون رقماً موجباً'
      }
    });
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_LIMIT',
        message: 'حد النتائج يجب أن يكون بين 1 و 100'
      }
    });
  }
  
  next();
};

module.exports = {
  // مخططات التحقق
  userSchema,
  orderSchema,
  restaurantSchema,
  exceptionSchema,
  orderStatusSchema,
  
  // دوال التحقق
  validateSchema,
  validateUUID,
  validateEmail,
  validatePassword,
  validatePagination,
  
  // دوال التحقق المحددة
  validateUser: validateSchema(userSchema),
  validateOrder: validateSchema(orderSchema),
  validateRestaurant: validateSchema(restaurantSchema),
  validateException: validateSchema(exceptionSchema),
  validateOrderStatus: validateSchema(orderStatusSchema),
  
  // دوال التحقق من المعرفات
  validateUserId: validateUUID('userId'),
  validateOrderId: validateUUID('orderId'),
  validateRestaurantId: validateUUID('restaurantId'),
  validateProjectId: validateUUID('projectId'),
  validateExceptionId: validateUUID('exceptionId')
};