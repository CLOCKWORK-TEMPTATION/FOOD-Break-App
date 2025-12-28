# Database Migration Notes

## تحديثات نموذج المشروع (Project Model Updates)

### التغييرات المطلوبة:

تم تحديث نموذج `Project` في `schema.prisma` بالحقول التالية:

```sql
-- إضافة حقول جديدة لجدول projects
ALTER TABLE projects ADD COLUMN qr_token TEXT;
ALTER TABLE projects ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE projects ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE projects ADD COLUMN last_accessed_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN order_window INTEGER NOT NULL DEFAULT 60;
ALTER TABLE projects ADD COLUMN created_by TEXT;
ALTER TABLE projects ADD COLUMN project_manager TEXT;
```

### الحقول المضافة:

1. **qr_token** (TEXT, nullable): رمز JWT للتحقق من QR Code
2. **latitude** (FLOAT, nullable): خط العرض لموقع المشروع
3. **longitude** (FLOAT, nullable): خط الطول لموقع المشروع
4. **last_accessed_at** (TIMESTAMP, nullable): آخر وقت تم فيه الوصول للمشروع
5. **order_window** (INTEGER, default: 60): نافذة الطلب بالدقائق (الوقت المتاح لتقديم الطلبات)
6. **created_by** (TEXT, nullable): معرف المستخدم الذي أنشأ المشروع
7. **project_manager** (TEXT, nullable): معرف مدير المشروع

### تعليمات التنفيذ:

قبل تشغيل الخادم، تأكد من تنفيذ الخطوات التالية:

```bash
# 1. توليد Prisma Client
npx prisma generate

# 2. تطبيق الـ Migration
npx prisma migrate dev --name add_project_fields

# أو استخدام:
npm run db:migrate
```

### ملاحظات:

- جميع الحقول الجديدة nullable ماعدا `order_window` الذي له قيمة افتراضية
- `order_window` يحدد المدة بالدقائق من بداية المشروع التي يمكن فيها تقديم الطلبات
- `qr_token` يُستخدم للتحقق من صحة QR Code عند المسح
- `last_accessed_at` يتم تحديثه تلقائياً عند الوصول للمشروع عبر QR Code
