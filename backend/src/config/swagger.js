/**
 * Swagger API Documentation Configuration
 * تكوين توثيق API باستخدام Swagger
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BreakApp API',
      version: '1.0.0',
      description: `
        توثيق API الشامل لتطبيق BreakApp

        ## الميزات الرئيسية
        - نظام طلبات المطاعم
        - إدارة الاستثناءات الغذائية
        - التوصيات الذكية
        - متابعة التغذية
        - نظام المدفوعات
        - التحليلات والتقارير

        ## المصادقة
        معظم الطلبات تتطلب JWT token في الرأس:
        \`Authorization: Bearer <token>\`
      `,
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
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        // General Schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'خطأ في التحقق من البيانات'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        },

        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'معرف المستخدم الفريد'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'البريد الإلكتروني'
            },
            firstName: {
              type: 'string',
              description: 'الاسم الأول'
            },
            lastName: {
              type: 'string',
              description: 'اسم العائلة'
            },
            phoneNumber: {
              type: 'string',
              description: 'رقم الهاتف'
            },
            role: {
              type: 'string',
              enum: ['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'],
              description: 'دور المستخدم'
            },
            isActive: {
              type: 'boolean',
              description: 'حالة النشاط'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ الإنشاء'
            }
          }
        },

        // Auth Schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'البريد الإلكتروني'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'كلمة المرور (8 أحرف على الأقل)'
            },
            firstName: {
              type: 'string',
              description: 'الاسم الأول'
            },
            lastName: {
              type: 'string',
              description: 'اسم العائلة'
            },
            phoneNumber: {
              type: 'string',
              description: 'رقم الهاتف (اختياري)'
            }
          }
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string'
            }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'JWT token'
                },
                refreshToken: {
                  type: 'string',
                  description: 'Refresh token'
                }
              }
            }
          }
        },

        // Restaurant Schemas
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            cuisineType: {
              type: 'string'
            },
            address: {
              type: 'string'
            },
            latitude: {
              type: 'number',
              format: 'float'
            },
            longitude: {
              type: 'number',
              format: 'float'
            },
            rating: {
              type: 'number',
              format: 'float'
            },
            isPartner: {
              type: 'boolean'
            },
            isActive: {
              type: 'boolean'
            }
          }
        },

        // Menu Item Schemas
        MenuItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            restaurantId: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            nameAr: {
              type: 'string',
              description: 'الاسم بالعربية'
            },
            description: {
              type: 'string'
            },
            price: {
              type: 'number',
              format: 'float'
            },
            category: {
              type: 'string'
            },
            imageUrl: {
              type: 'string',
              format: 'uri'
            },
            isAvailable: {
              type: 'boolean'
            },
            menuType: {
              type: 'string',
              enum: ['CORE', 'GEOGRAPHIC']
            },
            nutritionalInfo: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' }
              }
            }
          }
        },

        // Order Schemas
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            restaurantId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
            },
            orderType: {
              type: 'string',
              enum: ['REGULAR', 'EXCEPTION']
            },
            totalAmount: {
              type: 'number',
              format: 'float'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuItemId: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        CreateOrderRequest: {
          type: 'object',
          required: ['restaurantId', 'items'],
          properties: {
            restaurantId: {
              type: 'string',
              format: 'uuid'
            },
            projectId: {
              type: 'string',
              format: 'uuid',
              description: 'معرف المشروع (QR Code)'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['menuItemId', 'quantity'],
                properties: {
                  menuItemId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  quantity: {
                    type: 'integer',
                    minimum: 1
                  },
                  specialInstructions: {
                    type: 'string'
                  }
                }
              }
            },
            deliveryAddress: {
              type: 'string'
            },
            exceptionType: {
              type: 'string',
              enum: ['FULL', 'LIMITED', 'SELF_PAID']
            }
          }
        },

        // Notification Schemas
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            type: {
              type: 'string',
              enum: ['ORDER_CONFIRMED', 'ORDER_READY', 'ORDER_DELIVERED', 'EXCEPTION_APPROVED', 'REMINDER', 'SYSTEM']
            },
            title: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            isRead: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Nutrition Schemas
        NutritionLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            totalCalories: {
              type: 'number'
            },
            totalProtein: {
              type: 'number'
            },
            totalCarbs: {
              type: 'number'
            },
            totalFat: {
              type: 'number'
            },
            mealsCount: {
              type: 'integer'
            }
          }
        },

        // Recommendation Schemas
        Recommendation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            menuItemId: {
              type: 'string',
              format: 'uuid'
            },
            recommendationType: {
              type: 'string',
              enum: ['WEATHER_BASED', 'PERSONALIZED', 'SIMILAR_ITEMS', 'DIETARY_DIVERSITY', 'TRENDING']
            },
            score: {
              type: 'number',
              format: 'float'
            },
            reason: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            }
          }
        }
      },

      // Common Responses
      responses: {
        Unauthorized: {
          description: 'غير مصرح - JWT token مطلوب',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'ممنوع الوصول - ليس لديك الصلاحيات الكافية',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'المورد غير موجود',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'خطأ في التحقق من البيانات',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
