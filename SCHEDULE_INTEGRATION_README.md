# نظام تكامل جداول التصوير - BreakApp
# Schedule Integration System - BreakApp

## نظرة عامة | Overview

نظام تكامل جداول التصوير هو نظام متقدم يربط بين جداول التصوير وطلبات البريك في تطبيق BreakApp. يوفر النظام إدارة شاملة لجداول التصوير، فترات البريك، والتكامل التلقائي مع نظام الطلبات.

The Schedule Integration System is an advanced system that connects shooting schedules with break orders in BreakApp. It provides comprehensive management of shooting schedules, break periods, and automatic integration with the ordering system.

## المميزات الرئيسية | Key Features

### 🎬 إدارة جداول التصوير | Shooting Schedule Management
- إنشاء وتحديث جداول التصوير
- تتبع أوقات الحضور والانتهاء
- إدارة مواقع التصوير والإحداثيات
- تسجيل الملاحظات والأحوال الجوية

### ⏰ إدارة فترات البريك | Break Period Management
- تحديد أنواع البريك المختلفة (إفطار، غداء، عشاء، وجبات خفيفة)
- إدارة أوقات البداية والنهاية لكل بريك
- فتح وإغلاق نوافذ الطلب تلقائياً
- تتبع حالة كل فترة بريك

### 🔄 التكامل التلقائي | Automatic Integration
- تعديل أوقات التوصيل عند التأخير
- إرسال إشعارات تلقائية للطاقم
- تذكيرات الطلبات قبل إغلاق النافذة
- مراقبة التأخيرات والتنبيه عنها

### 📊 التقارير والإحصائيات | Reports & Analytics
- إحصائيات شاملة للجداول والبريكات
- تقارير التأخيرات والتغييرات
- تحليل أنماط الطلبات
- تصدير البيانات بصيغ مختلفة

## البنية التقنية | Technical Architecture

### Backend Components

#### 1. Database Models (Prisma Schema)
```prisma
// نموذج جدول التصوير
model ShootingSchedule {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  projectId         String   @db.ObjectId
  scheduleName      String   // اسم الجدول
  scheduleDate      DateTime // تاريخ التصوير
  callTime          String   // وقت الحضور
  wrapTime          String?  // وقت الانتهاء المتوقع
  actualWrapTime    String?  // وقت الانتهاء الفعلي
  status            ScheduleStatus @default(SCHEDULED)
  delayMinutes      Int?     // دقائق التأخير
  delayReason       String?  // سبب التأخير
  location          String?  // موقع التصوير
  coordinates       Coordinates? // إحداثيات GPS
  notes             String?  // ملاحظات
  weatherConditions String?  // الأحوال الجوية
  
  // العلاقات
  project           Project  @relation(fields: [projectId], references: [id])
  breakSchedules    BreakSchedule[]
  scheduleChanges   ScheduleChange[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// نموذج فترة البريك
model BreakSchedule {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  scheduleId        String   @db.ObjectId
  breakType         BreakType // نوع البريك
  breakName         String   // اسم البريك
  scheduledStart    String   // الوقت المجدول للبداية
  scheduledEnd      String   // الوقت المجدول للنهاية
  actualStart       String?  // الوقت الفعلي للبداية
  actualEnd         String?  // الوقت الفعلي للنهاية
  orderWindowStart  String?  // بداية نافذة الطلب
  orderWindowEnd    String?  // نهاية نافذة الطلب
  isOrderWindowOpen Boolean  @default(false)
  status            BreakStatus @default(SCHEDULED)
  
  // العلاقات
  schedule          ShootingSchedule @relation(fields: [scheduleId], references: [id])
  orders            Order[] // الطلبات المرتبطة
}
```

#### 2. Services Layer

**scheduleIntegrationService.js**
- إنشاء وتحديث جداول التصوير
- إدارة فترات البريك
- معالجة التأخيرات وتعديل الأوقات
- إرسال الإشعارات

**cronJobService.js**
- مراقبة البريكات النشطة (كل دقيقة)
- إرسال تذكيرات الطلبات (كل 5 دقائق)
- مراقبة التأخيرات (كل 10 دقائق)
- تنظيف البيانات القديمة (يومياً)

#### 3. API Endpoints

```javascript
// إدارة الجداول
POST   /api/schedules/projects/:projectId          // إنشاء جدول جديد
GET    /api/schedules/projects/:projectId          // جلب جداول المشروع
GET    /api/schedules/projects/:projectId/today    // جدول اليوم
GET    /api/schedules/:scheduleId                  // جدول محدد
PUT    /api/schedules/:scheduleId                  // تحديث جدول
DELETE /api/schedules/:scheduleId                  // حذف جدول

// إدارة البريكات
POST   /api/schedules/breaks/:breakId/start        // بدء بريك
POST   /api/schedules/breaks/:breakId/end          // إنهاء بريك
GET    /api/schedules/projects/:projectId/active-breaks // البريكات النشطة

// التقارير والإحصائيات
GET    /api/schedules/projects/:projectId/report   // تقرير الجداول
GET    /api/schedules/projects/:projectId/break-stats // إحصائيات البريكات

// النظام
GET    /api/schedules/system/check-active-breaks   // فحص البريكات (Cron)
GET    /api/schedules/system/info                  // معلومات النظام
```

### Frontend Components

#### 1. ScheduleManager Component
- عرض جداول التصوير الحالية
- إدارة البريكات النشطة
- تحديث الحالات في الوقت الفعلي
- واجهة تحكم للمديرين

#### 2. CreateScheduleForm Component
- نموذج إنشاء جدول جديد
- إدارة فترات البريك
- التحقق من صحة البيانات
- حساب نوافذ الطلب التلقائية

#### 3. SchedulePage Component
- صفحة شاملة لإدارة الجداول
- تبويبات للجداول والإحصائيات والإعدادات
- لوحة تحكم للمديرين
- عرض التقارير والإحصائيات

## التثبيت والإعداد | Installation & Setup

### 1. Backend Setup

```bash
# تثبيت التبعيات
cd backend
npm install node-cron

# تحديث قاعدة البيانات
npx prisma db push

# تشغيل الخادم
npm run dev
```

### 2. Environment Variables

```env
# إعدادات المهام المجدولة
ENABLE_SCHEDULE_CRON_JOBS=true

# إعدادات الإشعارات
SCHEDULE_NOTIFICATIONS_ENABLED=true

# إعدادات التكامل
SCHEDULE_AUTO_UPDATE_ORDERS=true
SCHEDULE_AUTO_NOTIFY_CHANGES=true
SCHEDULE_ADJUST_DELIVERY_TIMES=true
```

### 3. Frontend Setup

```bash
# تثبيت التبعيات
cd frontend
npm install

# تشغيل التطبيق
npm start
```

## الاستخدام | Usage

### 1. إنشاء جدول تصوير جديد

```javascript
const scheduleData = {
  scheduleName: "تصوير المشهد الأول",
  scheduleDate: "2025-01-15",
  callTime: "08:00",
  wrapTime: "18:00",
  location: "استوديو مصر، المعادي",
  breakSchedules: [
    {
      breakType: "BREAKFAST",
      breakName: "إفطار الطاقم",
      scheduledStart: "09:30",
      scheduledEnd: "10:00"
    },
    {
      breakType: "LUNCH",
      breakName: "غداء الطاقم",
      scheduledStart: "13:00",
      scheduledEnd: "14:00"
    }
  ]
};

const response = await fetch(`/api/schedules/projects/${projectId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(scheduleData)
});
```

### 2. بدء فترة بريك

```javascript
const response = await fetch(`/api/schedules/breaks/${breakId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. مراقبة الجداول في الوقت الفعلي

```javascript
// تحديث البيانات كل دقيقة
useEffect(() => {
  const interval = setInterval(loadScheduleData, 60000);
  return () => clearInterval(interval);
}, []);
```

## المهام المجدولة | Cron Jobs

### 1. مراقبة البريكات (كل دقيقة)
```javascript
cron.schedule('* * * * *', async () => {
  const result = await scheduleIntegrationService.checkActiveBreaks();
  console.log(`تم تحديث البريكات: بدء ${result.started}، إنهاء ${result.ended}`);
});
```

### 2. تذكيرات الطلبات (كل 5 دقائق)
```javascript
cron.schedule('*/5 * * * *', async () => {
  await sendOrderReminders();
});
```

### 3. مراقبة التأخيرات (كل 10 دقائق)
```javascript
cron.schedule('*/10 * * * *', async () => {
  await monitorScheduleDelays();
});
```

### 4. تنظيف البيانات (يومياً الساعة 2 صباحاً)
```javascript
cron.schedule('0 2 * * *', async () => {
  await cleanupOldData();
});
```

## الأمان والصلاحيات | Security & Permissions

### أدوار المستخدمين | User Roles

- **ADMIN**: صلاحيات كاملة
- **PRODUCER**: إدارة الجداول والبريكات
- **MANAGER**: إدارة الجداول والبريكات
- **LEAD**: التحكم في البريكات فقط
- **REGULAR**: عرض الجداول فقط

### التحقق من الصلاحيات | Permission Checks

```javascript
// إنشاء جدول جديد
router.post('/projects/:projectId', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER']),
  scheduleController.createSchedule
);

// التحكم في البريكات
router.post('/breaks/:breakId/start', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER', 'LEAD']),
  scheduleController.startBreak
);
```

## التعريب | Localization

### رسائل النظام
```javascript
const scheduleMessages = {
  ar: {
    scheduleCreated: 'تم إنشاء جدول التصوير بنجاح',
    breakStarted: 'تم بدء فترة البريك بنجاح - يمكن للطاقم الآن طلب الوجبات',
    scheduleDelayDetected: 'تم رصد تأخير في جدول التصوير: {minutes} دقيقة'
  }
};
```

### حالات النظام
```javascript
const scheduleStatus = {
  SCHEDULED: 'مجدول',
  IN_PROGRESS: 'قيد التنفيذ',
  ON_BREAK: 'في فترة راحة',
  DELAYED: 'متأخر',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  POSTPONED: 'مؤجل'
};
```

## المراقبة والسجلات | Monitoring & Logging

### سجلات النظام
```javascript
console.log('🕐 بدء تشغيل المهام المجدولة لنظام تكامل الجداول...');
console.log('📋 تم تشغيل مهمة مراقبة البريكات (كل دقيقة)');
console.log('📢 تم تشغيل مهمة تذكيرات الطلبات (كل 5 دقائق)');
console.log('⏰ تم تشغيل مهمة مراقبة التأخيرات (كل 10 دقائق)');
console.log('🧹 تم تشغيل مهمة تنظيف البيانات (يومياً الساعة 2 صباحاً)');
```

### مراقبة الأداء
- تتبع أوقات استجابة API
- مراقبة استهلاك الذاكرة للمهام المجدولة
- تسجيل الأخطاء والاستثناءات
- إحصائيات الاستخدام

## الاختبار | Testing

### اختبارات الوحدة | Unit Tests
```javascript
describe('Schedule Integration Service', () => {
  test('should create shooting schedule', async () => {
    const schedule = await scheduleIntegrationService.createShootingSchedule(
      projectId, 
      scheduleData
    );
    expect(schedule.scheduleName).toBe('تصوير المشهد الأول');
  });
});
```

### اختبارات التكامل | Integration Tests
```javascript
describe('Schedule API Endpoints', () => {
  test('POST /api/schedules/projects/:projectId', async () => {
    const response = await request(app)
      .post(`/api/schedules/projects/${projectId}`)
      .send(scheduleData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

## الأداء والتحسين | Performance & Optimization

### تحسين قاعدة البيانات
- فهرسة الحقول المستخدمة في البحث
- تحسين استعلامات الانضمام
- تنظيف البيانات القديمة تلقائياً

### تحسين الواجهة الأمامية
- تحديث البيانات في الوقت الفعلي
- تخزين مؤقت للبيانات المتكررة
- تحميل البيانات بشكل تدريجي

## استكشاف الأخطاء | Troubleshooting

### مشاكل شائعة | Common Issues

#### 1. المهام المجدولة لا تعمل
```bash
# التحقق من إعدادات البيئة
echo $ENABLE_SCHEDULE_CRON_JOBS

# فحص السجلات
tail -f logs/schedule-cron.log
```

#### 2. البريكات لا تبدأ تلقائياً
```javascript
// فحص حالة المهمة المجدولة
const status = cronJobService.getCronJobsStatus();
console.log('Break monitoring job:', status.jobs[0]);
```

#### 3. الإشعارات لا تُرسل
```javascript
// التحقق من إعدادات الإشعارات
const settings = await prisma.scheduleIntegrationSettings.findUnique({
  where: { projectId }
});
console.log('Auto notify changes:', settings.autoNotifyChanges);
```

## المساهمة | Contributing

### إضافة ميزة جديدة
1. إنشاء فرع جديد من `main`
2. تطوير الميزة مع الاختبارات
3. تحديث التوثيق
4. إرسال Pull Request

### معايير الكود
- استخدام TypeScript للأمان النوعي
- كتابة تعليقات باللغة العربية
- اتباع معايير ESLint المحددة
- تغطية اختبارات 80%+

## الترخيص | License

هذا المشروع مرخص تحت رخصة MIT. راجع ملف LICENSE للتفاصيل.

---

## ملخص التنفيذ | Implementation Summary

تم تنفيذ **Task 3: تكامل مع جداول التصوير** بنجاح ويتضمن:

### ✅ المكونات المكتملة | Completed Components

1. **قاعدة البيانات**: نماذج شاملة للجداول والبريكات
2. **الخدمات**: خدمة تكامل متقدمة مع معالجة التأخيرات
3. **API**: مسارات كاملة مع المصادقة والتحقق
4. **المهام المجدولة**: نظام Cron Jobs للمراقبة التلقائية
5. **الواجهة الأمامية**: مكونات React متقدمة
6. **التعريب**: رسائل عربية شاملة
7. **التوثيق**: دليل شامل للاستخدام والتطوير

### 🚀 الميزات المتقدمة | Advanced Features

- **مراقبة في الوقت الفعلي**: تحديث البيانات كل دقيقة
- **إدارة التأخيرات**: تعديل تلقائي للأوقات والإشعارات
- **نظام التذكيرات**: تذكيرات ذكية قبل إغلاق نوافذ الطلب
- **التقارير والإحصائيات**: تحليل شامل للأداء
- **الأمان المتقدم**: صلاحيات متدرجة حسب الأدوار

النظام جاهز للاستخدام الإنتاجي ويوفر تكاملاً سلساً بين جداول التصوير ونظام طلبات البريك في BreakApp.