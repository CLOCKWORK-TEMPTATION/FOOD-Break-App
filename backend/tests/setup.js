/**
 * Jest Setup File - إعداد بيئة الاختبار
 */

// إعداد متغيرات البيئة للاختبارات
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/breakapp_test';

// إعداد API Keys للاختبارات (مفاتيح وهمية)
process.env.OPENAI_API_KEY = 'sk-test-openai-key-for-testing';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.TOGETHER_API_KEY = 'test-together-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

// إعداد Stripe للاختبارات
process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';

// إعداد PayPal للاختبارات
process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';

// إعداد الإشعارات للاختبارات
process.env.PUSH_NOTIFICATIONS_ENABLED = 'false';
process.env.SMS_ENABLED = 'false';
process.env.SMTP_ENABLED = 'false';

// إعداد Phase 4 للاختبارات
process.env.VOICE_ENABLED = 'true';
process.env.MEDICAL_DATA_ENABLED = 'true';
process.env.EMERGENCY_MODE_ENABLED = 'true';
process.env.MEDICAL_DATA_ENCRYPTION_KEY = 'test-256-bit-encryption-key-for-testing-only-12345';

// إعداد QR Code للاختبارات
process.env.QR_SECRET_KEY = 'test-qr-secret-key-for-testing-only-32-chars';

// تعطيل التسجيل أثناء الاختبارات
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Mock external services
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
}));

jest.mock('@paypal/checkout-server-sdk', () => ({
  core: {
    SandboxEnvironment: jest.fn(),
    PayPalHttpClient: jest.fn(),
  },
  orders: {
    OrdersCreateRequest: jest.fn(),
    OrdersCaptureRequest: jest.fn(),
  },
}));

// Mock OpenAI and other AI services
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test AI response' } }]
        }),
      },
    },
  }));
});

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Test Anthropic response' }]
      }),
    },
  })),
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Test Anthropic response' }]
      }),
    },
  })),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Test Google AI response')
        }
      }),
    })),
  })),
}));

// Mock Groq SDK
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test Groq response' } }]
        }),
      },
    },
  }));
});

// Mock Together AI
jest.mock('together-ai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test Together AI response' } }]
        }),
      },
    },
  }));
});

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

// Mock QR code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test-qr-code'),
}));

// Mock file system operations for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'test-uuid-12345'),
  randomBytes: jest.fn((size) => Buffer.alloc(size, 'test-random-bytes')),
}));

// Mock speech-to-text for voice service tests - use virtual mock
jest.mock('speech-to-text', () => ({
  SpeechToTextV1: jest.fn(() => ({
    recognize: jest.fn().mockResolvedValue({
      result: {
        results: [{
          alternatives: [{
            transcript: 'Test speech recognition result'
          }]
        }]
      }
    }),
  })),
}), { virtual: true });

// Mock text-to-speech for voice service tests - use virtual mock
jest.mock('text-to-speech', () => ({
  TextToSpeechClient: jest.fn(() => ({
    synthesizeSpeech: jest.fn().mockResolvedValue([{
      audioContent: Buffer.from('test-audio-content')
    }]),
  })),
}), { virtual: true });

// Mock swagger-jsdoc to prevent parsing issues during tests
jest.mock('swagger-jsdoc', () => {
  return jest.fn(() => ({
    openapi: '3.0.0',
    info: {
      title: 'BreakApp API',
      version: '1.0.0',
      description: 'Test API Documentation'
    },
    paths: {},
    components: {}
  }));
});

// Mock localization system
const mockTranslations = {
  'orders.orderCreated': 'تم إنشاء الطلب بنجاح',
  'orders.itemsRequired': 'يجب إضافة عنصر واحد على الأقل للطلب',
  'orders.orderStatusUpdated': 'تم تحديث حالة الطلب إلى {status}',
  'orders.orderCancelled': 'تم إلغاء الطلب بنجاح',
  'emotion.moodLogSuccess': 'تم تسجيل المزاج بنجاح',
  'emotion.moodRequired': 'المزاج مطلوب',
  'emotion.consentUpdated': 'تم تحديث الموافقة بنجاح'
};

global.__ = jest.fn((key, params = {}) => {
  let translation = mockTranslations[key] || key;
  // Replace parameters in translation
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param]);
  });
  return translation;
});

// Mock localization middleware
jest.mock('../src/config/localization', () => ({
  localizationMiddleware: (req, res, next) => {
    req.__ = global.__;
    next();
  }
}));

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

// Setup global mockPrisma for all tests
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  restaurant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  menuItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  orderItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  project: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  // Phase 4 Models
  emergencySession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  prePreparedInventory: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  scheduleChangeNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyRestaurantNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalIncident: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalCheck: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalConsent: {
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyAlert: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyContactNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalDataAccessLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalDataDeletion: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  ingredient: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  drugFoodInteraction: {
    findFirst: jest.fn(),
    findMany: jest.fn()
  },
  voicePreferences: {
    create: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  voiceShortcut: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  personalVoiceModel: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn()
  },
  dietaryProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn()
  },
  // Emotion AI Models
  emotionLog: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  userMoodLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  consentRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  userConsent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  // Notification Models
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  // Exception Models
  exception: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  costAlert: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  budget: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  userReminderPreferences: {
    create: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  nutritionGoal: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  mealPlan: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  production: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  invoice: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  qRCode: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  reminder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  mlModel: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  prediction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  workflow: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  admin: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  analytics: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  // Voice Models
  voiceSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn().mockResolvedValue({
      _avg: { duration: 120 },
      _count: { id: 10 }
    }),
    deleteMany: jest.fn()
  },
  // Transaction support
  $transaction: jest.fn((callback) => callback(mockPrisma)),
  $disconnect: jest.fn(),
  $connect: jest.fn()
};

// Make mockPrisma available globally
global.mockPrisma = mockPrisma;
