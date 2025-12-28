# API Documentation Guide
# دليل توثيق API

## نظرة عامة

يتم توثيق BreakApp API باستخدام **Swagger/OpenAPI 3.0**، مما يوفر واجهة تفاعلية لاستكشاف واختبار جميع نقاط النهاية (endpoints).

## الوصول للتوثيق

### البيئة التطويرية
```
http://localhost:3000/api-docs
```

### البيئة الإنتاجية
```
https://api.breakapp.com/api-docs
```

### JSON Specification
```
http://localhost:3000/api-docs.json
```

## الميزات

### 1. واجهة تفاعلية (Interactive UI)
- استكشاف جميع الـ endpoints
- اختبار الطلبات مباشرة من المتصفح
- عرض الـ responses الفعلية

### 2. المصادقة (Authentication)
```bash
# إضافة JWT Token
1. انقر على "Authorize"
2. أدخل التوكن:Bearer <your-jwt-token>
3. انقر "Authorize"
4. سيتم إضافة التوكن تلقائياً لجميع الطلبات
```

### 3. التصفية والبحث
- تصفية الـ endpoints حسب الـ tags
- بحث سريع عن المسارات
- توسيع/طي التوثيق

## هيكل API

### Groups / Tags

#### Authentication (المصادقة)
```yaml
POST   /auth/register     # تسجيل مستخدم جديد
POST   /auth/login        # تسجيل الدخول
POST   /auth/refresh      # تجديد التوكن
POST   /auth/logout       # تسجيل الخروج
GET    /auth/me           # الحصول على بيانات المستخدم
```

#### Users (المستخدمين)
```yaml
GET    /users              # قائمة المستخدمين
GET    /users/:id          # بيانات مستخدم محدد
PUT    /users/:id          # تحديث بيانات المستخدم
DELETE /users/:id          # حذف المستخدم
GET    /users/:id/orders   # طلبات المستخدم
```

#### Restaurants (المطاعم)
```yaml
GET    /restaurants              # قائمة المطاعم
GET    /restaurants/:id          # بيانات مطعم
GET    /restaurants/nearby       # مطاعم قريبة (GPS)
GET    /restaurants/:id/menu     # قائمة مطعم
```

#### Menu (القوائم)
```yaml
GET    /menu                     # جميع العناصر
GET    /menu/:id                 # عنصر محدد
GET    /menu/search              # بحث في القائمة
GET    /menu/available           # العناصر المتاحة
```

#### Orders (الطلبات)
```yaml
POST   /orders                   # إنشاء طلب جديد
GET    /orders                   # قائمة طلباتي
GET    /orders/:id               # بيانات طلب
PUT    /orders/:id/status        # تحديث حالة الطلب
DELETE /orders/:id               # إلغاء الطلب
GET    /orders/:id/tracking      # تتبع الطلب (GPS)
```

#### Recommendations (التوصيات)
```yaml
GET    /recommendations           # توصياتي
POST   /recommendations/generate  # إنشاء توصيات جديدة
GET    /recommendations/trending  # العناصر الرائجة
```

#### Nutrition (التغذية)
```yaml
GET    /nutrition/logs            # سجل التغذية
POST   /nutrition/log             # تسجيل وجبة
GET    /nutrition/goals           # أهدافي الغذائية
POST   /nutrition/goals           # إنشاء هدف جديد
GET    /nutrition/report/weekly   # التقرير الأسبوعي
```

#### Payments (المدفوعات)
```yaml
POST   /payments/create           # إنشاء دفع
GET    /payments/:id              # حالة الدفع
POST   /payments/:id/refund       # استرداد المبلغ
```

#### Notifications (الإشعارات)
```yaml
GET    /notifications             # إشعاراتي
PUT    /notifications/:id/read    # تحديد كمقروء
PUT    /notifications/read-all    # تحديد الكل كمقروء
DELETE /notifications/:id         # حذف إشعار
```

## أمثلة الاستخدام

### 1. تسجيل مستخدم جديد

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "محمد",
    "lastName": "أحمد",
    "phoneNumber": "+966501234567"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "محمد",
      "lastName": "أحمد",
      "role": "REGULAR"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. تسجيل الدخول

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### 3. الحصول على المطاعم القريبة

```bash
curl -X GET "http://localhost:3000/api/v1/restaurants/nearby?lat=24.7136&lng=46.6753&radius=5" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 4. إنشاء طلب جديد

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "restaurant-uuid",
    "items": [
      {
        "menuItemId": "item-uuid-1",
        "quantity": 2
      },
      {
        "menuItemId": "item-uuid-2",
        "quantity": 1,
        "specialInstructions": "بدون ثوم"
      }
    ],
    "deliveryAddress": "الرياض، حي النخيل"
  }'
```

### 5. الحصول على التوصيات

```bash
curl -X GET "http://localhost:3000/api/v1/recommendations?type=WEATHER_BASED" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## أكواد الحالة (Status Codes)

| Code | Description | الوصف |
|------|-------------|--------|
| 200 | OK | نجاح |
| 201 | Created | تم الإنشاء |
| 204 | No Content | لا يوجد محتوى |
| 400 | Bad Request | طلب غير صحيح |
| 401 | Unauthorized | غير مصرح |
| 403 | Forbidden | ممنوع الوصول |
| 404 | Not Found | غير موجود |
| 409 | Conflict | تعارض |
| 422 | Validation Error | خطأ في التحقق |
| 429 | Too Many Requests | طلبات كثيرة |
| 500 | Internal Server Error | خطأ في الخادم |

## صيغة الاستجابة

### Success Response
```json
{
  "success": true,
  "data": {
    // البيانات المطلوبة
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "خطأ في التحقق من البيانات",
    "errors": [
      {
        "field": "email",
        "message": "البريد الإلكتروني غير صالح"
      }
    ]
  }
}
```

## التحقق من الصحة (Validation)

### قواعد التحقق الشائعة

```yaml
email:
  format: email
  required: true

password:
  minLength: 8
  maxLength: 128
  required: true

phoneNumber:
  pattern: ^\+?[1-9]\d{1,14}$
  required: false

name:
  minLength: 2
  maxLength: 50
  required: true
```

## الحدود المفروضة (Rate Limiting)

```yaml
Authentication:
  register: 5 requests/hour
  login: 10 requests/15 minutes

General API:
  authenticated: 1000 requests/hour
  unauthenticated: 100 requests/hour
```

## أفضل الممارسات

### 1. إدارة التوكنات
```javascript
// تخزين التوكن بأمان
localStorage.setItem('token', response.data.token);

// إضافته للطلبات
headers: {
  'Authorization': `Bearer ${token}`
}

// التعامل مع انتهاء الصلاحية
if (error.response?.status === 401) {
  // محاولة تجديد التوكن
  // أو توجيه لصفحة تسجيل الدخول
}
```

### 2. معالجة الأخطاء
```javascript
try {
  const response = await api.get('/orders');
} catch (error) {
  if (error.response?.data?.error) {
    // عرض رسالة الخطأ للمستخدم
    showMessage(error.response.data.error.message);
  }
}
```

### 3. Pagination
```javascript
// طلب الصفحة الثانية
const response = await api.get('/orders?page=2&limit=20');

// استخدام معلومات الصفحات
const { totalPages } = response.data.meta.pagination;
```

## الدعم والمساعدة

للحصول على دعم إضافي أو الإبلاغ عن مشاكل:
- Email: support@breakapp.com
- GitHub Issues: [github.com/breakapp/api/issues]
- Documentation: [docs.breakapp.com]

## التحديثات

الإصدار الحالي: **v1.0.0**

لمتابعة التحديثات والتغييرات، راجع:
- [CHANGELOG.md](./CHANGELOG.md)
- [Release Notes](https://github.com/breakapp/api/releases)
