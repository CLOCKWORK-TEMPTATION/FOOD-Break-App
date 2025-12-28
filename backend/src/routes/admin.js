const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// جميع مسارات الأدمن تتطلب صلاحية ADMIN أو PRODUCER
router.use(authenticateToken);
router.use(authorizeRoles(['ADMIN', 'PRODUCER']));

// إحصائيات لوحة التحكم
router.get('/dashboard/stats', adminController.getDashboardStats);

// أحدث الطلبات
router.get('/dashboard/recent-orders', adminController.getRecentOrders);

module.exports = router;
