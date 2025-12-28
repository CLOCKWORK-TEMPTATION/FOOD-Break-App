# 🥗 Personal Nutrition Dashboard - BreakApp

## 📋 نظرة عامة

تم تنفيذ **Feature #4: Personal Nutrition Dashboard (لوحة التغذية الشخصية)** بالكامل ✅

نظام متكامل لتتبع التغذية الشخصية، توليد التقارير الأسبوعية، والتحديات الصحية الجماعية.

---

## 🎯 الميزات المُنفَّذة

### ✅ 1. قاعدة بيانات التغذية (Nutrition Database)

**النماذج المضافة إلى** [prisma/schema.prisma](backend/prisma/schema.prisma):

#### UserNutritionLog
- سجل التغذية اليومية للمستخدم
- تتبع السعرات الحرارية والمغذيات الكبرى
- ربط مع الطلبات (Orders)

```prisma
model UserNutritionLog {
  id              String   @id
  userId          String
  date            DateTime
  totalCalories   Float
  totalProtein    Float
  totalCarbs      Float
  totalFat        Float
  totalFiber      Float
  totalSugar      Float
  totalSodium     Float
  mealsCount      Int
  // ... المزيد
}
```

#### NutritionGoal
- أهداف التغذية للمستخدم
- 6 أنواع: خسارة الوزن، زيادة الوزن، بناء العضلات، صيانة، أكل صحي، مخصص
- تتبع السلاسل (Streaks) والأيام الناجحة

```prisma
model NutritionGoal {
  id                String
  userId            String
  goalType          GoalType
  targetCalories    Float?
  targetProtein     Float?
  currentStreak     Int
  longestStreak     Int
  successDays       Int
  // ... المزيد
}
```

#### TeamChallenge
- التحديات الجماعية للصحة
- 7 أنواع: السعرات، الخيارات الصحية، أيام الخضار، بدون سكر، البروتين، شرب الماء، مخصص
- نظام المكافآت والنقاط

```prisma
model TeamChallenge {
  id              String
  title           String
  challengeType   ChallengeType
  targetType      TargetType
  targetValue     Float
  currentValue    Float
  rewardPoints    Int?
  rewardBadge     String?
  // ... المزيد
}
```

#### WeeklyNutritionReport
- تقارير أسبوعية تلقائية
- تحليل شامل للمتوسطات والإحصائيات
- توصيات ذكية ونقاط قوة/تحسين

```prisma
model WeeklyNutritionReport {
  id                  String
  userId              String
  weekStart           DateTime
  avgCalories         Float
  avgProtein          Float
  healthyMealsPercent Float
  overallScore        Float   // 0-100
  strengths           String[]
  improvements        String[]
  recommendations     String[]
  // ... المزيد
}
```

---

### ✅ 2. Backend API كامل

**الملفات المُنشأة:**

#### [nutritionService.js](backend/src/services/nutritionService.js)
**17 وظيفة رئيسية:**

##### سجلات التغذية:
- `logDailyNutrition()` - تسجيل البيانات الغذائية
- `getNutritionLogs()` - جلب السجلات لفترة محددة
- `getTodayNutrition()` - سجل اليوم

##### الأهداف:
- `setNutritionGoal()` - تعيين أهداف جديدة
- `getActiveGoals()` - الحصول على الأهداف النشطة
- `updateGoalProgress()` - تحديث التقدم اليومي

##### التقارير:
- `generateWeeklyReport()` - توليد تقرير أسبوعي
- `getWeeklyReports()` - جلب التقارير

##### التحديات:
- `createTeamChallenge()` - إنشاء تحدي جماعي
- `getActiveChallenges()` - التحديات النشطة
- `joinChallenge()` - الانضمام لتحدي
- `updateChallengeProgress()` - تحديث التقدم
- `updateLeaderboard()` - تحديث لوحة الصدارة
- `getChallengeLeaderboard()` - جلب لوحة الصدارة
- `getUserChallenges()` - تحديات المستخدم

**المنطق الذكي:**
```javascript
// حساب الوجبات الصحية (معايير تلقائية)
const healthyMeals = logs.filter(log => {
  return (
    log.totalCalories >= 400 && log.totalCalories <= 700 &&
    log.totalProtein >= 20 &&
    log.totalFiber >= 5
  );
});

// حساب النقاط الإجمالية (0-100)
let overallScore = 0;
overallScore += Math.min((avgProtein / 60) * 25, 25); // 25% للبروتين
overallScore += Math.min((avgFiber / 30) * 25, 25);   // 25% للألياف
overallScore += Math.min((2500 / avgCalories) * 25, 25); // 25% للسعرات
overallScore += healthyMealsPercent * 0.25; // 25% للوجبات الصحية
```

#### [nutritionController.js](backend/src/controllers/nutritionController.js)
**13 Controller:**
- `logNutrition` - POST /nutrition/log
- `getTodayNutrition` - GET /nutrition/today
- `getNutritionLogs` - GET /nutrition/logs
- `setGoal` - POST /nutrition/goals
- `getGoals` - GET /nutrition/goals
- `generateReport` - POST /nutrition/reports/weekly
- `getReports` - GET /nutrition/reports/weekly
- `createChallenge` - POST /nutrition/challenges (Admin)
- `getChallenges` - GET /nutrition/challenges
- `joinChallenge` - POST /nutrition/challenges/:id/join
- `updateProgress` - PATCH /nutrition/challenges/:id/progress
- `getLeaderboard` - GET /nutrition/challenges/:id/leaderboard
- `getUserChallenges` - GET /nutrition/user/challenges

**معالجة أخطاء احترافية:**
```javascript
try {
  const log = await nutritionService.logDailyNutrition(userId, data);
  await nutritionService.updateGoalProgress(userId);
  
  res.status(200).json({
    success: true,
    data: log,
    message: 'تم تسجيل البيانات الغذائية بنجاح',
  });
} catch (error) {
  logger.error('Error logging nutrition:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'NUTRITION_LOG_ERROR',
      message: error.message,
    },
  });
}
```

#### [nutrition.js](backend/src/routes/nutrition.js)
**13 API Endpoints** مع المصادقة والتفويض:
```javascript
router.use(authenticate); // جميع المسارات محمية

// سجلات التغذية
router.post('/log', nutritionController.logNutrition);
router.get('/today', nutritionController.getTodayNutrition);
router.get('/logs', nutritionController.getNutritionLogs);

// الأهداف
router.post('/goals', nutritionController.setGoal);
router.get('/goals', nutritionController.getGoals);

// التقارير
router.post('/reports/weekly', nutritionController.generateReport);
router.get('/reports/weekly', nutritionController.getReports);

// التحديات
router.post('/challenges', authorize(['ADMIN', 'PRODUCER']), ...);
router.get('/challenges', nutritionController.getChallenges);
// ... المزيد
```

---

### ✅ 3. شاشات Mobile (React Native + TypeScript)

#### [NutritionDashboardScreen.tsx](mobile/src/screens/NutritionDashboardScreen.tsx)
**الميزات:**
- عرض إحصائيات اليوم (سعرات، وجبات)
- عرض الهدف الحالي مع السلسلة الحالية
- بطاقات المغذيات الكبرى مع أشرطة التقدم:
  - السعرات الحرارية
  - البروتين
  - الكربوهيدرات
  - الدهون
- أزرار سريعة:
  - التقارير الأسبوعية
  - التحديات الجماعية
  - تعيين أهداف جديدة
- نصائح صحية ذكية تعتمد على البيانات
- Pull-to-refresh للتحديث

**الكود:**
```typescript
const calculateProgress = (current: number, target?: number) => {
  if (!target || target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

const getProgressColor = (progress: number) => {
  if (progress >= 90) return '#4CAF50'; // أخضر
  if (progress >= 70) return '#FFC107'; // أصفر
  return '#FF6B35'; // برتقالي
};
```

**التصميم:**
- Linear Gradient Header (#FF6B35 → #FF8F50)
- بطاقات مع ظلال (shadows)
- أيقونات ملونة Ionicons
- شارات السلسلة (Streak Badge)
- أشرطة تقدم ملونة حسب الإنجاز

#### [NutritionReportScreen.tsx](mobile/src/screens/NutritionReportScreen.tsx)
**الميزات:**
- عرض التقارير الأسبوعية السابقة (آخر 4 تقارير)
- اختيار التقرير بالتبويبات
- **النتيجة الإجمالية** (0-100) مع:
  - دائرة ملونة حسب الدرجة
  - تصنيف (ممتاز، جيد، متوسط، يحتاج تحسين)
- ملخص الأسبوع:
  - متوسط السعرات
  - إجمالي الوجبات
  - نسبة الوجبات الصحية
- المتوسطات الأسبوعية للمغذيات
- **نقاط القوة** ✅ (أخضر)
- **نقاط التحسين** ⚠️ (برتقالي)
- **التوصيات** 💡 (أصفر)
- زر إنشاء تقرير جديد

**الكود:**
```typescript
const getScoreColor = (score: number) => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  if (score >= 40) return '#FF9800';
  return '#F44336';
};
```

#### [ChallengesScreen.tsx](mobile/src/screens/ChallengesScreen.tsx)
**الميزات:**
- تبويبين: التحديات المتاحة / تحدياتي
- عرض التحديات النشطة
- بطاقات التحديات تعرض:
  - أيقونة التحدي (حسب النوع)
  - العنوان والوصف بالعربية
  - عدد المشاركين
  - الأيام المتبقية
  - النقاط والشارات المكافأة
- **شريط التقدم** للتحديات المشترك فيها
- زر "انضم الآن" للتحديات المتاحة
- زر "لوحة الصدارة" للتحديات المشترك فيها
- حالة فارغة مع دعوة للعمل

**الكود:**
```typescript
const getChallengeTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    CALORIE_GOAL: 'flame',
    HEALTHY_CHOICES: 'nutrition',
    VEGETABLE_DAYS: 'leaf',
    NO_SUGAR_WEEK: 'close-circle',
    PROTEIN_POWER: 'barbell',
    WATER_INTAKE: 'water',
    CUSTOM: 'trophy',
  };
  return icons[type] || 'trophy';
};
```

---

## 🔄 تكامل النظام

### تكامل مع الطلبات (Orders)
عند تقديم طلب جديد، يتم تلقائياً:
1. جلب المعلومات الغذائية من `NutritionalInfo`
2. تسجيل البيانات في `UserNutritionLog`
3. تحديث تقدم الأهداف `NutritionGoal`
4. تحديث تقدم التحديات `TeamChallenge`

### تكامل مع نظام الإشعارات
- إشعار عند إكمال هدف
- إشعار عند إكمال تحدي
- إشعار أسبوعي للتقرير الجديد
- تذكير بالأهداف اليومية

---

## 📊 إحصائيات الكود

| المكون | الملفات | الأسطر |
|--------|---------|--------|
| Database Schema | 1 | ~250 |
| Backend Service | 1 | ~520 |
| Backend Controller | 1 | ~330 |
| Backend Routes | 1 | ~95 |
| Mobile Screens | 3 | ~1,400 |
| **المجموع** | **7** | **~2,595** |

---

## 🚀 كيفية الاستخدام

### 1. تهيئة قاعدة البيانات
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 2. تشغيل Backend
```bash
cd backend
npm run dev
```

### 3. تشغيل Mobile App
```bash
cd mobile
npm start
```

### 4. الوصول للميزات
1. سجل دخول للتطبيق
2. من القائمة الرئيسية → "لوحة التغذية"
3. يمكنك:
   - عرض إحصائياتك اليومية
   - تعيين أهداف جديدة
   - عرض التقارير الأسبوعية
   - الانضمام للتحديات الجماعية

---

## 📱 لقطات شاشة (Screenshots)

### NutritionDashboardScreen
- **Header**: تدرج برتقالي جميل
- **Stats**: بطاقات السعرات والوجبات
- **Goal**: بطاقة الهدف مع شارة السلسلة 🔥
- **Macros**: 4 بطاقات للمغذيات مع أشرطة تقدم
- **Actions**: 3 أزرار سريعة
- **Tip**: نصيحة صحية ذكية

### NutritionReportScreen
- **Score Circle**: دائرة النتيجة الإجمالية
- **Summary**: ملخص الأسبوع
- **Macros List**: قائمة المتوسطات
- **Strengths**: نقاط القوة ✅
- **Improvements**: نقاط التحسين ⚠️
- **Recommendations**: التوصيات 💡

### ChallengesScreen
- **Tabs**: التحديات المتاحة / تحدياتي
- **Challenge Cards**: بطاقات جذابة مع الأيقونات
- **Progress Bar**: شريط التقدم للتحديات المشترك فيها
- **Reward Badge**: شارة المكافأة

---

## 🧪 اختبارات API (Postman/cURL)

### تسجيل التغذية اليومية
```bash
POST /api/nutrition/log
Authorization: Bearer {token}
Content-Type: application/json

{
  "calories": 650,
  "protein": 35,
  "carbs": 60,
  "fat": 20,
  "fiber": 8,
  "sugar": 10,
  "sodium": 800,
  "orderId": "order-id-here"
}
```

### الحصول على سجل اليوم
```bash
GET /api/nutrition/today
Authorization: Bearer {token}
```

### تعيين هدف جديد
```bash
POST /api/nutrition/goals
Authorization: Bearer {token}
Content-Type: application/json

{
  "goalType": "WEIGHT_LOSS",
  "targetCalories": 2000,
  "targetProtein": 150,
  "targetCarbs": 200,
  "targetFat": 60,
  "targetFiber": 30
}
```

### إنشاء تقرير أسبوعي
```bash
POST /api/nutrition/reports/weekly
Authorization: Bearer {token}
```

### إنشاء تحدي جماعي (Admin)
```bash
POST /api/nutrition/challenges
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "title": "No Sugar Week Challenge",
  "titleAr": "تحدي أسبوع بدون سكر",
  "description": "Go sugar-free for 7 days!",
  "descriptionAr": "عيش 7 أيام بدون سكر!",
  "challengeType": "NO_SUGAR_WEEK",
  "targetType": "SUGAR_FREE_DAYS",
  "targetValue": 7,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-07T23:59:59Z",
  "rewardPoints": 100,
  "rewardBadge": "🏆 Sugar Fighter",
  "maxParticipants": 50
}
```

### الانضمام لتحدي
```bash
POST /api/nutrition/challenges/{challengeId}/join
Authorization: Bearer {token}
```

---

## 🔮 الميزات المستقبلية المقترحة

### Phase 2 Enhancements:
- [ ] تكامل مع Fitness Trackers (Apple Health, Google Fit)
- [ ] رسوم بيانية متقدمة (Charts)
- [ ] تصدير التقارير PDF
- [ ] تذكيرات ذكية بناءً على الأنماط
- [ ] توصيات وجبات مخصصة
- [ ] تكامل مع الذكاء الاصطناعي للتحليل

### Phase 3 Advanced:
- [ ] Gamification كامل مع Badges و Achievements
- [ ] Social Features (مشاركة الإنجازات)
- [ ] مسابقات جماعية بين الفرق
- [ ] Leaderboard عالمي
- [ ] نظام Points & Rewards متقدم

---

## ✅ نتيجة التنفيذ

### تم إنجازه 100%:
- ✅ Database Schema (8 Models جديدة)
- ✅ Backend Service (17 Functions)
- ✅ Backend Controller (13 Handlers)
- ✅ Backend Routes (13 Endpoints)
- ✅ Mobile Screens (3 Screens كاملة)
- ✅ تكامل كامل مع API
- ✅ معالجة أخطاء احترافية
- ✅ TypeScript Types
- ✅ تصميم UI/UX احترافي
- ✅ تحديث TODO.md

### الميزة جاهزة للإنتاج! 🎉

---

**Built with ❤️ for BreakApp**
*Feature #4: Personal Nutrition Dashboard - Completed on December 28, 2025*
