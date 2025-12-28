# دليل النشر - BreakApp Deployment Guide

## المتطلبات الأساسية

### Server Requirements
- Node.js 18+ LTS
- PostgreSQL 14+
- 2GB RAM minimum (4GB recommended)
- 20GB Storage
- Ubuntu 20.04+ or similar Linux distribution

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@host:5432/breakapp"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Security
QR_SECRET_KEY=your_qr_secret_key

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM APIs (اختر واحد على الأقل)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# Weather & Maps
OPENWEATHER_API_KEY=...
GOOGLE_PLACES_API_KEY=...

# Monitoring
SENTRY_DSN=https://...
```

---

## خطوات النشر

### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت PM2
sudo npm install -g pm2
```

### 2. إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE breakapp;
CREATE USER breakapp_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE breakapp TO breakapp_user;
\q
```

### 3. نشر التطبيق

```bash
# استنساخ المشروع
git clone <repository-url>
cd breakapp/backend

# تثبيت التبعيات
npm ci --production

# إعداد Environment Variables
cp .env.example .env
nano .env  # عدل المتغيرات

# تشغيل Migrations
npx prisma migrate deploy
npx prisma generate

# Seed البيانات الأولية (اختياري)
npm run db:seed
```

### 4. تشغيل التطبيق مع PM2

```bash
# بدء التطبيق
pm2 start src/server.js --name breakapp-api

# حفظ التكوين
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup
```

### 5. إعداد Nginx (Reverse Proxy)

```bash
# تثبيت Nginx
sudo apt install -y nginx

# إنشاء ملف التكوين
sudo nano /etc/nginx/sites-available/breakapp
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/breakapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. إعداد SSL (Let's Encrypt)

```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d api.yourdomain.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

---

## المراقبة والصيانة

### مراقبة التطبيق

```bash
# عرض السجلات
pm2 logs breakapp-api

# عرض الحالة
pm2 status

# عرض استخدام الموارد
pm2 monit
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي لقاعدة البيانات
pg_dump -U breakapp_user breakapp > backup_$(date +%Y%m%d).sql

# استعادة من نسخة احتياطية
psql -U breakapp_user breakapp < backup_20250128.sql
```

### التحديثات

```bash
# سحب آخر التحديثات
git pull origin main

# تثبيت التبعيات الجديدة
npm ci --production

# تشغيل Migrations
npx prisma migrate deploy

# إعادة تشغيل التطبيق
pm2 restart breakapp-api
```

---

## استكشاف الأخطاء

### التطبيق لا يعمل
```bash
# التحقق من السجلات
pm2 logs breakapp-api --lines 100

# التحقق من المنفذ
sudo netstat -tulpn | grep 3000

# إعادة التشغيل
pm2 restart breakapp-api
```

### مشاكل قاعدة البيانات
```bash
# التحقق من حالة PostgreSQL
sudo systemctl status postgresql

# الاتصال بقاعدة البيانات
psql -U breakapp_user -d breakapp

# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

### مشاكل الأداء
```bash
# زيادة عدد العمليات
pm2 scale breakapp-api 4

# مراقبة الذاكرة
pm2 monit

# تنظيف السجلات
pm2 flush
```

---

## الأمان

### Firewall
```bash
# تفعيل UFW
sudo ufw enable

# السماح بالمنافذ الضرورية
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5432  # PostgreSQL (من localhost فقط)
```

### تحديثات الأمان
```bash
# تحديثات تلقائية
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## الأداء

### تحسين PostgreSQL
```sql
-- في /etc/postgresql/14/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### تحسين Node.js
```bash
# زيادة حد الذاكرة
pm2 start src/server.js --name breakapp-api --max-memory-restart 500M
```

---

## Checklist قبل النشر

- [ ] جميع Environment Variables محددة
- [ ] قاعدة البيانات جاهزة ومهيأة
- [ ] SSL مفعل
- [ ] Firewall مكون
- [ ] النسخ الاحتياطي التلقائي مفعل
- [ ] Monitoring مفعل (Sentry)
- [ ] السجلات تعمل بشكل صحيح
- [ ] اختبار جميع API Endpoints
- [ ] اختبار الأداء تحت الضغط
- [ ] توثيق API محدث

---

**آخر تحديث**: 28 ديسمبر 2025
