# دليل الاختبارات الشامل - BreakApp Backend

## نظرة عامة

تم إعداد نظام اختبارات شامل يغطي:
- ✅ **Unit Tests**: اختبارات الوحدات للخدمات الحرجة
- ✅ **Integration Tests**: اختبارات التكامل لـ API endpoints
- ✅ **E2E Tests**: اختبارات السيناريوهات الكاملة

## الهيكل

```
tests/
├── unit/                    # Unit Tests
│   └── services/
│       ├── authService.test.js
│       ├── menuService.test.js
│       ├── paymentService.test.js
│       └── qrCodeService.test.js
│
├── integration/             # Integration Tests
│   └── api/
│       ├── auth.test.js
│       ├── orders.test.js
│       └── payments.test.js
│
├── e2e/                    # E2E Tests
│   ├── orderFlow.test.js
│   └── paymentFlow.test.js
│
└── utils/                  # Test Utilities
    ├── testHelpers.js
    └── testDatabase.js
```

## الخدمات المختبرة

### Unit Tests

1. **Auth Service**
   - Password hashing
   - JWT token generation
   - Token validation
   - User authentication logic

2. **Menu Service**
   - getAllMenuItems
   - getMenuItemById
   - getCoreMenu
   - Menu filtering

3. **Payment Service**
   - Payment intent creation
   - Payment status mapping
   - Refund processing

4. **QR Code Service**
   - QR code generation
   - Token validation
   - Hash generation

### Integration Tests

1. **Auth API**
   - User registration
   - User login
   - Get current user
   - Token validation

2. **Orders API**
   - Create order
   - Get orders
   - Get order by ID
   - Update order status

3. **Payments API**
   - Create payment intent
   - Confirm payment
   - Get payments
   - Create invoice

### E2E Tests

1. **Order Flow**
   - Complete order lifecycle
   - User registration → Login → Browse → Order → Track

2. **Payment Flow**
   - Complete payment lifecycle
   - Payment intent → Confirmation → Invoice

## تشغيل الاختبارات

### جميع الاختبارات
```bash
npm test
```

### Unit Tests فقط
```bash
npm run test:unit
```

### Integration Tests فقط
```bash
npm run test:integration
```

### E2E Tests فقط
```bash
npm run test:e2e
```

### مع Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## إعداد قاعدة البيانات للاختبارات

### 1. إنشاء قاعدة بيانات منفصلة
```bash
createdb breakapp_test
```

### 2. إعداد متغيرات البيئة
انسخ `.env.test.example` إلى `.env.test`:
```bash
cp .env.test.example .env.test
```

عدّل `TEST_DATABASE_URL` في `.env.test`:
```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/breakapp_test"
```

### 3. تشغيل Migrations
```bash
DATABASE_URL=$TEST_DATABASE_URL npm run db:migrate
```

## كتابة اختبارات جديدة

### Unit Test Example
```javascript
const service = require('../../../src/services/myService');

describe('My Service - Unit Tests', () => {
  test('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example
```javascript
const request = require('supertest');
const app = require('../../../src/server');

describe('My API - Integration Tests', () => {
  test('should return 200', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### E2E Test Example
```javascript
describe('E2E - Complete Flow', () => {
  test('should complete full flow', async () => {
    // Step 1: Register
    // Step 2: Login
    // Step 3: Perform actions
    // Step 4: Verify results
  });
});
```

## Test Helpers

استخدم الأدوات المساعدة من `tests/utils/testHelpers.js`:

```javascript
const {
  createTestUser,
  createTestRestaurant,
  createTestMenuItem,
  createTestOrder,
  generateTestToken,
  cleanupTestData
} = require('../utils/testHelpers');
```

## Best Practices

1. **Isolation**: كل اختبار مستقل
2. **Cleanup**: تنظيف البيانات بعد كل اختبار
3. **Mocking**: Mock الخدمات الخارجية (Stripe, PayPal)
4. **Naming**: أسماء واضحة ووصفية
5. **Arrange-Act-Assert**: هيكل واضح للاختبارات

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Troubleshooting

### Database Connection Failed
```bash
# تأكد من وجود TEST_DATABASE_URL
echo $TEST_DATABASE_URL

# تأكد من تشغيل قاعدة البيانات
pg_isready
```

### Prisma Client Not Found
```bash
npm run db:generate
```

### Tests Timeout
زيادة `testTimeout` في `jest.config.js` أو ملفات config الفرعية.

### Mock Not Working
تأكد من أن Mock يتم قبل require للخدمة:
```javascript
jest.mock('stripe', () => {
  // Mock implementation
});
```

## Continuous Integration

للإضافة إلى CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    npm install
    npm run db:generate
    npm test
```

## المزيد من المعلومات

راجع `tests/README.md` للتفاصيل الإضافية.
