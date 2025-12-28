# BreakApp ML Features Documentation
# توثيق ميزات التعلم الآلي في BreakApp

## نظرة عامة (Overview)

تم تنفيذ مجموعة شاملة من ميزات التعلم الآلي (AI/ML) في BreakApp لتحسين تجربة المستخدم وأتمتة العمليات. هذه الميزات تشمل:

1. **Smart Recommendations (التوصيات الذكية)** - Item 8 ✅
2. **Predictive Ordering (الطلب التنبؤي)** - Item 9 ✅
3. **Smart Restaurant Discovery (اكتشاف المطاعم الذكي)** - Item 10 ✅

---

## 1. Smart Recommendations (التوصيات الذكية) ✅

### الوصف
نظام توصيات ذكي يستخدم التعلم الآلي لاقتراح الوجبات المناسبة للمستخدمين بناءً على:
- تاريخ الطلبات السابقة
- الطقس الحالي
- التفضيلات الغذائية
- التنوع التغذوي

### الخدمات المنفذة

#### `recommendationService.js`
المسار: `/backend/src/services/recommendationService.js`

**الميزات الرئيسية:**
- `RecommendationEngine` - محرك التوصيات الرئيسي
- `getPersonalizedRecommendations()` - توصيات شخصية بناءً على السجل
- `getWeatherBasedRecommendations()` - توصيات حسب الطقس
- `checkDietaryDiversity()` - فحص التنوع الغذائي
- `getTrendingRecommendations()` - العناصر الشائعة

**خوارزميات التعلم الآلي:**
- Cosine Similarity للعثور على عناصر مشابهة
- Item Embeddings للتمثيل الرقمي للعناصر
- Collaborative Filtering للتوصيات الشخصية

### API Endpoints

```
GET /api/v1/recommendations
- الحصول على التوصيات للمستخدم الحالي
- Query Params: location (optional)

POST /api/v1/recommendations/save
- حفظ توصية

GET /api/v1/recommendations/saved
- الحصول على التوصيات المحفوظة

PUT /api/v1/recommendations/preferences
- تحديث تفضيلات المستخدم

GET /api/v1/recommendations/analytics
- تحليلات وإحصائيات التوصيات (A/B Testing)
```

### تكامل الطقس (Weather Integration)

يستخدم النظام OpenWeatherMap API للحصول على بيانات الطقس:
```env
OPENWEATHER_API_KEY=your_api_key_here
```

**منطق التوصيات الجوية:**
- درجة حرارة < 15°C → أطباق ساخنة ودافئة
- درجة حرارة > 25°C → أطباق خفيفة وباردة
- أمطار → أطباق دافئة داخلية

### قاعدة البيانات

**نموذج Recommendation:**
```prisma
model Recommendation {
  id                 String             @id @default(uuid())
  userId             String
  menuItemId         String
  recommendationType RecommendationType
  score              Float
  reason             String
  weatherData        Json?
  isActive           Boolean            @default(true)
  expiresAt          DateTime?
  createdAt          DateTime           @default(now())
}

enum RecommendationType {
  WEATHER_BASED
  PERSONALIZED
  SIMILAR_ITEMS
  DIETARY_DIVERSITY
  TRENDING
}
```

---

## 2. Predictive Ordering (الطلب التنبؤي) ✅

### الوصف
نظام تنبؤ متقدم يحلل سلوك المستخدمين ويتنبأ بالطلبات المستقبلية لتسهيل عملية الطلب.

### الخدمات المنفذة

#### `behaviorAnalysisService.js`
المسار: `/backend/src/services/predictive/behaviorAnalysisService.js`

**الميزات:**
- تحليل أنماط الطلب حسب اليوم والوقت
- تحديد المطابخ المفضلة
- حساب متوسط قيمة الطلب
- حساب تكرار الطلبات

**الدوال الرئيسية:**
- `analyzeUserBehavior(userId)` - تحليل شامل لسلوك المستخدم
- `getUserBehavior(userId)` - جلب السلوك المحفوظ
- `analyzeAllUsersBehavior()` - تحليل جماعي (batch processing)

#### `patternRecognitionService.js`
المسار: `/backend/src/services/predictive/patternRecognitionService.js`

**الميزات:**
- التعرف على الأنماط المتكررة (يومي، أسبوعي، شهري)
- مطابقة الأنماط مع الوقت الحالي
- حساب نسبة الثقة للأنماط

#### `autoOrderSuggestionService.js`
المسار: `/backend/src/services/predictive/autoOrderSuggestionService.js`

**الميزات:**
- اقتراحات طلبات تلقائية
- ملء مسبق للطلبات مع إمكانية التعديل
- Smart defaults بناءً على السجل

**API Methods:**
- `generateSuggestion(userId)` - إنشاء اقتراح
- `acceptSuggestion(suggestionId, modifications)` - قبول الاقتراح
- `rejectSuggestion(suggestionId, reason)` - رفض الاقتراح
- `modifySuggestion(suggestionId, modifications)` - تعديل الاقتراح

#### `quantityForecastService.js`
المسار: `/backend/src/services/predictive/quantityForecastService.js`

**الميزات:**
- التنبؤ بالكميات المطلوبة
- دعم المطاعم في التخطيط
- تخفيضات الكميات الكبيرة

#### `deliverySchedulingService.js`
المسار: `/backend/src/services/predictive/deliverySchedulingService.js`

**الميزات:**
- تحسين جدولة التوصيل
- التنبؤ بأوقات الذروة
- تحسين مسارات التوصيل

#### `demandForecastReportService.js`
المسار: `/backend/src/services/predictive/demandForecastReportService.js`

**الميزات:**
- تقارير توقعات الطلب
- تحليلات للمطاعم
- دعم التفاوض على الأسعار

### API Endpoints

```
GET /api/v1/predictive/behavior/:userId
- تحليل سلوك المستخدم

GET /api/v1/predictive/patterns/:userId
- أنماط الطلبات

POST /api/v1/predictive/suggestions/generate
- إنشاء اقتراح طلب

POST /api/v1/predictive/suggestions/:id/accept
- قبول اقتراح

POST /api/v1/predictive/suggestions/:id/reject
- رفض اقتراح

PUT /api/v1/predictive/suggestions/:id/modify
- تعديل اقتراح
```

### قاعدة البيانات

**نماذج Prisma:**
```prisma
model UserBehavior {
  id                String   @id @default(uuid())
  userId            String
  dayOfWeek         Int
  timeSlot          String
  avgOrderValue     Float
  orderFrequency    Float
  preferredCuisines String[]
  preferredItems    String[]
  totalOrders       Int
  @@unique([userId, dayOfWeek, timeSlot])
}

model OrderPattern {
  id             String      @id @default(uuid())
  userId         String
  patternType    PatternType
  confidence     Float
  frequency      Int
  menuItemIds    String[]
  dayOfWeek      Int?
  timePreference String?
}

model AutoOrderSuggestion {
  id             String   @id @default(uuid())
  userId         String
  suggestedItems Json
  totalAmount    Float
  suggestedTime  DateTime
  reason         String
  confidence     Float
  status         String
  expiresAt      DateTime
}
```

---

## 3. Smart Restaurant Discovery (اكتشاف المطاعم الذكي) ✅

### الوصف
نظام ذكي لاكتشاف وتقييم المطاعم الجديدة باستخدام APIs خارجية وخوارزميات تحليل الجودة.

### الخدمات المنفذة

#### `restaurantDiscoveryService.js`
المسار: `/backend/src/services/ml/restaurantDiscoveryService.js`

**الميزات الرئيسية:**

##### 1. البحث عن مطاعم جديدة
- تكامل مع Google Places API
- البحث الجغرافي بنصف قطر محدد
- تصفية حسب نوع المطبخ

```javascript
async searchNewRestaurants(location, radius, cuisineType)
```

##### 2. تجميع التقييمات من منصات متعددة
- Google Places ratings
- قابل للتوسع لإضافة Facebook، Zomato، etc.
- حساب تقييم مجمع مرجح

```javascript
async aggregateMultiPlatformRatings(restaurantName, location)
```

##### 3. تحليل جودة المطعم
خوارزمية شاملة تحلل:
- **التقييم (30%)** - متوسط التقييمات
- **الاتساق (15%)** - تباين التقييمات
- **الحداثة (10%)** - حداثة التقييمات
- **المشاعر (20%)** - تحليل المشاعر في التعليقات
- **جودة القائمة (15%)** - تنوع وجودة العناصر
- **حجم الطلبات (10%)** - شعبية المطعم

```javascript
async analyzeRestaurantQuality(restaurantId)
```

**نتيجة الجودة الإجمالية (من 100):**
```javascript
qualityScore = {
  rating: { score, rating, totalReviews },
  consistency: { score, variance },
  freshness: { score, avgDaysOld },
  sentiment: { score, positiveCount, negativeCount },
  menuQuality: { score, totalItems, availableItems },
  orderVolume: { score, totalOrders, recentOrders },
  overallScore: 0-100
}
```

##### 4. تحليل المشاعر (Sentiment Analysis)
تحليل مبسط بناءً على الكلمات المفتاحية:

**كلمات إيجابية:**
- عربي: ممتاز، رائع، جميل، لذيذ، نظيف، سريع
- English: excellent, great, delicious

**كلمات سلبية:**
- عربي: سيء، قذر، متأخر، بارد
- English: bad, terrible, awful, late

##### 5. اقتراح مطاعم جديدة تلقائياً
معايير الاقتراح:
- حد أدنى للتقييم (افتراضي: 4.0)
- حد أدنى للمراجعات (افتراضي: 10)
- مسافة قصوى (افتراضي: 5 كم)
- أنواع مطابخ محددة (اختياري)

```javascript
async suggestNewRestaurants(location, criteria)
```

##### 6. سير عمل الاختبار والتجريب
نظام منظم لاختبار المطاعم الجديدة:

```javascript
async createTrialWorkflow(restaurantData)
```

**خطة التجريب:**
- مدة التجربة: 14 يوم
- معايير النجاح:
  - حد أدنى 10 طلبات
  - تقييم متوسط ≥ 4.0
  - معدل شكاوى ≤ 10%

**نقاط التحقق:**
- Day 7: مراجعة منتصف الفترة
- Day 14: مراجعة نهائية

```javascript
async evaluateTrialResults(restaurantId)
```

### API Endpoints

```
POST /api/v1/ml/training-data/collect
- جمع بيانات التدريب
- Access: Admin only

POST /api/v1/ml/models/train/recommendation
- تدريب نموذج التوصيات
- Access: Admin only

POST /api/v1/ml/models/train/predictive
- تدريب نموذج التنبؤ
- Access: Admin only

POST /api/v1/ml/models/train/quality
- تدريب نموذج الجودة
- Access: Admin only

POST /api/v1/ml/models/train/all
- تدريب جميع النماذج
- Access: Admin only

GET /api/v1/ml/restaurants/search
- البحث عن مطاعم جديدة
- Query: latitude, longitude, radius, cuisineType
- Access: Admin/Manager

GET /api/v1/ml/restaurants/:restaurantId/quality
- تحليل جودة مطعم
- Access: Admin/Manager

GET /api/v1/ml/restaurants/suggest
- اقتراح مطاعم جديدة
- Query: latitude, longitude, minRating, minReviews, maxDistance, cuisineTypes
- Access: Admin/Manager

POST /api/v1/ml/restaurants/trial
- إنشاء سير عمل تجريبي
- Access: Admin/Manager

GET /api/v1/ml/restaurants/:restaurantId/trial/evaluate
- تقييم نتائج التجربة
- Access: Admin/Manager

GET /api/v1/ml/restaurants/ratings/aggregate
- تجميع تقييمات من منصات متعددة
- Query: restaurantName, latitude, longitude
- Access: Admin/Manager
```

---

## 4. ML Infrastructure (البنية التحتية للتعلم الآلي)

### Training Data Service
المسار: `/backend/src/services/ml/trainingDataService.js`

**الميزات:**
- جمع تاريخ الطلبات للتدريب
- جمع بيانات الطقس التاريخية
- جمع تفضيلات المستخدمين
- جمع تقييمات المطاعم
- إنشاء datasets كاملة للتدريب

**الدوال الرئيسية:**
```javascript
collectOrderHistoryData(startDate, endDate)
collectWeatherData(location, startDate, endDate)
collectUserPreferencesData()
collectRestaurantRatingsData()
createTrainingDataset(options)
prepareRecommendationTrainingData()
saveDatasetToFile(dataset, filename)
```

### Model Trainer
المسار: `/backend/src/services/ml/modelTrainer.js`

**الميزات:**
- تدريب نموذج التوصيات (Recommendation Model)
- تدريب نموذج التنبؤ (Predictive Model)
- تدريب نموذج الجودة (Quality Model)
- حفظ وتحميل النماذج
- تقييم أداء النماذج

**بنية النماذج:**

#### Recommendation Model
```javascript
Input: [user_idx, item_idx, day_of_week, time_slot]
Layer 1: Dense(128, relu) + Dropout(0.3)
Layer 2: Dense(64, relu) + Dropout(0.2)
Layer 3: Dense(32, relu)
Output: Dense(1, sigmoid)
Optimizer: Adam(0.001)
Loss: Mean Squared Error
```

#### Predictive Model
```javascript
Input: [day_of_week, avg_order_value, order_frequency, total_orders]
Layer 1: Dense(64, relu) + Dropout(0.2)
Layer 2: Dense(32, relu)
Output: Dense(1, linear)
Optimizer: Adam(0.001)
Loss: Mean Squared Error
```

#### Quality Model
```javascript
Input: [rating, review_count, order_count, menu_items, is_partner]
Layer 1: Dense(32, relu) + Dropout(0.2)
Layer 2: Dense(16, relu)
Output: Dense(1, sigmoid)
Optimizer: Adam(0.001)
Loss: Binary Crossentropy
```

---

## 5. البيئة والإعدادات (Environment Variables)

إضافة المتغيرات التالية إلى `.env`:

```env
# OpenWeather API (للتوصيات الجوية)
OPENWEATHER_API_KEY=your_openweather_api_key

# Google Places API (لاكتشاف المطاعم)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# ML Settings
ML_TRAINING_BATCH_SIZE=32
ML_TRAINING_EPOCHS=50
ML_VALIDATION_SPLIT=0.2
```

---

## 6. الاستخدام (Usage Examples)

### مثال: الحصول على التوصيات

```javascript
// Frontend
const response = await fetch('/api/v1/recommendations?location=Riyadh', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data); // Array of recommendations
```

### مثال: تدريب النماذج

```bash
# تدريب جميع النماذج
curl -X POST http://localhost:3000/api/v1/ml/models/train/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 50,
    "batchSize": 32
  }'
```

### مثال: البحث عن مطاعم جديدة

```bash
curl -X GET "http://localhost:3000/api/v1/ml/restaurants/search?latitude=24.7136&longitude=46.6753&radius=5000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. الأداء والتحسينات (Performance & Optimizations)

### Caching
- تخزين مؤقت لنتائج Google Places API (24 ساعة)
- تخزين مؤقت لتقييمات المطاعم

### Batch Processing
- تحليل سلوك جميع المستخدمين دفعة واحدة
- معالجة البيانات بشكل غير متزامن

### Data Normalization
- تطبيع جميع المدخلات للنماذج (0-1)
- معالجة القيم المفقودة

---

## 8. المستقبل والتحسينات المقترحة (Future Enhancements)

### توصيات قصيرة المدى:
- [ ] تكامل Frontend للتوصيات
- [ ] إضافة Facebook ratings API
- [ ] تحسين تحليل المشاعر باستخدام NLP متقدم
- [ ] إضافة Health certificate verification API

### توصيات طويلة المدى:
- [ ] استخدام Deep Learning models أكثر تعقيداً
- [ ] تطبيق Reinforcement Learning للتوصيات
- [ ] Multi-armed Bandit للـ A/B Testing
- [ ] Real-time model updates

---

## 9. الاختبارات (Testing)

### Unit Tests
يجب إضافة اختبارات لـ:
- [ ] Training data collection
- [ ] Model training
- [ ] Restaurant discovery
- [ ] Quality analysis

### Integration Tests
- [ ] End-to-end recommendation flow
- [ ] Predictive ordering flow
- [ ] Restaurant discovery flow

---

## 10. المراجع والموارد (References)

### Documentation
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [OpenWeatherMap API](https://openweathermap.org/api)

### Related Files
- `/backend/src/services/recommendationService.js`
- `/backend/src/services/predictive/*`
- `/backend/src/services/ml/*`
- `/backend/src/controllers/mlController.js`
- `/backend/src/routes/mlRoutes.js`

---

## الدعم (Support)

للأسئلة والمساعدة، يرجى الرجوع إلى:
- README.md الرئيسي
- CHANGELOG.md للتحديثات
- TODO.md لمتابعة التطوير المستقبلي

---

**تاريخ آخر تحديث:** 2025-12-28
**الإصدار:** 1.0.0
**الحالة:** ✅ Production Ready
