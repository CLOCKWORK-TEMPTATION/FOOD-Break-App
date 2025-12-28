/**
 * اختبارات E2E لسيناريوهات المصادقة
 * End-to-End Tests for Authentication User Journeys
 *
 * السيناريوهات المغطاة:
 * - تسجيل مستخدم جديد وتسجيل الدخول
 * - تسجيل الدخول بمستخدم موجود
 * - تحديث الملف الشخصي
 * - تغيير كلمة المرور
 * - تسجيل الخروج
 */

const { test, expect } = require('@playwright/test');

test.describe('E2E: Authentication User Journey - رحلة المستخدم للمصادقة', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'أحمد',
    lastName: 'محمد',
    phoneNumber: '+966501234567'
  };

  test.describe('تسجيل مستخدم جديد ورحلة كاملة', () => {
    test('يجب أن يتمكن المستخدم من التسجيل وتسجيل الدخول والتحديث والخروج', async ({ page }) => {
      // Step 1: التسجيل (Register)
      const registerResponse = await page.request.post(`${baseURL}/api/v1/auth/register`, {
        data: testUser
      });

      expect(registerResponse.ok()).toBeTruthy();
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      expect(registerData.data).toHaveProperty('token');
      expect(registerData.data).toHaveProperty('user');
      expect(registerData.data.user.email).toBe(testUser.email);

      const token = registerData.data.token;

      // Step 2: الحصول على بيانات المستخدم الحالي (Get Current User)
      const meResponse = await page.request.get(`${baseURL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(meResponse.ok()).toBeTruthy();
      const meData = await meResponse.json();
      expect(meData.success).toBe(true);
      expect(meData.data.email).toBe(testUser.email);

      // Step 3: تحديث الملف الشخصي (Update Profile)
      const updatedProfile = {
        firstName: 'أحمد المحدث',
        lastName: 'محمد المحدث'
      };

      const updateResponse = await page.request.put(`${baseURL}/api/v1/auth/profile`, {
        data: updatedProfile,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updateData = await updateResponse.json();
      expect(updateData.success).toBe(true);
      expect(updateData.data.firstName).toBe(updatedProfile.firstName);

      // Step 4: تسجيل الخروج (Logout)
      const logoutResponse = await page.request.post(`${baseURL}/api/v1/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(logoutResponse.ok()).toBeTruthy();

      // Step 5: تسجيل الدخول مرة أخرى (Login Again)
      const loginResponse = await page.request.post(`${baseURL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });

      expect(loginResponse.ok()).toBeTruthy();
      const loginData = await loginResponse.json();
      expect(loginData.success).toBe(true);
      expect(loginData.data).toHaveProperty('token');
    });

    test('يجب رفض تسجيل الدخول ببيانات خاطئة', async ({ page }) => {
      const loginResponse = await page.request.post(`${baseURL}/api/v1/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrong_password'
        }
      });

      expect(loginResponse.status()).toBe(401);
      const loginData = await loginResponse.json();
      expect(loginData.success).toBe(false);
    });

    test('يجب رفض التسجيل ببريد إلكتروني مكرر', async ({ page }) => {
      // First registration
      await page.request.post(`${baseURL}/api/v1/auth/register`, {
        data: testUser
      });

      // Try to register again with same email
      const duplicateResponse = await page.request.post(`${baseURL}/api/v1/auth/register`, {
        data: testUser
      });

      expect(duplicateResponse.status()).toBe(400);
      const duplicateData = await duplicateResponse.json();
      expect(duplicateData.success).toBe(false);
    });
  });

  test.describe('تغيير كلمة المرور', () => {
    test('يجب تغيير كلمة المرور بنجاح', async ({ page }) => {
      // Step 1: Register
      const registerResponse = await page.request.post(`${baseURL}/api/v1/auth/register`, {
        data: {
          ...testUser,
          email: `password-test-${Date.now()}@example.com`
        }
      });

      const registerData = await registerResponse.json();
      const token = registerData.data.token;

      // Step 2: Change Password
      const newPassword = 'NewPassword456!';
      const changePasswordResponse = await page.request.post(`${baseURL}/api/v1/auth/change-password`, {
        data: {
          currentPassword: testUser.password,
          newPassword: newPassword
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(changePasswordResponse.ok()).toBeTruthy();

      // Step 3: Logout
      await page.request.post(`${baseURL}/api/v1/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Step 4: Login with new password
      const loginResponse = await page.request.post(`${baseURL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: newPassword
        }
      });

      expect(loginResponse.ok()).toBeTruthy();
    });

    test('يجب رفض تغيير كلمة المرور مع كلمة مرور حالية خاطئة', async ({ page }) => {
      // Register
      const registerResponse = await page.request.post(`${baseURL}/api/v1/auth/register`, {
        data: {
          ...testUser,
          email: `wrong-password-test-${Date.now()}@example.com`
        }
      });

      const registerData = await registerResponse.json();
      const token = registerData.data.token;

      // Try to change with wrong current password
      const changePasswordResponse = await page.request.post(`${baseURL}/api/v1/auth/change-password`, {
        data: {
          currentPassword: 'wrong_current_password',
          newPassword: 'NewPassword789!'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(changePasswordResponse.status()).toBe(400);
    });
  });

  test.describe('Authorization - التصريحات', () => {
    test('يجب رفض الوصول بدون توكن', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/api/v1/auth/me`);

      expect(response.status()).toBe(401);
    });

    test('يجب رفض الوصول بتوكن غير صالح', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/api/v1/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });

      expect(response.status()).toBe(401);
    });
  });
});
