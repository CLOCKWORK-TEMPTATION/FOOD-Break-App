# BreakApp - قائمة شاملة بجميع الاختبارات
# BreakApp - Complete Tests Inventory

## 📊 ملخص الاختبارات / Tests Summary

### إحصائيات عامة / General Statistics
- **إجمالي ملفات الاختبار**: 40+ ملف
- **أنواع الاختبارات**: Unit, Integration, E2E
- **إطارات العمل**: Jest, Playwright, React Native Testing Library
- **التغطية المستهدفة**: 80%+

---

## 🔧 Backend Tests (Node.js/Express)

### 📁 Unit Tests (`backend/tests/unit/`)

#### Controllers Tests
1. **authController.test.js**
   - اختبارات تسجيل الدخول والخروج
   - اختبارات التسجيل
   - اختبارات تحديث الملف الشخصي
   - اختبارات إدارة الجلسات

2. **emotionController.test.js**
   - اختبارات تسجيل المزاج
   - اختبارات تحليل المشاعر
   - اختبارات توصيات الطعام العاطفية
   - اختبارات الملف الشخصي العاطفي

3. **exceptionController.test.js**
   - اختبارات طلب الاستثناءات
   - اختبارات الموافقة على الاستثناءات
   - اختبارات حصص الاستثناءات
   - اختبارات أنواع الاستثناءات (Full/Limited/Self-Paid)

4. **menuController.test.js**
   - اختبارات عرض القوائم
   - اختبارات البحث في القوائم
   - اختبارات التصفية حسب الحمية
   - اختبارات عناصر القائمة

5. **orderController.test.js**
   - اختبارات إنشاء الطلبات
   - اختبارات تحديث حالة الطلب
   - اختبارات إلغاء الطلبات
   - اختبارات تتبع الطلبات

6. **restaurantController.test.js**
   - اختبارات إدارة المطاعم
   - اختبارات تقييمات المطاعم
   - اختبارات البحث عن المطاعم
   - اختبارات المطاعم الشريكة

#### Middleware Tests
7. **auth.test.js**
   - اختبارات JWT authentication
   - اختبارات التحقق من الصلاحيات
   - اختبارات Role-based access control
   - اختبارات انتهاء صلاحية التوكن

8. **errorHandler.test.js**
   - اختبارات معالجة الأخطاء المركزية
   - اختبارات تنسيق رسائل الأخطاء
   - اختبارات أكواد حالة HTTP
   - اختبارات تسجيل الأخطاء

9. **validation.test.js**
   - اختبارات التحقق من المدخلات
   - اختبارات Zod schemas
   - اختبارات التحقق من البريد الإلكتروني
   - اختبارات التحقق من كلمات المرور

#### Services Tests
10. **authService.test.js**
    - اختبارات تشفير كلمات المرور
    - اختبارات إنشاء JWT tokens
    - اختبارات تحديث الملف الشخصي
    - اختبارات إعادة تعيين كلمة المرور

11. **emotionService.test.js**
    - اختبارات تحليل المزاج
    - اختبارات توصيات الطعام العاطفية
    - اختبارات الملف الشخصي العاطفي
    - اختبارات تتبع الأنماط العاطفية

12. **exceptionService.test.js**
    - اختبارات منطق الاستثناءات
    - اختبارات حساب التكاليف
    - اختبارات التحقق من الحصص
    - اختبارات تنبيهات الميزانية

13. **menuService.test.js**
    - اختبارات إدارة القوائم
    - اختبارات التصفية حسب الحمية
    - اختبارات المعلومات الغذائية
    - اختبارات التسميات الغذائية

14. **orderService.test.js**
    - اختبارات إنشاء الطلبات
    - اختبارات حساب التكاليف
    - اختبارات التحقق من الطلبات
    - اختبارات تجميع الطلبات

15. **paymentService.test.js**
    - اختبارات معالجة المدفوعات
    - اختبارات Stripe integration
    - اختبارات PayPal integration
    - اختبارات إنشاء الفواتير

16. **qrCodeService.test.js**
    - اختبارات إنشاء QR codes
    - اختبارات التحقق من QR codes
    - اختبارات JWT tokens للمشاريع
    - اختبارات انتهاء صلاحية QR codes

#### Utils Tests
17. **jwt.test.js**
    - اختبارات إنشاء التوكنات
    - اختبارات التحقق من التوكنات
    - اختبارات انتهاء الصلاحية
    - اختبارات التوكنات غير الصالحة

---

### 📁 Integration Tests (`backend/tests/integration/`)

#### API Tests
18. **admin.test.js**
    - اختبارات لوحة تحكم المسؤول
    - اختبارات إدارة المستخدمين
    - اختبارات إدارة المطاعم
    - اختبارات التقارير والإحصائيات

19. **auth.test.js**
    - اختبارات تدفق التسجيل الكامل
    - اختبارات تدفق تسجيل الدخول
    - اختبارات تحديث الملف الشخصي
    - اختبارات إدارة الجلسات

20. **orders.test.js**
    - اختبارات تدفق الطلب الكامل
    - اختبارات تحديث حالة الطلب
    - اختبارات تتبع GPS
    - اختبارات الإشعارات

21. **payments.test.js**
    - اختبارات تدفق الدفع الكامل
    - اختبارات معالجة المدفوعات
    - اختبارات إنشاء الفواتير
    - اختبارات استرداد الأموال

---

### 📁 E2E Tests (`backend/tests/e2e/`)

22. **adminJourney.test.js**
    - رحلة المسؤول الكاملة
    - إدارة المستخدمين والمطاعم
    - عرض التقارير والإحصائيات
    - إدارة الاستثناءات

23. **orderFlow.test.js**
    - تدفق الطلب من البداية للنهاية
    - مسح QR code
    - اختيار العناصر
    - الدفع والتأكيد

24. **paymentFlow.test.js**
    - تدفق الدفع الكامل
    - اختيار طريقة الدفع
    - معالجة الدفع
    - إنشاء الفاتورة

25. **scenario.test.js**
    - سيناريوهات الاستخدام الواقعية
    - حالات الاستثناءات
    - حالات الطوارئ
    - حالات الأخطاء

26. **userJourney.test.js**
    - رحلة المستخدم الكاملة
    - التسجيل وتسجيل الدخول
    - تصفح القوائم
    - إنشاء الطلبات

---

## 📱 Mobile Tests (React Native)

### 📁 Component Tests (`mobile/src/__tests__/`)

27. **Navigation.test.tsx**
    - اختبارات التنقل بين الشاشات
    - اختبارات Stack Navigator
    - اختبارات Tab Navigator
    - اختبارات Deep Linking

---

### 📁 Service Tests (`mobile/src/services/__tests__/`)

28. **apiService.test.ts**
    - اختبارات API client
    - اختبارات HTTP requests
    - اختبارات معالجة الأخطاء
    - اختبارات Interceptors

29. **dietaryService.test.ts** ⭐ (شامل جداً)
    - **Dietary Profile Management**
      - getDietaryProfile
      - updateDietaryProfile
      - deleteDietaryProfile
      - getActiveDiets
      - getAvailableDietTypes
    
    - **Allergy Profile Management**
      - getAllergyProfile
      - updateAllergyProfile
      - getActiveAllergies
      - getAvailableAllergens
      - checkItemForAllergies
    
    - **Menu Filtering**
      - filterMenuItems
      - findCompatibleItems
    
    - **Food Labels**
      - getFoodLabels
      - getAllergenInfo
      - getAvailableLabelTypes
    
    - **Custom Order Messages**
      - createAutoMessages
      - getOrderMessages
    
    - **Helper Methods**
      - analyzeCartItems
      - validateOrderForDiet
    
    - **Edge Cases**
      - Empty arrays
      - Null values
      - Network errors
      - Large datasets

30. **locationService.test.ts**
    - اختبارات GPS tracking
    - اختبارات حساب المسافات
    - اختبارات الأذونات
    - اختبارات تحديث الموقع

31. **paymentService.test.ts**
    - اختبارات معالجة المدفوعات
    - اختبارات Stripe SDK
    - اختبارات Apple Pay
    - اختبارات Google Pay

32. **qrScannerService.test.ts**
    - اختبارات مسح QR codes
    - اختبارات التحقق من الصلاحية
    - اختبارات الأذونات
    - اختبارات معالجة الأخطاء

---

## 🌐 E2E Tests (Playwright)

### 📁 Root E2E Tests (`e2e/`)

33. **auth.spec.js**
    - اختبارات تسجيل الدخول
    - اختبارات التسجيل
    - اختبارات تسجيل الخروج
    - اختبارات إعادة تعيين كلمة المرور

34. **auth.spec.ts** (TypeScript version)
    - نفس اختبارات auth.spec.js بـ TypeScript
    - اختبارات إضافية للأمان
    - اختبارات التحقق من الصلاحيات

35. **order-journey.spec.js**
    - رحلة الطلب الكاملة
    - مسح QR code
    - تصفح القوائم
    - إضافة للسلة
    - الدفع والتأكيد

36. **orders.spec.ts**
    - اختبارات إدارة الطلبات
    - اختبارات تتبع الطلبات
    - اختبارات إلغاء الطلبات
    - اختبارات تحديث الحالة

---

## 🛠️ Test Utilities & Helpers

### Backend Test Utilities

37. **testHelpers.js** (`backend/tests/helpers/`)
    - دوال مساعدة للاختبارات
    - إنشاء بيانات اختبار
    - تنظيف قاعدة البيانات
    - دوال التحقق

38. **authHelper.js** (`backend/tests/helpers/`)
    - إنشاء مستخدمين للاختبار
    - إنشاء JWT tokens
    - محاكاة تسجيل الدخول
    - إدارة الجلسات

39. **testData.js** (`backend/tests/fixtures/`)
    - بيانات اختبار ثابتة
    - مستخدمين نموذجيين
    - طلبات نموذجية
    - مطاعم نموذجية

40. **prismaMock.js** (`backend/tests/mocks/`)
    - محاكاة Prisma Client
    - محاكاة عمليات قاعدة البيانات
    - بيانات اختبار معزولة

41. **testDatabase.js** (`backend/tests/utils/`)
    - إعداد قاعدة بيانات الاختبار
    - تنظيف البيانات
    - إنشاء بيانات أولية
    - إدارة الاتصالات

---

## 📋 Test Configuration Files

### Jest Configuration
- **backend/jest.config.js** - إعدادات Jest الرئيسية للـ Backend
- **backend/tests/unit/jest.config.js** - إعدادات Unit tests
- **backend/tests/integration/jest.config.js** - إعدادات Integration tests
- **backend/tests/e2e/jest.config.js** - إعدادات E2E tests
- **mobile/jest.config.js** - إعدادات Jest للـ Mobile

### Playwright Configuration
- **e2e/playwright.config.ts** - إعدادات Playwright للـ E2E tests
- **playwright.config.js** - إعدادات بديلة

### Setup Files
- **backend/tests/setup.js** - إعداد بيئة الاختبار للـ Backend
- **mobile/jest.setup.js** - إعداد بيئة الاختبار للـ Mobile

---

## 📊 Test Coverage Areas

### ✅ مناطق مغطاة بالكامل / Fully Covered Areas
1. **Authentication & Authorization**
   - تسجيل الدخول/الخروج
   - JWT tokens
   - Role-based access control

2. **Dietary System**
   - Dietary profiles
   - Allergy profiles
   - Food labels
   - Menu filtering

3. **Order Management**
   - Order creation
   - Order tracking
   - Order status updates

4. **Payment Processing**
   - Payment methods
   - Invoice generation
   - Refunds

5. **Emotion AI**
   - Mood logging
   - Sentiment analysis
   - Emotional recommendations

### ⚠️ مناطق تحتاج تغطية إضافية / Areas Needing More Coverage
1. **ML Models**
   - Model training tests
   - Prediction accuracy tests
   - Data preparation tests

2. **Real-time Features**
   - GPS tracking tests
   - WebSocket tests
   - Live notifications tests

3. **Emergency Mode**
   - Fast-track ordering tests
   - Emergency protocols tests

4. **Analytics & Reporting**
   - Dashboard tests
   - Report generation tests
   - Data visualization tests

---

## 🚀 Running Tests

### Backend Tests
```bash
cd backend

# جميع الاختبارات
npm test

# Unit tests فقط
npm run test:unit

# Integration tests فقط
npm run test:integration

# E2E tests فقط
npm run test:e2e

# مع التغطية
npm run test:coverage

# وضع المراقبة
npm run test:watch
```

### Mobile Tests
```bash
cd mobile

# جميع الاختبارات
npm test

# مع التغطية
npm run test:coverage

# وضع المراقبة
npm run test:watch
```

### E2E Tests (Playwright)
```bash
# من الجذر
npm run test:e2e

# مع واجهة المستخدم
npm run test:e2e:ui

# في وضع headed
npm run test:e2e:headed

# وضع التصحيح
npm run test:e2e:debug
```

---

## 📈 Test Metrics

### Current Status
- **Total Test Files**: 40+
- **Total Test Cases**: 500+ (تقديري)
- **Test Coverage**: ~70% (هدف: 80%+)
- **Test Execution Time**: ~5-10 دقائق

### Test Distribution
- **Unit Tests**: ~60%
- **Integration Tests**: ~25%
- **E2E Tests**: ~15%

---

## 📝 Testing Best Practices (المتبعة في المشروع)

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Test Names**: أسماء واضحة تشرح السلوك المتوقع
3. **Test Isolation**: كل اختبار مستقل عن الآخر
4. **Mock External Dependencies**: محاكاة الاعتماديات الخارجية
5. **Test Both Success and Failure**: اختبار الحالات الناجحة والفاشلة
6. **Use Fixtures**: استخدام بيانات ثابتة للاختبارات
7. **Clean Up**: تنظيف البيانات بعد كل اختبار

---

## 🎯 Next Steps for Testing

### Priority 1 (عاجل)
- [ ] زيادة تغطية ML models
- [ ] إضافة اختبارات للميزات الجديدة
- [ ] تحسين اختبارات Real-time features

### Priority 2 (مهم)
- [ ] إضافة Load testing
- [ ] إضافة Security testing
- [ ] تحسين E2E test coverage

### Priority 3 (مستقبلي)
- [ ] إضافة Visual regression tests
- [ ] إضافة Performance tests
- [ ] إضافة Accessibility tests

---

## 📚 Documentation

- **Testing Guide**: `backend/tests/TESTING_GUIDE.md`
- **Test README**: `backend/tests/README.md`
- **CI/CD**: `.github/workflows/ci.yml`

---

**آخر تحديث**: 2024
**الحالة**: 🟢 Active Development
