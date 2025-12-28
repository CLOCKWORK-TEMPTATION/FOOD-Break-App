/**
 * Admin Routes - مسارات لوحة التحكم الإدارية
 * تتطلب صلاحيات ADMIN أو PRODUCER
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة وصلاحيات إدارية
router.use(authenticateToken);
router.use(requireAdminOrProducer);

// ============================================
// إحصائيات لوحة التحكم
// ============================================

// GET /admin/stats - جلب الإحصائيات العامة
router.get('/stats', adminController.getDashboardStats);

// GET /admin/reports/performance - تقارير الأداء
router.get('/reports/performance', adminController.getDashboardStats);

// ============================================
// إدارة الطلبات
// ============================================

// GET /admin/orders/pending - الطلبات المعلقة
router.get('/orders/pending', adminController.getPendingOrders);

// GET /admin/orders - جميع الطلبات
router.get('/orders', adminController.getAdminOrders);

// GET /admin/orders/:orderId - طلب محدد
router.get('/orders/:orderId', adminController.getOrderById);

// PATCH /admin/orders/:orderId/status - تحديث حالة الطلب
router.patch('/orders/:orderId/status', adminController.updateOrderStatus);

// POST /admin/orders/:orderId/cancel - إلغاء طلب
router.post('/orders/:orderId/cancel', adminController.updateOrderStatus);

// ============================================
// إدارة المطاعم
// ============================================

// GET /admin/restaurants - جميع المطاعم
router.get('/restaurants', adminController.getRestaurants);

// GET /admin/restaurants/:restaurantId - مطعم محدد
router.get('/restaurants/:restaurantId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.restaurantId },
      include: { menuItems: true }
    });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'المطعم غير موجود' }
      });
    }
    
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
});

// POST /admin/restaurants - إنشاء مطعم جديد
router.post('/restaurants', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const restaurant = await prisma.restaurant.create({
      data: req.body
    });
    
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: error.message }
    });
  }
});

// PUT /admin/restaurants/:restaurantId - تحديث مطعم
router.put('/restaurants/:restaurantId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.restaurantId },
      data: req.body
    });
    
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
});

// PATCH /admin/restaurants/:restaurantId/toggle-status - تبديل حالة المطعم
router.patch('/restaurants/:restaurantId/toggle-status', adminController.toggleRestaurantStatus);

// DELETE /admin/restaurants/:restaurantId - حذف مطعم
router.delete('/restaurants/:restaurantId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.restaurant.delete({
      where: { id: req.params.restaurantId }
    });
    
    res.json({ success: true, message: 'تم حذف المطعم' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
});

// GET /admin/restaurants/:restaurantId/stats - إحصائيات مطعم
router.get('/restaurants/:restaurantId/stats', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { restaurantId } = req.params;
    
    const [totalOrders, completedOrders, orders] = await Promise.all([
      prisma.order.count({ where: { restaurantId } }),
      prisma.order.count({ where: { restaurantId, status: 'DELIVERED' } }),
      prisma.order.findMany({
        where: { restaurantId, status: 'DELIVERED' },
        select: { totalAmount: true }
      })
    ]);
    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        totalRevenue,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FAILED', message: error.message }
    });
  }
});

// ============================================
// إدارة القوائم
// ============================================

// GET /admin/restaurants/:restaurantId/menu - قائمة مطعم
router.get('/restaurants/:restaurantId/menu', adminController.getRestaurantMenu);

// POST /admin/restaurants/:restaurantId/menu - إضافة عنصر للقائمة
router.post('/restaurants/:restaurantId/menu', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const menuItem = await prisma.menuItem.create({
      data: {
        ...req.body,
        restaurantId: req.params.restaurantId
      }
    });
    
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: error.message }
    });
  }
});

// PUT /admin/menu/:menuItemId - تحديث عنصر القائمة
router.put('/menu/:menuItemId', adminController.updateMenuItem);

// DELETE /admin/menu/:menuItemId - حذف عنصر من القائمة
router.delete('/menu/:menuItemId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.menuItem.delete({
      where: { id: req.params.menuItemId }
    });
    
    res.json({ success: true, message: 'تم حذف العنصر' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
});

// PATCH /admin/menu/:menuItemId/toggle-availability - تبديل توفر العنصر
router.patch('/menu/:menuItemId/toggle-availability', adminController.toggleMenuItemAvailability);

// POST /admin/menu/bulk-update-prices - تحديث أسعار متعددة
router.post('/menu/bulk-update-prices', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { updates } = req.body;
    
    await Promise.all(
      updates.map(({ id, price }) =>
        prisma.menuItem.update({
          where: { id },
          data: { price }
        })
      )
    );
    
    res.json({ success: true, message: 'تم تحديث الأسعار' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'BULK_UPDATE_FAILED', message: error.message }
    });
  }
});

// ============================================
// الإشعارات
// ============================================

// POST /admin/notifications/send - إرسال إشعار
router.post('/notifications/send', adminController.sendNotification);

// GET /admin/notifications/history - سجل الإشعارات
router.get('/notifications/history', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
});

module.exports = router;
