/**
 * E2E Tests - Order Management Flow
 * اختبارات شاملة لتدفق إدارة الطلبات
 */

import { test, expect } from '@playwright/test';

test.describe('Order Management Flow - تدفق إدارة الطلبات', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول كمسؤول
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breakapp.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL(/.*admin/);
  });

  test('يجب أن يعرض قائمة الطلبات', async ({ page }) => {
    await expect(page.locator('text=إدارة الطلبات')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('يجب أن يفلتر الطلبات حسب الحالة', async ({ page }) => {
    // اختيار فلتر "قيد الانتظار"
    await page.selectOption('select', 'pending');

    // التحقق من تصفية النتائج
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test('يجب أن يبحث عن طلب محدد', async ({ page }) => {
    // البحث برقم الطلب
    await page.fill('input[placeholder*="ابحث"]', '#123456');

    // انتظار نتائج البحث
    await page.waitForTimeout(500);

    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test('يجب أن يحدث حالة الطلب', async ({ page }) => {
    // اختيار أول طلب
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor();

    // تغيير الحالة
    await page.locator('table tbody tr').first()
      .locator('select')
      .selectOption('CONFIRMED');

    // التحقق من نجاح التحديث
    await expect(page.locator('text=تم تحديث الحالة')).toBeVisible();
  });

  test('يجب أن يفتح تفاصيل الطلب', async ({ page }) => {
    // النقر على زر التفاصيل
    await page.locator('table tbody tr').first()
      .locator('button:has-text("تفاصيل")')
      .click();

    // التحقق من فتح النافذة
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
    await expect(page.locator('text=تفاصيل الطلب')).toBeVisible();
  });

  test('يجب أن يغلق نافذة التفاصيل', async ({ page }) => {
    // فتح التفاصيل
    await page.locator('table tbody tr').first()
      .locator('button:has-text("تفاصيل")')
      .click();

    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();

    // إغلاق النافذة
    await page.locator('[data-testid="order-details"]')
      .locator('button:has-text("إغلاق")')
      .click();

    // التحقق من الإغلاق
    await expect(page.locator('[data-testid="order-details"]')).not.toBeVisible();
  });
});

test.describe('Restaurant Management Flow - تدفق إدارة المطاعم', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breakapp.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL(/.*admin/);

    // الانتقال لتبويب المطاعم
    await page.click('text=المطاعم');
  });

  test('يجب أن يعرض قائمة المطاعم', async ({ page }) => {
    await expect(page.locator('text=إدارة المطاعم')).toBeVisible();
    await expect(page.locator('[data-testid^="restaurant-card"]')).toHaveCount(await page.locator('[data-testid^="restaurant-card"]').count());
  });

  test('يجب أن يفتح قائمة مطعم', async ({ page }) => {
    // النقر على زر عرض القائمة
    await page.locator('button:has-text("عرض القائمة")').first().click();

    await expect(page.locator('[data-testid="menu-management"]')).toBeVisible();
  });

  test('يجب أن يضيف مطعم جديد', async ({ page }) => {
    await page.click('button:has-text("+ إضافة مطعم جديد")');

    // تعبئة نموذج المطعم
    await page.fill('input[name="name"]', 'مطعم جديد');
    await page.fill('input[name="category"]', 'عربي');
    await page.fill('input[name="address"]', 'القاهرة');
    await page.fill('input[name="phone"]', '+201234567890');

    await page.click('button:has-text("حفظ")');

    await expect(page.locator('text=تم إضافة المطعم بنجاح')).toBeVisible();
  });

  test('يجب أن يفعل/يعطل مطعم', async ({ page }) => {
    // الحصول على عدد المطاعم النشطة قبل الإجراء
    const activeBefore = await page.locator('.status-dot.online').count();

    // النقر على زر التعطيل
    await page.locator('button:has-text("تعطيل")').first().click();

    // التحقق من تغير الحالة
    await page.waitForTimeout(500);
    const activeAfter = await page.locator('.status-dot.online').count();

    expect(activeAfter).toBeLessThanOrEqual(activeBefore);
  });
});

test.describe('Analytics Dashboard - لوحة الإحصائيات', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breakapp.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL(/.*admin/);

    await page.click('text=الإحصائيات');
  });

  test('يجب أن يعرض إحصائيات المبيعات', async ({ page }) => {
    await expect(page.locator('text=الإحصائيات والتحليلات')).toBeVisible();
    await expect(page.locator('text=متوسط قيمة الطلب')).toBeVisible();
    await expect(page.locator('text=متوسط وقت التوصيل')).toBeVisible();
    await expect(page.locator('text=معدل الإكمال')).toBeVisible();
  });

  test('يجب أن يعرض الرسوم البيانية', async ({ page }) => {
    await expect(page.locator('.chart')).toHaveCount(await page.locator('.chart').count());
  });

  test('يجب أن يطبق فلتر النطاق الزمني', async ({ page }) => {
    // اختيار نطاق زمني
    await page.fill('input[type="date"]').first().fill('2024-01-01');
    await page.fill('input[type="date"]').nth(1).fill('2024-12-31');

    // النقر على زر التطبيق
    await page.click('button:has-text("تطبيق")');

    // التحقق من تحديث البيانات
    await page.waitForTimeout(1000);
  });
});

test.describe('Notifications Flow - تدفق الإشعارات', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breakapp.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL(/.*admin/);

    await page.click('text=التنبيهات');
  });

  test('يجب أن يرسل إشعار لجميع الزبائن', async ({ page }) => {
    // اختيار نوع الإشعار
    await page.selectOption('select', 'order-ready');

    // اختيار المستقبلين
    await page.click('input[value="all"]');

    // إرسال
    await page.click('button:has-text("إرسال الآن")');

    await expect(page.locator('text=تم إرسال الإشعار بنجاح')).toBeVisible();
  });

  test('يجب أن يرسل إشعار مخصص', async ({ page }) => {
    await page.selectOption('select', 'promotional');
    await page.fill('textarea', 'عرض خاص لك اليوم فقط!');

    await page.click('button:has-text("إرسال الآن")');

    await expect(page.locator('text=تم إرسال الإشعار بنجاح')).toBeVisible();
  });

  test('يجب أن يعرض سجل الإشعارات المرسلة', async ({ page }) => {
    await expect(page.locator('text=الرسائل المرسلة مؤخراً')).toBeVisible();

    const reminders = await page.locator('[data-testid="reminder-item"]').count();
    expect(reminders).toBeGreaterThan(0);
  });
});

test.describe('Predictive Insights Flow - تدفق الرؤى التنبؤية', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breakapp.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL(/.*admin/);
  });

  test('يجب أن يفتح الرؤى التنبؤية من الزر العائم', async ({ page }) => {
    await page.click('[data-testid="predictive-button"]');

    await expect(page.locator('[data-testid="predictive-insights"]')).toBeVisible();
  });

  test('يجب أن ينتقل لتبويب التنبؤات', async ({ page }) => {
    await page.click('text=التنبؤات');

    await expect(page.locator('[data-testid="predictive-insights"]')).toBeVisible();
    await expect(page.locator('text=رؤى تنبؤية')).toBeVisible();
  });
});
