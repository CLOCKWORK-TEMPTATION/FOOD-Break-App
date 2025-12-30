/**
 * اختبارات خدمة تقارير جاهزية الإنتاج
 * Production Readiness Service Tests
 */

const productionReadinessService = require('../../../src/services/productionReadinessService');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    productionReadinessReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('ProductionReadinessService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeProductionData', () => {
    it('يجب أن يحلل بيانات الإنتاج بشكل صحيح', () => {
      const productionData = {
        equipment: {
          availabilityRate: 90,
          maintenancePending: false,
          technicalIssues: []
        },
        humanResources: {
          staffingLevel: 95,
          trainingCompleted: 85
        },
        materials: {
          stockLevel: 70,
          supplyChainIssues: false
        },
        qualitySafety: {
          qualityIssues: false,
          safetyViolations: false
        },
        infrastructure: {
          facilityCondition: 'good'
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(productionData);

      expect(analysis).toHaveProperty('equipment');
      expect(analysis).toHaveProperty('humanResources');
      expect(analysis).toHaveProperty('materials');
      expect(analysis).toHaveProperty('qualitySafety');
      expect(analysis).toHaveProperty('infrastructure');
      expect(analysis).toHaveProperty('overallRating');
      expect(analysis).toHaveProperty('challenges');
      expect(analysis).toHaveProperty('risks');
      expect(analysis).toHaveProperty('recommendations');
    });

    it('يجب أن يعطي تقييم "جاهز تماماً" للبيانات الممتازة', () => {
      const excellentData = {
        equipment: {
          availabilityRate: 95,
          maintenancePending: false,
          technicalIssues: []
        },
        humanResources: {
          staffingLevel: 100,
          trainingCompleted: 95
        },
        materials: {
          stockLevel: 80,
          supplyChainIssues: false
        },
        qualitySafety: {
          qualityIssues: false,
          safetyViolations: false
        },
        infrastructure: {
          facilityCondition: 'excellent'
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(excellentData);
      expect(analysis.overallRating).toBe('FULLY_READY');
    });

    it('يجب أن يعطي تقييم "غير جاهز" للبيانات السيئة', () => {
      const poorData = {
        equipment: {
          availabilityRate: 50,
          maintenancePending: true,
          technicalIssues: ['عطل كبير', 'عطل آخر']
        },
        humanResources: {
          staffingLevel: 60,
          trainingCompleted: 50
        },
        materials: {
          stockLevel: 20,
          supplyChainIssues: true,
          criticalItemsShortage: true
        },
        qualitySafety: {
          qualityIssues: true,
          safetyViolations: true
        },
        infrastructure: {
          facilityCondition: 'poor',
          powerOutages: true
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(poorData);
      expect(analysis.overallRating).toBe('NOT_READY');
    });

    it('يجب أن يحدد التحديات بشكل صحيح', () => {
      const dataWithChallenges = {
        equipment: {
          technicalIssues: ['مشكلة في المحرك']
        },
        humanResources: {
          staffingLevel: 75
        },
        materials: {
          supplyChainIssues: true
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(dataWithChallenges);
      expect(analysis.challenges.length).toBeGreaterThan(0);
      expect(analysis.challenges.some(c => c.type === 'technical')).toBe(true);
      expect(analysis.challenges.some(c => c.type === 'staffing')).toBe(true);
      expect(analysis.challenges.some(c => c.type === 'supply_chain')).toBe(true);
    });

    it('يجب أن يحدد المخاطر بشكل صحيح', () => {
      const dataWithRisks = {
        equipment: {
          availabilityRate: 70
        },
        qualitySafety: {
          safetyViolations: true
        },
        materials: {
          criticalItemsShortage: true
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(dataWithRisks);
      expect(analysis.risks.length).toBeGreaterThan(0);
      expect(analysis.risks.some(r => r.type === 'operational')).toBe(true);
      expect(analysis.risks.some(r => r.type === 'safety')).toBe(true);
      expect(analysis.risks.some(r => r.type === 'supply')).toBe(true);
    });

    it('يجب أن يولد توصيات مناسبة', () => {
      const dataNeededImprovement = {
        equipment: {
          availabilityRate: 75,
          maintenancePending: true
        },
        humanResources: {
          staffingLevel: 80,
          trainingCompleted: 70
        },
        materials: {
          stockLevel: 40
        }
      };

      const analysis = productionReadinessService.analyzeProductionData(dataNeededImprovement);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.category === 'equipment')).toBe(true);
      expect(analysis.recommendations.some(r => r.category === 'hr')).toBe(true);
      expect(analysis.recommendations.some(r => r.category === 'materials')).toBe(true);
    });
  });

  describe('generateReportText', () => {
    it('يجب أن يولد نص تقرير كامل بالعربية', () => {
      const productionData = {
        facilityName: 'مصنع الإنتاج الرئيسي',
        projectName: 'مشروع التوسع 2024',
        reportingPeriod: 'الربع الأول 2024',
        equipment: { availabilityRate: 85 }
      };

      const reportDate = '2024-01-15';
      const analysis = productionReadinessService.analyzeProductionData(productionData);
      const reportText = productionReadinessService.generateReportText(
        productionData,
        reportDate,
        analysis
      );

      expect(reportText).toContain('تقرير جاهزية الإنتاج');
      expect(reportText).toContain('Production Readiness Report');
      expect(reportText).toContain('مصنع الإنتاج الرئيسي');
      expect(reportText).toContain('مشروع التوسع 2024');
      expect(reportText).toContain('معلومات عامة');
      expect(reportText).toContain('حالة المعدات والآلات');
      expect(reportText).toContain('الموارد البشرية');
      expect(reportText).toContain('المواد الخام والمخزون');
      expect(reportText).toContain('الجودة والسلامة');
      expect(reportText).toContain('البنية التحتية');
      expect(reportText).toContain('التحديات والمخاطر');
      expect(reportText).toContain('التوصيات');
      expect(reportText).toContain('التقييم العام');
    });

    it('يجب أن يتضمن جميع التقييمات في التقرير', () => {
      const productionData = { equipment: { availabilityRate: 85 } };
      const analysis = productionReadinessService.analyzeProductionData(productionData);
      const reportText = productionReadinessService.generateReportText(
        productionData,
        new Date(),
        analysis
      );

      expect(reportText).toContain(`${analysis.equipment.rating}/5`);
      expect(reportText).toContain(`${analysis.humanResources.rating}/5`);
      expect(reportText).toContain(`${analysis.materials.rating}/5`);
      expect(reportText).toContain(`${analysis.qualitySafety.rating}/5`);
      expect(reportText).toContain(`${analysis.infrastructure.rating}/5`);
    });
  });

  describe('createReport', () => {
    it('يجب أن ينشئ تقرير جديد ويحفظه في قاعدة البيانات', async () => {
      const productionData = {
        facilityName: 'مصنع الإنتاج',
        equipment: { availabilityRate: 85 }
      };
      const reportDate = '2024-01-15';

      const mockReport = {
        id: 'report-123',
        reportDate: new Date(reportDate),
        facilityName: 'مصنع الإنتاج',
        overallRating: 'READY_WITH_NOTES',
        createdAt: new Date()
      };

      prisma.productionReadinessReport.create.mockResolvedValue(mockReport);

      const result = await productionReadinessService.createReport(
        productionData,
        reportDate
      );

      expect(result.success).toBe(true);
      expect(result.report).toEqual(mockReport);
      expect(result.analysis).toBeDefined();
      expect(prisma.productionReadinessReport.create).toHaveBeenCalledTimes(1);
    });

    it('يجب أن يستخدم التاريخ الحالي إذا لم يتم تحديد تاريخ', async () => {
      const productionData = { equipment: { availabilityRate: 85 } };

      const mockReport = {
        id: 'report-123',
        reportDate: expect.any(Date),
        overallRating: 'READY_WITH_NOTES'
      };

      prisma.productionReadinessReport.create.mockResolvedValue(mockReport);

      await productionReadinessService.createReport(productionData, new Date());

      expect(prisma.productionReadinessReport.create).toHaveBeenCalled();
      const createCall = prisma.productionReadinessReport.create.mock.calls[0][0];
      expect(createCall.data.reportDate).toBeInstanceOf(Date);
    });

    it('يجب أن يعالج الأخطاء بشكل صحيح', async () => {
      const productionData = { equipment: { availabilityRate: 85 } };
      
      prisma.productionReadinessReport.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        productionReadinessService.createReport(productionData, new Date())
      ).rejects.toThrow('Database error');
    });
  });

  describe('getReport', () => {
    it('يجب أن يجلب تقرير بالمعرف', async () => {
      const reportId = 'report-123';
      const mockReport = {
        id: reportId,
        facilityName: 'مصنع الإنتاج',
        overallRating: 'FULLY_READY'
      };

      prisma.productionReadinessReport.findUnique.mockResolvedValue(mockReport);

      const result = await productionReadinessService.getReport(reportId);

      expect(result).toEqual(mockReport);
      expect(prisma.productionReadinessReport.findUnique).toHaveBeenCalledWith({
        where: { id: reportId }
      });
    });

    it('يجب أن يرمي خطأ إذا لم يتم العثور على التقرير', async () => {
      prisma.productionReadinessReport.findUnique.mockResolvedValue(null);

      await expect(
        productionReadinessService.getReport('non-existent')
      ).rejects.toThrow('التقرير غير موجود');
    });
  });

  describe('listReports', () => {
    it('يجب أن يجلب قائمة التقارير مع التصفية', async () => {
      const mockReports = [
        { id: '1', facilityName: 'مصنع 1', overallRating: 'FULLY_READY' },
        { id: '2', facilityName: 'مصنع 2', overallRating: 'READY_WITH_NOTES' }
      ];

      prisma.productionReadinessReport.findMany.mockResolvedValue(mockReports);
      prisma.productionReadinessReport.count.mockResolvedValue(2);

      const filters = {
        facilityName: 'مصنع',
        limit: 50,
        offset: 0
      };

      const result = await productionReadinessService.listReports(filters);

      expect(result.reports).toEqual(mockReports);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('يجب أن يطبق التصفية حسب التقييم العام', async () => {
      prisma.productionReadinessReport.findMany.mockResolvedValue([]);
      prisma.productionReadinessReport.count.mockResolvedValue(0);

      await productionReadinessService.listReports({
        overallRating: 'FULLY_READY'
      });

      const findManyCall = prisma.productionReadinessReport.findMany.mock.calls[0][0];
      expect(findManyCall.where.overallRating).toBe('FULLY_READY');
    });

    it('يجب أن يطبق التصفية حسب التواريخ', async () => {
      prisma.productionReadinessReport.findMany.mockResolvedValue([]);
      prisma.productionReadinessReport.count.mockResolvedValue(0);

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      await productionReadinessService.listReports({
        startDate,
        endDate
      });

      const findManyCall = prisma.productionReadinessReport.findMany.mock.calls[0][0];
      expect(findManyCall.where.reportDate.gte).toEqual(new Date(startDate));
      expect(findManyCall.where.reportDate.lte).toEqual(new Date(endDate));
    });
  });

  describe('updateApprovalStatus', () => {
    it('يجب أن يحدث حالة الموافقة', async () => {
      const reportId = 'report-123';
      const mockUpdatedReport = {
        id: reportId,
        approvalStatus: 'APPROVED',
        approvedBy: 'user-123'
      };

      prisma.productionReadinessReport.update.mockResolvedValue(mockUpdatedReport);

      const result = await productionReadinessService.updateApprovalStatus(
        reportId,
        'APPROVED',
        'user-123'
      );

      expect(result).toEqual(mockUpdatedReport);
      expect(prisma.productionReadinessReport.update).toHaveBeenCalledWith({
        where: { id: reportId },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy: 'user-123',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deleteReport', () => {
    it('يجب أن يحذف تقرير', async () => {
      const reportId = 'report-123';

      prisma.productionReadinessReport.delete.mockResolvedValue({});

      const result = await productionReadinessService.deleteReport(reportId);

      expect(result.success).toBe(true);
      expect(prisma.productionReadinessReport.delete).toHaveBeenCalledWith({
        where: { id: reportId }
      });
    });

    it('يجب أن يعالج أخطاء الحذف', async () => {
      prisma.productionReadinessReport.delete.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        productionReadinessService.deleteReport('report-123')
      ).rejects.toThrow('Delete failed');
    });
  });
});
