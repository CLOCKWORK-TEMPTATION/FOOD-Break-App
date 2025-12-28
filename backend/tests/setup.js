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
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test AI response' } }]
        }),
      },
    },
  })),
}));

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn(() => ({
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
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
}));