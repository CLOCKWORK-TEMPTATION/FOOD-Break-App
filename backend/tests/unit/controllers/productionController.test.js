/**
 * Production Controller Tests
 * اختبارات شاملة لمتحكم الإنتاج
 */

jest.mock('../../../src/services/productionService');

const ProductionController = require('../../../src/controllers/productionController');
const productionService = require('../../../src/services/productionService');

describe('Production Controller Tests', () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'user-123' }
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getSchedule', () => {
    it('should get schedule successfully', async () => {
      const mockSchedule = {
        projectId: 'project-123',
        days: [
          { id: 'day-1', date: '2024-01-01' },
          { id: 'day-2', date: '2024-01-02' }
        ]
      };

      req.params = { projectId: 'project-123' };
      productionService.getSchedule.mockResolvedValue(mockSchedule);

      await ProductionController.getSchedule(req, res);

      expect(productionService.getSchedule).toHaveBeenCalledWith('project-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSchedule
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Schedule fetch failed');
      req.params = { projectId: 'project-123' };
      productionService.getSchedule.mockRejectedValue(error);

      await ProductionController.getSchedule(req, res);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch schedule'
      });
    });
  });

  describe('syncSchedule', () => {
    it('should sync schedule successfully', async () => {
      const scheduleData = {
        days: [
          { date: '2024-01-01', callTime: '08:00' }
        ]
      };
      const mockSyncedSchedule = {
        id: 'schedule-123',
        ...scheduleData
      };

      req.params = { projectId: 'project-123' };
      req.body = scheduleData;
      productionService.syncSchedule.mockResolvedValue(mockSyncedSchedule);

      await ProductionController.syncSchedule(req, res);

      expect(productionService.syncSchedule).toHaveBeenCalledWith('project-123', scheduleData);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSyncedSchedule
      });
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      req.params = { projectId: 'project-123' };
      req.body = { days: [] };
      productionService.syncSchedule.mockRejectedValue(error);

      await ProductionController.syncSchedule(req, res);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to sync schedule'
      });
    });
  });

  describe('getAttendance', () => {
    it('should get attendance successfully', async () => {
      const mockAttendance = [
        { userId: 'user-1', status: 'PRESENT', location: 'Set A' },
        { userId: 'user-2', status: 'LATE', location: 'Set B' }
      ];

      req.params = { dayId: 'day-123' };
      productionService.getDayAttendance.mockResolvedValue(mockAttendance);

      await ProductionController.getAttendance(req, res);

      expect(productionService.getDayAttendance).toHaveBeenCalledWith('day-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAttendance
      });
    });

    it('should handle attendance fetch errors', async () => {
      const error = new Error('Attendance fetch failed');
      req.params = { dayId: 'day-123' };
      productionService.getDayAttendance.mockRejectedValue(error);

      await ProductionController.getAttendance(req, res);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch attendance'
      });
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance successfully', async () => {
      const attendanceData = {
        shootingDayId: 'day-123',
        userId: 'user-456',
        status: 'PRESENT',
        location: 'Set A'
      };
      const mockRecord = {
        id: 'record-123',
        ...attendanceData
      };

      req.body = attendanceData;
      productionService.updateAttendance.mockResolvedValue(mockRecord);

      await ProductionController.updateAttendance(req, res);

      expect(productionService.updateAttendance).toHaveBeenCalledWith(
        'day-123',
        'user-456',
        'PRESENT',
        'Set A'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRecord,
        message: 'Attendance updated'
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      req.body = {
        shootingDayId: 'day-123',
        userId: 'user-456',
        status: 'PRESENT'
      };
      productionService.updateAttendance.mockRejectedValue(error);

      await ProductionController.updateAttendance(req, res);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update attendance'
      });
    });
  });

  describe('getBudgetStats', () => {
    it('should get budget stats successfully', async () => {
      const mockStats = {
        totalBudget: 100000,
        spent: 45000,
        remaining: 55000,
        percentage: 45
      };

      req.params = { projectId: 'project-123' };
      productionService.getBudgetStats.mockResolvedValue(mockStats);

      await ProductionController.getBudgetStats(req, res);

      expect(productionService.getBudgetStats).toHaveBeenCalledWith('project-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle budget stats fetch errors', async () => {
      const error = new Error('Stats fetch failed');
      req.params = { projectId: 'project-123' };
      productionService.getBudgetStats.mockRejectedValue(error);

      await ProductionController.getBudgetStats(req, res);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch budget stats'
      });
    });
  });

  describe('Controller instance', () => {
    it('should be a singleton instance', () => {
      expect(ProductionController).toBeDefined();
      expect(typeof ProductionController.getSchedule).toBe('function');
      expect(typeof ProductionController.syncSchedule).toBe('function');
      expect(typeof ProductionController.getAttendance).toBe('function');
      expect(typeof ProductionController.updateAttendance).toBe('function');
      expect(typeof ProductionController.getBudgetStats).toBe('function');
    });
  });
});
