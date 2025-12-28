const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');

// Schedule Routes
router.get('/project/:projectId/schedule', productionController.getSchedule);
router.post('/project/:projectId/sync', productionController.syncSchedule);

// Attendance Routes
router.get('/day/:dayId/attendance', productionController.getAttendance);
router.post('/attendance/update', productionController.updateAttendance);

// Financial Routes
router.get('/project/:projectId/budget', productionController.getBudgetStats);

module.exports = router;
