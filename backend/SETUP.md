# خطوات إعداد BreakApp Backend

## 1. إعداد البيئة

```bash
cd backend

# نسخ ملف البيئة
cp .env.example .env
```

قم بتحديث `.env` بالمعلومات الصحيحة:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/breakapp?schema=public"
JWT_SECRET=your_secure_random_secret
```

## 2. تثبيت التبعيات

```bash
npm install
```

## 3. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npm run db:generate

# تشغيل Migrations
npm run db:migrate
```

## 4. تشغيل الخادم

```bash
# وضع التطوير (مع hot reload)
npm run dev

# أو وضع الإنتاج
npm start
```

الخادم سيعمل على: `http://localhost:3000`

## 5. اختبار API

يمكنك اختبار API باستخدام:

### تسجيل مستخدم جديد

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@breakapp.com",
    "password": "password123",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "ADMIN"
  }'
```

### تسجيل الدخول

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@breakapp.com",
    "password": "password123"
  }'
```

احفظ الـ `token` من الاستجابة واستخدمه في الطلبات القادمة.

### الحصول على المستخدم الحالي

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## ما تم إنجازه

✅ **نظام المصادقة والتفويض**
- تسجيل المستخدمين
- تسجيل الدخول/الخروج
- JWT Authentication
- نظام الأدوار (REGULAR, VIP, ADMIN, PRODUCER)

✅ **نظام إدارة المطاعم**
- CRUD للمطاعم
- البحث الجغرافي (المطاعم القريبة)
- حساب المسافة والوقت التقديري
- تقييمات المطاعم

✅ **نظام القوائم**
- القائمة الأساسية (Core Menu)
- القائمة الجغرافية (Geographic Menu)
- CRUD لعناصر القائمة
- البحث في القوائم
- تتبع الجودة

✅ **نظام الاستثناءات**
- 3 أنواع من الاستثناءات (FULL, LIMITED, SELF_PAID)
- إدارة الحصص (مرة كل 3 أسابيع للمستخدمين العاديين)
- استثناءات غير محدودة لـ VIP
- حساب التكلفة التلقائي
- تقارير مالية

✅ **البنية التحتية**
- معالجة أخطاء مركزية
- Validation middleware
- Logging system
- Security headers (Helmet)
- CORS configuration

## الخطوات القادمة

الخطوات المتبقية من TODO.md:

### 1. إعداد البنية السحابية
- [ ] اختيار مزود خدمة سحابية (AWS/GCP/Azure)
- [ ] إعداد RDS أو Cloud SQL لقاعدة البيانات
- [ ] إعداد Load Balancer
- [ ] إعداد CDN للملفات الثابتة

### 2. تنفيذ CI/CD Pipeline
- [ ] إعداد GitHub Actions أو GitLab CI
- [ ] Automated testing
- [ ] Automated deployment
- [ ] Docker containerization

### 3. إعداد المراقبة والتسجيل
- [ ] تكامل Sentry لتتبع الأخطاء
- [ ] إعداد DataDog أو CloudWatch
- [ ] Application Performance Monitoring
- [ ] Log aggregation

راجع [TODO.md](../TODO.md) للحصول على القائمة الكاملة للميزات المخططة.
