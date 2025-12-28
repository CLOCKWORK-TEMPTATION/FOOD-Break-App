const exceptionController = require('../../../src/controllers/exceptionController');
const exceptionService = require('../../../src/services/exceptionService');

jest.mock('../../../src/services/exceptionService');

describe('Exception Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 'user-123', role: 'REGULAR' }, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkEligibility', () => {
    it('should check exception eligibility', async () => {
      req.query = { exceptionType: 'FULL' };
      exceptionService.checkExceptionEligibility.mockResolvedValue({ eligible: true, remaining: 1 });

      await exceptionController.checkEligibility(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { eligible: true, remaining: 1 }
      });
    });

    it('should reject without exception type', async () => {
      req.query = {};

      await exceptionController.checkEligibility(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('calculateCost', () => {
    it('should calculate exception cost', async () => {
      req.body = { exceptionType: 'FULL', orderTotal: 100 };
      exceptionService.calculateExceptionCost.mockReturnValue({ total: 100, userPays: 0 });

      await exceptionController.calculateCost(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { total: 100, userPays: 0 }
      });
    });

    it('should reject without required fields', async () => {
      req.body = {};

      await exceptionController.calculateCost(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('generateFinancialReport', () => {
    it('should generate financial report', async () => {
      req.body = { startDate: '2024-01-01', endDate: '2024-01-31' };
      exceptionService.generateFinancialReport.mockResolvedValue({ totalCost: 5000 });

      await exceptionController.generateFinancialReport(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { totalCost: 5000 }
      });
    });
  });
});
