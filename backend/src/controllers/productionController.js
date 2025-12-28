const productionService = require('../services/productionService');

/**
 * Production Controller
 * Handles routes for Producer Dashboard
 */
class ProductionController {

    // GET /api/production/project/:projectId/schedule
    async getSchedule(req, res) {
        try {
            const { projectId } = req.params;
            const schedule = await productionService.getSchedule(projectId);
            res.json({ success: true, data: schedule });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
        }
    }

    // POST /api/production/project/:projectId/sync
    async syncSchedule(req, res) {
        try {
            const { projectId } = req.params;
            const scheduleData = req.body;
            const schedule = await productionService.syncSchedule(projectId, scheduleData);
            res.json({ success: true, data: schedule });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to sync schedule' });
        }
    }

    // GET /api/production/day/:dayId/attendance
    async getAttendance(req, res) {
        try {
            const { dayId } = req.params;
            const attendance = await productionService.getDayAttendance(dayId);
            res.json({ success: true, data: attendance });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
        }
    }

    // POST /api/production/attendance/update
    async updateAttendance(req, res) {
        try {
            const { shootingDayId, userId, status, location } = req.body;
            const record = await productionService.updateAttendance(shootingDayId, userId, status, location);
            res.json({ success: true, data: record, message: 'Attendance updated' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to update attendance' });
        }
    }

    // GET /api/production/project/:projectId/budget
    async getBudgetStats(req, res) {
        try {
            const { projectId } = req.params;
            const stats = await productionService.getBudgetStats(projectId);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to fetch budget stats' });
        }
    }
}

module.exports = new ProductionController();
