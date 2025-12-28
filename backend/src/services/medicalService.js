/**
 * Medical Service - خدمة التنبيهات الطبية
 * يوفر جميع العمليات المتعلقة بالملفات الطبية والتحذيرات
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * إنشاء أو تحديث الملف الطبي
 */
async function createOrUpdateMedicalProfile(userId, profileData) {
  try {
    // تشفير البيانات الحساسة
    const encryptedData = encryptMedicalData(profileData);

    const medicalProfile = await prisma.medicalProfile.upsert({
      where: { userId },
      update: {
        ...encryptedData,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...encryptedData,
        createdAt: new Date()
      }
    });

    // تسجيل الوصول للبيانات الطبية (GDPR/HIPAA Compliance)
    await logMedicalDataAccess(userId, 'PROFILE_UPDATED', {
      action: 'Medical profile created/updated',
      timestamp: new Date()
    });

    return decryptMedicalData(medicalProfile);
  } catch (error) {
    logger.error('Error creating/updating medical profile:', error);
    throw error;
  }
}

/**
 * الحصول على الملف الطبي
 */
async function getMedicalProfile(userId) {
  try {
    const profile = await prisma.medicalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!profile) {
      return null;
    }

    // تسجيل الوصول للبيانات
    await logMedicalDataAccess(userId, 'PROFILE_ACCESSED', {
      action: 'Medical profile accessed',
      timestamp: new Date()
    });

    return decryptMedicalData(profile);
  } catch (error) {
    logger.error('Error getting medical profile:', error);
    throw error;
  }
}

/**
 * فحص عنصر للتحذيرات الطبية
 */
async function checkItemForMedicalAlerts(userId, { menuItemId, ingredients }) {
  try {
    // الحصول على الملف الطبي
    const medicalProfile = await getMedicalProfile(userId);
    if (!medicalProfile) {
      return {
        alertLevel: 'NONE',
        message: 'لا يوجد ملف طبي',
        detectedAllergens: []
      };
    }

    let itemIngredients = ingredients || [];
    let itemName = 'عنصر غير محدد';

    // إذا تم توفير معرف العنصر، جلب المكونات من قاعدة البيانات
    if (menuItemId) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      if (menuItem) {
        itemName = menuItem.name;
        itemIngredients = menuItem.ingredients.map(ing => ing.ingredient.name);
      }
    }

    // فحص الحساسيات
    const userAllergies = medicalProfile.allergies || [];
    const detectedAllergens = [];
    let alertLevel = 'NONE';
    let alertMessage = '';

    for (const allergen of userAllergies) {
      for (const ingredient of itemIngredients) {
        if (ingredient.toLowerCase().includes(allergen.name.toLowerCase()) ||
            allergen.aliases?.some(alias => ingredient.toLowerCase().includes(alias.toLowerCase()))) {
          
          detectedAllergens.push({
            allergen: allergen.name,
            severity: allergen.severity,
            ingredient: ingredient
          });

          // تحديد مستوى التحذير
          if (allergen.severity === 'SEVERE' || allergen.severity === 'LIFE_THREATENING') {
            alertLevel = 'RED';
            alertMessage = `تحذير شديد: يحتوي على ${allergen.name} - قد يسبب رد فعل تحسسي خطير`;
          } else if (allergen.severity === 'MODERATE' && alertLevel !== 'RED') {
            alertLevel = 'YELLOW';
            alertMessage = `تحذير متوسط: يحتوي على ${allergen.name}`;
          } else if (alertLevel === 'NONE') {
            alertLevel = 'GREEN';
            alertMessage = `تحذير خفيف: يحتوي على ${allergen.name}`;
          }
        }
      }
    }

    // فحص التفاعلات الدوائية
    const medicationInteractions = await checkMedicationInteractions(
      medicalProfile.medications || [],
      itemIngredients
    );

    if (medicationInteractions.length > 0) {
      if (alertLevel === 'NONE') alertLevel = 'YELLOW';
      alertMessage += ` | تحذير: قد يتفاعل مع الأدوية`;
    }

    const result = {
      alertLevel,
      message: alertMessage || 'لا توجد تحذيرات',
      detectedAllergens,
      medicationInteractions,
      itemName,
      emergencyContact: medicalProfile.emergencyContact,
      recommendations: generateRecommendations(alertLevel, detectedAllergens)
    };

    // تسجيل فحص العنصر
    await prisma.medicalCheck.create({
      data: {
        userId,
        menuItemId,
        alertLevel,
        detectedAllergens: JSON.stringify(detectedAllergens),
        checkedAt: new Date()
      }
    });

    return result;
  } catch (error) {
    logger.error('Error checking item for medical alerts:', error);
    throw error;
  }
}

/**
 * تسجيل حادثة طبية
 */
async function reportMedicalIncident(userId, incidentData) {
  try {
    const incident = await prisma.medicalIncident.create({
      data: {
        userId,
        ...incidentData,
        id: crypto.randomUUID()
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, phoneNumber: true }
        }
      }
    });

    // تسجيل الحادثة في سجل الأمان
    await logMedicalDataAccess(userId, 'INCIDENT_REPORTED', {
      incidentId: incident.id,
      severity: incidentData.severity,
      timestamp: new Date()
    });

    return incident;
  } catch (error) {
    logger.error('Error reporting medical incident:', error);
    throw error;
  }
}

/**
 * تفعيل بروتوكول الطوارئ
 */
async function triggerEmergencyProtocol(userId, incident) {
  try {
    // الحصول على معلومات الاتصال الطارئ
    const medicalProfile = await getMedicalProfile(userId);
    
    if (medicalProfile?.emergencyContact) {
      // إرسال إشعار لجهة الاتصال الطارئة
      await notifyEmergencyContact(medicalProfile.emergencyContact, userId, incident);
    }

    // إشعار الإدارة
    await prisma.emergencyAlert.create({
      data: {
        userId,
        incidentId: incident.id,
        alertType: 'MEDICAL_EMERGENCY',
        severity: incident.severity,
        message: `حادثة طبية ${incident.severity}: ${incident.description}`,
        createdAt: new Date()
      }
    });

    // تسجيل تفعيل البروتوكول
    await logMedicalDataAccess(userId, 'EMERGENCY_PROTOCOL_TRIGGERED', {
      incidentId: incident.id,
      severity: incident.severity,
      timestamp: new Date()
    });

    logger.warn(`Emergency protocol triggered for user ${userId}, incident ${incident.id}`);
  } catch (error) {
    logger.error('Error triggering emergency protocol:', error);
    throw error;
  }
}

/**
 * إشعار جهة الاتصال الطارئة
 */
async function notifyEmergencyContact(emergencyContact, userId, incident) {
  try {
    // هنا يمكن إضافة إرسال SMS أو مكالمة
    // للآن سنسجل الإشعار في قاعدة البيانات
    
    await prisma.emergencyContactNotification.create({
      data: {
        userId,
        contactName: emergencyContact.name,
        contactPhone: emergencyContact.phone,
        incidentId: incident.id,
        message: `تنبيه طبي طارئ: ${incident.description}`,
        sentAt: new Date()
      }
    });

    logger.info(`Emergency contact notified for user ${userId}`);
  } catch (error) {
    logger.error('Error notifying emergency contact:', error);
    throw error;
  }
}

/**
 * الحصول على الحوادث الطبية
 */
async function getMedicalIncidents(userId, filters) {
  try {
    const where = { userId };
    
    if (filters.startDate || filters.endDate) {
      where.reportedAt = {};
      if (filters.startDate) where.reportedAt.gte = filters.startDate;
      if (filters.endDate) where.reportedAt.lte = filters.endDate;
    }
    
    if (filters.severity) {
      where.severity = filters.severity;
    }

    const [incidents, total] = await Promise.all([
      prisma.medicalIncident.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          menuItem: {
            select: { name: true, restaurant: { select: { name: true } } }
          }
        }
      }),
      prisma.medicalIncident.count({ where })
    ]);

    // تسجيل الوصول للبيانات
    await logMedicalDataAccess(userId, 'INCIDENTS_ACCESSED', {
      count: incidents.length,
      timestamp: new Date()
    });

    return {
      incidents,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit)
      }
    };
  } catch (error) {
    logger.error('Error getting medical incidents:', error);
    throw error;
  }
}

/**
 * تحديث موافقة معالجة البيانات الطبية
 */
async function updateMedicalConsent(userId, consentData) {
  try {
    const consent = await prisma.medicalConsent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType: consentData.consentType
        }
      },
      update: {
        granted: consentData.granted,
        version: consentData.version,
        timestamp: consentData.timestamp,
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent
      },
      create: {
        userId,
        ...consentData
      }
    });

    // تسجيل تحديث الموافقة
    await logMedicalDataAccess(userId, 'CONSENT_UPDATED', {
      consentType: consentData.consentType,
      granted: consentData.granted,
      timestamp: new Date()
    });

    return consent;
  } catch (error) {
    logger.error('Error updating medical consent:', error);
    throw error;
  }
}

/**
 * الحصول على حالة الموافقات
 */
async function getMedicalConsent(userId) {
  try {
    const consents = await prisma.medicalConsent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    return consents;
  } catch (error) {
    logger.error('Error getting medical consent:', error);
    throw error;
  }
}

/**
 * إضافة مكون جديد
 */
async function addIngredient(ingredientData) {
  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        ...ingredientData,
        createdAt: new Date()
      }
    });

    return ingredient;
  } catch (error) {
    logger.error('Error adding ingredient:', error);
    throw error;
  }
}

/**
 * البحث في المكونات
 */
async function searchIngredients({ query, category, allergen }) {
  try {
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { nameArabic: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (category) {
      where.category = category;
    }

    if (allergen) {
      where.commonAllergens = {
        has: allergen
      };
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50
    });

    return ingredients;
  } catch (error) {
    logger.error('Error searching ingredients:', error);
    throw error;
  }
}

/**
 * تصدير البيانات الطبية للمستخدم (GDPR)
 */
async function exportUserMedicalData(userId) {
  try {
    const [profile, incidents, consents, checks] = await Promise.all([
      prisma.medicalProfile.findUnique({ where: { userId } }),
      prisma.medicalIncident.findMany({ where: { userId } }),
      prisma.medicalConsent.findMany({ where: { userId } }),
      prisma.medicalCheck.findMany({ where: { userId } })
    ]);

    const exportData = {
      profile: profile ? decryptMedicalData(profile) : null,
      incidents,
      consents,
      checks,
      exportedAt: new Date(),
      dataRetentionPolicy: 'البيانات محفوظة وفقاً لسياسة الخصوصية'
    };

    // تسجيل التصدير
    await logMedicalDataAccess(userId, 'DATA_EXPORTED', {
      timestamp: new Date()
    });

    return exportData;
  } catch (error) {
    logger.error('Error exporting medical data:', error);
    throw error;
  }
}

/**
 * حذف البيانات الطبية (Right to be Forgotten)
 */
async function deleteMedicalData(userId) {
  try {
    await prisma.$transaction(async (tx) => {
      // حذف جميع البيانات الطبية
      await tx.medicalProfile.deleteMany({ where: { userId } });
      await tx.medicalIncident.deleteMany({ where: { userId } });
      await tx.medicalConsent.deleteMany({ where: { userId } });
      await tx.medicalCheck.deleteMany({ where: { userId } });
      await tx.emergencyContactNotification.deleteMany({ where: { userId } });
      
      // الاحتفاظ بسجل الحذف للامتثال القانوني
      await tx.medicalDataDeletion.create({
        data: {
          userId,
          deletedAt: new Date(),
          reason: 'USER_REQUEST_GDPR'
        }
      });
    });

    logger.info(`Medical data deleted for user ${userId}`);
  } catch (error) {
    logger.error('Error deleting medical data:', error);
    throw error;
  }
}

/**
 * فحص التفاعلات الدوائية
 */
async function checkMedicationInteractions(medications, ingredients) {
  try {
    const interactions = [];
    
    for (const medication of medications) {
      for (const ingredient of ingredients) {
        // فحص قاعدة بيانات التفاعلات الدوائية
        const interaction = await prisma.drugFoodInteraction.findFirst({
          where: {
            drugName: { contains: medication.name, mode: 'insensitive' },
            foodIngredient: { contains: ingredient, mode: 'insensitive' }
          }
        });

        if (interaction) {
          interactions.push({
            medication: medication.name,
            ingredient,
            severity: interaction.severity,
            description: interaction.description
          });
        }
      }
    }

    return interactions;
  } catch (error) {
    logger.error('Error checking medication interactions:', error);
    return [];
  }
}

/**
 * إنشاء توصيات بناءً على التحذيرات
 */
function generateRecommendations(alertLevel, detectedAllergens) {
  const recommendations = [];

  if (alertLevel === 'RED') {
    recommendations.push('تجنب هذا العنصر تماماً');
    recommendations.push('استشر طبيبك إذا تناولته بالخطأ');
    recommendations.push('احمل معك دواء الطوارئ (EpiPen) إن وُجد');
  } else if (alertLevel === 'YELLOW') {
    recommendations.push('تناول بحذر شديد');
    recommendations.push('راقب أي أعراض تحسسية');
    recommendations.push('أبلغ المطعم عن حساسيتك');
  } else if (alertLevel === 'GREEN') {
    recommendations.push('يمكن تناوله مع الحذر');
    recommendations.push('راقب أي أعراض خفيفة');
  }

  return recommendations;
}

/**
 * تشفير البيانات الطبية الحساسة
 */
function encryptMedicalData(data) {
  const algorithm = 'aes-256-gcm';
  const key = process.env.MEDICAL_DATA_ENCRYPTION_KEY || crypto.randomBytes(32);
  
  const encryptedData = { ...data };
  
  // تشفير الحقول الحساسة
  const sensitiveFields = ['allergies', 'chronicConditions', 'medications', 'emergencyContact', 'medicalNotes'];
  
  for (const field of sensitiveFields) {
    if (data[field]) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(JSON.stringify(data[field]), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      encryptedData[field] = {
        encrypted,
        iv: iv.toString('hex')
      };
    }
  }
  
  return encryptedData;
}

/**
 * فك تشفير البيانات الطبية
 */
function decryptMedicalData(data) {
  if (!data) return null;
  
  const algorithm = 'aes-256-gcm';
  const key = process.env.MEDICAL_DATA_ENCRYPTION_KEY || crypto.randomBytes(32);
  
  const decryptedData = { ...data };
  
  const sensitiveFields = ['allergies', 'chronicConditions', 'medications', 'emergencyContact', 'medicalNotes'];
  
  for (const field of sensitiveFields) {
    if (data[field] && typeof data[field] === 'object' && data[field].encrypted) {
      try {
        const decipher = crypto.createDecipher(algorithm, key);
        
        let decrypted = decipher.update(data[field].encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        decryptedData[field] = JSON.parse(decrypted);
      } catch (error) {
        logger.error(`Error decrypting field ${field}:`, error);
        decryptedData[field] = null;
      }
    }
  }
  
  return decryptedData;
}

/**
 * تسجيل الوصول للبيانات الطبية (Audit Trail)
 */
async function logMedicalDataAccess(userId, action, metadata) {
  try {
    await prisma.medicalDataAccessLog.create({
      data: {
        userId,
        action,
        metadata: JSON.stringify(metadata),
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || 'system',
        userAgent: metadata.userAgent || 'system'
      }
    });
  } catch (error) {
    logger.error('Error logging medical data access:', error);
  }
}

module.exports = {
  createOrUpdateMedicalProfile,
  getMedicalProfile,
  checkItemForMedicalAlerts,
  reportMedicalIncident,
  triggerEmergencyProtocol,
  notifyEmergencyContact,
  getMedicalIncidents,
  updateMedicalConsent,
  getMedicalConsent,
  addIngredient,
  searchIngredients,
  exportUserMedicalData,
  deleteMedicalData
};