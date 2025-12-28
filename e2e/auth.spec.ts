/**
 * E2E Tests - Authentication Flow
 * اختبارات شاملة لتدفق المصادقة
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_CREDENTIALS = {
  email: 'admin@breakapp.com',
  password: 'admin123',
};

const USER_CREDENTIALS = {
  email: 'user@example.com',
  password: 'user123',
};

test.describe('Authentication Flow - تدفق المصادقة', () => {
  test.beforeEach(async ({ page }) => {
    // زيارة صفحة تسجيل الدخول
    await page.goto('/login');
  });

  test('يجب أن يعرض نموذج تسجيل الدخول', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('تسجيل الدخول');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("تسجيل الدخول")')).toBeVisible();
  });

  test('يجب أن يرفض تسجيل الدخول ببيانات فارغة', async ({ page }) => {
    await page.click('button:has-text("تسجيل الدخول")');

    // يجب أن يظهر رسالة خطأ
    await expect(page.locator('text=البريد الإلكتروني مطلوب')).toBeVisible();
  });

  test('يجب أن يرفض البريد الإلكتروني غير الصحيح', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("تسجيل الدخول")');

    await expect(page.locator('text=البريد الإلكتروني غير صالح')).toBeVisible();
  });

  test('يجب أن يرفض كلمة المرور القصيرة', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '12345');
    await page.click('button:has-text("تسجيل الدخول")');

    await expect(page.locator('text=كلمة المرور يجب أن تكون 6 أحرف على الأقل')).toBeVisible();
  });

  test('يجب أن يسجل دخول المسؤول بنجاح', async ({ page }) => {
    // هذا الاختبار يتطلب API mock أو اختبار على بيئة حقيقية
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("تسجيل الدخول")');

    // بعد تسجيل دخول ناجح، يجب التوجيه للوحة التحكم
    await expect(page).toHaveURL(/.*admin/);
    await expect(page.locator('text=BreakApp Admin')).toBeVisible();
  });

  test('يجب أن يعرض رسالة خطأ لبيانات خاطئة', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("تسجيل الدخول")');

    await expect(page.locator('text=فشل تسجيل الدخول')).toBeVisible();
  });

  test('يجب أن ينقل لصفحة التسجيل', async ({ page }) => {
    await page.click('text=سجل الآن');

    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1')).toContainText('إنشاء حساب');
  });
});

test.describe('Registration Flow - تدفق التسجيل', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('يجب أن يعرض نموذج التسجيل', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('إنشاء حساب');
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phoneNumber"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("إنشاء حساب")')).toBeVisible();
  });

  test('يجب أن يتحقق من صحة جميع الحقول', async ({ page }) => {
    // نموذج فارغ
    await page.click('button:has-text("إنشاء حساب")');

    await expect(page.locator('text=الاسم الأول مطلوب')).toBeVisible();
    await expect(page.locator('text=الاسم الأخير مطلوب')).toBeVisible();
    await expect(page.locator('text=البريد الإلكتروني مطلوب')).toBeVisible();
    await expect(page.locator('text=كلمة المرور مطلوبة')).toBeVisible();
  });

  test('يجب أن ينشئ حساب جديد بنجاح', async ({ page }) => {
    const timestamp = Date.now();
    const newUser = {
      firstName: 'محمد',
      lastName: 'أحمد',
      email: `test${timestamp}@example.com`,
      phoneNumber: '+201234567890',
      password: 'password123',
    };

    await page.fill('input[name="firstName"]', newUser.firstName);
    await page.fill('input[name="lastName"]', newUser.lastName);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="phoneNumber"]', newUser.phoneNumber);
    await page.fill('input[name="password"]', newUser.password);
    await page.click('button:has-text("إنشاء حساب")');

    // بعد التسجيل الناجح
    await expect(page.locator('text=تم إنشاء الحساب بنجاح')).toBeVisible();
  });

  test('يجب أن يمنع التسجيل ببريد إلكتروني موجود', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'محمد');
    await page.fill('input[name="lastName"]', 'أحمد');
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="phoneNumber"]', '+201234567890');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("إنشاء حساب")');

    await expect(page.locator('text=البريد الإلكتروني مستخدم مسبقاً')).toBeVisible();
  });
});

test.describe('Password Recovery - استعادة كلمة المرور', () => {
  test('يجب أن يعرض نموذج استعادة كلمة المرور', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('h1')).toContainText('استعادة كلمة المرور');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('يجب أن يرسل رابط الاستعادة', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', USER_CREDENTIALS.email);
    await page.click('button:has-text("إرسال")');

    await expect(page.locator('text=تم إرسال رابط الاستعادة')).toBeVisible();
  });
});

test.describe('Logout - تسجيل الخروج', () => {
  test('يجب أن يسجل الخروج بنجاح', async ({ page }) => {
    // تسجيل الدخول أولاً
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("تسجيل الدخول")');

    await expect(page).toHaveURL(/.*admin/);

    // تسجيل الخروج
    await page.click('[data-testid="user-menu"]');
    await page.click('text=تسجيل الخروج');

    await expect(page).toHaveURL(/.*login/);
  });

  test('يجب أن يمسح التوكن عند تسجيل الخروج', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("تسجيل الدخول")');

    // التحقق من وجود التوكن
    const tokenBefore = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenBefore).toBeTruthy();

    // تسجيل الخروج
    await page.click('[data-testid="user-menu"]');
    await page.click('text=تسجيل الخروج');

    // التحقق من مسح التوكن
    const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenAfter).toBeNull();
  });
});

test.describe('Session Persistence - استمرار الجلسة', () => {
  test('يجب أن يحافظ على الجلسة بعد إعادة التحميل', async ({ page }) => {
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("تسجيل الدخول")');

    await expect(page).toHaveURL(/.*admin/);

    // إعادة تحميل الصفحة
    await page.reload();

    // يجب أن يبقى مسجل الدخول
    await expect(page).toHaveURL(/.*admin/);
    await expect(page.locator('text=BreakApp Admin')).toBeVisible();
  });

  test('يجب أن يتطلب إعادة المصادقة بعد انتهاء الجلسة', async ({ page, context }) => {
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("تسجيل الدخول")');

    // مسح التوكن (محاكاة انتهاء الجلسة)
    await page.evaluate(() => localStorage.removeItem('authToken'));

    // إعادة تحميل
    await page.reload();

    // يجب التوجيه لصفحة تسجيل الدخول
    await expect(page).toHaveURL(/.*login/);
  });
});
