const express = require('express');
const router = express.Router();
const productionIntegrationService = require('../services/productionIntegrationService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');
const logger = require('../utils/logger');

// جميع المسارات تحتاج صلاحيات Admin/Producer
router.use(authenticateToken);
router.use(authorizeRoles(['ADMIN', 'PRODUCER']));

// مزامنة جدول التصوير
router.post('/schedule/sync', [
  body('projectId').isUUID().withMessage('Project ID required'),
  body('scheduleData').isObject().withMessage('Schedule data required')
], async (req, res) => {
  try {
    const { projectId, scheduleData } = req.body;
    const result = await productionIntegrationService.syncShootingSchedule(projectId, scheduleData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error syncing schedule:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// معالجة تغييرات الجدول
router.post('/schedule/change', [
  body('projectId').isUUID(),
  body('changeType').isIn(['DELAY', 'CANCELLATION', 'TIME_MODIFICATION']),
  body('data').isObject()
], async (req, res) => {
  try {
    const { projectId, changeType, data } = req.body;
    const result = await productionIntegrationService.handleScheduleChange(projectId, changeType, data);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error handling schedule change:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// مزامنة الحضور
router.post('/attendance/sync', [
  body('projectId').isUUID(),
  body('attendanceData').isObject()
], async (req, res) => {
  try {
    const { projectId, attendanceData } = req.body;
    const result = await productionIntegrationService.syncAttendance(projectId, attendanceData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error syncing attendance:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ربط تسجيل الدخول بالطلب
router.post('/checkin/:userId/:projectId', async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const order = await productionIntegrationService.linkCheckInToOrder(userId, projectId);
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error linking check-in:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// تقرير الحضور والوجبات المدمج
router.get('/report/combined/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const report = await productionIntegrationService.getCombinedAttendanceReport(projectId, date);
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error getting combined report:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// تحليل أنماط الغياب
router.get('/absence/patterns/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;
    const patterns = await productionIntegrationService.analyzeAbsencePatterns(projectId, parseInt(days));
    res.json({ success: true, data: patterns });
  } catch (error) {
    logger.error('Error analyzing absence patterns:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
