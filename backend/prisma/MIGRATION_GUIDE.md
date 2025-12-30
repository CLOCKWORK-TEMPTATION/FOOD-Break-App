# Database Migration Guide دليل هجرة قاعدة البيانات

## Overview / نظرة عامة

This guide explains how to manage database migrations, schema changes, and data integrity in the BreakApp project.
هذا الدليل يشرح كيفية إدارة هجرات قاعدة البيانات، تغييرات المخطط، وسلامة البيانات في مشروع BreakApp.

---

## 📋 Table of Contents / المحتويات

1. [Migration Basics](#migration-basics)
2. [Creating Migrations](#creating-migrations)
3. [Running Migrations](#running-migrations)
4. [Rollback Strategies](#rollback-strategies)
5. [Production Deployment](#production-deployment)
6. [Data Seeding](#data-seeding)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Migration Basics / أساسيات الهجرة

### What is a Migration? / ما هي الهجرة؟

A migration is a version-controlled change to your database schema.
الهجرة هي تغيير مُتحكم به في مخطط قاعدة البيانات.

### Why Use Migrations? / لماذا استخدام الهجرات؟

- ✅ Version control for database changes / التحكم بإصدارات تغييرات قاعدة البيانات
- ✅ Team collaboration / التعاون الجماعي
- ✅ Deployment automation / أتمتة النشر
- ✅ Rollback capability / إمكانية التراجع
- ✅ Data integrity / سلامة البيانات

---

## 📝 Creating Migrations / إنشاء الهجرات

### 1. Development Migration

When developing new features, create a migration:
عند تطوير ميزات جديدة، أنشئ هجرة:

```bash
# 1. Edit schema.prisma with your changes
# 1. عدّل schema.prisma بالتغييرات المطلوبة

# 2. Generate migration
# 2. أنشئ الهجرة
npx prisma migrate dev --name descriptive_migration_name

# Example / مثال:
npx prisma migrate dev --name add_user_preferences
npx prisma migrate dev --name add_emergency_system
```

### 2. What Happens During Migration

```
1. Prisma analyzes schema changes
   Prisma يحلل تغييرات المخطط

2. Generates SQL migration file
   يُنشئ ملف SQL للهجرة

3. Applies migration to database
   يطبق الهجرة على قاعدة البيانات

4. Updates Prisma Client
   يُحدّث Prisma Client
```

### 3. Migration Naming Conventions

Use descriptive, lowercase names with underscores:
استخدم أسماء وصفية بأحرف صغيرة مع شرطات سفلية:

- ✅ `add_dietary_profile`
- ✅ `update_user_roles`
- ✅ `create_emergency_tables`
- ❌ `migration1`
- ❌ `UpdateUser`

---

## 🚀 Running Migrations / تشغيل الهجرات

### Development Environment / بيئة التطوير

```bash
# Run all pending migrations
# شغّل جميع الهجرات المعلقة
npm run db:migrate

# Or directly with Prisma
# أو مباشرة مع Prisma
npx prisma migrate dev
```

### Production Environment / بيئة الإنتاج

```bash
# Deploy migrations (NO prompts, safe for CI/CD)
# نشر الهجرات (بدون أسئلة، آمن للـ CI/CD)
npx prisma migrate deploy

# With Docker
# مع Docker
docker-compose exec backend npx prisma migrate deploy
```

### Check Migration Status / التحقق من حالة الهجرات

```bash
# See applied and pending migrations
# عرض الهجرات المطبقة والمعلقة
npx prisma migrate status
```

---

## ↩️ Rollback Strategies / استراتيجيات التراجع

### Option 1: Create Reverse Migration (Recommended)

```bash
# 1. Create a new migration that reverses the changes
# 1. أنشئ هجرة جديدة تعكس التغييرات

# Edit schema.prisma to reverse changes
# عدّل schema.prisma لعكس التغييرات

npx prisma migrate dev --name revert_feature_name
```

### Option 2: Reset Database (Development Only!)

```bash
# ⚠️ WARNING: This deletes ALL data!
# ⚠️ تحذير: هذا يحذف جميع البيانات!

npx prisma migrate reset
```

### Option 3: Manual Rollback (Advanced)

```sql
-- Find the migration you want to rollback
-- ابحث عن الهجرة التي تريد التراجع عنها

-- Manually write SQL to reverse it
-- اكتب SQL يدوياً لعكسها
```

---

## 🏭 Production Deployment / النشر للإنتاج

### Pre-Deployment Checklist

```bash
# 1. Test migrations locally
# 1. اختبر الهجرات محلياً
npm run db:migrate

# 2. Review generated SQL
# 2. راجع SQL المُنشأة
cat prisma/migrations/*/migration.sql

# 3. Backup production database
# 3. احفظ نسخة احتياطية من قاعدة بيانات الإنتاج
pg_dump -U username -d dbname > backup.sql

# 4. Run in staging first
# 4. شغّل في بيئة التجريب أولاً
```

### Deployment Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Deploy migrations
npx prisma migrate deploy

# 5. Restart application
pm2 restart breakapp
```

### Zero-Downtime Deployment

For critical changes, use these strategies:
للتغييرات الحرجة، استخدم هذه الاستراتيجيات:

1. **Backward Compatible Changes**
   - Add columns as nullable first
   - Remove columns in separate deployment

2. **Staged Migrations**
   - Deploy schema changes
   - Update application code
   - Remove old columns

---

## 🌱 Data Seeding / ملء البيانات

### Development Seed

```bash
# Seed development data
# ملء بيانات التطوير
npm run db:seed

# Or directly
npx prisma db seed
```

### Production Seed

```bash
# Seed essential production data
# ملء البيانات الأساسية للإنتاج
node prisma/seed-production.js
```

### Custom Seed Files

Create specialized seed files:
أنشئ ملفات seed متخصصة:

```bash
# Emotional AI seed
node prisma/seed-emotion.js

# Emergency system seed
node prisma/seed-emergency.js
```

---

## ✅ Best Practices / أفضل الممارسات

### 1. Schema Design / تصميم المخطط

```prisma
// ✅ DO: Use descriptive names
model UserPreferences { ... }

// ❌ DON'T: Use abbreviations
model UsrPref { ... }

// ✅ DO: Add indexes for frequently queried fields
@@index([email])
@@index([createdAt])

// ✅ DO: Use proper cascading
onDelete: Cascade  // Delete related records
onDelete: SetNull  // Keep records but remove reference

// ✅ DO: Document complex fields
/// معلومات التغذية المتقدمة
nutritionalInfo Json?
```

### 2. Migration Safety / أمان الهجرة

```bash
# ✅ DO: Always backup before production migration
pg_dump > backup_before_migration.sql

# ✅ DO: Test migrations in staging
# ✅ DO: Review generated SQL
# ✅ DO: Use transactions when possible

# ❌ DON'T: Run migrations directly in production without testing
# ❌ DON'T: Delete columns without backing up data
# ❌ DON'T: Change primary keys without careful planning
```

### 3. Data Integrity / سلامة البيانات

```prisma
// ✅ DO: Use appropriate constraints
email String @unique
role UserRole @default(REGULAR)
createdAt DateTime @default(now())

// ✅ DO: Use enums for fixed values
enum UserRole {
  REGULAR
  VIP
  ADMIN
  PRODUCER
}

// ✅ DO: Add validation at database level
@@index([email])
@@index([role, isActive])
```

---

## 🔧 Troubleshooting / استكشاف الأخطاء

### Problem: Migration Failed

```bash
# 1. Check error message
# 1. تحقق من رسالة الخطأ

# 2. Check database connection
# 2. تحقق من اتصال قاعدة البيانات
npx prisma db pull

# 3. Check migration history
# 3. تحقق من سجل الهجرات
npx prisma migrate status

# 4. Force reset (development only!)
# 4. إعادة تعيين قسرية (للتطوير فقط!)
npx prisma migrate reset
```

### Problem: Schema Out of Sync

```bash
# 1. Pull current database schema
# 1. اسحب مخطط قاعدة البيانات الحالي
npx prisma db pull

# 2. Compare with schema.prisma
# 2. قارن مع schema.prisma

# 3. Create migration for differences
# 3. أنشئ هجرة للاختلافات
npx prisma migrate dev --name sync_schema
```

### Problem: Prisma Client Not Updated

```bash
# Regenerate Prisma Client
# أعد توليد Prisma Client
npx prisma generate
```

### Problem: Foreign Key Constraints

```bash
# Check relationships in schema.prisma
# تحقق من العلاقات في schema.prisma

# Ensure referenced records exist
# تأكد من وجود السجلات المُشار إليها

# Consider using @relation with onDelete/onUpdate
onDelete: Cascade
onUpdate: Cascade
```

---

## 📊 Migration History / سجل الهجرات

### View Migration History

```bash
# List all migrations
ls prisma/migrations/

# View specific migration
cat prisma/migrations/20231201120000_init/migration.sql
```

### Migration Files Structure

```
prisma/migrations/
├── 20231201120000_init/
│   ├── migration.sql       # SQL commands
│   └── README.md           # Auto-generated notes
├── 20231202150000_add_users/
│   └── migration.sql
└── migration_lock.toml     # Lock file
```

---

## 🎓 Advanced Topics / مواضيع متقدمة

### Custom Migration SQL

```bash
# 1. Create empty migration
npx prisma migrate dev --create-only --name custom_indexes

# 2. Edit the SQL file manually
# 2. عدّل ملف SQL يدوياً
vi prisma/migrations/*/migration.sql

# 3. Apply migration
npx prisma migrate dev
```

### Data Migration

```javascript
// In a separate script: prisma/data-migration.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  // Example: Update existing records
  await prisma.user.updateMany({
    where: { role: null },
    data: { role: 'REGULAR' },
  });
}

migrateData();
```

---

## 📚 Resources / الموارد

### Documentation

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Open Prisma Studio
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

---

## ✅ Migration Checklist / قائمة التحقق

Before deploying a migration to production:
قبل نشر هجرة للإنتاج:

- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] Reviewed generated SQL
- [ ] Backed up production database
- [ ] Verified no breaking changes
- [ ] Updated application code if needed
- [ ] Documented migration purpose
- [ ] Prepared rollback plan
- [ ] Scheduled maintenance window (if needed)
- [ ] Team notified

---

**Prepared by Agent 1: DB_ARCHITECT_01**
**أعده الوكيل 1: مهندس قواعد البيانات**
