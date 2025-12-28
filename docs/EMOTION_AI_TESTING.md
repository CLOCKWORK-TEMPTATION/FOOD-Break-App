# 🧪 Emotion-Based AI - Testing Guide

## 📋 نظرة عامة

هذا الدليل يوضح كيفية اختبار نظام الذكاء العاطفي (Emotion-Based AI) بشكل شامل.

---

## 🎯 أنواع الاختبارات

### 1. Unit Tests (اختبارات الوحدات)
### 2. Integration Tests (اختبارات التكامل)
### 3. E2E Tests (اختبارات شاملة)
### 4. Manual Testing (اختبار يدوي)

---

## 🔧 إعداد بيئة الاختبار

### تثبيت أدوات الاختبار
```bash
cd backend
npm install --save-dev jest supertest @types/jest @types/supertest

cd ../mobile
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### إعداد Jest
```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
};
```

---

## 1️⃣ Unit Tests (Backend)

### Test: analyzeSentiment()

```javascript
// backend/tests/unit/emotionService.test.js

const { analyzeSentiment } = require('../../src/services/emotionService');

describe('Sentiment Analysis', () => {
  test('should detect positive sentiment in Arabic', () => {
    const text = 'أنا سعيد جداً اليوم وأشعر بالرضا';
    const result = analyzeSentiment(text);
    
    expect(result.label).toBe('POSITIVE');
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.emotions).toContain('سعيد');
  });

  test('should detect negative sentiment in English', () => {
    const text = 'I feel sad and tired today';
    const result = analyzeSentiment(text);
    
    expect(result.label).toBe('NEGATIVE');
    expect(result.score).toBeLessThan(-0.3);
  });

  test('should detect neutral sentiment', () => {
    const text = 'Today is Wednesday';
    const result = analyzeSentiment(text);
    
    expect(result.label).toBe('NEUTRAL');
    expect(result.score).toBeGreaterThanOrEqual(-0.3);
    expect(result.score).toBeLessThanOrEqual(0.3);
  });

  test('should handle empty text', () => {
    const result = analyzeSentiment('');
    
    expect(result.label).toBe('NEUTRAL');
    expect(result.score).toBe(0);
  });

  test('should detect multiple emotions', () => {
    const text = 'سعيد ومتحمس لكن متعب قليلاً';
    const result = analyzeSentiment(text);
    
    expect(result.emotions.length).toBeGreaterThan(0);
    expect(result.emotions).toContain('سعيد');
    expect(result.emotions).toContain('متحمس');
  });
});
```

### Test: calculateMoodMatchScore()

```javascript
describe('Mood Match Scoring', () => {
  const sampleMenuItem = {
    id: 'item1',
    name: 'Chocolate Cake',
    category: 'Dessert',
    nutritionalInfo: {
      calories: 450,
      protein: 5,
      carbs: 65,
      fat: 18,
      fiber: 2,
    },
    avgRating: 4.5,
    price: 35,
  };

  const stressedMood = {
    moodType: 'STRESSED',
    intensity: 8,
    energy: 4,
    stress: 9,
    workType: 'HEAVY_SHOOT',
    shootingHours: 12,
  };

  test('should recommend comfort food for stressed mood', () => {
    const result = calculateMoodMatchScore(
      sampleMenuItem,
      stressedMood,
      'COMFORT_FOOD'
    );
    
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.emotionalBenefit).toContain('يحسن المزاج');
    expect(result.comfortLevel).toBeGreaterThanOrEqual(8);
  });

  test('should have lower confidence for energy boost with dessert', () => {
    const result = calculateMoodMatchScore(
      sampleMenuItem,
      { ...stressedMood, energy: 2 },
      'ENERGY_BOOST'
    );
    
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.energyBoost).toBeLessThan(5);
  });
});
```

### Test: generateWeeklyInsights()

```javascript
describe('Weekly Insights Generation', () => {
  test('should calculate overall score correctly', async () => {
    const userId = 'test-user-id';
    
    // Create mock mood entries
    const mockMoods = [
      { stress: 3, energy: 8, moodType: 'HAPPY' },
      { stress: 4, energy: 7, moodType: 'MOTIVATED' },
      { stress: 2, energy: 9, moodType: 'EXCITED' },
      { stress: 3, energy: 8, moodType: 'CONTENT' },
      { stress: 5, energy: 6, moodType: 'CALM' },
    ];
    
    const insights = await generateWeeklyInsights(userId);
    
    expect(insights.overallScore).toBeGreaterThan(70);
    expect(insights.strengths.length).toBeGreaterThan(0);
    expect(insights.dominantEmotions).toContain('HAPPY');
  });

  test('should identify concerns for high stress', async () => {
    // Mock high stress week
    const insights = await generateWeeklyInsights('stressed-user');
    
    expect(insights.concerns).toContain('مستوى ضغط عالٍ');
    expect(insights.recommendations).toContain('حاول ممارسة تمارين الاسترخاء');
  });
});
```

---

## 2️⃣ Integration Tests (API)

### Test: POST /api/emotion/mood/log

```javascript
// backend/tests/integration/emotion.api.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Emotion API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Setup: Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/emotion/mood/log', () => {
    test('should create mood entry successfully', async () => {
      const moodData = {
        moodType: 'HAPPY',
        intensity: 8,
        energy: 7,
        stress: 3,
        workType: 'LIGHT_SHOOT',
        shootingHours: 6,
        context: 'Great day at work',
      };

      const response = await request(app)
        .post('/api/emotion/mood/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send(moodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodType).toBe('HAPPY');
      expect(response.body.data.userId).toBe(userId);
    });

    test('should auto-generate recommendations', async () => {
      const response = await request(app)
        .post('/api/emotion/mood/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moodType: 'STRESSED',
          intensity: 8,
          energy: 4,
          stress: 9,
        })
        .expect(201);

      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
    });

    test('should reject invalid mood type', async () => {
      await request(app)
        .post('/api/emotion/mood/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moodType: 'INVALID_MOOD',
          intensity: 8,
          energy: 7,
          stress: 3,
        })
        .expect(400);
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/emotion/mood/log')
        .send({
          moodType: 'HAPPY',
          intensity: 8,
        })
        .expect(401);
    });
  });

  describe('GET /api/emotion/mood/today', () => {
    test('should return today\'s mood with recommendations', async () => {
      const response = await request(app)
        .get('/api/emotion/mood/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('moodType');
        expect(response.body.data).toHaveProperty('recommendations');
      }
    });
  });

  describe('POST /api/emotion/wellness/goals', () => {
    test('should create wellness goal', async () => {
      const goalData = {
        goalType: 'STRESS_REDUCTION',
        title: 'تقليل الضغط اليومي',
        description: 'خفض مستوى الضغط إلى أقل من 5',
        targetValue: 5,
        duration: 30,
      };

      const response = await request(app)
        .post('/api/emotion/wellness/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goalType).toBe('STRESS_REDUCTION');
      expect(response.body.data.progress).toBe(0);
    });
  });

  describe('POST /api/emotion/insights/weekly', () => {
    test('should generate weekly insights', async () => {
      const response = await request(app)
        .post('/api/emotion/insights/weekly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
```

---

## 3️⃣ E2E Tests (Mobile)

### Test: Mood Tracker Screen

```typescript
// mobile/tests/e2e/MoodTracker.test.tsx

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MoodTrackerScreen from '../../src/screens/MoodTrackerScreen';

describe('MoodTrackerScreen E2E', () => {
  test('should complete full mood logging flow', async () => {
    const { getByText, getByTestId } = render(<MoodTrackerScreen />);

    // Step 1: Select mood
    const happyButton = getByText('سعيد');
    fireEvent.press(happyButton);

    // Step 2: Set sliders
    const intensitySlider = getByTestId('intensity-slider');
    fireEvent.press(intensitySlider, { nativeEvent: { locationX: 80 } });

    const energySlider = getByTestId('energy-slider');
    fireEvent.press(energySlider, { nativeEvent: { locationX: 70 } });

    const stressSlider = getByTestId('stress-slider');
    fireEvent.press(stressSlider, { nativeEvent: { locationX: 30 } });

    // Step 3: Select work type
    const workTypeButton = getByText('تصوير خفيف');
    fireEvent.press(workTypeButton);

    // Step 4: Enter shooting hours
    const shootingHoursInput = getByTestId('shooting-hours-input');
    fireEvent.changeText(shootingHoursInput, '6');

    // Step 5: Add context
    const contextInput = getByTestId('context-input');
    fireEvent.changeText(contextInput, 'يوم رائع');

    // Step 6: Submit
    const submitButton = getByText('حفظ المزاج');
    fireEvent.press(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(getByText(/تم حفظ مزاجك بنجاح/)).toBeTruthy();
    });
  });

  test('should show validation error when mood not selected', async () => {
    const { getByText } = render(<MoodTrackerScreen />);

    const submitButton = getByText('حفظ المزاج');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText(/يرجى اختيار المزاج/)).toBeTruthy();
    });
  });
});
```

---

## 4️⃣ Manual Testing Scenarios

### السيناريو 1: رحلة المستخدم الكاملة

#### الهدف: اختبار كامل ميزة الذكاء العاطفي

**الخطوات:**
1. **التسجيل/تسجيل الدخول:**
   - افتح التطبيق
   - سجل دخول بحساب تجريبي

2. **أول استخدام للميزة:**
   - انتقل إلى "الذكاء العاطفي"
   - تحقق من ظهور شاشة الترحيب
   - اقرأ شروط الخصوصية
   - وافق على الشروط

3. **تسجيل أول مزاج:**
   - اضغط "تسجيل المزاج"
   - اختر HAPPY
   - حرك Intensity إلى 8
   - حرك Energy إلى 7
   - حرك Stress إلى 3
   - اختر Work Type: LIGHT_SHOOT
   - أدخل ساعات التصوير: 6
   - اكتب سياق: "يوم تصوير ممتع مع الفريق"
   - احفظ

4. **عرض التوصيات:**
   - ارجع للوحة التحكم
   - تحقق من ظهور قسم "التوصيات الذكية"
   - تحقق من وجود 3-5 توصيات
   - تحقق من أن التوصيات من نوع CELEBRATION أو MOOD_BALANCE
   - اضغط على توصية
   - تحقق من ظهور التفاصيل والسبب

5. **إنشاء هدف رفاهية:**
   - انتقل إلى شاشة "الرفاهية"
   - اضغط "+"
   - اختر STRESS_REDUCTION
   - العنوان: "تقليل الضغط"
   - القيمة المستهدفة: 5
   - المدة: 30 يوم
   - احفظ
   - تحقق من ظهور الهدف بـ Progress 0%

6. **تسجيل مزاج لعدة أيام:**
   - سجل مزاج مختلف كل يوم لمدة 7 أيام
   - نوّع بين HAPPY, STRESSED, TIRED, MOTIVATED
   - نوّع مستويات الطاقة والضغط

7. **توليد رؤية أسبوعية:**
   - بعد 7 أيام، انتقل لشاشة الرفاهية
   - اضغط "توليد رؤية جديدة"
   - انتظر التحليل
   - تحقق من:
     - النتيجة الإجمالية (0-100)
     - وجود نقاط قوة
     - وجود توصيات عملية
   - اضغط على الرؤية لعرض التفاصيل الكاملة

8. **تقييم توصية:**
   - من لوحة التحكم
   - اختر توصية
   - قيّمها (1-5 نجوم)
   - تحقق من حفظ التقييم

9. **إعدادات الخصوصية:**
   - انتقل للإعدادات
   - قسم "الخصوصية العاطفية"
   - تحقق من الخيارات:
     - السماح بالتحليل
     - السماح بتحليل المشاعر
     - مدة الاحتفاظ بالبيانات
     - إخفاء الهوية
   - جرب تغيير الإعدادات
   - احفظ

**النتائج المتوقعة:**
✅ جميع الخطوات تعمل بسلاسة
✅ التوصيات منطقية ومرتبطة بالمزاج
✅ الرؤى الأسبوعية دقيقة ومفيدة
✅ الهدف يتتبع التقدم تلقائياً
✅ إعدادات الخصوصية تحترم

---

### السيناريو 2: حالات ضغط عالي

#### الهدف: اختبار توصيات STRESS_RELIEF

**الخطوات:**
1. سجل مزاج STRESSED
2. Intensity: 9
3. Energy: 3
4. Stress: 9
5. Work Type: HEAVY_SHOOT
6. Shooting Hours: 14
7. Context: "يوم شاق جداً، تصوير مكثف"

**النتائج المتوقعة:**
✅ توصيات من نوع STRESS_RELIEF
✅ وجبات خفيفة (<600 cal)
✅ سلطات وخضروات
✅ تفسير "يساعد على الاسترخاء"

---

### السيناريو 3: طاقة منخفضة

#### الهدف: اختبار توصيات ENERGY_BOOST

**الخطوات:**
1. سجل مزاج TIRED
2. Intensity: 7
3. Energy: 2
4. Stress: 6
5. Work Type: HEAVY_SHOOT

**النتائج المتوقعة:**
✅ توصيات من نوع ENERGY_BOOST
✅ وجبات عالية البروتين (>30g)
✅ سعرات معتدلة (500-800)
✅ تفسير "يمنحك طاقة مستدامة"

---

## 🔍 اختبار الأداء

### Load Testing

```javascript
// backend/tests/load/emotion.load.test.js

const autocannon = require('autocannon');

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:3001/api/emotion/mood/today',
    connections: 100,
    duration: 30,
    headers: {
      'Authorization': 'Bearer TEST_TOKEN',
    },
  });

  console.log(result);
  
  // Expected results:
  // - Avg latency < 100ms
  // - Throughput > 1000 req/s
  // - 0% errors
}

loadTest();
```

---

## 📊 معايير النجاح

### Unit Tests
- ✅ Coverage > 80%
- ✅ جميع الحالات الحدية مغطاة
- ✅ 0 اختبارات فاشلة

### Integration Tests
- ✅ جميع الـ API endpoints تعمل
- ✅ معالجة الأخطاء صحيحة
- ✅ المصادقة تعمل

### E2E Tests
- ✅ جميع سيناريوهات المستخدم تعمل
- ✅ UX سلس وبدون أخطاء
- ✅ البيانات تتزامن بشكل صحيح

### Performance
- ✅ API response < 200ms (p95)
- ✅ Mobile screens render < 1s
- ✅ Database queries optimized

---

## 🚀 تشغيل الاختبارات

### Backend
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test emotionService.test.js

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

### Mobile
```bash
cd mobile

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## 📝 Checklist قبل الإنتاج

- [ ] جميع Unit Tests ناجحة
- [ ] جميع Integration Tests ناجحة
- [ ] جميع E2E Tests ناجحة
- [ ] Coverage > 80%
- [ ] Performance tests ناجحة
- [ ] Manual testing مكتمل
- [ ] Security audit مكتمل
- [ ] Privacy compliance verified
- [ ] Documentation updated
- [ ] Seed data created
- [ ] Migration tested on staging

---

**Testing is Essential for Quality! 🧪**
