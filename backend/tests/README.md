# دليل الاختبارات - BreakApp Backend

## نظرة عامة

هذا الدليل يشرح هيكل الاختبارات وكيفية تشغيلها.

## هيكل الاختبارات

```
tests/
├── unit/              # Unit Tests - اختبارات الوحدات
│   └── services/      # اختبارات الخدمات
├── integration/       # Integration Tests - اختبارات التكامل
│   └── api/          # اختبارات API endpoints
├── e2e/              # E2E Tests - اختبارات السيناريوهات الكاملة
└── utils/             # أدوات مساعدة للاختبارات
    ├── testHelpers.js
    └── testDatabase.js
```

## أنواع الاختبارات

### 1. Unit Tests (اختبارات الوحدات)
- **الهدف**: اختبار الوظائف والخدمات بشكل منفصل
- **الموقع**: `tests/unit/`
- **مثال**: اختبار منطق hash password، توليد JWT token

### 2. Integration Tests (اختبارات التكامل)
- **الهدف**: اختبار API endpoints بشكل متكامل
- **الموقع**: `tests/integration/`
- **مثال**: اختبار مسار تسجيل الدخول، إنشاء طلب

### 3. E2E Tests (اختبارات السيناريوهات الكاملة)
- **الهدف**: اختبار السيناريوهات الكاملة من البداية للنهاية
- **الموقع**: `tests/e2e/`
- **مثال**: التسجيل → تسجيل الدخول → تصفح القائمة → إنشاء طلب → الدفع

## تشغيل الاختبارات

### تشغيل جميع الاختبارات
```bash
npm test
```

### تشغيل Unit Tests فقط
```bash
npm run test:unit
```

### تشغيل Integration Tests فقط
```bash
npm run test:integration
```

### تشغيل E2E Tests فقط
```bash
npm run test:e2e
```

### تشغيل الاختبارات مع Coverage
```bash
npm run test:coverage
```

### تشغيل الاختبارات في وضع Watch
```bash
npm run test:watch
```

## إعداد قاعدة البيانات للاختبارات

1. إنشاء قاعدة بيانات منفصلة للاختبارات:
```bash
createdb breakapp_test
```

2. إضافة متغير البيئة:
```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/breakapp_test"
```

3. تشغيل Migrations:
```bash
DATABASE_URL=$TEST_DATABASE_URL npm run db:migrate
```

## كتابة اختبارات جديدة

### مثال: Unit Test
```javascript
describe('Service Name - Unit Tests', () => {
  test('should do something', () => {
    // Test implementation
  });
});
```

### مثال: Integration Test
```javascript
describe('API Endpoint - Integration Tests', () => {
  test('should return 200', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .expect(200);
  });
});
```

## Best Practices

1. **استخدام Test Helpers**: استخدم `testHelpers.js` لتقليل التكرار
2. **تنظيف البيانات**: استخدم `cleanupTestData()` بعد كل اختبار
3. **Mocking**: استخدم Mocks للخدمات الخارجية (Stripe, PayPal)
4. **Isolation**: كل اختبار يجب أن يكون مستقلاً
5. **Naming**: استخدم أسماء واضحة ووصفية للاختبارات

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Troubleshooting

### مشكلة: Database connection failed
**الحل**: تأكد من وجود `TEST_DATABASE_URL` في `.env`

### مشكلة: Tests timeout
**الحل**: زيادة `testTimeout` في `jest.config.js`

### مشكلة: Prisma Client not found
**الحل**: تشغيل `npm run db:generate`
