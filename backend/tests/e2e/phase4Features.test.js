/**
 * Phase 4 Features E2E Tests
 * اختبارات شاملة من النهاية للنهاية للمميزات المتقدمة
 */

const request = require('supertest');
const app = require('../../src/server');
const { 
  createTestUser, 
  createTestProject, 
  generateTestToken, 
  cleanupTestData, 
  closePrisma 
} = require('../utils/testHelpers');

describe('Phase 4 Features - E2E Tests', () => {
  let adminUser, regularUser, adminToken, userToken, testProject;

  beforeAll(async () => {
    // إنشاء مستخدمين للاختبار
    adminUser = await createTestUser({ role: 'ADMIN' });
    regularUser = await createTestUser({ role: 'REGULAR' });
    
    // إنشاء مشروع للاختبار
    testProject = await createTestProject({ name: 'Phase 4 Test Project' });
    
    // إنشاء tokens
    adminToken = generateTestToken(adminUser.id, 'ADMIN');
    userToken = generateTestToken(regularUser.id, 'REGULAR');
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('Emergency Mode Complete Workflow', () => {
    it('should handle complete emergency scenario', async () => {
      // 1. تفعيل وضع الطوارئ
      const emergencyResponse = await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          emergencyType: 'SCHEDULE_CHANGE',
          reason: 'Urgent schedule change due to weather',
          estimatedDuration: 180
        })
        .expect(200);

      expect(emergencyResponse.body.success).toBe(true);
      const emergencyId = emergencyResponse.body.data.id;

      // 2. إنشاء طلب طوارئ
      const orderResponse = await request(app)
        .post('/api/v1/emergency/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: testProject.id,
          urgencyLevel: 'CRITICAL',
          specialInstructions: 'Immediate delivery required for emergency meeting',
          deliveryLocation: {
            address: '123 Emergency Street',
            latitude: 30.0444,
            longitude: 31.2357
          }
        })
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.urgencyLevel).toBe('CRITICAL');
      expect(orderResponse.body.data.estimatedDeliveryTime).toBeLessThan(20); // Critical = very fast
      const orderId = orderResponse.body.data.id;

      // 3. البحث عن مطاعم الطوارئ
      const restaurantsResponse = await request(app)
        .get('/api/v1/emergency/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          latitude: 30.0444,
          longitude: 31.2357,
          radius: 5000
        })
        .expect(200);

      expect(restaurantsResponse.body.success).toBe(true);
      expect(Array.isArray(restaurantsResponse.body.data)).toBe(true);

      // 4. تحديث حالة طلب الطوارئ
      const statusUpdateResponse = await request(app)
        .patch(`/api/v1/emergency/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'URGENT_CONFIRMED',
          estimatedDeliveryTime: 15,
          notes: 'Order confirmed by emergency partner restaurant'
        })
        .expect(200);

      expect(statusUpdateResponse.body.success).toBe(true);
      expect(statusUpdateResponse.body.data.status).toBe('URGENT_CONFIRMED');

      // 5. إرسال تنبيه تغيير الجدولة
      const scheduleChangeResponse = await request(app)
        .post('/api/v1/emergency/schedule-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          changeType: 'DELAY',
          newSchedule: {
            deliveryTime: '14:30',
            estimatedDelay: 30
          },
          reason: 'Weather conditions causing delays',
          affectedMeals: ['LUNCH']
        })
        .expect(200);

      expect(scheduleChangeResponse.body.success).toBe(true);
      expect(scheduleChangeResponse.body.data.sentTo).toBeGreaterThan(0);

      // 6. عرض تاريخ الطوارئ
      const historyResponse = await request(app)
        .get('/api/v1/emergency/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          projectId: testProject.id,
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data.length).toBeGreaterThan(0);

      // 7. إلغاء تفعيل وضع الطوارئ
      const deactivateResponse = await request(app)
        .post('/api/v1/emergency/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          reason: 'Emergency situation resolved successfully'
        })
        .expect(200);

      expect(deactivateResponse.body.success).toBe(true);
    });
  });

  describe('Medical Alerts Complete Workflow', () => {
    it('should handle complete medical profile and alerts scenario', async () => {
      // 1. إنشاء ملف طبي
      const profileResponse = await request(app)
        .post('/api/v1/medical/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          allergies: ['NUTS', 'DAIRY', 'SHELLFISH'],
          chronicConditions: ['DIABETES', 'HYPERTENSION'],
          medications: ['INSULIN', 'METFORMIN'],
          emergencyContact: {
            name: 'John Doe',
            phone: '+1234567890',
            relationship: 'SPOUSE'
          },
          bloodType: 'A+',
          medicalNotes: 'Severe nut allergy - carries EpiPen',
          consentGiven: true
        })
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.consentGiven).toBe(true);

      // 2. فحص عنصر قائمة للتنبيهات الطبية
      const alertCheckResponse = await request(app)
        .post('/api/v1/medical/check-item')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ingredients: ['BREAD', 'PEANUT_BUTTER', 'JELLY', 'NUTS']
        })
        .expect(200);

      expect(alertCheckResponse.body.success).toBe(true);
      expect(alertCheckResponse.body.data.hasAlerts).toBe(true);
      expect(alertCheckResponse.body.data.alertLevel).toBe('RED');
      expect(alertCheckResponse.body.data.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'ALLERGY',
            allergen: 'NUTS',
            severity: 'SEVERE'
          })
        ])
      );

      // 3. تسجيل حادثة طبية
      const incidentResponse = await request(app)
        .post('/api/v1/medical/incidents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          incidentType: 'ALLERGIC_REACTION',
          severity: 'MODERATE',
          description: 'Mild allergic reaction after consuming nuts accidentally',
          symptoms: ['RASH', 'ITCHING', 'MILD_SWELLING'],
          actionTaken: 'Took antihistamine, monitored symptoms',
          location: 'Office cafeteria'
        })
        .expect(201);

      expect(incidentResponse.body.success).toBe(true);
      expect(incidentResponse.body.data.incidentType).toBe('ALLERGIC_REACTION');
      expect(incidentResponse.body.data.severity).toBe('MODERATE');

      // 4. عرض تاريخ الحوادث الطبية
      const incidentsHistoryResponse = await request(app)
        .get('/api/v1/medical/incidents')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          page: 1,
          limit: 10,
          severity: 'MODERATE'
        })
        .expect(200);

      expect(incidentsHistoryResponse.body.success).toBe(true);
      expect(incidentsHistoryResponse.body.data.length).toBeGreaterThan(0);

      // 5. تحديث موافقة معالجة البيانات الطبية
      const consentResponse = await request(app)
        .post('/api/v1/medical/consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          consentType: 'EMERGENCY_SHARING',
          granted: true,
          version: '1.0'
        })
        .expect(200);

      expect(consentResponse.body.success).toBe(true);
      expect(consentResponse.body.data.granted).toBe(true);

      // 6. البحث في المكونات
      const ingredientSearchResponse = await request(app)
        .get('/api/v1/medical/ingredients/search')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          query: 'peanut',
          category: 'NUTS',
          allergen: 'NUTS'
        })
        .expect(200);

      expect(ingredientSearchResponse.body.success).toBe(true);
      expect(Array.isArray(ingredientSearchResponse.body.data)).toBe(true);

      // 7. تصدير البيانات الطبية (GDPR)
      const exportResponse = await request(app)
        .get('/api/v1/medical/export')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data).toEqual(
        expect.objectContaining({
          userId: regularUser.id,
          exportDate: expect.any(String),
          data: expect.objectContaining({
            medicalProfile: expect.any(Object),
            incidents: expect.any(Array),
            consents: expect.any(Array)
          })
        })
      );
    });
  });

  describe('Voice Ordering Complete Workflow', () => {
    it('should handle complete voice ordering scenario', async () => {
      // 1. إعداد تفضيلات الصوت
      const preferencesResponse = await request(app)
        .post('/api/v1/voice/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          preferredLanguage: 'ar',
          voiceSpeed: 'normal',
          voiceType: 'female',
          enableVoiceConfirmation: true,
          enableVoiceShortcuts: true
        })
        .expect(200);

      expect(preferencesResponse.body.success).toBe(true);
      expect(preferencesResponse.body.data.preferredLanguage).toBe('ar');

      // 2. إنشاء اختصار صوتي مخصص
      const shortcutResponse = await request(app)
        .post('/api/v1/voice/shortcuts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phrase: 'اطلب لي المعتاد',
          action: 'ORDER_USUAL',
          parameters: {}
        })
        .expect(201);

      expect(shortcutResponse.body.success).toBe(true);
      expect(shortcutResponse.body.data.phrase).toBe('اطلب لي المعتاد');

      // 3. معالجة أمر صوتي
      const voiceCommandResponse = await request(app)
        .post('/api/v1/voice/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          audioData: 'base64-encoded-audio-data-arabic-command',
          language: 'ar'
        })
        .expect(200);

      expect(voiceCommandResponse.body.success).toBe(true);
      expect(voiceCommandResponse.body.data).toEqual(
        expect.objectContaining({
          sessionId: expect.any(String),
          transcription: expect.any(String),
          intent: expect.any(String),
          confidence: expect.any(Number)
        })
      );

      const sessionId = voiceCommandResponse.body.data.sessionId;

      // 4. البحث الصوتي في القائمة
      const voiceSearchResponse = await request(app)
        .post('/api/v1/voice/search-menu')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'برجر مع بطاطس',
          language: 'ar'
        })
        .expect(200);

      expect(voiceSearchResponse.body.success).toBe(true);
      expect(Array.isArray(voiceSearchResponse.body.data)).toBe(true);

      // 5. تأكيد الطلب الصوتي
      const confirmationResponse = await request(app)
        .post('/api/v1/voice/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          confirmed: true
        })
        .expect(200);

      expect(confirmationResponse.body.success).toBe(true);
      expect(confirmationResponse.body.data).toEqual(
        expect.objectContaining({
          status: expect.any(String)
        })
      );

      // 6. تحويل النص إلى صوت
      const textToSpeechResponse = await request(app)
        .post('/api/v1/voice/text-to-speech')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'تم تأكيد طلبك بنجاح. سيتم التوصيل خلال 30 دقيقة.',
          language: 'ar',
          voice: 'female'
        })
        .expect(200);

      expect(textToSpeechResponse.body.success).toBe(true);
      expect(textToSpeechResponse.body.data).toEqual(
        expect.objectContaining({
          audioData: expect.any(String),
          format: expect.any(String),
          language: 'ar'
        })
      );

      // 7. الحصول على الطلب المعتاد
      const usualOrderResponse = await request(app)
        .get('/api/v1/voice/usual-order')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // قد يكون null إذا لم يكن هناك طلبات سابقة
      expect(usualOrderResponse.body.success).toBe(true);

      // 8. عرض إحصائيات استخدام الصوت
      const analyticsResponse = await request(app)
        .get('/api/v1/voice/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data).toEqual(
        expect.objectContaining({
          totalCommands: expect.any(Number),
          successfulCommands: expect.any(Number),
          failedCommands: expect.any(Number),
          languageUsage: expect.any(Object)
        })
      );
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should handle emergency medical scenario with voice ordering', async () => {
      // سيناريو متكامل: طوارئ طبية مع طلب صوتي

      // 1. تفعيل وضع الطوارئ الطبية
      await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          emergencyType: 'MEDICAL',
          reason: 'Medical emergency requiring special dietary considerations'
        })
        .expect(200);

      // 2. فحص طبي للعناصر المتاحة في الطوارئ
      const medicalCheckResponse = await request(app)
        .post('/api/v1/medical/check-item')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ingredients: ['CHICKEN', 'RICE', 'VEGETABLES'] // آمن للحساسيات
        })
        .expect(200);

      expect(medicalCheckResponse.body.data.alertLevel).toBe('GREEN');

      // 3. طلب صوتي للطوارئ مع مراعاة الحالة الطبية
      const voiceEmergencyOrderResponse = await request(app)
        .post('/api/v1/voice/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          audioData: 'emergency-voice-command-arabic',
          language: 'ar'
        })
        .expect(200);

      expect(voiceEmergencyOrderResponse.body.success).toBe(true);

      // 4. إنشاء طلب طوارئ مع مراعاة القيود الطبية
      const emergencyOrderResponse = await request(app)
        .post('/api/v1/emergency/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: testProject.id,
          urgencyLevel: 'HIGH',
          specialInstructions: 'Medical emergency - no nuts, dairy, or shellfish',
          medicalRestrictions: ['NUTS', 'DAIRY', 'SHELLFISH']
        })
        .expect(201);

      expect(emergencyOrderResponse.body.success).toBe(true);
      expect(emergencyOrderResponse.body.data.urgencyLevel).toBe('HIGH');

      // 5. تسجيل الحادثة الطبية المرتبطة بالطوارئ
      await request(app)
        .post('/api/v1/medical/incidents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          incidentType: 'MEDICAL_EMERGENCY',
          severity: 'CRITICAL',
          description: 'Emergency situation requiring immediate dietary accommodation',
          actionTaken: 'Activated emergency mode and ordered safe meal options'
        })
        .expect(201);

      // 6. إلغاء تفعيل وضع الطوارئ بعد الحل
      await request(app)
        .post('/api/v1/emergency/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          reason: 'Medical emergency resolved, safe meal delivered'
        })
        .expect(200);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests across all Phase 4 features', async () => {
      const concurrentRequests = [];

      // إنشاء 10 طلبات متزامنة لكل ميزة
      for (let i = 0; i < 10; i++) {
        // Emergency requests
        concurrentRequests.push(
          request(app)
            .get('/api/v1/emergency/restaurants')
            .set('Authorization', `Bearer ${userToken}`)
            .query({ latitude: 30.0444, longitude: 31.2357 })
        );

        // Medical requests
        concurrentRequests.push(
          request(app)
            .post('/api/v1/medical/check-item')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ ingredients: ['CHICKEN', 'RICE'] })
        );

        // Voice requests
        concurrentRequests.push(
          request(app)
            .get('/api/v1/voice/preferences')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(concurrentRequests);

      // التحقق من أن جميع الطلبات نجحت
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
        expect(response.body.success).toBe(true);
      });

      // التحقق من أن الاستجابة كانت سريعة (أقل من 5 ثوان)
      const totalTime = responses.reduce((sum, response) => {
        return sum + (response.duration || 0);
      }, 0);

      expect(totalTime).toBeLessThan(5000); // 5 seconds total
    });
  });
});