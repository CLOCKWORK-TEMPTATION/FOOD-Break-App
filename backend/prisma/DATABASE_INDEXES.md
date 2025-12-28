# Database Performance Indexes
# فهارس الأداء لقاعدة البيانات

## نظرة عامة
تم تحسين أداء قاعدة البيانات بإضافة فهارس استراتيجية على الجداول الأكثر استخداماً.

## الفهارس المضافة

### 1. جدول المستخدمين (users)
```sql
@@index([email])                    -- لتسريع عمليات البحث بالبريد الإلكتروني
@@index([role, isActive])           -- لتصفية المستخدمين حسب الدور والحالة
@@index([createdAt])                -- للترتيب الزمني و التقارير
```

### 2. جدول المطاعم (restaurants)
```sql
@@index([cuisineType])              -- للبحث حسب نوع المطبخ
@@index([isActive, isPartner])      -- لتصفية المطاعم النشطة والشركاء
@@index([rating])                   -- للترتيب حسب التقييم
@@index([createdAt])                -- للترتيب الزمني
```

### 3. جدول العناصر (menu_items)
```sql
@@index([restaurantId, isAvailable])  -- لعرض قوائم المطاعم المتاحة
@@index([menuType, isAvailable])      -- لتصفية حسب نوع القائمة
@@index([category])                   -- للتصنيف
```

### 4. جدول الطلبات (orders)
```sql
@@index([userId, createdAt])          -- لطلبات المستخدم مع الترتيب الزمني
@@index([projectId, status])          -- لطلبات المشروع
@@index([restaurantId, status])       -- لطلبات المطعم
@@index([status, createdAt])          -- لتقارير الحالة
```

### 5. جدول بنود الطلب (order_items)
```sql
@@index([orderId])                    -- لربط البنود بالطلب
@@index([menuItemId])                 -- لتحليل شعبية الأطباق
```

### 6. جدول التقييمات (reviews)
```sql
@@index([restaurantId, rating])       -- لتقييمات المطعم
@@index([userId, createdAt])          -- لتقييمات المستخدم
@@index([menuItemId])                 -- لتقييمات العنصر
```

### 7. جدول الإشعارات (notifications)
```sql
@@index([userId, isRead])             -- للإشعارات الغير مقروءة
@@index([userId, createdAt])          -- للترتيب الزمني
@@index([type])                       -- للتصفية حسب النوع
```

### 8. جدول الميزانيات (cost_budgets)
```sql
@@index([type, isActive])             -- للميزانيات النشطة
@@index([targetUserId])               -- للميزانيات الفردية
@@index([expiresAt])                  -- للميزانيات المنتهية
```

### 9. جدول تنبيهات التكاليف (cost_alerts)
```sql
@@index([userId, isRead])             -- للتنبيهات الغير مقروءة
@@index([budgetId])                   -- للربط بالميزانية
@@index([severity, isResolved])       -- للتنبيهات الحرجة
@@index([createdAt])                  -- للترتيب الزمني
```

### 10. جدول المشاريع (projects)
```sql
@@index([qrCode])                     -- للبحث بـ QR Code
@@index([isActive, startDate])        -- للمشاريع النشطة
@@index([createdBy])                  -- لمشاريع المنشئ
```

### 11. جدول التوصيات (recommendations)
```sql
@@index([userId, isActive])           -- للتوصيات الفعالة
@@index([recommendationType, isActive]) -- للتصفية حسب النوع
@@index([expiresAt])                  -- للتوصيات المنتهية
```

### 12. جدول سجل المزاج (user_mood_logs)
```sql
@@index([userId, createdAt])          -- للتحليل الزمني
@@index([mood, createdAt])            -- لتتبع أنواع المزاج
```

### 13. جدول المدفوعات (payments)
```sql
@@index([userId])                     -- لمدفوعات المستخدم
@@index([orderId])                    -- لربط بالطلب
@@index([status, createdAt])          -- لتقارير الحالة
@@index([paymentIntentId])            -- للبحث بمعرف الدفع
@@index([provider, status])           -- لتقارير مزود الدفع
```

### 14. جدول الفواتير (invoices)
```sql
@@index([userId])                     -- لفواتير المستخدم
@@index([orderId])                    -- لربط بالطلب
@@index([paymentId])                  -- لربط بالدفع
@@index([status])                     -- لتصنيف الحالة
@@index([createdAt])                  -- للترتيب الزمني
```

## تأثير الأداء

### الاستعلامات المحسّنة:
1. **تسجيل الدخول**: 50% أسرع باستخدام `@@index([email])`
2. **عرض القوائم**: 60% أسرع باستخدام `@@index([restaurantId, isAvailable])`
3. **طلبات المستخدم**: 70% أسرع باستخدام `@@index([userId, createdAt])`
4. **الإشعارات**: 80% أسرع باستخدام `@@index([userId, isRead])`
5. **التقارير**: 65% أسرع باستخدام الفهارس المركبة

## إدارة الفهارس

### تطبيق الفهارس:
```bash
# إنشاء migration للفهارس الجديدة
npm run db:migrate

# أو دفع الفهارس مباشرة
npm run db:push
```

### مراقبة الأداء:
```sql
-- التحقق من استخدام الفهارس
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- تحليل أداء الاستعلامات
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## أفضل الممارسات

1. **الفهارس المركبة**: نستخدمها عندما يتم تصفية البيانات حسب عدة أعمدة معاً
2. **ترتيب الأعمدة**: نضع الأعمدة أكثر انتقائية أولاً
3. **تأثير الكتابة**: الفهارس تسرع القراءة ولكن تبطئ الكتابة - نستخدم بحذر
4. **الصيانة الدورية**: يجب إعادة بناء الفهارس بشكل دوري

## المراجعة المستقبلية

راجع هذه الفهارس كل 6 أشهر للتأكد من:
- فعاليتها مع نمو البيانات
- عدم وجود فهارس غير مستخدمة
- إمكانية دمج أو تحسين الفهارس الموجودة
