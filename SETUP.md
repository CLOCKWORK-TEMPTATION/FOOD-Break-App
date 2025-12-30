# دليل إعداد المشروع - BreakApp
# Project Setup Guide - BreakApp

<div dir="rtl">

## 📋 المحتويات - Table of Contents

1. [المتطلبات الأساسية - Prerequisites](#المتطلبات-الأساسية---prerequisites)
2. [الإعداد السريع - Quick Setup](#الإعداد-السريع---quick-setup)
3. [الإعداد التفصيلي - Detailed Setup](#الإعداد-التفصيلي---detailed-setup)
4. [إعداد Docker - Docker Setup](#إعداد-docker---docker-setup)
5. [إعداد قاعدة البيانات - Database Setup](#إعداد-قاعدة-البيانات---database-setup)
6. [المتغيرات البيئية - Environment Variables](#المتغيرات-البيئية---environment-variables)
7. [تشغيل المشروع - Running the Project](#تشغيل-المشروع---running-the-project)
8. [استكشاف الأخطاء - Troubleshooting](#استكشاف-الأخطاء---troubleshooting)

---

## 📦 المتطلبات الأساسية - Prerequisites

### الأدوات المطلوبة - Required Tools

| الأداة | الإصدار المطلوب | الاستخدام |
|--------|-----------------|-----------|
| Node.js | 18.0.0+ | بيئة تشغيل JavaScript |
| npm | 8.0.0+ | مدير الحزم |
| Docker | 20.10+ | حاويات التطوير |
| Docker Compose | 2.0+ | إدارة الحاويات المتعددة |
| Git | 2.30+ | إدارة الإصدارات |

### التحقق من التثبيت - Verify Installation

```bash
# التحقق من Node.js
node --version  # يجب أن يكون >= 18.0.0

# التحقق من npm
npm --version   # يجب أن يكون >= 8.0.0

# التحقق من Docker
docker --version
docker-compose --version

# التحقق من Git
git --version
```

---

## ⚡ الإعداد السريع - Quick Setup

### الخيار 1: استخدام Docker (موصى به للمبتدئين)

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd FOOD-Break-App

# 2. نسخ ملف البيئة
cp .env.example .env

# 3. بناء وتشغيل الحاويات
npm run docker:up

# 4. تهيئة قاعدة البيانات (في terminal جديد)
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. افتح المتصفح
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PgAdmin: http://localhost:5050
# Redis Commander: http://localhost:8081
```

### الخيار 2: التثبيت المحلي (للتطوير المتقدم)

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd FOOD-Break-App

# 2. تثبيت التبعيات
npm run install:all

# 3. إعداد قاعدة البيانات المحلية
# تأكد من تشغيل PostgreSQL و Redis محلياً
# ثم قم بإنشاء قاعدة البيانات

# 4. نسخ وتعديل ملف البيئة
cp .env.example .env
# عدّل الملف بمعلومات قاعدة البيانات المحلية

# 5. تهيئة قاعدة البيانات
npm run db:generate
npm run db:migrate
npm run db:seed

# 6. تشغيل المشروع
npm run dev
```

---

## 🔧 الإعداد التفصيلي - Detailed Setup

### 1. إعداد المشروع الأساسي

#### أ. استنساخ المشروع

```bash
git clone <repository-url>
cd FOOD-Break-App
```

#### ب. فهم هيكل المشروع

```
FOOD-Break-App/
├── backend/              # خادم Node.js API
│   ├── src/             # كود المصدر
│   ├── prisma/          # مخطط قاعدة البيانات
│   ├── tests/           # الاختبارات
│   └── Dockerfile       # ملف Docker للخلفية
├── frontend/            # تطبيق React
│   ├── src/             # كود المصدر
│   ├── public/          # ملفات ثابتة
│   └── Dockerfile       # ملف Docker للواجهة
├── mobile/              # تطبيق React Native (اختياري)
├── docker-compose.yml   # تكوين Docker Compose
├── .env.example         # مثال متغيرات البيئة
└── package.json         # تبعيات المشروع الرئيسية
```

### 2. تكوين المتغيرات البيئية

#### أ. إنشاء ملف .env

```bash
cp .env.example .env
```

#### ب. تحديث المتغيرات الأساسية

افتح ملف `.env` وقم بتحديث القيم التالية:

```bash
# قاعدة البيانات
DATABASE_URL="postgresql://breakapp:your_password@localhost:5432/breakapp_db?schema=public"

# Redis
REDIS_URL="redis://:your_redis_password@localhost:6379"

# JWT Secret (استخدم قيمة عشوائية قوية)
JWT_SECRET="your-very-secure-secret-key-min-32-characters"

# البريد الإلكتروني (اختياري للتطوير)
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

#### ج. توليد أسرار قوية

```bash
# توليد JWT Secret قوي
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# توليد Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. تثبيت التبعيات

#### أ. تثبيت تبعيات الجذر

```bash
npm install
```

#### ب. تثبيت تبعيات جميع الحزم

```bash
npm run install:all
```

هذا الأمر سيقوم بتثبيت التبعيات لـ:
- الحزمة الرئيسية
- Backend
- Frontend
- Mobile (إذا كانت موجودة)

---

## 🐳 إعداد Docker - Docker Setup

### ما هو Docker؟

Docker يسمح لك بتشغيل المشروع بالكامل (قاعدة البيانات، Redis، Backend، Frontend) في حاويات معزولة دون الحاجة لتثبيت أي شيء محلياً.

### الخدمات المتوفرة

| الخدمة | المنفذ | الوصف |
|--------|--------|-------|
| PostgreSQL | 5432 | قاعدة البيانات |
| Redis | 6379 | التخزين المؤقت |
| Backend API | 3001 | خادم API |
| Frontend | 3000 | واجهة المستخدم |
| PgAdmin | 5050 | إدارة قاعدة البيانات |
| Redis Commander | 8081 | إدارة Redis |

### أوامر Docker المفيدة

```bash
# بناء جميع الحاويات
npm run docker:build

# تشغيل جميع الخدمات في الخلفية
npm run docker:up

# تشغيل جميع الخدمات مع عرض السجلات
npm run docker:dev

# إيقاف جميع الخدمات
npm run docker:down

# عرض حالة الخدمات
npm run docker:ps

# عرض سجلات الخدمات
npm run docker:logs

# إعادة تشغيل الخدمات
npm run docker:restart

# حذف جميع الحاويات والبيانات
npm run docker:clean
```

### عرض سجلات خدمة محددة

```bash
# سجلات Backend
docker-compose logs -f backend

# سجلات Frontend
docker-compose logs -f frontend

# سجلات PostgreSQL
docker-compose logs -f postgres

# سجلات Redis
docker-compose logs -f redis
```

### الدخول إلى حاوية محددة

```bash
# الدخول إلى Backend
docker-compose exec backend sh

# الدخول إلى PostgreSQL
docker-compose exec postgres psql -U breakapp -d breakapp_db

# الدخول إلى Redis
docker-compose exec redis redis-cli -a breakapp_redis_password
```

---

## 🗄️ إعداد قاعدة البيانات - Database Setup

### Prisma ORM

هذا المشروع يستخدم Prisma كـ ORM لإدارة قاعدة البيانات.

### الأوامر الأساسية

```bash
# توليد Prisma Client
npm run db:generate

# إنشاء migration جديدة
npm run db:migrate

# تطبيق migrations بدون إنشاء جديدة
cd backend && npx prisma migrate deploy

# ملء قاعدة البيانات ببيانات تجريبية
npm run db:seed

# فتح Prisma Studio (واجهة بيانات مرئية)
npm run db:studio
```

### مخطط قاعدة البيانات

يمكنك العثور على مخطط قاعدة البيانات في:
```
backend/prisma/schema.prisma
```

### إعادة تعيين قاعدة البيانات

⚠️ **تحذير**: هذا سيحذف جميع البيانات!

```bash
cd backend
npx prisma migrate reset
```

---

## 🌐 المتغيرات البيئية - Environment Variables

### المتغيرات الإلزامية

| المتغير | الوصف | مثال |
|---------|--------|------|
| `DATABASE_URL` | رابط قاعدة البيانات | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | رابط Redis | `redis://:pass@localhost:6379` |
| `JWT_SECRET` | مفتاح JWT | سلسلة عشوائية 32+ حرف |
| `NODE_ENV` | بيئة التشغيل | `development` أو `production` |

### المتغيرات الاختيارية

| المتغير | الوصف | افتراضي |
|---------|--------|---------|
| `BACKEND_PORT` | منفذ Backend | `3001` |
| `FRONTEND_PORT` | منفذ Frontend | `3000` |
| `LOG_LEVEL` | مستوى السجلات | `debug` |
| `SMTP_HOST` | خادم البريد | - |
| `ANTHROPIC_API_KEY` | مفتاح Claude AI | - |
| `GOOGLE_AI_API_KEY` | مفتاح Gemini AI | - |

### التحقق من المتغيرات

```bash
# عرض جميع المتغيرات المحملة (للتطوير فقط)
cd backend
node -e "require('dotenv').config(); console.log(process.env)"
```

---

## 🚀 تشغيل المشروع - Running the Project

### طريقة 1: التطوير المحلي

```bash
# تشغيل Backend و Frontend معاً
npm run dev

# أو تشغيل كل واحد بشكل منفصل
npm run dev:backend   # في terminal أول
npm run dev:frontend  # في terminal ثاني
```

### طريقة 2: استخدام Docker

```bash
# تشغيل جميع الخدمات
npm run docker:up

# أو مع عرض السجلات
npm run docker:dev
```

### الوصول إلى التطبيق

بعد التشغيل، يمكنك الوصول إلى:

| الخدمة | الرابط |
|--------|--------|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3001 |
| **API Docs** | http://localhost:3001/api-docs |
| **PgAdmin** | http://localhost:5050 |
| **Redis Commander** | http://localhost:8081 |
| **Prisma Studio** | http://localhost:5555 (بعد تشغيل `npm run db:studio`) |

### بيانات تسجيل الدخول الافتراضية

#### PgAdmin
- **Email**: `admin@breakapp.local`
- **Password**: `admin`

#### بعد الاتصال بـ PgAdmin، أضف server جديد:
- **Host**: `postgres`
- **Port**: `5432`
- **Database**: `breakapp_db`
- **Username**: `breakapp`
- **Password**: `breakapp_dev_password`

---

## 🧪 الاختبارات - Testing

### تشغيل الاختبارات

```bash
# جميع الاختبارات
npm test

# اختبارات مع مراقبة التغييرات
npm run test:watch

# اختبارات التغطية
npm run test:coverage

# اختبارات الباكند فقط
cd backend && npm test

# اختبارات الفرونتند فقط
cd frontend && npm test
```

---

## 🔍 استكشاف الأخطاء - Troubleshooting

### المشكلة: فشل الاتصال بقاعدة البيانات

**الحل:**

```bash
# 1. تحقق من تشغيل PostgreSQL
docker-compose ps postgres

# 2. تحقق من DATABASE_URL في .env
cat .env | grep DATABASE_URL

# 3. اختبر الاتصال
docker-compose exec postgres psql -U breakapp -d breakapp_db -c "SELECT 1;"
```

### المشكلة: فشل الاتصال بـ Redis

**الحل:**

```bash
# 1. تحقق من تشغيل Redis
docker-compose ps redis

# 2. اختبر الاتصال
docker-compose exec redis redis-cli -a breakapp_redis_password ping
# يجب أن يرجع: PONG
```

### المشكلة: خطأ "Port already in use"

**الحل:**

```bash
# ابحث عن العملية المستخدمة للمنفذ
# Linux/Mac:
lsof -i :3000  # استبدل 3000 بالمنفذ المطلوب
# Windows:
netstat -ano | findstr :3000

# أوقف العملية أو غيّر المنفذ في .env
```

### المشكلة: Prisma Client لم يتم توليده

**الحل:**

```bash
# أعد توليد Prisma Client
npm run db:generate

# أو مباشرة في Backend
cd backend
npx prisma generate
```

### المشكلة: Docker containers لا تبدأ

**الحل:**

```bash
# 1. نظف جميع الحاويات القديمة
npm run docker:clean

# 2. أعد بناء الحاويات
npm run docker:build

# 3. ابدأ من جديد
npm run docker:up

# 4. تحقق من السجلات
npm run docker:logs
```

### المشكلة: التبعيات لم يتم تثبيتها بشكل صحيح

**الحل:**

```bash
# احذف node_modules وأعد التثبيت
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# أو بشكل منفصل
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## 📚 موارد إضافية - Additional Resources

### التوثيق

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Redis Documentation](https://redis.io/docs/)

### أدوات مفيدة

```bash
# تنسيق الكود باستخدام Prettier
npm run format

# فحص الكود
npm run lint

# إصلاح مشاكل ESLint
npm run lint:fix
```

---

## 🤝 الدعم - Support

إذا واجهت أي مشاكل:

1. راجع قسم [استكشاف الأخطاء](#استكشاف-الأخطاء---troubleshooting)
2. ابحث في [القضايا المفتوحة](https://github.com/your-repo/issues)
3. افتح قضية جديدة مع تفاصيل المشكلة

---

## 📄 الترخيص - License

MIT License - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

**تم إعداد هذا الدليل بواسطة فريق BreakApp**
**Prepared by the BreakApp Team**

</div>
