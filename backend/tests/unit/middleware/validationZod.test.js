/**
 * Zod Validation Middleware Tests
 * اختبارات شاملة لوسطاء التحقق من البيانات
 */

const { z } = require('zod');
const {
  userSchema,
  orderSchema,
  restaurantSchema,
  exceptionSchema,
  orderStatusSchema,
  validateSchema,
  validateUUID,
  validateEmail,
  validatePassword,
  validatePagination,
  validateUser,
  validateOrder,
  validateRestaurant,
  validateException,
  validateOrderStatus,
  validateUserId,
  validateOrderId,
  validateRestaurantId,
  validateProjectId,
  validateExceptionId
} = require('../../../src/middleware/validationZod');

describe('Zod Validation Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('userSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!'
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPass123!'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const invalidUser = {
        name: 'J',
        email: 'john@example.com',
        password: 'StrongPass123!'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should accept optional phone and role', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        phone: '+1234567890',
        role: 'USER'
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        role: 'INVALID_ROLE'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('orderSchema', () => {
    it('should validate correct order data', () => {
      const validOrder = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        restaurantId: '550e8400-e29b-41d4-a716-446655440001',
        items: [
          {
            menuItemId: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 2,
            price: 15.99
          }
        ],
        totalAmount: 31.98,
        deliveryAddress: '123 Main St, City, Country'
      };

      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidOrder = {
        projectId: 'invalid-uuid',
        restaurantId: '550e8400-e29b-41d4-a716-446655440001',
        items: [{ menuItemId: '550e8400-e29b-41d4-a716-446655440002', quantity: 2, price: 15.99 }],
        totalAmount: 31.98,
        deliveryAddress: '123 Main St'
      };

      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
      const invalidOrder = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        restaurantId: '550e8400-e29b-41d4-a716-446655440001',
        items: [],
        totalAmount: 0,
        deliveryAddress: '123 Main St'
      };

      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative quantity', () => {
      const invalidOrder = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        restaurantId: '550e8400-e29b-41d4-a716-446655440001',
        items: [{ menuItemId: '550e8400-e29b-41d4-a716-446655440002', quantity: 0, price: 15.99 }],
        totalAmount: 0,
        deliveryAddress: '123 Main St'
      };

      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should accept optional notes', () => {
      const validOrder = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        restaurantId: '550e8400-e29b-41d4-a716-446655440001',
        items: [
          {
            menuItemId: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 2,
            price: 15.99,
            notes: 'No onions please'
          }
        ],
        totalAmount: 31.98,
        deliveryAddress: '123 Main St, City',
        notes: 'Leave at door'
      };

      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('restaurantSchema', () => {
    it('should validate correct restaurant data', () => {
      const validRestaurant = {
        name: 'Great Restaurant',
        address: '123 Restaurant St, City, Country',
        phone: '1234567890',
        latitude: 40.7128,
        longitude: -74.0060
      };

      const result = restaurantSchema.safeParse(validRestaurant);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const invalidRestaurant = {
        name: 'Great Restaurant',
        address: '123 Restaurant St',
        phone: '1234567890',
        latitude: 95,
        longitude: -74.0060
      };

      const result = restaurantSchema.safeParse(invalidRestaurant);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const invalidRestaurant = {
        name: 'Great Restaurant',
        address: '123 Restaurant St',
        phone: '1234567890',
        latitude: 40.7128,
        longitude: 200
      };

      const result = restaurantSchema.safeParse(invalidRestaurant);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSchema middleware', () => {
    it('should pass valid data', () => {
      const schema = z.object({ name: z.string() });
      const middleware = validateSchema(schema);
      req.body = { name: 'Test' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedData).toEqual({ name: 'Test' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid data', () => {
      const schema = z.object({ name: z.string() });
      const middleware = validateSchema(schema);
      req.body = { name: 123 };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.any(Array)
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle validation errors with field names', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });
      const middleware = validateSchema(schema);
      req.body = { email: 'invalid', age: 10 };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errorCall = res.json.mock.calls[0][0];
      expect(errorCall.error.details).toHaveLength(2);
    });
  });

  describe('validateUUID middleware', () => {
    it('should accept valid UUID', () => {
      const middleware = validateUUID('id');
      req.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID', () => {
      const middleware = validateUUID('id');
      req.params = { id: 'invalid-uuid' };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_ID'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-UUID strings', () => {
      const middleware = validateUUID('userId');
      req.params = { userId: '12345' };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateEmail middleware', () => {
    it('should accept valid email', () => {
      req.body = { email: 'test@example.com' };

      validateEmail(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      req.body = { email: 'invalid-email' };

      validateEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_EMAIL'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass when email is not provided', () => {
      req.body = {};

      validateEmail(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validatePassword middleware', () => {
    it('should accept strong password', () => {
      req.body = { password: 'StrongPass123!' };

      validatePassword(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject short password', () => {
      req.body = { password: 'Short1!' };

      validatePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'WEAK_PASSWORD',
          details: expect.arrayContaining([
            expect.stringContaining('8 أحرف')
          ])
        })
      });
    });

    it('should reject password without uppercase', () => {
      req.body = { password: 'weakpass123!' };

      validatePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errorDetails = res.json.mock.calls[0][0].error.details;
      expect(errorDetails).toContain('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    });

    it('should reject password without lowercase', () => {
      req.body = { password: 'WEAKPASS123!' };

      validatePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errorDetails = res.json.mock.calls[0][0].error.details;
      expect(errorDetails).toContain('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    });

    it('should reject password without numbers', () => {
      req.body = { password: 'WeakPassword!' };

      validatePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errorDetails = res.json.mock.calls[0][0].error.details;
      expect(errorDetails).toContain('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    });

    it('should reject password without special characters', () => {
      req.body = { password: 'WeakPassword123' };

      validatePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errorDetails = res.json.mock.calls[0][0].error.details;
      expect(errorDetails).toContain('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    });

    it('should pass when password is not provided', () => {
      req.body = {};

      validatePassword(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validatePagination middleware', () => {
    it('should accept valid pagination', () => {
      req.query = { page: '1', limit: '10' };

      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject negative page number', () => {
      req.query = { page: '-1' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_PAGE'
        })
      });
    });

    it('should reject zero page number', () => {
      req.query = { page: '0' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject limit greater than 100', () => {
      req.query = { limit: '101' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_LIMIT'
        })
      });
    });

    it('should reject non-numeric page', () => {
      req.query = { page: 'abc' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should pass when pagination params not provided', () => {
      req.query = {};

      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('specific validation middleware functions', () => {
    it('should have validateUser function', () => {
      expect(validateUser).toBeDefined();
      expect(typeof validateUser).toBe('function');
    });

    it('should have validateOrder function', () => {
      expect(validateOrder).toBeDefined();
      expect(typeof validateOrder).toBe('function');
    });

    it('should have validateRestaurant function', () => {
      expect(validateRestaurant).toBeDefined();
      expect(typeof validateRestaurant).toBe('function');
    });

    it('should have validateException function', () => {
      expect(validateException).toBeDefined();
      expect(typeof validateException).toBe('function');
    });

    it('should have validateOrderStatus function', () => {
      expect(validateOrderStatus).toBeDefined();
      expect(typeof validateOrderStatus).toBe('function');
    });
  });

  describe('specific UUID validation middleware', () => {
    it('should have validateUserId function', () => {
      expect(validateUserId).toBeDefined();
      req.params = { userId: '550e8400-e29b-41d4-a716-446655440000' };
      validateUserId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should have validateOrderId function', () => {
      expect(validateOrderId).toBeDefined();
      req.params = { orderId: '550e8400-e29b-41d4-a716-446655440000' };
      validateOrderId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should have validateRestaurantId function', () => {
      expect(validateRestaurantId).toBeDefined();
      req.params = { restaurantId: '550e8400-e29b-41d4-a716-446655440000' };
      validateRestaurantId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should have validateProjectId function', () => {
      expect(validateProjectId).toBeDefined();
      req.params = { projectId: '550e8400-e29b-41d4-a716-446655440000' };
      validateProjectId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should have validateExceptionId function', () => {
      expect(validateExceptionId).toBeDefined();
      req.params = { exceptionId: '550e8400-e29b-41d4-a716-446655440000' };
      validateExceptionId(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('exceptionSchema', () => {
    it('should validate correct exception data', () => {
      const validException = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Emergency food requirement for urgent meeting',
        requestedItems: [
          {
            restaurantId: '550e8400-e29b-41d4-a716-446655440001',
            itemName: 'Pizza',
            quantity: 5,
            estimatedPrice: 75.00
          }
        ],
        additionalCost: 20.00,
        urgency: 'HIGH'
      };

      const result = exceptionSchema.safeParse(validException);
      expect(result.success).toBe(true);
    });

    it('should reject short reason', () => {
      const invalidException = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Too short',
        requestedItems: [
          {
            restaurantId: '550e8400-e29b-41d4-a716-446655440001',
            itemName: 'Pizza',
            quantity: 5,
            estimatedPrice: 75.00
          }
        ],
        additionalCost: 20.00
      };

      const result = exceptionSchema.safeParse(invalidException);
      expect(result.success).toBe(false);
    });
  });

  describe('orderStatusSchema', () => {
    it('should validate valid order status', () => {
      const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

      statuses.forEach(status => {
        const result = orderStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid order status', () => {
      const result = orderStatusSchema.safeParse({ status: 'INVALID_STATUS' });
      expect(result.success).toBe(false);
    });
  });
});
