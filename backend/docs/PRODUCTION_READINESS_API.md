# Production Readiness Reports API Documentation
# توثيق واجهة برمجة تطبيقات تقارير جاهزية الإنتاج

## نظرة عامة (Overview)

نظام تقارير جاهزية الإنتاج هو نظام متكامل لتقييم وتوليد تقارير شاملة بالعربية تقيّم جاهزية المنشآت والمشاريع الإنتاجية. يقوم النظام بتحليل البيانات المقدمة عبر تسع فئات رئيسية وإنشاء تقرير احترافي بالعربية.

## Base URL

```
/api/v1/production-readiness
```

## API Endpoints

### 1. Preview Report (معاينة تقرير)

**POST** `/reports/preview`

إنشاء معاينة للتقرير بدون حفظه في قاعدة البيانات.

#### Request Body

```json
{
  "productionData": {
    "facilityName": "مصنع الإنتاج الرئيسي",
    "projectName": "مشروع التوسع 2024",
    "reportingPeriod": "الربع الأول 2024",
    "equipment": {
      "availabilityRate": 85,
      "maintenancePending": true,
      "technicalIssues": ["عطل في الخط 3"],
      "outdatedEquipment": false
    },
    "humanResources": {
      "staffingLevel": 90,
      "trainingCompleted": 75,
      "criticalPositionsVacant": false
    },
    "materials": {
      "stockLevel": 60,
      "supplyChainIssues": false,
      "criticalItemsShortage": false
    },
    "qualitySafety": {
      "qualityIssues": false,
      "safetyViolations": false,
      "certificationExpired": false,
      "recentAccidents": false
    },
    "infrastructure": {
      "facilityCondition": "good",
      "powerOutages": false,
      "waterSupplyIssues": false
    },
    "budget": {
      "exceeded": false
    },
    "external": {
      "marketConditions": "stable"
    }
  },
  "reportDate": "2024-01-15"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "reportText": "# تقرير جاهزية الإنتاج\n...",
    "analysis": {
      "equipment": {
        "rating": 4,
        "availability": 85,
        "maintenanceStatus": "يوجد صيانة معلقة",
        "technicalIssues": ["عطل في الخط 3"],
        "notes": ["توجد معدات تحتاج صيانة عاجلة"]
      },
      "humanResources": {
        "rating": 4,
        "staffingLevel": 90,
        "trainingStatus": "غير مكتمل",
        "readiness": "جاهز",
        "notes": ["نسبة التدريب المكتمل: 75%"]
      },
      "materials": {
        "rating": 3,
        "availability": 100,
        "inventoryLevel": "منخفض",
        "supplyChain": "مستقر",
        "notes": ["مخزون المواد الخام يحتاج تعزيز"]
      },
      "qualitySafety": {
        "rating": 5,
        "qualityControl": "مطبق",
        "safetyProtocols": "مفعل",
        "compliance": "ملتزم",
        "notes": []
      },
      "infrastructure": {
        "rating": 5,
        "facilities": "جيد",
        "utilities": "مستقر",
        "support": "كافٍ",
        "notes": []
      },
      "overallRating": "READY_WITH_NOTES",
      "challenges": [...],
      "risks": [...],
      "recommendations": [...]
    },
    "ratings": {
      "equipment": 4,
      "humanResources": 4,
      "materials": 3,
      "qualitySafety": 5,
      "infrastructure": 5,
      "overall": "READY_WITH_NOTES"
    }
  },
  "message": "تم إنشاء معاينة التقرير"
}
```

### 2. Create Report (إنشاء تقرير)

**POST** `/reports`

إنشاء تقرير جديد وحفظه في قاعدة البيانات.

#### Request Body

نفس بنية `POST /reports/preview`

#### Response (Success - 201)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "reportDate": "2024-01-15T00:00:00.000Z",
    "facilityName": "مصنع الإنتاج الرئيسي",
    "projectName": "مشروع التوسع 2024",
    "reportingPeriod": "الربع الأول 2024",
    "equipmentStatus": 4,
    "hrReadiness": 4,
    "materialsStatus": 3,
    "qualitySafety": 5,
    "infrastructure": 5,
    "overallRating": "READY_WITH_NOTES",
    "overallNotes": null,
    "challenges": [...],
    "risks": [...],
    "recommendations": [...],
    "generatedReport": "# تقرير جاهزية الإنتاج\n...",
    "reportPdfUrl": null,
    "createdBy": "user-123",
    "approvedBy": null,
    "approvalStatus": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "analysis": {...},
  "message": "تم إنشاء تقرير جاهزية الإنتاج بنجاح"
}
```

#### Error Responses

**400 Bad Request** - بيانات الإنتاج مفقودة

```json
{
  "success": false,
  "error": {
    "code": "MISSING_PRODUCTION_DATA",
    "message": "بيانات الإنتاج مطلوبة"
  }
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "REPORT_CREATION_FAILED",
    "message": "فشل إنشاء تقرير جاهزية الإنتاج",
    "details": "Error details..."
  }
}
```

### 3. List Reports (قائمة التقارير)

**GET** `/reports`

الحصول على قائمة التقارير مع إمكانية التصفية.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| facilityName | string | تصفية باسم المنشأة | `مصنع` |
| projectName | string | تصفية باسم المشروع | `مشروع التوسع` |
| overallRating | string | تصفية بالتقييم العام | `FULLY_READY` |
| approvalStatus | string | تصفية بحالة الموافقة | `APPROVED` |
| startDate | string | تاريخ البداية (ISO 8601) | `2024-01-01` |
| endDate | string | تاريخ النهاية (ISO 8601) | `2024-01-31` |
| limit | number | عدد النتائج (افتراضي: 50) | `20` |
| offset | number | الإزاحة للصفحات (افتراضي: 0) | `0` |

#### Example Request

```
GET /reports?facilityName=مصنع&overallRating=FULLY_READY&limit=20&offset=0
```

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "reportDate": "2024-01-15T00:00:00.000Z",
      "facilityName": "مصنع الإنتاج الرئيسي",
      "projectName": "مشروع التوسع 2024",
      "overallRating": "FULLY_READY",
      "approvalStatus": "APPROVED",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    ...
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "totalPages": 3,
    "limit": 20
  },
  "message": "تم جلب 20 تقرير بنجاح"
}
```

### 4. Get Report (الحصول على تقرير)

**GET** `/reports/:reportId`

الحصول على تقرير محدد بجميع تفاصيله.

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "reportDate": "2024-01-15T00:00:00.000Z",
    "facilityName": "مصنع الإنتاج الرئيسي",
    "projectName": "مشروع التوسع 2024",
    "reportingPeriod": "الربع الأول 2024",
    "productionData": {...},
    "equipmentStatus": 4,
    "hrReadiness": 4,
    "materialsStatus": 3,
    "qualitySafety": 5,
    "infrastructure": 5,
    "overallRating": "READY_WITH_NOTES",
    "challenges": [...],
    "risks": [...],
    "recommendations": [...],
    "generatedReport": "# تقرير جاهزية الإنتاج\n...",
    "reportPdfUrl": null,
    "createdBy": "user-123",
    "approvedBy": null,
    "approvalStatus": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "تم جلب التقرير بنجاح"
}
```

#### Error Responses

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "REPORT_NOT_FOUND",
    "message": "التقرير غير موجود"
  }
}
```

### 5. Get Report Text (الحصول على نص التقرير)

**GET** `/reports/:reportId/text`

الحصول على نص التقرير فقط بصيغة Markdown.

#### Response (Success - 200)

```markdown
# تقرير جاهزية الإنتاج
# Production Readiness Report

---

## 1. معلومات عامة (General Information)

**تاريخ التقرير:** الإثنين، 15 يناير 2024

...
```

### 6. Update Approval Status (تحديث حالة الموافقة)

**PATCH** `/reports/:reportId/approval`

تحديث حالة الموافقة على التقرير.

#### Request Body

```json
{
  "status": "APPROVED"
}
```

**Valid Status Values:**
- `PENDING` - في الانتظار
- `APPROVED` - معتمد
- `REJECTED` - مرفوض
- `UNDER_REVIEW` - قيد المراجعة

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "approvalStatus": "APPROVED",
    "approvedBy": "user-123",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "تم تحديث حالة الموافقة إلى APPROVED"
}
```

#### Error Responses

**400 Bad Request** - حالة غير صالحة

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "حالة غير صالحة. الحالات المسموح بها: PENDING, APPROVED, REJECTED, UNDER_REVIEW"
  }
}
```

### 7. Delete Report (حذف تقرير)

**DELETE** `/reports/:reportId`

حذف تقرير من قاعدة البيانات.

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "تم حذف التقرير بنجاح"
}
```

## Data Models

### Overall Ratings (التقييمات العامة)

```typescript
enum ReadinessRating {
  FULLY_READY           // جاهز تماماً
  READY_WITH_NOTES      // جاهز مع ملاحظات
  PARTIALLY_READY       // جاهز جزئياً
  NOT_READY             // غير جاهز
  REQUIRES_INTERVENTION // يتطلب تدخل فوري
}
```

### Approval Status (حالات الموافقة)

```typescript
enum ApprovalStatus {
  PENDING      // في الانتظار
  APPROVED     // معتمد
  REJECTED     // مرفوض
  UNDER_REVIEW // قيد المراجعة
}
```

### Production Data Structure

```typescript
interface ProductionData {
  facilityName?: string;
  projectName?: string;
  reportingPeriod?: string;
  
  equipment?: {
    availabilityRate?: number;        // 0-100
    maintenancePending?: boolean;
    technicalIssues?: string[];
    outdatedEquipment?: boolean;
  };
  
  humanResources?: {
    staffingLevel?: number;           // 0-100
    trainingCompleted?: number;       // 0-100
    criticalPositionsVacant?: boolean;
  };
  
  materials?: {
    stockLevel?: number;              // 0-100
    supplyChainIssues?: boolean;
    criticalItemsShortage?: boolean;
  };
  
  qualitySafety?: {
    qualityIssues?: boolean;
    safetyViolations?: boolean;
    certificationExpired?: boolean;
    recentAccidents?: boolean;
  };
  
  infrastructure?: {
    facilityCondition?: 'excellent' | 'good' | 'fair' | 'poor';
    powerOutages?: boolean;
    waterSupplyIssues?: boolean;
  };
  
  budget?: {
    exceeded?: boolean;
  };
  
  external?: {
    marketConditions?: 'stable' | 'volatile';
  };
}
```

## Usage Examples

### Example 1: Create a Complete Report

```javascript
const axios = require('axios');

const response = await axios.post(
  'http://localhost:3001/api/v1/production-readiness/reports',
  {
    productionData: {
      facilityName: 'مصنع الإنتاج الرئيسي',
      projectName: 'مشروع التوسع 2024',
      reportingPeriod: 'الربع الأول 2024',
      equipment: {
        availabilityRate: 85,
        maintenancePending: false,
        technicalIssues: []
      },
      humanResources: {
        staffingLevel: 95,
        trainingCompleted: 90
      },
      materials: {
        stockLevel: 75,
        supplyChainIssues: false
      },
      qualitySafety: {
        qualityIssues: false,
        safetyViolations: false
      },
      infrastructure: {
        facilityCondition: 'good'
      }
    },
    reportDate: '2024-01-15'
  },
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE',
      'Content-Type': 'application/json'
    }
  }
);

console.log('Report ID:', response.data.data.id);
console.log('Overall Rating:', response.data.data.overallRating);
```

### Example 2: Preview Report Before Saving

```javascript
const response = await axios.post(
  'http://localhost:3001/api/v1/production-readiness/reports/preview',
  {
    productionData: {
      equipment: { availabilityRate: 85 }
    }
  }
);

console.log('Report Preview:', response.data.data.reportText);
console.log('Ratings:', response.data.data.ratings);
```

### Example 3: Get All Approved Reports

```javascript
const response = await axios.get(
  'http://localhost:3001/api/v1/production-readiness/reports',
  {
    params: {
      approvalStatus: 'APPROVED',
      limit: 20,
      offset: 0
    }
  }
);

console.log(`Found ${response.data.pagination.total} approved reports`);
```

## Report Structure (هيكل التقرير)

التقرير المُنشأ يحتوي على الأقسام التالية بالعربية:

1. **معلومات عامة** - تاريخ التقرير، المنشأة/المشروع، الفترة
2. **حالة المعدات والآلات** - تقييم، معدل التوفر، حالة الصيانة، المشاكل الفنية
3. **الموارد البشرية** - مستوى التوظيف، التدريب، الجاهزية
4. **المواد الخام والمخزون** - مستوى المخزون، سلسلة التوريد
5. **الجودة والسلامة** - مراقبة الجودة، بروتوكولات السلامة، الامتثال
6. **البنية التحتية** - حالة المرافق، الخدمات، الدعم الفني
7. **التحديات والمخاطر** - التحديات المحددة، المخاطر المحتملة
8. **التوصيات** - توصيات حسب الأولوية مع الإطار الزمني والجهة المسؤولة
9. **التقييم العام** - تقييم الجاهزية النهائي مع التبرير

## Notes (ملاحظات)

- جميع التواريخ بصيغة ISO 8601
- التقارير يتم إنشاؤها بالعربية افتراضياً
- يمكن معاينة التقرير قبل حفظه باستخدام endpoint المعاينة
- التقييمات من 1 إلى 5 (5 هو الأفضل)
- نظام الأولويات: critical (حرج) > high (عالي) > medium (متوسط) > low (منخفض)
