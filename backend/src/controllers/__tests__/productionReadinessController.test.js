/**
 * اختبارات متحكم تقارير جاهزية الإنتاج
 * Production Readiness Controller Tests
 */

const productionReadinessController = require('../../../src/controllers/productionReadinessController');
const productionReadinessService = require('../../../src/services/productionReadinessService');

// Mock the service
jest.mock('../../../src/services/productionReadinessService');

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('ProductionReadinessController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('createReport', () => {
    it('يجب أن ينشئ تقرير جديد بنجاح', async () => {
      const productionData = {
        facilityName: 'مصنع الإنتاج',
        equipment: { availabilityRate: 85 }
      };

      req.body = {
        productionData,
        reportDate: '2024-01-15'
      };

      const mockResult = {
        success: true,
        report: {
          id: 'report-123',
          facilityName: 'مصنع الإنتاج',
          overallRating: 'READY_WITH_NOTES'
        },
        analysis: {
          equipment: { rating: 4 },
          overallRating: 'READY_WITH_NOTES'
        }
      };

      productionReadinessService.createReport.mockResolvedValue(mockResult);

      await productionReadinessController.createReport(req, res);

      expect(productionReadinessService.createReport).toHaveBeenCalledWith(
        productionData,
        '2024-01-15',
        'user-123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.report,
        analysis: mockResult.analysis,
        message: 'تم إنشاء تقرير جاهزية الإنتاج بنجاح'
      });
    });

    it('يجب أن يرجع خطأ 400 إذا كانت بيانات الإنتاج مفقودة', async () => {
      req.body = {};

      await productionReadinessController.createReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_PRODUCTION_DATA',
          message: 'بيانات الإنتاج مطلوبة'
        }
      });
    });

    it('يجب أن يستخدم التاريخ الحالي إذا لم يتم تحديد تاريخ', async () => {
      req.body = {
        productionData: { equipment: { availabilityRate: 85 } }
      };

      const mockResult = {
        success: true,
        report: { id: 'report-123' },
        analysis: {}
      };

      productionReadinessService.createReport.mockResolvedValue(mockResult);

      await productionReadinessController.createReport(req, res);

      expect(productionReadinessService.createReport).toHaveBeenCalled();
      const callArgs = productionReadinessService.createReport.mock.calls[0];
      expect(callArgs[1]).toBeDefined(); // التأكد من وجود تاريخ
    });

    it('يجب أن يعالج الأخطاء بشكل صحيح', async () => {
      req.body = {
        productionData: { equipment: { availabilityRate: 85 } }
      };

      productionReadinessService.createReport.mockRejectedValue(
        new Error('Database error')
      );

      await productionReadinessController.createReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_CREATION_FAILED',
          message: 'فشل إنشاء تقرير جاهزية الإنتاج',
          details: 'Database error'
        }
      });
    });
  });

  describe('getReport', () => {
    it('يجب أن يجلب تقرير بنجاح', async () => {
      req.params = { reportId: 'report-123' };

      const mockReport = {
        id: 'report-123',
        facilityName: 'مصنع الإنتاج',
        overallRating: 'FULLY_READY'
      };

      productionReadinessService.getReport.mockResolvedValue(mockReport);

      await productionReadinessController.getReport(req, res);

      expect(productionReadinessService.getReport).toHaveBeenCalledWith('report-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport,
        message: 'تم جلب التقرير بنجاح'
      });
    });

    it('يجب أن يرجع 404 إذا لم يتم العثور على التقرير', async () => {
      req.params = { reportId: 'non-existent' };

      productionReadinessService.getReport.mockRejectedValue(
        new Error('التقرير غير موجود')
      );

      await productionReadinessController.getReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'التقرير غير موجود'
        }
      });
    });

    it('يجب أن يعالج أخطاء أخرى بشكل صحيح', async () => {
      req.params = { reportId: 'report-123' };

      productionReadinessService.getReport.mockRejectedValue(
        new Error('Database error')
      );

      await productionReadinessController.getReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_FETCH_FAILED',
          message: 'فشل جلب التقرير',
          details: 'Database error'
        }
      });
    });
  });

  describe('getReportText', () => {
    it('يجب أن يرجع نص التقرير', async () => {
      req.params = { reportId: 'report-123' };

      const mockReport = {
        id: 'report-123',
        generatedReport: '# تقرير جاهزية الإنتاج\n\nمحتوى التقرير...'
      };

      productionReadinessService.getReport.mockResolvedValue(mockReport);

      await productionReadinessController.getReportText(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/markdown; charset=utf-8'
      );
      expect(res.send).toHaveBeenCalledWith(mockReport.generatedReport);
    });

    it('يجب أن يعالج الأخطاء', async () => {
      req.params = { reportId: 'report-123' };

      productionReadinessService.getReport.mockRejectedValue(
        new Error('Error')
      );

      await productionReadinessController.getReportText(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_TEXT_FETCH_FAILED',
          message: 'فشل جلب نص التقرير'
        }
      });
    });
  });

  describe('listReports', () => {
    it('يجب أن يجلب قائمة التقارير بنجاح', async () => {
      req.query = {
        facilityName: 'مصنع',
        limit: '20',
        offset: '0'
      };

      const mockResult = {
        reports: [
          { id: '1', facilityName: 'مصنع 1' },
          { id: '2', facilityName: 'مصنع 2' }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      };

      productionReadinessService.listReports.mockResolvedValue(mockResult);

      await productionReadinessController.listReports(req, res);

      expect(productionReadinessService.listReports).toHaveBeenCalledWith({
        facilityName: 'مصنع',
        projectName: undefined,
        overallRating: undefined,
        approvalStatus: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.reports,
        pagination: {
          total: 2,
          page: 1,
          totalPages: 1,
          limit: 20
        },
        message: 'تم جلب 2 تقرير بنجاح'
      });
    });

    it('يجب أن يستخدم القيم الافتراضية للحد والإزاحة', async () => {
      req.query = {};

      const mockResult = {
        reports: [],
        total: 0,
        page: 1,
        totalPages: 0
      };

      productionReadinessService.listReports.mockResolvedValue(mockResult);

      await productionReadinessController.listReports(req, res);

      expect(productionReadinessService.listReports).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0
        })
      );
    });

    it('يجب أن يعالج الأخطاء', async () => {
      req.query = {};

      productionReadinessService.listReports.mockRejectedValue(
        new Error('Database error')
      );

      await productionReadinessController.listReports(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORTS_LIST_FAILED',
          message: 'فشل جلب قائمة التقارير',
          details: 'Database error'
        }
      });
    });
  });

  describe('updateApprovalStatus', () => {
    it('يجب أن يحدث حالة الموافقة بنجاح', async () => {
      req.params = { reportId: 'report-123' };
      req.body = { status: 'APPROVED' };

      const mockReport = {
        id: 'report-123',
        approvalStatus: 'APPROVED',
        approvedBy: 'user-123'
      };

      productionReadinessService.updateApprovalStatus.mockResolvedValue(mockReport);

      await productionReadinessController.updateApprovalStatus(req, res);

      expect(productionReadinessService.updateApprovalStatus).toHaveBeenCalledWith(
        'report-123',
        'APPROVED',
        'user-123'
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport,
        message: 'تم تحديث حالة الموافقة إلى APPROVED'
      });
    });

    it('يجب أن يرفض حالات غير صالحة', async () => {
      req.params = { reportId: 'report-123' };
      req.body = { status: 'INVALID_STATUS' };

      await productionReadinessController.updateApprovalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: expect.stringContaining('حالة غير صالحة')
        }
      });
    });

    it('يجب أن يعالج الأخطاء', async () => {
      req.params = { reportId: 'report-123' };
      req.body = { status: 'APPROVED' };

      productionReadinessService.updateApprovalStatus.mockRejectedValue(
        new Error('Update failed')
      );

      await productionReadinessController.updateApprovalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'APPROVAL_UPDATE_FAILED',
          message: 'فشل تحديث حالة الموافقة',
          details: 'Update failed'
        }
      });
    });
  });

  describe('deleteReport', () => {
    it('يجب أن يحذف تقرير بنجاح', async () => {
      req.params = { reportId: 'report-123' };

      productionReadinessService.deleteReport.mockResolvedValue({ success: true });

      await productionReadinessController.deleteReport(req, res);

      expect(productionReadinessService.deleteReport).toHaveBeenCalledWith('report-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف التقرير بنجاح'
      });
    });

    it('يجب أن يعالج الأخطاء', async () => {
      req.params = { reportId: 'report-123' };

      productionReadinessService.deleteReport.mockRejectedValue(
        new Error('Delete failed')
      );

      await productionReadinessController.deleteReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_DELETE_FAILED',
          message: 'فشل حذف التقرير',
          details: 'Delete failed'
        }
      });
    });
  });

  describe('previewReport', () => {
    it('يجب أن ينشئ معاينة بدون حفظ', async () => {
      const productionData = {
        equipment: { availabilityRate: 85 }
      };

      req.body = {
        productionData,
        reportDate: '2024-01-15'
      };

      const mockAnalysis = {
        equipment: { rating: 4 },
        humanResources: { rating: 5 },
        materials: { rating: 4 },
        qualitySafety: { rating: 5 },
        infrastructure: { rating: 4 },
        overallRating: 'READY_WITH_NOTES'
      };

      const mockReportText = '# تقرير جاهزية الإنتاج\n\nمحتوى...';

      productionReadinessService.analyzeProductionData.mockReturnValue(mockAnalysis);
      productionReadinessService.generateReportText.mockReturnValue(mockReportText);

      await productionReadinessController.previewReport(req, res);

      expect(productionReadinessService.analyzeProductionData).toHaveBeenCalledWith(
        productionData
      );
      expect(productionReadinessService.generateReportText).toHaveBeenCalledWith(
        productionData,
        '2024-01-15',
        mockAnalysis
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reportText: mockReportText,
          analysis: mockAnalysis,
          ratings: {
            equipment: 4,
            humanResources: 5,
            materials: 4,
            qualitySafety: 5,
            infrastructure: 4,
            overall: 'READY_WITH_NOTES'
          }
        },
        message: 'تم إنشاء معاينة التقرير'
      });
    });

    it('يجب أن يرجع خطأ 400 إذا كانت بيانات الإنتاج مفقودة', async () => {
      req.body = {};

      await productionReadinessController.previewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_PRODUCTION_DATA',
          message: 'بيانات الإنتاج مطلوبة'
        }
      });
    });

    it('يجب أن يعالج الأخطاء', async () => {
      req.body = {
        productionData: { equipment: { availabilityRate: 85 } }
      };

      productionReadinessService.analyzeProductionData.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      await productionReadinessController.previewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PREVIEW_FAILED',
          message: 'فشل إنشاء معاينة التقرير',
          details: 'Analysis failed'
        }
      });
    });
  });
});
