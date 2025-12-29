/**
 * أمثلة استخدام نظام تقارير جاهزية الإنتاج
 * Production Readiness Reports Usage Examples
 */

const axios = require('axios');

// إعداد الاتصال
const API_BASE_URL = 'http://localhost:3001/api/v1';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // استبدل بالتوكن الفعلي

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ==============================================
// مثال 1: معاينة تقرير بدون حفظ
// ==============================================

async function previewReport() {
  console.log('=== مثال 1: معاينة تقرير ===\n');
  
  try {
    const response = await api.post('/production-readiness/reports/preview', {
      productionData: {
        facilityName: 'مصنع الإنتاج الرئيسي',
        projectName: 'مشروع التوسع 2024',
        reportingPeriod: 'الربع الأول 2024',
        
        equipment: {
          availabilityRate: 85,
          maintenancePending: true,
          technicalIssues: ['عطل في الخط الثالث'],
          outdatedEquipment: false
        },
        
        humanResources: {
          staffingLevel: 90,
          trainingCompleted: 75,
          criticalPositionsVacant: false
        },
        
        materials: {
          stockLevel: 60,
          supplyChainIssues: false,
          criticalItemsShortage: false
        },
        
        qualitySafety: {
          qualityIssues: false,
          safetyViolations: false,
          certificationExpired: false,
          recentAccidents: false
        },
        
        infrastructure: {
          facilityCondition: 'good',
          powerOutages: false,
          waterSupplyIssues: false
        }
      },
      reportDate: '2024-01-15'
    });

    console.log('✓ تم إنشاء المعاينة بنجاح');
    console.log('\nالتقييمات:');
    console.log('- المعدات:', response.data.data.ratings.equipment, '/5');
    console.log('- الموارد البشرية:', response.data.data.ratings.humanResources, '/5');
    console.log('- المواد الخام:', response.data.data.ratings.materials, '/5');
    console.log('- الجودة والسلامة:', response.data.data.ratings.qualitySafety, '/5');
    console.log('- البنية التحتية:', response.data.data.ratings.infrastructure, '/5');
    console.log('\nالتقييم العام:', response.data.data.ratings.overall);
    
    console.log('\nعدد التحديات المحددة:', response.data.data.analysis.challenges.length);
    console.log('عدد المخاطر المحددة:', response.data.data.analysis.risks.length);
    console.log('عدد التوصيات:', response.data.data.analysis.recommendations.length);
    
    console.log('\n');
    
    return response.data;
  } catch (error) {
    console.error('✗ خطأ في معاينة التقرير:', error.response?.data || error.message);
    throw error;
  }
}

// تشغيل الأمثلة
if (require.main === module) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║    أمثلة استخدام نظام تقارير جاهزية الإنتاج            ║');
  console.log('║    Production Readiness Reports Usage Examples         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  previewReport().catch(console.error);
}

module.exports = { previewReport };
