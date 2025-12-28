const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validationZod');
const { z } = require('zod');
const emergencyService = require('../services/emergencyService');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Validation Schemas
const createEmergencyOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  emergencyType: z.enum(['NATURAL_DISASTER', 'MEDICAL_EMERGENCY', 'SECURITY_EMERGENCY', 'SYSTEM_FAILURE', 'CUSTOM']),
  emergencyReason: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive()
  })),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  fastTrackDelivery: z.boolean().optional().default(true)
});

const updateEmergencyOrderSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED']).optional(),
  priorityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  estimatedTime: z.number().int().positive().optional(),
  isResolved: z.boolean().optional()
});

const emergencyRestaurantSchema = z.object({
  restaurantId: z.string().uuid(),
  isEmergencyReady: z.boolean().optional().default(true),
  emergencyLevel: z.enum(['STANDARD', 'PRIORITY', 'CRITICAL', 'DISASTER']).optional().default('STANDARD'),
  maxEmergencyOrders: z.number().int().positive().optional().default(10),
  avgPreparationTime: z.number().int().positive().optional().default(15),
  emergencyHoursStart: z.string().optional(),
  emergencyHoursEnd: z.string().optional(),
  is24HourAvailable: z.boolean().optional().default(false),
  emergencyPhone: z.string().optional(),
  emergencyEmail: z.string().email().optional(),
  servicesAvailable: z.array(z.string()).optional(),
  paymentMethods: z.array(z.string()).optional()
});

const prePreparedMealSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  expirationDate: z.string().datetime(),
  cost: z.number().positive(),
  emergencyPrice: z.number().positive(),
  nutritionalInfo: z.object({}).optional(),
  allergens: z.array(z.string()).optional().default([]),
  dietaryLabels: z.array(z.string()).optional().default([])
});

const emergencyProtocolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  emergencyType: z.enum(['NATURAL_DISASTER', 'MEDICAL_EMERGENCY', 'SECURITY_EMERGENCY', 'SYSTEM_FAILURE', 'CUSTOM']),
  triggerConditions: z.object({}).optional(),
  requiredActions: z.array(z.string()).optional().default([]),
  notificationSteps: z.object({}).optional(),
  escalationRules: z.object({}).optional(),
  emergencyContacts: z.array(z.string()).optional().default([])
});

// ✅ Emergency Order Routes

// إنشاء طلب طوارئ جديد
router.post('/orders', authenticateToken, validateRequest(createEmergencyOrderSchema), asyncHandler(async (req, res) => {
  const order = await emergencyService.createEmergencyOrder(req.user.id, req.body);
  res.status(201).json({
    success: true,
    data: order,
    message: 'تم إنشاء طلب الطوارئ بنجاح'
  });
}));

// الحصول على طلبات الطوارئ للمستخدم
router.get('/orders', authenticateToken, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const result = await emergencyService.getUserEmergencyOrders(req.user.id, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });
  res.json({
    success: true,
    data: result.orders,
    pagination: result.pagination
  });
}));

// الحصول على تفاصيل طلب طوارئ محدد
router.get('/orders/:id', authenticateToken, asyncHandler(async (req, res) => {
  const order = await emergencyService.getEmergencyOrderById(req.params.id, req.user.id);
  res.json({
    success: true,
    data: order
  });
}));

// تحديث طلب طوارئ
router.patch('/orders/:id', authenticateToken, validateRequest(updateEmergencyOrderSchema), asyncHandler(async (req, res) => {
  const order = await emergencyService.updateEmergencyOrder(req.params.id, req.user.id, req.body);
  res.json({
    success: true,
    data: order,
    message: 'تم تحديث طلب الطوارئ بنجاح'
  });
}));

// ✅ Emergency Restaurant Routes

// الحصول على مطاعم الطوارئ المتاحة
router.get('/restaurants', authenticateToken, asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10, emergencyLevel } = req.query;
  const restaurants = await emergencyService.getAvailableEmergencyRestaurants({
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    radius: parseInt(radius),
    emergencyLevel
  });
  res.json({
    success: true,
    data: restaurants
  });
}));

// تسجيل مطعم في نظام الطوارئ
router.post('/restaurants', authenticateToken, validateRequest(emergencyRestaurantSchema), asyncHandler(async (req, res) => {
  const restaurant = await emergencyService.registerEmergencyRestaurant(req.body);
  res.status(201).json({
    success: true,
    data: restaurant,
    message: 'تم تسجيل المطعم في نظام الطوارئ بنجاح'
  });
}));

// تحديث معلومات مطعم الطوارئ
router.patch('/restaurants/:id', authenticateToken, asyncHandler(async (req, res) => {
  const restaurant = await emergencyService.updateEmergencyRestaurant(req.params.id, req.body);
  res.json({
    success: true,
    data: restaurant,
    message: 'تم تحديث معلومات مطعم الطوارئ بنجاح'
  });
}));

// ✅ Pre-prepared Meals Routes

// الحصول على الوجبات المعدة مسبقاً
router.get('/meals/available', authenticateToken, asyncHandler(async (req, res) => {
  const { restaurantId, dietaryRestrictions, allergens } = req.query;
  const meals = await emergencyService.getAvailablePrePreparedMeals({
    restaurantId,
    dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',') : [],
    allergens: allergens ? allergens.split(',') : []
  });
  res.json({
    success: true,
    data: meals
  });
}));

// إضافة وجبة معدة مسبقاً
router.post('/meals', authenticateToken, validateRequest(prePreparedMealSchema), asyncHandler(async (req, res) => {
  const meal = await emergencyService.addPrePreparedMeal(req.body);
  res.status(201).json({
    success: true,
    data: meal,
    message: 'تم إضافة الوجبة المعدة مسبقاً بنجاح'
  });
}));

// حجز وجبة معدة مسبقاً
router.post('/meals/:id/reserve', authenticateToken, asyncHandler(async (req, res) => {
  const meal = await emergencyService.reservePrePreparedMeal(req.params.id, req.user.id);
  res.json({
    success: true,
    data: meal,
    message: 'تم حجز الوجبة بنجاح'
  });
}));

// ✅ Emergency Protocol Routes

// الحصول على بروتوكولات الطوارئ
router.get('/protocols', authenticateToken, asyncHandler(async (req, res) => {
  const { emergencyType, isActive } = req.query;
  const protocols = await emergencyService.getEmergencyProtocols({
    emergencyType,
    isActive: isActive !== undefined ? isActive === 'true' : undefined
  });
  res.json({
    success: true,
    data: protocols
  });
}));

// إنشاء بروتوكول طوارئ جديد
router.post('/protocols', authenticateToken, validateRequest(emergencyProtocolSchema), asyncHandler(async (req, res) => {
  const protocol = await emergencyService.createEmergencyProtocol(req.body);
  res.status(201).json({
    success: true,
    data: protocol,
    message: 'تم إنشاء بروتوكول الطوارئ بنجاح'
  });
}));

// تفعيل بروتوكول طوارئ
router.post('/protocols/:id/activate', authenticateToken, asyncHandler(async (req, res) => {
  const result = await emergencyService.activateEmergencyProtocol(req.params.id);
  res.json({
    success: true,
    data: result,
    message: 'تم تفعيل بروتوكول الطوارئ بنجاح'
  });
}));

// ✅ Emergency Notifications

// إرسال إشعار طوارئ
router.post('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const { type, title, message, targetUsers, targetRestaurants } = req.body;
  const result = await emergencyService.sendEmergencyNotification({
    type,
    title,
    message,
    targetUsers,
    targetRestaurants,
    senderId: req.user.id
  });
  res.json({
    success: true,
    data: result,
    message: 'تم إرسال إشعار الطوارئ بنجاح'
  });
}));

// الحصول على إشعارات الطوارئ
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const { isRead, page = 1, limit = 10 } = req.query;
  const result = await emergencyService.getEmergencyNotifications(req.user.id, {
    isRead: isRead !== undefined ? isRead === 'true' : undefined,
    page: parseInt(page),
    limit: parseInt(limit)
  });
  res.json({
    success: true,
    data: result.notifications,
    pagination: result.pagination
  });
}));

// ✅ Emergency Statistics

// الحصول على إحصائيات الطوارئ
router.get('/statistics', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate, emergencyType } = req.query;
  const stats = await emergencyService.getEmergencyStatistics({
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    emergencyType
  });
  res.json({
    success: true,
    data: stats
  });
}));

// ✅ Emergency Schedule Changes

// إشعار بتغيير الجدول
router.post('/schedule-changes', authenticateToken, asyncHandler(async (req, res) => {
  const { restaurantId, changeType, effectiveDate, reason, affectedOrders } = req.body;
  const result = await emergencyService.notifyScheduleChange({
    restaurantId,
    changeType,
    effectiveDate: new Date(effectiveDate),
    reason,
    affectedOrders,
    notifiedBy: req.user.id
  });
  res.json({
    success: true,
    data: result,
    message: 'تم إرسال إشعار تغيير الجدول بنجاح'
  });
}));

module.exports = router;