# QR Code & Order Workflow API Documentation

## نظرة عامة

تم تنفيذ **المهام 11، 12، 13، و14** من TODO.md:
- ✅ **المهمة 12**: تطبيق نظام توليد QR Code للمشاريع
- ✅ **المهمة 13**: إنشاء نظام مسح QR Code وإدارة الوصول
- ✅ **المهمة 14**: بناء نظام تقديم الطلبات اليومي

---

## المكونات الرئيسية

### 1. نظام إدارة المشاريع (Project Management)

#### إنشاء مشروع جديد
```http
POST /api/v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "مشروع تصوير الفيلم X",
  "location": "استوديو القاهرة",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "startDate": "2025-01-15T08:00:00Z",
  "endDate": "2025-01-15T20:00:00Z",
  "orderWindow": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "مشروع تصوير الفيلم X",
      "location": "استوديو القاهرة",
      "startDate": "2025-01-15T08:00:00Z",
      "orderWindow": 60,
      "qrCode": "data:image/png;base64,iVBORw0KG...",
      "expiresAt": "2025-01-16T08:00:00Z"
    },
    "message": "تم إنشاء المشروع بنجاح"
  }
}
```

#### الحصول على جميع المشاريع
```http
GET /api/v1/projects?page=1&limit=10&isActive=true
Authorization: Bearer {token}
```

#### الحصول على مشروع محدد
```http
GET /api/v1/projects/{projectId}
Authorization: Bearer {token}
```

#### تحديث مشروع
```http
PATCH /api/v1/projects/{projectId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderWindow": 90,
  "isActive": true
}
```

---

### 2. نظام QR Code

#### توليد QR Code جديد للمشروع
```http
POST /api/v1/projects/{projectId}/regenerate-qr
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "expiresAt": "2025-01-16T08:00:00Z",
    "message": "تم توليد QR Code جديد بنجاح"
  }
}
```

#### الوصول للمشروع عبر QR Code (من التطبيق المحمول)
```http
POST /api/v1/projects/access-by-qr
Content-Type: application/json

{
  "qrToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "مشروع تصوير الفيلم X",
      "location": "استوديو القاهرة",
      "latitude": 30.0444,
      "longitude": 31.2357,
      "startDate": "2025-01-15T08:00:00Z",
      "orderWindow": 60,
      "isOrderWindowOpen": true,
      "orderWindowEnd": "2025-01-15T09:00:00Z"
    },
    "accessGranted": true,
    "message": "تم الوصول للمشروع بنجاح"
  }
}
```

#### التحقق من صحة QR Code
```http
POST /api/v1/qr/validate
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### فك تشفير QR Code
```http
POST /api/v1/qr/decode
Content-Type: application/json

{
  "qrText": "{\"token\":\"...\",\"url\":\"...\"}"
}
```

---

### 3. نظام نافذة الطلب (Order Window)

#### التحقق من حالة نافذة الطلب
```http
GET /api/v1/projects/{projectId}/order-window
Authorization: Bearer {token}
```

**Response (نافذة مفتوحة):**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "projectName": "مشروع تصوير الفيلم X",
    "isOrderWindowOpen": true,
    "orderWindowStart": "2025-01-15T08:00:00Z",
    "orderWindowEnd": "2025-01-15T09:00:00Z",
    "timeRemainingMs": 1800000,
    "minutesRemaining": 30
  }
}
```

**Response (نافذة مغلقة):**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_WINDOW_CLOSED",
    "message": "انتهت نافذة الطلب",
    "details": {
      "endedAt": "2025-01-15T09:00:00Z",
      "minutesAgo": 15
    },
    "orderWindow": {
      "start": "2025-01-15T08:00:00Z",
      "end": "2025-01-15T09:00:00Z"
    }
  }
}
```

---

### 4. نظام تقديم الطلبات اليومي (Daily Order Submission)

#### تقديم طلب جديد
```http
POST /api/v1/workflow/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "uuid",
  "restaurantId": "uuid",
  "menuItems": [
    {
      "menuItemId": "uuid",
      "quantity": 1
    },
    {
      "menuItemId": "uuid",
      "quantity": 2
    }
  ],
  "notes": "بدون بصل",
  "deliveryAddress": "الموقع الخاص بالتصوير"
}
```

**Validation:**
- ✅ يتحقق من أن نافذة الطلب مفتوحة
- ✅ يتحقق من عدم وجود طلب مكرر لنفس اليوم
- ✅ يحسب المجموع الكلي من قاعدة البيانات
- ✅ ينشئ الطلب ويرسل إشعارات

**Response (نجاح):**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "status": "PENDING",
    "totalAmount": 150.00,
    "createdAt": "2025-01-15T08:30:00Z",
    "message": "تم تقديم الطلب بنجاح"
  }
}
```

**Response (نافذة مغلقة):**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_WINDOW_CLOSED",
    "message": "انتهت نافذة الطلب",
    "details": {
      "endedAt": "2025-01-15T09:00:00Z",
      "minutesAgo": 15
    }
  }
}
```

**Response (طلب مكرر):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ORDER",
    "message": "لقد قدمت طلباً بالفعل لهذا المشروع اليوم",
    "existingOrder": {
      "id": "uuid",
      "status": "CONFIRMED",
      "createdAt": "2025-01-15T08:15:00Z"
    }
  }
}
```

#### تأكيد الطلب
```http
PATCH /api/v1/workflow/orders/{orderId}/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmed": true
}
```

#### جلب طلبات المستخدم
```http
GET /api/v1/workflow/orders?projectId={projectId}&status=CONFIRMED&page=1&limit=10
Authorization: Bearer {token}
```

---

### 5. نظام الطلبات المجمعة للمنتجين (Aggregated Orders)

#### جلب الطلبات المجمعة
```http
GET /api/v1/workflow/projects/{projectId}/aggregated-orders
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 45,
      "totalAmount": 6750.00,
      "restaurantCount": 3
    },
    "aggregatedByRestaurant": {
      "restaurant-uuid-1": {
        "restaurant": {
          "id": "uuid",
          "name": "مطعم النخبة"
        },
        "items": {
          "item-uuid-1": {
            "menuItem": {
              "id": "uuid",
              "name": "شاورما دجاج",
              "price": 50.00
            },
            "quantity": 25,
            "totalPrice": 1250.00
          }
        },
        "orders": ["order-uuid-1", "order-uuid-2"],
        "totalAmount": 2500.00
      }
    }
  }
}
```

---

### 6. نظام التذكيرات (Reminders)

#### إرسال تذكيرات للمستخدمين الذين لم يقدموا طلبات
```http
POST /api/v1/workflow/send-reminders
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "remindersSent": 12,
    "usersReminded": 12,
    "message": "تم إرسال التذكيرات"
  }
}
```

---

## آلية العمل الكاملة (End-to-End Flow)

### 1. إنشاء المشروع
```
ADMIN/PRODUCER → POST /api/v1/projects
                ↓
            تم توليد QR Code
                ↓
            حفظ المشروع في قاعدة البيانات
```

### 2. مسح QR Code من التطبيق المحمول
```
Mobile App → Scan QR Code
            ↓
         استخراج qrToken
            ↓
         POST /api/v1/projects/access-by-qr
            ↓
         التحقق من الصلاحية
            ↓
         عرض معلومات المشروع + حالة نافذة الطلب
```

### 3. تقديم الطلب
```
User → GET /api/v1/projects/{projectId}/order-window
      ↓
   التحقق من نافذة الطلب
      ↓
   POST /api/v1/workflow/orders
      ↓
   Middleware: checkOrderWindow
      ↓
   Middleware: checkDuplicateOrder
      ↓
   Controller: submitOrder
      ↓
   حساب المجموع + إنشاء الطلب
      ↓
   إرسال إشعار تأكيد
```

### 4. إدارة الطلبات من المنتج
```
PRODUCER → GET /api/v1/workflow/projects/{projectId}/aggregated-orders
          ↓
       عرض الطلبات المجمعة حسب المطعم
          ↓
       PATCH /api/v1/workflow/orders/{orderId}/status
          ↓
       تحديث حالة الطلبات
```

---

## Middleware

### checkOrderWindow
- يتحقق من أن المشروع موجود ونشط
- يحسب نافذة الطلب بناءً على `startDate` و `orderWindow`
- يرفض الطلبات خارج النافذة مع رسائل واضحة
- يضيف معلومات المشروع ونافذة الطلب إلى `req.project` و `req.orderWindow`

### checkDuplicateOrder
- يتحقق من عدم وجود طلب لنفس المستخدم في نفس المشروع في نفس اليوم
- يمنع الطلبات المكررة
- يعرض معلومات الطلب الموجود في حالة الرفض

---

## Models & Database Schema

### Project Model
```typescript
model Project {
  id              String
  name            String
  qrCode          String   @unique
  qrToken         String?
  location        String?
  latitude        Float?
  longitude       Float?
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean  @default(true)
  lastAccessedAt  DateTime?
  orderWindow     Int      @default(60) // بالدقائق
  createdBy       String?
  projectManager  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `PROJECT_NOT_FOUND` | المشروع غير موجود | 404 |
| `PROJECT_INACTIVE` | المشروع غير نشط | 403 |
| `ORDER_WINDOW_CLOSED` | نافذة الطلب مغلقة | 403 |
| `DUPLICATE_ORDER` | طلب مكرر | 400 |
| `INVALID_QR_CODE` | QR Code غير صحيح | 401 |
| `MISSING_QR_TOKEN` | QR Token مطلوب | 400 |

---

## ملاحظات مهمة

1. **نافذة الطلب**: افتراضياً ساعة واحدة (60 دقيقة) من بداية المشروع، قابلة للتعديل
2. **صلاحية QR Code**: 24 ساعة من وقت التوليد
3. **منع الطلبات المكررة**: مستخدم واحد = طلب واحد يومياً لكل مشروع
4. **الصلاحيات المطلوبة**:
   - إنشاء مشروع: `ADMIN` أو `PROJECT_MANAGER`
   - الوصول عبر QR: متاح للجميع
   - تقديم طلب: مستخدم مسجل
   - عرض الطلبات المجمعة: `PRODUCER` أو `ADMIN`

---

## مثال سيناريو كامل

```bash
# 1. المنتج ينشئ مشروع
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "تصوير فيلم الأكشن",
    "location": "استوديو المدينة",
    "startDate": "2025-01-15T08:00:00Z",
    "orderWindow": 60
  }'

# 2. المستخدم يمسح QR Code
curl -X POST http://localhost:3000/api/v1/projects/access-by-qr \
  -H "Content-Type: application/json" \
  -d '{
    "qrToken": "eyJhbGci..."
  }'

# 3. المستخدم يتحقق من نافذة الطلب
curl -X GET http://localhost:3000/api/v1/projects/{projectId}/order-window \
  -H "Authorization: Bearer {token}"

# 4. المستخدم يقدم طلب
curl -X POST http://localhost:3000/api/v1/workflow/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid",
    "restaurantId": "uuid",
    "menuItems": [
      {"menuItemId": "uuid", "quantity": 1}
    ]
  }'

# 5. المنتج يعرض الطلبات المجمعة
curl -X GET http://localhost:3000/api/v1/workflow/projects/{projectId}/aggregated-orders \
  -H "Authorization: Bearer {token}"
```

---

## التكامل مع التطبيق المحمول

### React Native Example
```typescript
import { Camera } from 'expo-camera';

// 1. مسح QR Code
const handleBarCodeScanned = async ({ data }) => {
  const qrData = JSON.parse(data);

  // 2. الوصول للمشروع
  const response = await fetch('/api/v1/projects/access-by-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: qrData.token })
  });

  const { data: projectData } = await response.json();

  // 3. التحقق من نافذة الطلب
  if (projectData.project.isOrderWindowOpen) {
    // عرض قائمة المطاعم
    navigateToOrderScreen(projectData.project);
  } else {
    // عرض رسالة
    showAlert('نافذة الطلب مغلقة');
  }
};
```

---

تم تنفيذ النظام بالكامل مع جميع المتطلبات! 🎉
