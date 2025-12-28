const productionService = require('../services/productionService');

/**
 * Production Controller - متحكم الإنتاج العربي
 * Handles routes for Producer Dashboard with Arabic localization
 */
class ProductionController {

    // GET /api/production/project/:projectId/schedule
    async getSchedule(req, res) {
        try {
            const { projectId } = req.params;
            const schedule = await productionService.getSchedule(projectId);
            res.json({ 
                success: true, 
                data: schedule,
                message: req.t('production.scheduleRetrieved')
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                error: {
                    code: 'SCHEDULE_FETCH_FAILED',
                    message: req.t('production.scheduleFetchFailed')
                }
            });
        }
    }

    // POST /api/production/project/:projectId/sync
    async syncSchedule(req, res) {
        try {
            const { projectId } = req.params;
            const scheduleData = req.body;
            const schedule = await productionService.syncSchedule(projectId, scheduleData);
            res.json({ 
                success: true, 
                data: schedule,
                message: req.t('production.scheduleSynced')
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                error: {
                    code: 'SCHEDULE_SYNC_FAILED',
                    message: req.t('production.scheduleSyncFailed')
                }
            });
        }
    }

    // GET /api/production/day/:dayId/attendance
    async getAttendance(req, res) {
        try {
            const { dayId } = req.params;
            const attendance = await productionService.getDayAttendance(dayId);
            res.json({ 
                success: true, 
                data: attendance,
                message: req.t('production.attendanceRetrieved')
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                error: {
                    code: 'ATTENDANCE_FETCH_FAILED',
                    message: req.t('production.attendanceFetchFailed')
                }
            });
        }
    }

    // POST /api/production/attendance/update
    async updateAttendance(req, res) {
        try {
            const { shootingDayId, userId, status, location } = req.body;
            const record = await productionService.updateAttendance(shootingDayId, userId, status, location);
            res.json({ 
                success: true, 
                data: record, 
                message: req.t('production.attendanceUpdated')
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                error: {
                    code: 'ATTENDANCE_UPDATE_FAILED',
                    message: req.t('production.attendanceUpdateFailed')
                }
            });
        }
    }

    // GET /api/production/project/:projectId/budget
    async getBudgetStats(req, res) {
        try {
            const { projectId } = req.params;
            const stats = await productionService.getBudgetStats(projectId);
            res.json({ 
                success: true, 
                data: stats,
                message: req.t('production.budgetStatsRetrieved')
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                error: {
                    code: 'BUDGET_STATS_FAILED',
                    message: req.t('production.budgetStatsFailed')
                }
            });
        }
    }
}

module.exports = new ProductionController();
