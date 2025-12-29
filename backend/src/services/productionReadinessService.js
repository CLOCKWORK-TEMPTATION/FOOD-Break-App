/**
 * خدمة تقارير جاهزية الإنتاج
 * Production Readiness Service
 * 
 * هذه الخدمة مسؤولة عن إنشاء وإدارة تقارير جاهزية الإنتاج بالعربية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class ProductionReadinessService {
  /**
   * تحليل بيانات الإنتاج وتقييم الجاهزية
   * @param {Object} productionData - البيانات الأولية للإنتاج
   * @returns {Object} - نتائج التحليل والتقييم
   */
  analyzeProductionData(productionData) {
    const analysis = {
      equipment: this._analyzeEquipment(productionData.equipment || {}),
      humanResources: this._analyzeHR(productionData.humanResources || {}),
      materials: this._analyzeMaterials(productionData.materials || {}),
      qualitySafety: this._analyzeQualitySafety(productionData.qualitySafety || {}),
      infrastructure: this._analyzeInfrastructure(productionData.infrastructure || {}),
      challenges: this._identifyChallenges(productionData),
      risks: this._identifyRisks(productionData),
      recommendations: []
    };

    // حساب التقييم العام
    analysis.overallRating = this._calculateOverallRating(analysis);
    
    // توليد التوصيات بناءً على التحليل
    analysis.recommendations = this._generateRecommendations(analysis);

    return analysis;
  }

  /**
   * تحليل حالة المعدات والآلات
   */
  _analyzeEquipment(equipment) {
    const status = {
      rating: 5,
      availability: 100,
      maintenanceStatus: 'جيد',
      technicalIssues: [],
      notes: []
    };

    if (equipment.availabilityRate !== undefined) {
      status.availability = equipment.availabilityRate;
      if (equipment.availabilityRate < 70) {
        status.rating = 2;
        status.notes.push('معدل توفر المعدات منخفض جداً');
      } else if (equipment.availabilityRate < 85) {
        status.rating = 3;
        status.notes.push('معدل توفر المعدات يحتاج تحسين');
      }
    }

    if (equipment.maintenancePending) {
      status.rating = Math.min(status.rating, 3);
      status.maintenanceStatus = 'يوجد صيانة معلقة';
      status.notes.push('توجد معدات تحتاج صيانة عاجلة');
    }

    if (equipment.technicalIssues && equipment.technicalIssues.length > 0) {
      status.rating = Math.min(status.rating, 2);
      status.technicalIssues = equipment.technicalIssues;
    }

    if (equipment.outdatedEquipment) {
      status.notes.push('بعض المعدات قديمة وتحتاج استبدال');
    }

    return status;
  }

  /**
   * تحليل حالة الموارد البشرية
   */
  _analyzeHR(hr) {
    const status = {
      rating: 5,
      staffingLevel: 100,
      trainingStatus: 'مكتمل',
      readiness: 'جاهز',
      notes: []
    };

    if (hr.staffingLevel !== undefined) {
      status.staffingLevel = hr.staffingLevel;
      if (hr.staffingLevel < 70) {
        status.rating = 2;
        status.readiness = 'غير جاهز';
        status.notes.push('نقص حاد في العمالة');
      } else if (hr.staffingLevel < 85) {
        status.rating = 3;
        status.readiness = 'جاهز جزئياً';
        status.notes.push('يوجد نقص في بعض التخصصات');
      }
    }

    if (hr.trainingCompleted !== undefined && hr.trainingCompleted < 80) {
      status.rating = Math.min(status.rating, 3);
      status.trainingStatus = 'غير مكتمل';
      status.notes.push(`نسبة التدريب المكتمل: ${hr.trainingCompleted}%`);
    }

    if (hr.criticalPositionsVacant) {
      status.rating = Math.min(status.rating, 2);
      status.notes.push('وظائف حرجة شاغرة');
    }

    return status;
  }

  /**
   * تحليل حالة المواد الخام والمخزون
   */
  _analyzeMaterials(materials) {
    const status = {
      rating: 5,
      availability: 100,
      inventoryLevel: 'كافٍ',
      supplyChain: 'مستقر',
      notes: []
    };

    if (materials.stockLevel !== undefined) {
      if (materials.stockLevel < 30) {
        status.rating = 2;
        status.inventoryLevel = 'منخفض جداً';
        status.notes.push('مخزون المواد الخام في مستوى حرج');
      } else if (materials.stockLevel < 50) {
        status.rating = 3;
        status.inventoryLevel = 'منخفض';
        status.notes.push('مخزون المواد الخام يحتاج تعزيز');
      }
    }

    if (materials.supplyChainIssues) {
      status.rating = Math.min(status.rating, 3);
      status.supplyChain = 'يوجد مشاكل';
      status.notes.push('مشاكل في سلسلة التوريد');
    }

    if (materials.criticalItemsShortage) {
      status.rating = Math.min(status.rating, 2);
      status.notes.push('نقص في مواد حرجة');
    }

    return status;
  }

  /**
   * تحليل الجودة والسلامة
   */
  _analyzeQualitySafety(qualitySafety) {
    const status = {
      rating: 5,
      qualityControl: 'مطبق',
      safetyProtocols: 'مفعل',
      compliance: 'ملتزم',
      notes: []
    };

    if (qualitySafety.qualityIssues) {
      status.rating = 3;
      status.qualityControl = 'يوجد مشاكل';
      status.notes.push('مشاكل في مراقبة الجودة');
    }

    if (qualitySafety.safetyViolations) {
      status.rating = Math.min(status.rating, 2);
      status.safetyProtocols = 'يوجد انتهاكات';
      status.notes.push('انتهاكات في بروتوكولات السلامة');
    }

    if (qualitySafety.certificationExpired) {
      status.rating = Math.min(status.rating, 3);
      status.compliance = 'شهادات منتهية';
      status.notes.push('تجديد الشهادات مطلوب');
    }

    if (qualitySafety.recentAccidents) {
      status.notes.push('حوادث حديثة تم تسجيلها');
    }

    return status;
  }

  /**
   * تحليل البنية التحتية
   */
  _analyzeInfrastructure(infrastructure) {
    const status = {
      rating: 5,
      facilities: 'جيد',
      utilities: 'مستقر',
      support: 'كافٍ',
      notes: []
    };

    if (infrastructure.facilityCondition === 'poor') {
      status.rating = 2;
      status.facilities = 'سيء';
      status.notes.push('المرافق في حالة سيئة');
    } else if (infrastructure.facilityCondition === 'fair') {
      status.rating = 3;
      status.facilities = 'مقبول';
      status.notes.push('المرافق تحتاج تحسين');
    }

    if (infrastructure.powerOutages) {
      status.rating = Math.min(status.rating, 3);
      status.utilities = 'غير مستقر';
      status.notes.push('انقطاعات متكررة في الكهرباء');
    }

    if (infrastructure.waterSupplyIssues) {
      status.utilities = 'مشاكل في التزويد';
      status.notes.push('مشاكل في إمدادات المياه');
    }

    return status;
  }

  /**
   * تحديد التحديات والعقبات
   */
  _identifyChallenges(productionData) {
    const challenges = [];

    if (productionData.equipment?.technicalIssues?.length > 0) {
      challenges.push({
        type: 'technical',
        severity: 'high',
        description: 'مشاكل فنية في المعدات',
        impact: 'قد تؤثر على جدول الإنتاج'
      });
    }

    if (productionData.humanResources?.staffingLevel < 80) {
      challenges.push({
        type: 'staffing',
        severity: 'medium',
        description: 'نقص في الموارد البشرية',
        impact: 'قد يؤدي لتأخيرات في الإنتاج'
      });
    }

    if (productionData.materials?.supplyChainIssues) {
      challenges.push({
        type: 'supply_chain',
        severity: 'high',
        description: 'مشاكل في سلسلة التوريد',
        impact: 'خطر نفاد المواد الخام'
      });
    }

    if (productionData.budget?.exceeded) {
      challenges.push({
        type: 'financial',
        severity: 'medium',
        description: 'تجاوز الميزانية المخصصة',
        impact: 'قد يتطلب تمويل إضافي'
      });
    }

    return challenges;
  }

  /**
   * تحديد المخاطر المحتملة
   */
  _identifyRisks(productionData) {
    const risks = [];

    if (productionData.equipment?.availabilityRate < 80) {
      risks.push({
        type: 'operational',
        probability: 'high',
        impact: 'high',
        description: 'خطر توقف الإنتاج بسبب عطل المعدات',
        mitigation: 'تنفيذ صيانة وقائية فورية'
      });
    }

    if (productionData.qualitySafety?.safetyViolations) {
      risks.push({
        type: 'safety',
        probability: 'medium',
        impact: 'critical',
        description: 'خطر حوادث العمل',
        mitigation: 'تفعيل بروتوكولات السلامة وتدريب العاملين'
      });
    }

    if (productionData.materials?.criticalItemsShortage) {
      risks.push({
        type: 'supply',
        probability: 'high',
        impact: 'high',
        description: 'خطر نقص المواد الحرجة',
        mitigation: 'تأمين موردين بديلين وزيادة المخزون الاستراتيجي'
      });
    }

    if (productionData.external?.marketConditions === 'volatile') {
      risks.push({
        type: 'market',
        probability: 'medium',
        impact: 'medium',
        description: 'تقلبات في ظروف السوق',
        mitigation: 'مرونة في خطة الإنتاج'
      });
    }

    return risks;
  }

  /**
   * حساب التقييم العام للجاهزية
   */
  _calculateOverallRating(analysis) {
    const ratings = [
      analysis.equipment.rating,
      analysis.humanResources.rating,
      analysis.materials.rating,
      analysis.qualitySafety.rating,
      analysis.infrastructure.rating
    ];

    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const minRating = Math.min(...ratings);

    // التقييم العام يعتمد على المتوسط والحد الأدنى
    if (minRating === 1 || averageRating < 2.5) {
      return 'NOT_READY';
    } else if (minRating === 2 || averageRating < 3.5) {
      return 'REQUIRES_INTERVENTION';
    } else if (averageRating < 4) {
      return 'PARTIALLY_READY';
    } else if (averageRating < 4.5 || minRating < 4) {
      return 'READY_WITH_NOTES';
    } else {
      return 'FULLY_READY';
    }
  }

  /**
   * توليد التوصيات بناءً على التحليل
   */
  _generateRecommendations(analysis) {
    const recommendations = [];

    // توصيات المعدات
    if (analysis.equipment.rating < 4) {
      recommendations.push({
        priority: 'high',
        category: 'equipment',
        title: 'تحسين حالة المعدات',
        description: 'تنفيذ برنامج صيانة شامل للمعدات وإصلاح الأعطال الفنية',
        timeline: 'فوري - أسبوع',
        responsibleParty: 'قسم الصيانة'
      });
    }

    // توصيات الموارد البشرية
    if (analysis.humanResources.rating < 4) {
      recommendations.push({
        priority: 'high',
        category: 'hr',
        title: 'تعزيز الموارد البشرية',
        description: 'توظيف عمالة إضافية واستكمال برامج التدريب',
        timeline: '2-4 أسابيع',
        responsibleParty: 'قسم الموارد البشرية'
      });
    }

    // توصيات المواد الخام
    if (analysis.materials.rating < 4) {
      recommendations.push({
        priority: 'critical',
        category: 'materials',
        title: 'تأمين المواد الخام',
        description: 'زيادة المخزون وتنويع الموردين لضمان الاستمرارية',
        timeline: 'فوري',
        responsibleParty: 'قسم المشتريات والتوريد'
      });
    }

    // توصيات الجودة والسلامة
    if (analysis.qualitySafety.rating < 4) {
      recommendations.push({
        priority: 'critical',
        category: 'quality_safety',
        title: 'تعزيز الجودة والسلامة',
        description: 'تفعيل بروتوكولات السلامة وتحديث إجراءات مراقبة الجودة',
        timeline: 'فوري - أسبوع',
        responsibleParty: 'قسم الجودة والسلامة'
      });
    }

    // توصيات البنية التحتية
    if (analysis.infrastructure.rating < 4) {
      recommendations.push({
        priority: 'medium',
        category: 'infrastructure',
        title: 'تحسين البنية التحتية',
        description: 'صيانة المرافق وتحسين الخدمات الداعمة',
        timeline: '2-4 أسابيع',
        responsibleParty: 'قسم المرافق'
      });
    }

    // توصيات عامة
    if (analysis.challenges.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'management',
        title: 'خطة معالجة التحديات',
        description: 'وضع خطة شاملة لمعالجة جميع التحديات المحددة',
        timeline: 'أسبوع - أسبوعين',
        responsibleParty: 'الإدارة العليا'
      });
    }

    return recommendations;
  }

  /**
   * إنشاء نص التقرير بالعربية
   */
  generateReportText(productionData, reportDate, analysis) {
    const facilityName = productionData.facilityName || 'غير محدد';
    const projectName = productionData.projectName || 'غير محدد';
    const reportingPeriod = productionData.reportingPeriod || 'غير محدد';

    // ترجمة التقييم العام
    const ratingTranslations = {
      'FULLY_READY': 'جاهز تماماً',
      'READY_WITH_NOTES': 'جاهز مع ملاحظات',
      'PARTIALLY_READY': 'جاهز جزئياً',
      'NOT_READY': 'غير جاهز',
      'REQUIRES_INTERVENTION': 'يتطلب تدخل فوري'
    };

    const overallRatingText = ratingTranslations[analysis.overallRating] || analysis.overallRating;

    let report = `# تقرير جاهزية الإنتاج
# Production Readiness Report

---

## 1. معلومات عامة (General Information)

**تاريخ التقرير:** ${new Date(reportDate).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}

**اسم المنشأة/المشروع:** ${facilityName}${projectName !== 'غير محدد' ? ` - ${projectName}` : ''}

**فترة التقرير:** ${reportingPeriod}

---

## 2. حالة المعدات والآلات (Equipment and Machinery Status)

**التقييم:** ${analysis.equipment.rating}/5

**معدل التوفر:** ${analysis.equipment.availability}%

**حالة الصيانة:** ${analysis.equipment.maintenanceStatus}

`;

    if (analysis.equipment.technicalIssues.length > 0) {
      report += `**المشاكل الفنية:**\n`;
      analysis.equipment.technicalIssues.forEach((issue, idx) => {
        report += `${idx + 1}. ${issue}\n`;
      });
      report += '\n';
    }

    if (analysis.equipment.notes.length > 0) {
      report += `**ملاحظات:**\n`;
      analysis.equipment.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += `---

## 3. الموارد البشرية (Human Resources)

**التقييم:** ${analysis.humanResources.rating}/5

**مستوى التوظيف:** ${analysis.humanResources.staffingLevel}%

**حالة التدريب:** ${analysis.humanResources.trainingStatus}

**الجاهزية:** ${analysis.humanResources.readiness}

`;

    if (analysis.humanResources.notes.length > 0) {
      report += `**ملاحظات:**\n`;
      analysis.humanResources.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += `---

## 4. المواد الخام والمخزون (Raw Materials and Inventory)

**التقييم:** ${analysis.materials.rating}/5

**معدل التوفر:** ${analysis.materials.availability}%

**مستوى المخزون:** ${analysis.materials.inventoryLevel}

**حالة سلسلة التوريد:** ${analysis.materials.supplyChain}

`;

    if (analysis.materials.notes.length > 0) {
      report += `**ملاحظات:**\n`;
      analysis.materials.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += `---

## 5. الجودة والسلامة (Quality and Safety)

**التقييم:** ${analysis.qualitySafety.rating}/5

**مراقبة الجودة:** ${analysis.qualitySafety.qualityControl}

**بروتوكولات السلامة:** ${analysis.qualitySafety.safetyProtocols}

**الامتثال للمعايير:** ${analysis.qualitySafety.compliance}

`;

    if (analysis.qualitySafety.notes.length > 0) {
      report += `**ملاحظات:**\n`;
      analysis.qualitySafety.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += `---

## 6. البنية التحتية (Infrastructure)

**التقييم:** ${analysis.infrastructure.rating}/5

**حالة المرافق:** ${analysis.infrastructure.facilities}

**المرافق والخدمات:** ${analysis.infrastructure.utilities}

**الدعم الفني:** ${analysis.infrastructure.support}

`;

    if (analysis.infrastructure.notes.length > 0) {
      report += `**ملاحظات:**\n`;
      analysis.infrastructure.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += `---

## 7. التحديات والمخاطر (Challenges and Risks)

`;

    if (analysis.challenges.length > 0) {
      report += `### التحديات المحددة:\n\n`;
      analysis.challenges.forEach((challenge, idx) => {
        report += `**${idx + 1}. ${challenge.description}**\n`;
        report += `- النوع: ${challenge.type}\n`;
        report += `- الخطورة: ${challenge.severity === 'high' ? 'عالية' : challenge.severity === 'medium' ? 'متوسطة' : 'منخفضة'}\n`;
        report += `- التأثير: ${challenge.impact}\n\n`;
      });
    } else {
      report += `لا توجد تحديات كبيرة محددة.\n\n`;
    }

    if (analysis.risks.length > 0) {
      report += `### المخاطر المحتملة:\n\n`;
      analysis.risks.forEach((risk, idx) => {
        report += `**${idx + 1}. ${risk.description}**\n`;
        report += `- النوع: ${risk.type}\n`;
        report += `- الاحتمالية: ${risk.probability === 'high' ? 'عالية' : risk.probability === 'medium' ? 'متوسطة' : 'منخفضة'}\n`;
        report += `- التأثير: ${risk.impact === 'critical' ? 'حرج' : risk.impact === 'high' ? 'عالي' : risk.impact === 'medium' ? 'متوسط' : 'منخفض'}\n`;
        report += `- خطة التخفيف: ${risk.mitigation}\n\n`;
      });
    } else {
      report += `لا توجد مخاطر كبيرة محددة.\n\n`;
    }

    report += `---

## 8. التوصيات (Recommendations)

`;

    if (analysis.recommendations.length > 0) {
      analysis.recommendations.forEach((rec, idx) => {
        const priorityText = rec.priority === 'critical' ? '🔴 حرج' : 
                           rec.priority === 'high' ? '🟠 عالي' : 
                           rec.priority === 'medium' ? '🟡 متوسط' : '🟢 منخفض';
        
        report += `### ${idx + 1}. ${rec.title}\n\n`;
        report += `**الأولوية:** ${priorityText}\n\n`;
        report += `**الوصف:** ${rec.description}\n\n`;
        report += `**الإطار الزمني:** ${rec.timeline}\n\n`;
        report += `**الجهة المسؤولة:** ${rec.responsibleParty}\n\n`;
        report += `---\n\n`;
      });
    } else {
      report += `لا توجد توصيات خاصة. النظام جاهز للعمل.\n\n`;
    }

    report += `## 9. التقييم العام (Overall Assessment)

**تقييم الجاهزية:** **${overallRatingText}**

`;

    // إضافة التبرير
    const justifications = {
      'FULLY_READY': 'جميع الأنظمة والعمليات في حالة ممتازة والمنشأة جاهزة تماماً لبدء أو مواصلة الإنتاج بكفاءة عالية.',
      'READY_WITH_NOTES': 'المنشأة جاهزة للإنتاج مع وجود بعض الملاحظات التي يُنصح بمعالجتها لتحسين الكفاءة، لكنها لا تمنع بدء العمليات.',
      'PARTIALLY_READY': 'توجد عدة جوانب تحتاج إلى تحسين قبل تحقيق الجاهزية الكاملة. يمكن بدء الإنتاج مع خطة معالجة واضحة.',
      'NOT_READY': 'المنشأة غير جاهزة حالياً لبدء الإنتاج. توجد مشاكل حرجة يجب معالجتها أولاً.',
      'REQUIRES_INTERVENTION': 'يتطلب تدخل فوري من الإدارة لمعالجة المشاكل الحرجة قبل بدء أو مواصلة الإنتاج.'
    };

    report += `**التبرير:** ${justifications[analysis.overallRating]}\n\n`;

    // ملخص الدرجات
    report += `**ملخص التقييمات:**\n`;
    report += `- المعدات والآلات: ${analysis.equipment.rating}/5\n`;
    report += `- الموارد البشرية: ${analysis.humanResources.rating}/5\n`;
    report += `- المواد الخام والمخزون: ${analysis.materials.rating}/5\n`;
    report += `- الجودة والسلامة: ${analysis.qualitySafety.rating}/5\n`;
    report += `- البنية التحتية: ${analysis.infrastructure.rating}/5\n\n`;

    report += `---

**تم إنشاء هذا التقرير بواسطة نظام BreakApp**

**التاريخ:** ${new Date().toLocaleString('ar-EG')}

---
`;

    return report;
  }

  /**
   * إنشاء وحفظ تقرير جاهزية الإنتاج
   */
  async createReport(productionData, reportDate, createdBy = null) {
    try {
      // تحليل البيانات
      const analysis = this.analyzeProductionData(productionData);

      // توليد نص التقرير
      const reportText = this.generateReportText(productionData, reportDate, analysis);

      // حفظ في قاعدة البيانات
      const report = await prisma.productionReadinessReport.create({
        data: {
          reportDate: new Date(reportDate),
          facilityName: productionData.facilityName || null,
          projectName: productionData.projectName || null,
          reportingPeriod: productionData.reportingPeriod || null,
          productionData: productionData,
          equipmentStatus: analysis.equipment.rating,
          hrReadiness: analysis.humanResources.rating,
          materialsStatus: analysis.materials.rating,
          qualitySafety: analysis.qualitySafety.rating,
          infrastructure: analysis.infrastructure.rating,
          overallRating: analysis.overallRating,
          challenges: analysis.challenges,
          risks: analysis.risks,
          recommendations: analysis.recommendations,
          generatedReport: reportText,
          createdBy: createdBy,
          approvalStatus: 'PENDING'
        }
      });

      logger.info(`تم إنشاء تقرير جاهزية الإنتاج: ${report.id}`);

      return {
        success: true,
        report: report,
        analysis: analysis
      };

    } catch (error) {
      logger.error('خطأ في إنشاء تقرير جاهزية الإنتاج:', error);
      throw error;
    }
  }

  /**
   * الحصول على تقرير بالمعرف
   */
  async getReport(reportId) {
    try {
      const report = await prisma.productionReadinessReport.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        throw new Error('التقرير غير موجود');
      }

      return report;
    } catch (error) {
      logger.error('خطأ في جلب التقرير:', error);
      throw error;
    }
  }

  /**
   * الحصول على قائمة التقارير مع تصفية
   */
  async listReports(filters = {}) {
    try {
      const where = {};

      if (filters.facilityName) {
        where.facilityName = { contains: filters.facilityName };
      }

      if (filters.projectName) {
        where.projectName = { contains: filters.projectName };
      }

      if (filters.overallRating) {
        where.overallRating = filters.overallRating;
      }

      if (filters.approvalStatus) {
        where.approvalStatus = filters.approvalStatus;
      }

      if (filters.startDate || filters.endDate) {
        where.reportDate = {};
        if (filters.startDate) {
          where.reportDate.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.reportDate.lte = new Date(filters.endDate);
        }
      }

      const reports = await prisma.productionReadinessReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      });

      const total = await prisma.productionReadinessReport.count({ where });

      return {
        reports,
        total,
        page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
        totalPages: Math.ceil(total / (filters.limit || 50))
      };
    } catch (error) {
      logger.error('خطأ في جلب قائمة التقارير:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة الموافقة على التقرير
   */
  async updateApprovalStatus(reportId, status, approvedBy = null) {
    try {
      const report = await prisma.productionReadinessReport.update({
        where: { id: reportId },
        data: {
          approvalStatus: status,
          approvedBy: approvedBy,
          updatedAt: new Date()
        }
      });

      logger.info(`تم تحديث حالة الموافقة للتقرير ${reportId} إلى ${status}`);

      return report;
    } catch (error) {
      logger.error('خطأ في تحديث حالة الموافقة:', error);
      throw error;
    }
  }

  /**
   * حذف تقرير
   */
  async deleteReport(reportId) {
    try {
      await prisma.productionReadinessReport.delete({
        where: { id: reportId }
      });

      logger.info(`تم حذف التقرير ${reportId}`);

      return { success: true };
    } catch (error) {
      logger.error('خطأ في حذف التقرير:', error);
      throw error;
    }
  }
}

module.exports = new ProductionReadinessService();
