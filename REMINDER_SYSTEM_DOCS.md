# نظام التذكيرات النصف ساعية (Half-Hourly Reminder System)

## نظرة عامة (Overview)

تم تنفيذ نظام تذكيرات نصف ساعية متكامل لإرسال تنبيهات للمستخدمين الذين لم يقدموا طلبات الطعام الخاصة بهم. هذا النظام يعالج المهمة رقم 20 من قائمة TODO: "Half-hourly reminders for non-submitters".

## المميزات الرئيسية (Key Features)

### 1. جدولة تلقائية (Automated Scheduling)
- تشغيل تلقائي كل 30 دقيقة باستخدام `node-cron`
- نوافذ طلبات قابلة للتخصيص (Order Windows)
- دعم multiple projects نشطة

### 2. قنوات متعددة للإشعارات (Multi-Channel Notifications)
- **Push Notifications**: إشعارات فورية للهواتف
- **Email**: بريد إلكتروني مع قوالب HTML جميلة
- **SMS**: دعم الرسائل النصية (قابل للتفعيل)

### 3. تخصيص كامل (Full Customization)
- إعدادات على مستوى المشروع (Project-level settings)
- تفضيلات على مستوى المستخدم (User preferences)
- رسائل مخصصة وقوالب قابلة للتعديل

### 4. تتبع شامل (Comprehensive Tracking)
- سجل كامل لجميع التذكيرات المرسلة
- حالة التسليم لكل قناة
- تتبع استجابة المستخدمين

### 5. وضع عدم الإزعاج (Do Not Disturb Mode)
- احترام أوقات عدم الإزعاج للمستخدمين
- حد أقصى للتذكيرات اليومية

## البنية التقنية (Technical Architecture)

### المكونات (Components)

```
backend/
├── src/
│   ├── services/
│   │   ├── reminderSchedulerService.js    # خدمة الجدولة الرئيسية
│   │   └── notificationService.js         # خدمة الإشعارات (محدثة)
│   ├── controllers/
│   │   └── reminderController.js          # معالجات API
│   └── routes/
│       └── reminders.js                   # نقاط نهاية API
└── prisma/
    └── schema.prisma                      # نماذج قاعدة البيانات
```

### نماذج قاعدة البيانات (Database Models)

#### 1. ReminderLog
سجل جميع التذكيرات المرسلة:
```prisma
model ReminderLog {
  id              String
  userId          String
  projectId       String?
  reminderType    ReminderType
  title           String
  message         String
  channel         String[]
  status          ReminderStatus
  deliveryStatus  Json?
  scheduledFor    DateTime
  sentAt          DateTime
  readAt          DateTime?
  isActedUpon     Boolean
  actionTakenAt   DateTime?
  actionType      String?
}
```

#### 2. ProjectReminderSettings
إعدادات التذكير لكل مشروع:
```prisma
model ProjectReminderSettings {
  id                        String
  projectId                 String @unique
  enableReminders           Boolean
  enableHalfHourlyReminders Boolean
  orderWindowStart          String  // "08:00"
  orderWindowEnd            String  // "09:00"
  reminderInterval          Int     // 30 minutes
  enablePushNotifications   Boolean
  enableEmailNotifications  Boolean
  enableSMSNotifications    Boolean
  customMessageTemplate     String?
  excludedUserIds           String[]
}
```

#### 3. UserReminderPreferences
تفضيلات المستخدم للتذكيرات:
```prisma
model UserReminderPreferences {
  id                        String
  userId                    String @unique
  enableReminders           Boolean
  enableHalfHourlyReminders Boolean
  preferredChannels         String[]  // ["push", "email", "sms"]
  doNotDisturbStart         String?   // "22:00"
  doNotDisturbEnd           String?   // "08:00"
  maxRemindersPerDay        Int       // 10
}
```

## API Endpoints

### User Endpoints

#### GET /api/v1/reminders/preferences
الحصول على تفضيلات التذكير للمستخدم الحالي

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "enableReminders": true,
    "enableHalfHourlyReminders": true,
    "preferredChannels": ["push", "email"],
    "doNotDisturbStart": null,
    "doNotDisturbEnd": null,
    "maxRemindersPerDay": 10
  }
}
```

#### PUT /api/v1/reminders/preferences
تحديث تفضيلات التذكير

**Request Body:**
```json
{
  "enableReminders": true,
  "preferredChannels": ["push"],
  "doNotDisturbStart": "22:00",
  "doNotDisturbEnd": "07:00",
  "maxRemindersPerDay": 5
}
```

#### GET /api/v1/reminders/logs
الحصول على سجل التذكيرات

**Query Parameters:**
- `page`: رقم الصفحة (default: 1)
- `limit`: عدد النتائج (default: 20)
- `projectId`: تصفية حسب المشروع

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "تذكير: موعد تقديم الطلبات",
      "message": "...",
      "sentAt": "2025-12-28T10:30:00Z",
      "readAt": null,
      "status": "SENT"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Admin/Producer Endpoints

#### GET /api/v1/reminders/projects/:projectId/settings
الحصول على إعدادات التذكير للمشروع

#### PUT /api/v1/reminders/projects/:projectId/settings
تحديث إعدادات التذكير للمشروع

**Request Body:**
```json
{
  "enableReminders": true,
  "enableHalfHourlyReminders": true,
  "orderWindowStart": "08:00",
  "orderWindowEnd": "09:00",
  "reminderInterval": 30,
  "enablePushNotifications": true,
  "enableEmailNotifications": true,
  "customMessageTemplate": "مرحباً {userName}, لم تقدم طلبك في {projectName}. الموعد النهائي بعد {timeRemaining} دقيقة."
}
```

#### POST /api/v1/reminders/projects/:projectId/send
إرسال تذكير فوري لجميع المستخدمين في المشروع

#### GET /api/v1/reminders/system/status
الحصول على حالة نظام التذكيرات (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "isRunning": true,
      "activeJobs": ["halfHourly", "cleanup"],
      "timezone": "Asia/Riyadh"
    },
    "stats": {
      "remindersToday": 150,
      "remindersSent": 145,
      "remindersFailed": 5
    }
  }
}
```

#### GET /api/v1/reminders/projects/:projectId/stats
إحصائيات التذكيرات للمشروع

## التثبيت والإعداد (Installation & Setup)

### 1. تثبيت المكتبات المطلوبة
```bash
cd backend
npm install node-cron nodemailer --save
```

### 2. تطبيق تحديثات قاعدة البيانات
```bash
npx prisma generate
npx prisma db push
# أو
npx prisma migrate dev --name add-reminder-system
```

### 3. إعداد متغيرات البيئة (.env)
```env
# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@breakapp.com

# App Configuration
APP_URL=https://your-domain.com
TZ=Asia/Riyadh

# Push Notifications (Optional)
PUSH_NOTIFICATIONS_ENABLED=true
FCM_SERVER_KEY=your-fcm-key
```

### 4. تشغيل الخادم
```bash
npm run dev
# or
npm start
```

## آلية العمل (How It Works)

### سير العمل (Workflow)

```
1. Cron Job يعمل كل 30 دقيقة
   ↓
2. جلب جميع المشاريع النشطة
   ↓
3. لكل مشروع:
   ├─ التحقق من الإعدادات (enabled/disabled)
   ├─ التحقق من نافذة الطلبات (order window)
   ├─ جلب المستخدمين الذين لم يقدموا طلبات
   └─ لكل مستخدم:
      ├─ التحقق من تفضيلات المستخدم
      ├─ التحقق من وضع عدم الإزعاج
      ├─ التحقق من الحد الأقصى للتذكيرات
      ├─ إنشاء رسالة التذكير
      ├─ إرسال عبر القنوات المفعّلة
      └─ حفظ سجل التذكير
```

### مثال على رسالة التذكير

**Push Notification:**
```
🔔 تذكير: موعد تقديم الطلبات

مرحباً أحمد، لم تقم بتقديم طلب الطعام بعد في مشروع
"فيلم الصحراء". الموعد النهائي بعد 30 دقيقة.
```

**Email:**
رسالة HTML جميلة مع:
- أيقونة وعنوان بارز
- الرسالة الرئيسية
- معلومات المشروع
- عداد الوقت المتبقي
- زر "قدّم طلبك الآن"

## الأمان (Security)

### تدابير الحماية المطبقة:

1. **Authentication**: جميع endpoints محمية بـ JWT authentication
2. **Authorization**: التحقق من صلاحيات المستخدم (Admin/Producer)
3. **Rate Limiting**: حد أقصى للتذكيرات اليومية لكل مستخدم
4. **Data Validation**: التحقق من صحة جميع المدخلات
5. **Privacy**: احترام تفضيلات المستخدم ووضع عدم الإزعاج

## الأداء (Performance)

### تحسينات الأداء:

1. **Cron Scheduling**: معالجة فعالة بدون حمل مستمر
2. **Database Indexing**: فهارس على userId, projectId, scheduledFor
3. **Batch Processing**: معالجة المستخدمين على دفعات
4. **Cleanup Job**: حذف تلقائي للسجلات القديمة (+30 يوم)
5. **Async Operations**: جميع العمليات غير متزامنة

## الاختبار (Testing)

### اختبار يدوي:

#### 1. اختبار الإعدادات الأساسية
```bash
# تسجيل دخول كمستخدم
POST /api/v1/auth/login

# جلب التفضيلات
GET /api/v1/reminders/preferences

# تحديث التفضيلات
PUT /api/v1/reminders/preferences
{
  "enableReminders": true,
  "preferredChannels": ["push", "email"]
}
```

#### 2. اختبار إرسال تذكير فوري
```bash
# كمسؤول أو منتج
POST /api/v1/reminders/projects/{projectId}/send
```

#### 3. التحقق من السجلات
```bash
GET /api/v1/reminders/logs?projectId={id}
```

### اختبار Cron Job:

لاختبار الجدولة، يمكنك تغيير التوقيت مؤقتاً في `reminderSchedulerService.js`:

```javascript
// تغيير من كل 30 دقيقة
cron.schedule('*/30 * * * *', ...)

// إلى كل دقيقة للاختبار
cron.schedule('* * * * *', ...)
```

## استكشاف الأخطاء (Troubleshooting)

### المشاكل الشائعة وحلولها:

#### 1. التذكيرات لا ترسل
**التحقق:**
- هل النظام قيد التشغيل؟ `GET /api/v1/reminders/system/status`
- هل الإعدادات مفعّلة؟ تحقق من `enableReminders`
- هل الوقت ضمن نافذة الطلبات؟

#### 2. البريد الإلكتروني لا يعمل
**التحقق:**
- تأكد من إعداد SMTP في `.env`
- تحقق من السجلات (logs) للأخطاء
- جرب إرسال تجريبي

#### 3. جدول Prisma Error
**الحل:**
```bash
npx prisma generate
npx prisma db push
```

## التطوير المستقبلي (Future Enhancements)

### ميزات مقترحة:

1. **Smart Timing**: تحليل أفضل أوقات الاستجابة وتخصيص التوقيت
2. **SMS Integration**: تكامل كامل مع Twilio أو خدمة SMS محلية
3. **Push Notification**: تكامل Firebase Cloud Messaging
4. **A/B Testing**: اختبار رسائل مختلفة لتحسين معدل الاستجابة
5. **Analytics Dashboard**: لوحة تحكم مرئية للإحصائيات
6. **Multi-language**: دعم لغات متعددة في الرسائل
7. **Voice Reminders**: تذكيرات صوتية عبر الهاتف

## المساهمة (Contributing)

عند إضافة ميزات جديدة للنظام:

1. حافظ على البنية الحالية
2. أضف التوثيق المناسب
3. اختبر جميع السيناريوهات
4. تأكد من Backward Compatibility
5. حدّث هذا الملف بالتغييرات

## الترخيص (License)

هذا المشروع جزء من تطبيق BreakApp ويتبع نفس الترخيص.

## الدعم (Support)

للمشاكل أو الأسئلة:
- افتح Issue في المستودع
- راسل فريق التطوير
- راجع الوثائق الكاملة

---

**تم التنفيذ بنجاح**: ✅ TODO Item #20 - Half-hourly reminders for non-submitters

**تاريخ الإنجاز**: 28 ديسمبر 2025

**المطور**: Claude AI Assistant
