/**
 * Swagger Configuration Tests
 * اختبارات تكوين Swagger
 */

// Mock swagger-jsdoc before requiring the module
jest.mock('swagger-jsdoc', () => {
  return jest.fn(() => ({
    openapi: '3.0.0',
    info: {
      title: 'BreakApp API',
      version: '1.0.0',
      description: 'Test Description',
      contact: {
        name: 'BreakApp Development Team',
        email: 'support@breakapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: process.env.PROD_API_URL || 'https://api.breakapp.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: { type: 'object' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'] }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string' }, password: { type: 'string' } }
        },
        AuthResponse: {
          type: 'object',
          properties: { success: { type: 'boolean' }, data: { type: 'object' } }
        },
        Restaurant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            latitude: { type: 'number', format: 'float' },
            longitude: { type: 'number', format: 'float' }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            menuType: { type: 'string', enum: ['CORE', 'GEOGRAPHIC'] },
            nutritionalInfo: {
              properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' }
              }
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
            orderType: { type: 'string', enum: ['REGULAR', 'EXCEPTION'] },
            totalAmount: { type: 'number' }
          }
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['restaurantId', 'items'],
          properties: {
            restaurantId: { type: 'string' },
            items: {
              type: 'array',
              items: { required: ['menuItemId', 'quantity'] }
            },
            exceptionType: { type: 'string', enum: ['FULL', 'LIMITED', 'SELF_PAID'] }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['ORDER_CONFIRMED', 'ORDER_READY', 'ORDER_DELIVERED', 'EXCEPTION_APPROVED', 'REMINDER', 'SYSTEM'] }
          }
        },
        NutritionLog: {
          type: 'object',
          properties: {
            totalCalories: { type: 'number' },
            totalProtein: { type: 'number' },
            totalCarbs: { type: 'number' },
            totalFat: { type: 'number' }
          }
        },
        Recommendation: {
          type: 'object',
          properties: {
            recommendationType: { type: 'string', enum: ['WEATHER_BASED', 'PERSONALIZED', 'SIMILAR_ITEMS', 'DIETARY_DIVERSITY', 'TRENDING'] },
            score: { type: 'number' }
          }
        }
      },
      responses: {
        Unauthorized: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        Forbidden: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        NotFound: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        ValidationError: { description: 'Validation Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
      }
    },
    security: [{ bearerAuth: [] }]
  }));
});

describe('Swagger Configuration', () => {
  let swaggerSpec;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
  });

  describe('Basic Configuration', () => {
    it('should load swagger configuration successfully', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec).toBeDefined();
    });

    it('should have OpenAPI 3.0.0 specification', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.openapi).toBe('3.0.0');
    });

    it('should have API info defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.info).toBeDefined();
      expect(swaggerSpec.info.title).toBe('BreakApp API');
      expect(swaggerSpec.info.version).toBe('1.0.0');
      expect(swaggerSpec.info.description).toBeDefined();
    });

    it('should have contact information', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.info.contact).toBeDefined();
      expect(swaggerSpec.info.contact.name).toBe('BreakApp Development Team');
      expect(swaggerSpec.info.contact.email).toBe('support@breakapp.com');
    });

    it('should have license information', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.info.license).toBeDefined();
      expect(swaggerSpec.info.license.name).toBe('MIT');
      expect(swaggerSpec.info.license.url).toBe('https://opensource.org/licenses/MIT');
    });
  });

  describe('Server Configuration', () => {
    it('should have servers defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.servers).toBeDefined();
      expect(Array.isArray(swaggerSpec.servers)).toBe(true);
      expect(swaggerSpec.servers.length).toBeGreaterThanOrEqual(1);
    });

    it('should have development server', () => {
      swaggerSpec = require('../../../src/config/swagger');
      const devServer = swaggerSpec.servers.find(s => s.description === 'Development server');
      expect(devServer).toBeDefined();
    });

    it('should have production server', () => {
      swaggerSpec = require('../../../src/config/swagger');
      const prodServer = swaggerSpec.servers.find(s => s.description === 'Production server');
      expect(prodServer).toBeDefined();
    });
  });

  describe('Security Schemes', () => {
    it('should have components defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components).toBeDefined();
    });

    it('should have security schemes defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.securitySchemes).toBeDefined();
    });

    it('should have bearer authentication configured', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
      expect(swaggerSpec.components.securitySchemes.bearerAuth.type).toBe('http');
      expect(swaggerSpec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
      expect(swaggerSpec.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    });

    it('should have global security applied', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.security).toBeDefined();
      expect(Array.isArray(swaggerSpec.security)).toBe(true);
    });
  });

  describe('Schema Definitions', () => {
    it('should have schemas defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.schemas).toBeDefined();
      expect(typeof swaggerSpec.components.schemas).toBe('object');
    });

    describe('General Schemas', () => {
      it('should have Error schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        expect(swaggerSpec.components.schemas.Error).toBeDefined();
        expect(swaggerSpec.components.schemas.Error.type).toBe('object');
        expect(swaggerSpec.components.schemas.Error.properties.success).toBeDefined();
        expect(swaggerSpec.components.schemas.Error.properties.error).toBeDefined();
      });

      it('should have Success schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        expect(swaggerSpec.components.schemas.Success).toBeDefined();
        expect(swaggerSpec.components.schemas.Success.type).toBe('object');
        expect(swaggerSpec.components.schemas.Success.properties.success).toBeDefined();
        expect(swaggerSpec.components.schemas.Success.properties.data).toBeDefined();
      });
    });

    describe('User Schemas', () => {
      it('should have User schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const userSchema = swaggerSpec.components.schemas.User;
        expect(userSchema).toBeDefined();
        expect(userSchema.type).toBe('object');
        expect(userSchema.properties.id).toBeDefined();
        expect(userSchema.properties.email).toBeDefined();
        expect(userSchema.properties.firstName).toBeDefined();
        expect(userSchema.properties.lastName).toBeDefined();
        expect(userSchema.properties.role).toBeDefined();
      });

      it('should have correct user role enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const roleEnum = swaggerSpec.components.schemas.User.properties.role.enum;
        expect(roleEnum).toBeDefined();
        expect(roleEnum).toContain('REGULAR');
        expect(roleEnum).toContain('VIP');
        expect(roleEnum).toContain('ADMIN');
        expect(roleEnum).toContain('PRODUCER');
      });
    });

    describe('Auth Schemas', () => {
      it('should have RegisterRequest schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const registerSchema = swaggerSpec.components.schemas.RegisterRequest;
        expect(registerSchema).toBeDefined();
        expect(registerSchema.required).toContain('email');
        expect(registerSchema.required).toContain('password');
        expect(registerSchema.required).toContain('firstName');
        expect(registerSchema.required).toContain('lastName');
      });

      it('should have LoginRequest schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const loginSchema = swaggerSpec.components.schemas.LoginRequest;
        expect(loginSchema).toBeDefined();
        expect(loginSchema.required).toContain('email');
        expect(loginSchema.required).toContain('password');
      });

      it('should have AuthResponse schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const authResponseSchema = swaggerSpec.components.schemas.AuthResponse;
        expect(authResponseSchema).toBeDefined();
        expect(authResponseSchema.properties.data).toBeDefined();
      });

      it('should validate password minimum length', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const passwordField = swaggerSpec.components.schemas.RegisterRequest.properties.password;
        expect(passwordField.minLength).toBe(8);
      });
    });

    describe('Restaurant Schemas', () => {
      it('should have Restaurant schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const restaurantSchema = swaggerSpec.components.schemas.Restaurant;
        expect(restaurantSchema).toBeDefined();
        expect(restaurantSchema.properties.id).toBeDefined();
        expect(restaurantSchema.properties.name).toBeDefined();
        expect(restaurantSchema.properties.latitude).toBeDefined();
        expect(restaurantSchema.properties.longitude).toBeDefined();
      });

      it('should have location coordinates as float', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const restaurantSchema = swaggerSpec.components.schemas.Restaurant;
        expect(restaurantSchema.properties.latitude.format).toBe('float');
        expect(restaurantSchema.properties.longitude.format).toBe('float');
      });
    });

    describe('Menu Item Schemas', () => {
      it('should have MenuItem schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const menuItemSchema = swaggerSpec.components.schemas.MenuItem;
        expect(menuItemSchema).toBeDefined();
        expect(menuItemSchema.properties.name).toBeDefined();
        expect(menuItemSchema.properties.price).toBeDefined();
        expect(menuItemSchema.properties.nutritionalInfo).toBeDefined();
      });

      it('should have menu type enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const menuTypeEnum = swaggerSpec.components.schemas.MenuItem.properties.menuType.enum;
        expect(menuTypeEnum).toBeDefined();
        expect(menuTypeEnum).toContain('CORE');
        expect(menuTypeEnum).toContain('GEOGRAPHIC');
      });

      it('should have nutritional information structure', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const nutritionalInfo = swaggerSpec.components.schemas.MenuItem.properties.nutritionalInfo;
        expect(nutritionalInfo.properties.calories).toBeDefined();
        expect(nutritionalInfo.properties.protein).toBeDefined();
        expect(nutritionalInfo.properties.carbs).toBeDefined();
        expect(nutritionalInfo.properties.fat).toBeDefined();
      });
    });

    describe('Order Schemas', () => {
      it('should have Order schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const orderSchema = swaggerSpec.components.schemas.Order;
        expect(orderSchema).toBeDefined();
        expect(orderSchema.properties.status).toBeDefined();
        expect(orderSchema.properties.orderType).toBeDefined();
        expect(orderSchema.properties.totalAmount).toBeDefined();
      });

      it('should have correct order status enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const statusEnum = swaggerSpec.components.schemas.Order.properties.status.enum;
        expect(statusEnum).toContain('PENDING');
        expect(statusEnum).toContain('CONFIRMED');
        expect(statusEnum).toContain('PREPARING');
        expect(statusEnum).toContain('OUT_FOR_DELIVERY');
        expect(statusEnum).toContain('DELIVERED');
        expect(statusEnum).toContain('CANCELLED');
      });

      it('should have correct order type enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const typeEnum = swaggerSpec.components.schemas.Order.properties.orderType.enum;
        expect(typeEnum).toContain('REGULAR');
        expect(typeEnum).toContain('EXCEPTION');
      });

      it('should have CreateOrderRequest schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const createOrderSchema = swaggerSpec.components.schemas.CreateOrderRequest;
        expect(createOrderSchema).toBeDefined();
        expect(createOrderSchema.required).toContain('restaurantId');
        expect(createOrderSchema.required).toContain('items');
      });

      it('should validate order items structure', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const itemsSchema = swaggerSpec.components.schemas.CreateOrderRequest.properties.items;
        expect(itemsSchema.type).toBe('array');
        expect(itemsSchema.items.required).toContain('menuItemId');
        expect(itemsSchema.items.required).toContain('quantity');
      });

      it('should have exception type enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const exceptionEnum = swaggerSpec.components.schemas.CreateOrderRequest.properties.exceptionType.enum;
        expect(exceptionEnum).toContain('FULL');
        expect(exceptionEnum).toContain('LIMITED');
        expect(exceptionEnum).toContain('SELF_PAID');
      });
    });

    describe('Notification Schemas', () => {
      it('should have Notification schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const notificationSchema = swaggerSpec.components.schemas.Notification;
        expect(notificationSchema).toBeDefined();
        expect(notificationSchema.properties.type).toBeDefined();
        expect(notificationSchema.properties.title).toBeDefined();
        expect(notificationSchema.properties.message).toBeDefined();
      });

      it('should have correct notification type enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const typeEnum = swaggerSpec.components.schemas.Notification.properties.type.enum;
        expect(typeEnum).toContain('ORDER_CONFIRMED');
        expect(typeEnum).toContain('ORDER_READY');
        expect(typeEnum).toContain('ORDER_DELIVERED');
        expect(typeEnum).toContain('EXCEPTION_APPROVED');
        expect(typeEnum).toContain('REMINDER');
        expect(typeEnum).toContain('SYSTEM');
      });
    });

    describe('Nutrition Schemas', () => {
      it('should have NutritionLog schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const nutritionLogSchema = swaggerSpec.components.schemas.NutritionLog;
        expect(nutritionLogSchema).toBeDefined();
        expect(nutritionLogSchema.properties.totalCalories).toBeDefined();
        expect(nutritionLogSchema.properties.totalProtein).toBeDefined();
        expect(nutritionLogSchema.properties.totalCarbs).toBeDefined();
        expect(nutritionLogSchema.properties.totalFat).toBeDefined();
      });
    });

    describe('Recommendation Schemas', () => {
      it('should have Recommendation schema', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const recommendationSchema = swaggerSpec.components.schemas.Recommendation;
        expect(recommendationSchema).toBeDefined();
        expect(recommendationSchema.properties.recommendationType).toBeDefined();
        expect(recommendationSchema.properties.score).toBeDefined();
      });

      it('should have correct recommendation type enum', () => {
        swaggerSpec = require('../../../src/config/swagger');
        const typeEnum = swaggerSpec.components.schemas.Recommendation.properties.recommendationType.enum;
        expect(typeEnum).toContain('WEATHER_BASED');
        expect(typeEnum).toContain('PERSONALIZED');
        expect(typeEnum).toContain('SIMILAR_ITEMS');
        expect(typeEnum).toContain('DIETARY_DIVERSITY');
        expect(typeEnum).toContain('TRENDING');
      });
    });
  });

  describe('Response Definitions', () => {
    it('should have responses defined', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.responses).toBeDefined();
    });

    it('should have Unauthorized response', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.responses.Unauthorized).toBeDefined();
      expect(swaggerSpec.components.responses.Unauthorized.description).toBeDefined();
    });

    it('should have Forbidden response', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.responses.Forbidden).toBeDefined();
    });

    it('should have NotFound response', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.responses.NotFound).toBeDefined();
    });

    it('should have ValidationError response', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.components.responses.ValidationError).toBeDefined();
    });

    it('should have all responses use Error schema', () => {
      swaggerSpec = require('../../../src/config/swagger');
      const responses = swaggerSpec.components.responses;

      Object.values(responses).forEach(response => {
        expect(response.content).toBeDefined();
        expect(response.content['application/json']).toBeDefined();
        expect(response.content['application/json'].schema).toBeDefined();
      });
    });
  });

  describe('Paths and API Documentation', () => {
    it('should export swagger specification', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec).toBeTruthy();
      expect(typeof swaggerSpec).toBe('object');
    });

    it('should be compatible with OpenAPI 3.0', () => {
      swaggerSpec = require('../../../src/config/swagger');
      expect(swaggerSpec.openapi).toMatch(/^3\.0\./);
    });
  });

  describe('Environment Configuration', () => {
    it('should use environment variables for server URLs', () => {
      const originalEnv = process.env;
      process.env.API_BASE_URL = 'http://test:3000/api/v1';

      jest.resetModules();
      swaggerSpec = require('../../../src/config/swagger');

      const devServer = swaggerSpec.servers.find(s => s.description === 'Development server');
      expect(devServer.url).toBe('http://test:3000/api/v1');

      process.env = originalEnv;
    });

    it('should have default values when env vars not set', () => {
      const originalEnv = process.env;
      delete process.env.API_BASE_URL;
      delete process.env.PROD_API_URL;

      jest.resetModules();
      swaggerSpec = require('../../../src/config/swagger');

      const devServer = swaggerSpec.servers.find(s => s.description === 'Development server');
      expect(devServer.url).toBe('http://localhost:3000/api/v1');

      process.env = originalEnv;
    });
  });
});
