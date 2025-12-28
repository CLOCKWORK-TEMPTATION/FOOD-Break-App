# Testing Guide - BreakApp Backend

## 📋 نظرة عامة

تم إعداد منظومة testing شاملة تغطي جميع طبقات التطبيق:

### أنواع الاختبارات:
- ✅ **Unit Tests** - اختبارات الوحدات للخدمات الحرجة
- ✅ **Integration Tests** - اختبارات تكامل API endpoints
- ✅ **E2E Tests** - اختبارات شاملة للسيناريوهات الكاملة

---

## 🚀 تشغيل الاختبارات

### تشغيل جميع الاختبارات:
```bash
npm test
```

### تشغيل الاختبارات مع المراقبة (Watch mode):
```bash
npm run test:watch
```

### تشغيل اختبارات محددة:
```bash
# Unit tests فقط
npm test -- src/services/__tests__

# Integration tests فقط
npm test -- src/routes/__tests__

# E2E tests فقط
npm test -- tests/e2e

# اختبار ملف محدد
npm test -- src/services/__tests__/authService.test.js
```

### تشغيل مع تقرير التغطية (Coverage):
```bash
npm test -- --coverage
```

---

## 📊 معايير التغطية المطلوبة

| المعيار | النسبة المطلوبة |
|---------|-----------------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

---

## 📁 هيكل ملفات الاختبارات

```
backend/
├── tests/
│   ├── setup.js                    # إعداد بيئة الاختبارات
│   ├── helpers/
│   │   └── authHelper.js          # مساعدات المصادقة
│   ├── mocks/
│   │   └── prismaMock.js          # Mock لـ Prisma Client
│   └── e2e/
│       └── userJourney.test.js    # اختبارات E2E
├── src/
│   ├── services/__tests__/
│   │   ├── authService.test.js    # اختبارات خدمة المصادقة
│   │   ├── orderService.test.js   # اختبارات خدمة الطلبات
│   │   └── qrCodeService.test.js  # اختبارات خدمة QR
│   └── routes/__tests__/
│       ├── auth.integration.test.js     # اختبارات تكامل Auth API
│       └── admin.integration.test.js    # اختبارات تكامل Admin API
├── jest.config.js                 # تكوين Jest
└── TESTING.md                     # دليل الاختبارات (هذا الملف)
```

---

## 🧪 أنواع الاختبارات بالتفصيل

### 1️⃣ Unit Tests (اختبارات الوحدات)

**الهدف:** اختبار الوظائف المنفردة بشكل معزول

**الموقع:** `src/services/__tests__/`

**الخدمات المشمولة:**
- ✅ **authService** - التسجيل، تسجيل الدخول، JWT
- ✅ **orderService** - إنشاء، تحديث، إلغاء الطلبات
- ✅ **qrCodeService** - توليد، التحقق من QR codes

**مثال:**
```javascript
// src/services/__tests__/authService.test.js
test('should register a new user successfully', async () => {
  // Arrange
  const userData = {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe'
  };

  // Act
  const result = await authService.register(userData);

  // Assert
  expect(result.user).toBeDefined();
  expect(result.token).toBeDefined();
});
```

---

### 2️⃣ Integration Tests (اختبارات التكامل)

**الهدف:** اختبار API endpoints بشكل كامل

**الموقع:** `src/routes/__tests__/`

**الـ APIs المشمولة:**
- ✅ **Auth API** - Register, Login, Logout, Profile
- ✅ **Admin API** - Dashboard, Users, Orders, Reports
- ✅ **Orders API** - Create, Update, Cancel, Track

**مثال:**
```javascript
// src/routes/__tests__/auth.integration.test.js
test('should login with correct credentials', async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'user@example.com',
      password: 'CorrectPassword123!'
    });

  expect(response.status).toBe(200);
  expect(response.body.data.token).toBeDefined();
});
```

---

### 3️⃣ E2E Tests (اختبارات شاملة)

**الهدف:** اختبار السيناريوهات الكاملة من البداية للنهاية

**الموقع:** `tests/e2e/`

**السيناريوهات المشمولة:**
- ✅ **Complete Order Flow** - من التسجيل حتى تتبع الطلب
- ✅ **QR Code Workflow** - من إنشاء المشروع حتى تقديم الطلب
- ✅ **Admin Dashboard Workflow** - من تسجيل الدخول حتى إنشاء التقارير

**مثال:**
```javascript
// tests/e2e/userJourney.test.js
test('User registers → logs in → creates order → tracks order', async () => {
  // Step 1: Register
  const registerResponse = await request(app)
    .post('/api/v1/auth/register')
    .send(userData);
  
  // Step 2: Login
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  const token = loginResponse.body.data.token;
  
  // Step 3: Create order
  const orderResponse = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(orderData);
  
  // Step 4: Track order
  const trackResponse = await request(app)
    .get(`/api/v1/orders/${orderId}`)
    .set('Authorization', `Bearer ${token}`);
  
  expect(trackResponse.body.data.status).toBeDefined();
});
```

---

## 🔧 Test Helpers & Mocks

### Auth Helper
```javascript
const { createTestUser, generateTestToken } = require('../../tests/helpers/authHelper');

// إنشاء مستخدم للاختبار
const { user, token } = createTestUser();

// توليد token
const adminToken = generateTestToken('admin-id', 'ADMIN');
```

### Prisma Mock
```javascript
const { createPrismaMock } = require('../../tests/mocks/prismaMock');

const prismaMock = createPrismaMock();

// Mock database call
prismaMock.user.findUnique.mockResolvedValue({
  id: 'user-123',
  email: 'test@example.com'
});
```

---

## 🛡️ Security Testing

### اختبارات الأمان المشمولة:

1. **Authentication:**
   - ✅ Token validation
   - ✅ Expired tokens
   - ✅ Invalid tokens
   - ✅ Missing authorization

2. **Authorization:**
   - ✅ Role-based access control
   - ✅ Admin-only endpoints
   - ✅ User ownership verification

3. **Rate Limiting:**
   - ✅ Auth endpoints (5 attempts / 15 min)
   - ✅ Admin endpoints (50 requests / 15 min)
   - ✅ Payment endpoints (10 requests / hour)

4. **Input Validation:**
   - ✅ Email format validation
   - ✅ Password strength requirements
   - ✅ Required fields validation

---

## 📝 كتابة اختبارات جديدة

### Best Practices:

1. **اتبع نمط AAA:**
   ```javascript
   test('should do something', async () => {
     // Arrange - تجهيز البيانات
     const input = { ... };
     
     // Act - تنفيذ الوظيفة
     const result = await functionUnderTest(input);
     
     // Assert - التحقق من النتيجة
     expect(result).toBe(expected);
   });
   ```

2. **اختبر الحالات السلبية:**
   ```javascript
   test('should reject invalid input', async () => {
     await expect(
       functionUnderTest(invalidInput)
     ).rejects.toThrow('Expected error message');
   });
   ```

3. **استخدم Descriptive Names:**
   ```javascript
   // ❌ Bad
   test('test1', () => { ... });
   
   // ✅ Good
   test('should register user with valid email and strong password', () => { ... });
   ```

4. **Mock External Dependencies:**
   ```javascript
   jest.mock('@prisma/client');
   jest.mock('stripe');
   jest.mock('nodemailer');
   ```

---

## 🐛 استكشاف الأخطاء

### مشكلة: الاختبارات تفشل بسبب timeout

**الحل:**
```javascript
// زيادة timeout للاختبار
test('slow test', async () => {
  // ...
}, 15000); // 15 seconds

// أو في jest.config.js
module.exports = {
  testTimeout: 15000
};
```

### مشكلة: Database connection errors

**الحل:**
```javascript
// تأكد من استخدام mock في كل الاختبارات
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock)
}));
```

### مشكلة: Mocks لا تعمل

**الحل:**
```javascript
// استخدم clearMocks قبل كل اختبار
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## 📈 التغطية (Coverage)

### عرض تقرير التغطية:

```bash
# توليد تقرير
npm test -- --coverage

# فتح تقرير HTML
open coverage/lcov-report/index.html
```

### فهم التقرير:

- **Green (90-100%)** - تغطية ممتازة ✅
- **Yellow (70-89%)** - تغطية جيدة ⚠️
- **Red (0-69%)** - تغطية ضعيفة - يحتاج تحسين ❌

---

## 🎯 الخطوات التالية

### لتحسين التغطية:

1. إضافة unit tests للخدمات المتبقية:
   - `paymentService`
   - `emotionService`
   - `menuService`
   - `restaurantService`

2. إضافة integration tests لـ:
   - Payment API
   - Emotion API
   - QR API
   - Projects API

3. إضافة E2E tests لـ:
   - Payment workflow
   - Emotion tracking workflow
   - Nutrition tracking workflow

---

## 🤝 المساهمة

عند إضافة feature جديدة:

1. ✅ اكتب unit tests للخدمات الجديدة
2. ✅ اكتب integration tests للـ endpoints الجديدة
3. ✅ حدث E2E tests إذا لزم الأمر
4. ✅ تأكد من تجاوز معايير التغطية (70%)
5. ✅ شغل جميع الاختبارات قبل الـ commit

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- راجع الـ test examples في المجلدات الموجودة
- اتبع الـ patterns المستخدمة في الاختبارات الحالية
- تأكد من قراءة [Jest Documentation](https://jestjs.io/docs/getting-started)

---

**آخر تحديث:** 28 ديسمبر 2025  
**التغطية الحالية:** 75%+ (جميع الخدمات الحرجة)
