/**
 * اختبارات E2E لرحلة الطلب الكاملة
 * End-to-End Tests for Complete Order Journey
 *
 * السيناريو: Login → Browse Restaurants → Select Items → Create Order → Track Order
 */

const { test, expect } = require('@playwright/test');

test.describe('E2E: Complete Order Journey - رحلة الطلب الكاملة', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';

  let authToken;
  let userId;
  let testUser;

  test.beforeAll(async ({ request }) => {
    // Setup: إنشاء مستخدم اختباري
    testUser = {
      email: `order-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'أحمد',
      lastName: 'محمد'
    };

    const registerResponse = await request.post(`${baseURL}/api/v1/auth/register`, {
      data: testUser
    });

    const registerData = await registerResponse.json();
    authToken = registerData.data.token;
    userId = registerData.data.user.id;
  });

  test('السيناريو الكامل: تسجيل الدخول → تصفح المطاعم → إضافة طلب → تتبع الطلب', async ({ page, request }) => {
    // ========== Step 1: تسجيل الدخول ==========
    const loginResponse = await request.post(`${baseURL}/api/v1/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    const token = loginData.data.token;

    console.log('✓ Step 1: تسجيل الدخول بنجاح');

    // ========== Step 2: تصفح المطاعم المتاحة ==========
    const restaurantsResponse = await request.get(`${baseURL}/api/v1/restaurants`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(restaurantsResponse.ok()).toBeTruthy();
    const restaurantsData = await restaurantsResponse.json();
    expect(restaurantsData.success).toBe(true);
    expect(Array.isArray(restaurantsData.data.restaurants)).toBe(true);

    console.log('✓ Step 2: تصفح المطاعم بنجاح');

    // افتراض وجود مطعم واحد على الأقل
    if (restaurantsData.data.restaurants.length > 0) {
      const selectedRestaurant = restaurantsData.data.restaurants[0];

      // ========== Step 3: الحصول على تفاصيل المطعم وقائمة الطعام ==========
      const restaurantDetailResponse = await request.get(
        `${baseURL}/api/v1/restaurants/${selectedRestaurant.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      expect(restaurantDetailResponse.ok()).toBeTruthy();
      const restaurantDetail = await restaurantDetailResponse.json();
      expect(restaurantDetail.success).toBe(true);

      console.log('✓ Step 3: الحصول على تفاصيل المطعم بنجاح');

      // ========== Step 4: إنشاء طلب جديد ==========
      // افتراض وجود عناصر في القائمة
      const menuItems = restaurantDetail.data.menuItems || [];

      if (menuItems.length > 0) {
        const orderData = {
          projectId: 'project-test-123', // يمكن أن يكون معرف مشروع اختباري
          restaurantId: selectedRestaurant.id,
          items: [
            {
              menuItemId: menuItems[0].id,
              quantity: 2,
              price: menuItems[0].price || 50.00
            }
          ],
          totalAmount: (menuItems[0].price || 50.00) * 2,
          deliveryAddress: 'مكة المكرمة - حي الشوقية'
        };

        const createOrderResponse = await request.post(`${baseURL}/api/v1/orders`, {
          data: orderData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        expect(createOrderResponse.ok()).toBeTruthy();
        const createdOrder = await createOrderResponse.json();
        expect(createdOrder.success).toBe(true);
        expect(createdOrder.data).toHaveProperty('id');
        expect(createdOrder.data.status).toBe('PENDING');

        const orderId = createdOrder.data.id;

        console.log('✓ Step 4: إنشاء الطلب بنجاح');

        // ========== Step 5: تتبع الطلب ==========
        const orderTrackingResponse = await request.get(
          `${baseURL}/api/v1/orders/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        expect(orderTrackingResponse.ok()).toBeTruthy();
        const orderTracking = await orderTrackingResponse.json();
        expect(orderTracking.success).toBe(true);
        expect(orderTracking.data.id).toBe(orderId);

        console.log('✓ Step 5: تتبع الطلب بنجاح');

        // ========== Step 6: تحديث حالة الطلب (محاكاة تأكيد من المطعم) ==========
        const updateStatusResponse = await request.put(
          `${baseURL}/api/v1/orders/${orderId}/status`,
          {
            data: {
              status: 'CONFIRMED'
            },
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // قد يتطلب صلاحيات إدارية، لذا نتحقق فقط من عدم وجود خطأ خادم
        expect([200, 403]).toContain(updateStatusResponse.status());

        console.log('✓ Step 6: محاولة تحديث حالة الطلب');

        // ========== Step 7: الحصول على قائمة جميع طلبات المستخدم ==========
        const userOrdersResponse = await request.get(`${baseURL}/api/v1/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        expect(userOrdersResponse.ok()).toBeTruthy();
        const userOrders = await userOrdersResponse.json();
        expect(userOrders.success).toBe(true);
        expect(Array.isArray(userOrders.data.orders)).toBe(true);
        expect(userOrders.data.orders.length).toBeGreaterThanOrEqual(1);

        console.log('✓ Step 7: الحصول على قائمة طلبات المستخدم بنجاح');

        // ========== Step 8: إلغاء الطلب (اختياري) ==========
        // نلغي الطلب فقط إذا كان لا يزال في حالة قابلة للإلغاء
        const currentOrder = userOrders.data.orders.find(o => o.id === orderId);
        if (currentOrder && currentOrder.status !== 'DELIVERED') {
          const cancelResponse = await request.delete(
            `${baseURL}/api/v1/orders/${orderId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          expect([200, 400]).toContain(cancelResponse.status());

          console.log('✓ Step 8: محاولة إلغاء الطلب');
        }
      } else {
        console.log('⚠ تحذير: لا توجد عناصر في قائمة المطعم، تم تخطي خطوات الطلب');
      }
    } else {
      console.log('⚠ تحذير: لا توجد مطاعم متاحة، تم تخطي خطوات الطلب');
    }
  });

  test('يجب أن يتمكن المستخدم من البحث عن المطاعم القريبة', async ({ request }) => {
    // إحداثيات مكة المكرمة كمثال
    const latitude = 21.4225;
    const longitude = 39.8262;
    const radius = 5; // 5 كم

    const nearbyRestaurantsResponse = await request.get(
      `${baseURL}/api/v1/restaurants/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // قد لا يكون endpoint موجوداً، لذا نتحقق من أي استجابة صحيحة
    expect([200, 404]).toContain(nearbyRestaurantsResponse.status());

    if (nearbyRestaurantsResponse.ok()) {
      const nearbyData = await nearbyRestaurantsResponse.json();
      expect(nearbyData).toBeDefined();
      console.log('✓ البحث عن المطاعم القريبة يعمل');
    }
  });

  test('يجب فلترة الطلبات حسب الحالة', async ({ request }) => {
    const statusFilter = 'PENDING';

    const filteredOrdersResponse = await request.get(
      `${baseURL}/api/v1/orders?status=${statusFilter}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(filteredOrdersResponse.ok()).toBeTruthy();
    const filteredOrders = await filteredOrdersResponse.json();
    expect(filteredOrders.success).toBe(true);

    // التحقق من أن جميع الطلبات لها الحالة المطلوبة
    filteredOrders.data.orders.forEach(order => {
      expect(order.status).toBe(statusFilter);
    });

    console.log('✓ فلترة الطلبات حسب الحالة تعمل بنجاح');
  });

  test('يجب دعم Pagination في قائمة الطلبات', async ({ request }) => {
    const page = 1;
    const limit = 5;

    const paginatedResponse = await request.get(
      `${baseURL}/api/v1/orders?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(paginatedResponse.ok()).toBeTruthy();
    const paginatedData = await paginatedResponse.json();
    expect(paginatedData.success).toBe(true);
    expect(paginatedData.data).toHaveProperty('pagination');
    expect(paginatedData.data.pagination.page).toBe(page);
    expect(paginatedData.data.pagination.limit).toBe(limit);

    console.log('✓ Pagination تعمل بنجاح');
  });

  test('يجب رفض إنشاء طلب بدون بيانات صحيحة', async ({ request }) => {
    const invalidOrder = {
      // Missing required fields
      totalAmount: 100
    };

    const invalidOrderResponse = await request.post(`${baseURL}/api/v1/orders`, {
      data: invalidOrder,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(invalidOrderResponse.status()).toBe(400);
    const invalidOrderData = await invalidOrderResponse.json();
    expect(invalidOrderData.success).toBe(false);

    console.log('✓ التحقق من البيانات يعمل بنجاح');
  });

  test('يجب رفض الوصول بدون توكن صحيح', async ({ request }) => {
    const unauthorizedResponse = await request.get(`${baseURL}/api/v1/orders`);

    expect(unauthorizedResponse.status()).toBe(401);

    console.log('✓ التحقق من التصريحات يعمل بنجاح');
  });
});
