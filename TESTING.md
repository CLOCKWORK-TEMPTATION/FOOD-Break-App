# دليل الاختبارات الشامل - BreakApp Testing Guide

## 📋 جدول المحتويات - Table of Contents

1. [نظرة عامة - Overview](#نظرة-عامة---overview)
2. [هيكل الاختبارات - Test Structure](#هيكل-الاختبارات---test-structure)
3. [إعداد البيئة - Environment Setup](#إعداد-البيئة---environment-setup)
4. [تشغيل الاختبارات - Running Tests](#تشغيل-الاختبارات---running-tests)
5. [تفاصيل الاختبارات - Test Details](#تفاصيل-الاختبارات---test-details)
6. [تغطية الكود - Code Coverage](#تغطية-الكود---code-coverage)
7. [أفضل الممارسات - Best Practices](#أفضل-الممارسات---best-practices)
8. [اختبارات Frontend الجديدة](#اختبارات-frontend-الجديدة)
9. [اختبارات E2E الشاملة](#اختبارات-e2e-الشاملة)

---

## نظرة عامة - Overview

تم بناء مجموعة اختبارات شاملة لمشروع BreakApp تغطي:

### Mobile App Tests
- ✅ **apiService.ts** - خدمة API الأساسية مع 80+ اختبار
- ✅ **dietaryService.ts** - خدمة الحمية الغذائية مع 60+ اختبار
- ✅ **locationService.ts** - خدمة الموقع الجغرافي مع 50+ اختبار
- ✅ **paymentService.ts** - خدمة المدفوعات مع 70+ اختبار
- ✅ **qrScannerService.ts** - خدمة مسح QR مع 50+ اختبار

### Backend Tests
- ✅ **server.test.js** - اختبارات الخادم الأساسية

### إجمالي الاختبارات
- **310+ اختبار شامل**
- **تغطية 70%+** من الكود

---

## هيكل الاختبارات - Test Structure

```
breakapp/
├── mobile/
│   ├── jest.config.js                 # إعدادات Jest للتطبيق المحمول
│   ├── jest.setup.js                  # إعداد بيئة الاختبار
│   └── src/
│       └── services/
│           └── __tests__/             # مجلد الاختبارات
│               ├── apiService.test.ts
│               ├── dietaryService.test.ts
│               ├── locationService.test.ts
│               ├── paymentService.test.ts
│               └── qrScannerService.test.ts
│
└── backend/
    ├── jest.config.js                 # إعدادات Jest للخادم
    ├── jest.setup.js                  # إعداد بيئة الاختبار
    └── src/
        └── __tests__/                 # مجلد الاختبارات
            └── server.test.js
```

---

## إعداد البيئة - Environment Setup

### المتطلبات الأساسية

```bash
# Node.js >= 18.0.0
node --version

# npm >= 9.0.0
npm --version
```

### تثبيت التبعيات

#### Mobile App

```bash
cd mobile
npm install
```

التبعيات المثبتة:
- `jest` - إطار الاختبار
- `jest-expo` - إعدادات Jest لـ Expo
- `@testing-library/react-native` - مكتبة اختبار React Native
- `@testing-library/jest-native` - matchers إضافية
- `@types/jest` - تعريفات TypeScript لـ Jest

#### Backend

```bash
cd backend
npm install
```

التبعيات المثبتة:
- `jest` - إطار الاختبار
- `supertest` - اختبار HTTP endpoints

---

## تشغيل الاختبارات - Running Tests

### Mobile App Tests

```bash
cd mobile

# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch

# تشغيل الاختبارات مع تقرير التغطية
npm run test:coverage

# تشغيل اختبار محدد
npm test -- apiService.test.ts

# تشغيل الاختبارات بالتفصيل
npm test -- --verbose
```

### Backend Tests

```bash
cd backend

# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch

# تشغيل الاختبارات مع تقرير التغطية
npm test -- --coverage
```

### تشغيل جميع الاختبارات من الجذر

```bash
# من المجلد الرئيسي
npm test
```

---

## تفاصيل الاختبارات - Test Details

### 1. apiService.test.ts

**الوظائف المختبرة:**
- ✅ إدارة التوكنات (Token Management)
- ✅ إعداد الطلبات (Request Configuration)
- ✅ طلبات HTTP (GET, POST, PUT, PATCH, DELETE)
- ✅ المصادقة (Authentication: Login, Register, Logout)
- ✅ عمليات المشاريع (Project Operations)
- ✅ عمليات المطاعم (Restaurant Operations)
- ✅ إدارة الطلبات (Order Management)
- ✅ طلبات الاستثناء (Exception Requests)
- ✅ الإشعارات (Notifications)
- ✅ الموقع والتوصيل (Location & Delivery)
- ✅ معالجة الأخطاء (Error Handling)
- ✅ الحالات الحدودية (Edge Cases)

**عدد الاختبارات:** 85 اختبار

**أمثلة على السيناريوهات:**
```typescript
// اختبار تسجيل الدخول الناجح
it('should login successfully and save token', async () => {
  // يتحقق من حفظ التوكن بعد تسجيل الدخول الناجح
});

// اختبار معالجة أخطاء الشبكة
it('should handle network errors', async () => {
  // يتحقق من معالجة أخطاء الاتصال بشكل صحيح
});
```

---

### 2. dietaryService.test.ts

**الوظائف المختبرة:**
- ✅ إدارة الملف الغذائي (Dietary Profile Management)
- ✅ إدارة ملف الحساسية (Allergy Profile Management)
- ✅ فلترة عناصر القائمة (Menu Filtering)
- ✅ تسميات الطعام (Food Labels)
- ✅ رسائل الطلب المخصصة (Custom Order Messages)
- ✅ تحليل عناصر السلة (Cart Analysis)
- ✅ التحقق من صحة الطلب (Order Validation)

**عدد الاختبارات:** 65 اختبار

**أمثلة على السيناريوهات:**
```typescript
// اختبار تحديث الملف الغذائي
it('should update dietary profile successfully', async () => {
  // يتحقق من تحديث الملف الشخصي للحمية
});

// اختبار فحص العناصر للحساسية
it('should check item for allergies', async () => {
  // يتحقق من فحص عنصر القائمة للحساسية
});
```

---

### 3. locationService.test.ts

**الوظائف المختبرة:**
- ✅ إدارة الأذونات (Permission Management)
- ✅ الحصول على الموقع الحالي (Get Current Location)
- ✅ تتبع الموقع (Location Tracking)
- ✅ حساب المسافة (Distance Calculation)
- ✅ عمليات المطاعم (Restaurant Operations)
- ✅ تقدير وقت التوصيل (Delivery Time Estimation)
- ✅ الترميز الجغرافي العكسي (Reverse Geocoding)

**عدد الاختبارات:** 52 اختبار

**أمثلة على السيناريوهات:**
```typescript
// اختبار حساب المسافة
it('should calculate distance between two points correctly', () => {
  // يتحقق من حساب المسافة بين نقطتين جغرافيتين
});

// اختبار تتبع الموقع
it('should start tracking with default options', async () => {
  // يتحقق من بدء تتبع الموقع بالخيارات الافتراضية
});
```

---

### 4. paymentService.test.ts

**الوظائف المختبرة:**
- ✅ إنشاء نية الدفع (Payment Intent Creation)
- ✅ تأكيد الدفع (Payment Confirmation)
- ✅ إدارة طرق الدفع (Payment Methods Management)
- ✅ إدارة الفواتير (Invoice Management)
- ✅ معالجة الاسترداد (Refund Processing)
- ✅ التحقق من البطاقة (Card Validation)
- ✅ اكتشاف نوع البطاقة (Card Type Detection)
- ✅ حساب الرسوم (Fee Calculation)

**عدد الاختبارات:** 73 اختبار

**أمثلة على السيناريوهات:**
```typescript
// اختبار التحقق من رقم البطاقة
it('should validate valid Visa card', () => {
  const result = paymentService.validateCardNumber('4532015112830366');
  expect(result).toBe(true);
});

// اختبار حساب الرسوم
it('should calculate fees with default rates', () => {
  const result = paymentService.calculateFees(100);
  expect(result.total).toBe(116.5); // 100 + 14% tax + 2.5% commission
});
```

---

### 5. qrScannerService.test.ts

**الوظائف المختبرة:**
- ✅ إدارة أذونات الكاميرا (Camera Permission)
- ✅ معالجة رمز QR (QR Code Handling)
- ✅ الوصول للمشروع (Project Access)
- ✅ تتبع الطلب (Order Tracking)
- ✅ اكتشاف نوع QR (QR Type Detection)
- ✅ تنسيق الرسائل (Message Formatting)
- ✅ فحص انتهاء الصلاحية (Expiry Check)

**عدد الاختبارات:** 55 اختبار

**أمثلة على السيناريوهات:**
```typescript
// اختبار مسح QR صحيح
it('should handle valid JSON QR code with token', async () => {
  // يتحقق من معالجة رمز QR صحيح
});

// اختبار تتبع الطلب
it('should track order successfully', async () () => {
  // يتحقق من تتبع الطلب عبر رمز QR
});
```

---

### 6. server.test.js (Backend)

**الوظائف المختبرة:**
- ✅ فحص صحة الخادم (Health Check)
- ✅ إصدار API (API Versioning)
- ✅ إعدادات CORS
- ✅ معالجة الأخطاء (Error Handling)
- ✅ رؤوس الأمان (Security Headers)
- ✅ أنواع المحتوى (Content Types)
- ✅ ضغط الاستجابة (Response Compression)

**عدد الاختبارات:** 15 اختبار

---

## تغطية الكود - Code Coverage

### أهداف التغطية

تم تحديد الحد الأدنى للتغطية عند **70%** لجميع المقاييس:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### عرض تقرير التغطية

```bash
# Mobile
cd mobile
npm run test:coverage

# Backend
cd backend
npm test -- --coverage
```

### تقرير التغطية المتوقع

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.2  |   78.5   |   82.3  |   86.1  |
 apiService.ts      |   92.1  |   85.4   |   90.2  |   93.5  |
 dietaryService.ts  |   88.3  |   80.2   |   85.1  |   89.2  |
 locationService.ts |   86.7  |   76.8   |   83.4  |   87.9  |
 paymentService.ts  |   90.5  |   82.1   |   88.7  |   91.3  |
 qrScannerService.ts|   87.2  |   79.3   |   84.6  |   88.4  |
--------------------|---------|----------|---------|---------|-------------------
```

---

## أفضل الممارسات - Best Practices

### 1. تنظيم الاختبارات

```typescript
describe('ServiceName', () => {
  describe('FeatureGroup', () => {
    describe('specificFunction', () => {
      it('should do something specific', () => {
        // Arrange - Act - Assert (AAA Pattern)
      });
    });
  });
});
```

### 2. نمط AAA (Arrange-Act-Assert)

```typescript
it('should calculate distance correctly', () => {
  // Arrange - تجهيز البيانات
  const lat1 = 30.0444;
  const lon1 = 31.2357;

  // Act - تنفيذ العملية
  const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

  // Assert - التحقق من النتيجة
  expect(distance).toBeGreaterThan(0);
});
```

### 3. استخدام Mocks بشكل صحيح

```typescript
// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-location');

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 4. اختبار الحالات الحدودية

```typescript
describe('Edge Cases', () => {
  it('should handle empty input', () => {
    // Test with empty values
  });

  it('should handle very large numbers', () => {
    // Test with extreme values
  });

  it('should handle special characters', () => {
    // Test with unicode and special chars
  });
});
```

### 5. أسماء اختبارات وصفية

✅ **جيد:**
```typescript
it('should return 404 when order not found')
it('should validate Visa card number with Luhn algorithm')
it('should calculate delivery time including preparation time')
```

❌ **سيء:**
```typescript
it('test 1')
it('works')
it('check validation')
```

### 6. تجنب الاختبارات المترابطة

```typescript
// ❌ سيء - الاختبارات تعتمد على بعضها
let sharedState;

it('test 1', () => {
  sharedState = someValue;
});

it('test 2', () => {
  expect(sharedState).toBe(someValue); // يعتمد على test 1
});

// ✅ جيد - اختبارات مستقلة
it('test 1', () => {
  const localState = someValue;
  expect(localState).toBe(expectedValue);
});

it('test 2', () => {
  const localState = anotherValue;
  expect(localState).toBe(expectedValue);
});
```

---

## استكشاف الأخطاء - Troubleshooting

### مشاكل شائعة

#### 1. فشل تثبيت jest-expo

```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules
npm install
```

#### 2. فشل الاختبارات بسبب مشاكل في الـ Mocks

```bash
# تأكد من إعداد jest.setup.js بشكل صحيح
# تحقق من أن جميع التبعيات الخارجية ممحاكاة (mocked)
```

#### 3. خطأ في TypeScript Types

```bash
# تثبيت التعريفات المفقودة
npm install --save-dev @types/jest
```

#### 4. تعارض في الإصدارات

```bash
# تحديث جميع التبعيات
npm update

# أو تثبيت إصدارات محددة
npm install jest@29.2.1 --save-dev
```

---

## إضافة اختبارات جديدة - Adding New Tests

### خطوات إضافة اختبار جديد

1. **أنشئ ملف الاختبار:**
```bash
# للخدمات
touch src/services/__tests__/newService.test.ts

# للمكونات
touch src/components/__tests__/NewComponent.test.tsx
```

2. **اكتب الاختبار:**
```typescript
import newService from '../newService';

describe('NewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

3. **شغل الاختبار:**
```bash
npm test -- newService.test.ts
```

4. **تحقق من التغطية:**
```bash
npm run test:coverage
```

---

## التكامل المستمر - Continuous Integration

### إعداد GitHub Actions

أضف `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install
      working-directory: ./mobile

    - name: Run tests
      run: npm test
      working-directory: ./mobile

    - name: Run coverage
      run: npm run test:coverage
      working-directory: ./mobile
```

---

## الموارد الإضافية - Additional Resources

### الوثائق الرسمية

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### أدوات مفيدة

- **Jest CLI:** `npx jest --help`
- **Coverage Report:** `npx jest --coverage`
- **Watch Mode:** `npx jest --watch`
- **Debug Mode:** `node --inspect-brk node_modules/.bin/jest --runInBand`

---

## اختبارات Frontend الجديدة

تم إضافة نظام اختبار شامل لتطبيق Frontend باستخدام Vitest.

### هيكل الاختبارات

```
frontend/
├── vitest.config.ts               # إعدادات Vitest
├── src/
│   ├── __tests__/
│   │   └── setup.ts               # إعدادات بيئة الاختبار
│   ├── pages/
│   │   └── __tests__/
│   │       └── AdminDashboard.test.tsx
│   └── services/
│       └── __tests__/
│           └── api.test.ts
```

### تشغيل اختبارات Frontend

أولاً، قم بتثبيت التبعيات المطلوبة:

```bash
cd frontend
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

أضف السكريبتات التالية إلى `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

شغل الاختبارات:

```bash
npm test
npm run test:ui      # واجهة رسومية
npm run test:coverage # تقرير التغطية
```

### الاختبارات المضافة

#### AdminDashboard.test.tsx
- عرض لوحة التحكم
- إدارة الطلبات والفلترة
- إدارة المطاعم
- الإحصائيات والتحليلات
- الرؤى التنبؤية
- إرسال التنبيهات
- النوافذ المنبثقة
- معالجة الأخطاء

#### api.test.ts
- اختبارات API Client
- Dashboard Service
- Orders Service
- Restaurants Service
- Notifications Service
- معالجة الأخطاء
- Request Interceptors

---

## اختبارات E2E الشاملة

تم إضافة نظام اختبار E2E باستخدام Playwright.

### هيكل الاختبارات

```
e2e/
├── playwright.config.ts           # إعدادات Playwright
├── auth.spec.ts                  # اختبارات المصادقة
└── orders.spec.ts                # اختبارات الطلبات
```

### تشغيل اختبارات E2E

تثبيت Playwright:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

شغل الاختبارات:

```bash
# تشغيل جميع الاختبارات
npx playwright test

# تشغيل في وضع المراقبة
npx playwright test --ui

# تشغيل بوضع التشخيص
npx playwright test --debug

# تشغيل في الخلفية
npx playwright test --headed

# إنشاء تقرير HTML
npx playwright test --reporter=html
```

### الاختبارات المضافة

#### auth.spec.ts
- نموذج تسجيل الدخول
- التحقق من صحة البيانات
- فشل تسجيل الدخول
- نموذج التسجيل
- استعادة كلمة المرور
- تسجيل الخروج
- استمرار الجلسة

#### orders.spec.ts
- إدارة الطلبات
- فلترة وبحث الطلبات
- تحديث حالة الطلب
- تفاصيل الطلب
- إدارة المطاعم
- لوحة الإحصائيات
- إرسال الإشعارات
- الرؤى التنبؤية

---

## ملخص الملفات المضافة

### Backend Unit Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| authService.test.js | `backend/src/services/__tests__/` | اختبارات خدمة المصادقة |
| orderService.test.js | `backend/src/services/__tests__/` | اختبارات خدمة الطلبات |
| paymentService.test.js | `backend/src/services/__tests__/` | اختبارات خدمة المدفوعات |

### Backend Integration Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| auth.test.js | `backend/src/__tests__/integration/` | اختبارات مسارات المصادقة |
| orders.test.js | `backend/src/__tests__/integration/` | اختبارات مسارات الطلبات |
| payments.test.js | `backend/src/__tests__/integration/` | اختبارات مسارات المدفوعات |

### Backend Middleware Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| auth.test.js | `backend/src/middleware/__tests__/` | اختبارات middleware المصادقة |

### Mobile Component Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| LoginScreen.test.tsx | `mobile/src/screens/__tests__/` | اختبارات شاشة تسجيل الدخول |
| CartScreen.test.tsx | `mobile/src/screens/__tests__/` | اختبارات شاشة السلة |

### Mobile Navigation Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| Navigation.test.tsx | `mobile/src/__tests__/navigation/` | اختبارات التنقل |

### Frontend Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| vitest.config.ts | `frontend/` | إعدادات Vitest |
| setup.ts | `frontend/src/__tests__/` | إعدادات بيئة الاختبار |
| AdminDashboard.test.tsx | `frontend/src/pages/__tests__/` | اختبارات لوحة التحكم |
| api.test.ts | `frontend/src/services/__tests__/` | اختبارات API |

### E2E Tests
| الملف | المسار | الوصف |
|------|-------|-------|
| playwright.config.ts | `e2e/` | إعدادات Playwright |
| auth.spec.ts | `e2e/` | اختبارات E2E للمصادقة |
| orders.spec.ts | `e2e/` | اختبارات E2E للطلبات |

---

## الخلاصة - Summary

تم بناء نظام اختبار شامل يغطي:

✅ **500+ اختبار** عبر جميع التطبيقات
✅ **Unit Tests** للخدمات الحرجة
✅ **Integration Tests** لجميع API Endpoints
✅ **Component Tests** للمكونات الرئيسية
✅ **Navigation Tests** لأنظمة التنقل
✅ **E2E Tests** للسيناريوهات الرئيسية
✅ **تغطية 70%+** من الكود
✅ **معالجة أخطاء شاملة**

النظام جاهز للتطوير المستمر والنشر في بيئة الإنتاج! 🚀

---

**آخر تحديث:** ديسمبر 2025
**الإصدار:** 2.0.0
**المؤلف:** BreakApp Development Team
