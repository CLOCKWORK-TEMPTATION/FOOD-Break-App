/**
 * Medical Controller Tests
 * اختبارات متحكم التنبيهات الطبية - Phase 4 Feature
 */

const medicalController = require('../../../src/controllers/medicalController');
const medicalService = require('../../../src/services/medicalService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

// Mock the medical service
jest.mock('../../../src/services/medicalService');

describe('Medical Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('createOrUpdateMedicalProfile', () => {
    it('should create medical profile successfully', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        allergies: ['NUTS', 'DAIRY'],
        chronicConditions: ['DIABETES'],
        medications: ['INSULIN']
      };

      mockReq.body = {
        allergies: ['NUTS', 'DAIRY'],
        chronicConditions: ['DIABETES'],
        medications: ['INSULIN'],
        consentGiven: true
      };

      medicalService.createOrUpdateMedicalProfile.mockResolvedValue(mockProfile);

      await medicalController.createOrUpdateMedicalProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile,
        message: expect.any(String)
      });
    });

    it('should require consent for medical data processing', async () => {
      mockReq.body = {
        allergies: ['NUTS'],
        consentGiven: false
      };

      medicalService.createOrUpdateMedicalProfile.mockRejectedValue(
        new Error('Consent required for medical data processing')
      );

      await medicalController.createOrUpdateMedicalProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'MEDICAL_PROFILE_FAILED',
          message: expect.any(String)
        })
      });
    });
  });

  describe('getMedicalProfile', () => {
    it('should return medical profile successfully', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        allergies: ['NUTS', 'DAIRY'],
        chronicConditions: ['DIABETES'],
        emergencyContact: {
          name: 'John Doe',
          phone: '+1234567890'
        }
      };

      medicalService.getMedicalProfile.mockResolvedValue(mockProfile);

      await medicalController.getMedicalProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });

    it('should handle missing medical profile', async () => {
      medicalService.getMedicalProfile.mockResolvedValue(null);

      await medicalController.getMedicalProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'MEDICAL_PROFILE_NOT_FOUND',
          message: expect.any(String)
        })
      });
    });
  });

  describe('checkItemForMedicalAlerts', () => {
    it('should return medical alerts for menu item', async () => {
      const mockAlerts = {
        hasAlerts: true,
        alertLevel: 'RED',
        alerts: [
          {
            type: 'ALLERGY',
            allergen: 'NUTS',
            severity: 'SEVERE',
            message: 'Contains nuts - severe allergy risk'
          }
        ]
      };

      mockReq.body = {
        menuItemId: 'item-1'
      };

      medicalService.checkItemForMedicalAlerts.mockResolvedValue(mockAlerts);

      await medicalController.checkItemForMedicalAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });

    it('should check ingredients directly', async () => {
      const mockAlerts = {
        hasAlerts: false,
        alertLevel: 'GREEN',
        alerts: []
      };

      mockReq.body = {
        ingredients: ['CHICKEN', 'RICE', 'VEGETABLES']
      };

      medicalService.checkItemForMedicalAlerts.mockResolvedValue(mockAlerts);

      await medicalController.checkItemForMedicalAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });
  });

  describe('reportMedicalIncident', () => {
    it('should report medical incident successfully', async () => {
      const mockIncident = {
        id: 'incident-1',
        userId: 'user-1',
        incidentType: 'ALLERGIC_REACTION',
        severity: 'MODERATE',
        description: 'Mild allergic reaction to nuts'
      };

      mockReq.body = {
        incidentType: 'ALLERGIC_REACTION',
        severity: 'MODERATE',
        description: 'Mild allergic reaction to nuts',
        menuItemId: 'item-1',
        symptoms: ['RASH', 'ITCHING']
      };

      medicalService.reportMedicalIncident.mockResolvedValue(mockIncident);

      await medicalController.reportMedicalIncident(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockIncident,
        message: expect.any(String)
      });
    });

    it('should handle critical incidents with emergency contact', async () => {
      const mockIncident = {
        id: 'incident-1',
        severity: 'CRITICAL',
        emergencyContactNotified: true
      };

      mockReq.body = {
        incidentType: 'ALLERGIC_REACTION',
        severity: 'CRITICAL',
        description: 'Severe allergic reaction requiring immediate attention'
      };

      medicalService.reportMedicalIncident.mockResolvedValue(mockIncident);

      await medicalController.reportMedicalIncident(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockIncident,
        message: expect.any(String)
      });
    });
  });

  describe('getMedicalIncidents', () => {
    it('should return medical incidents with pagination', async () => {
      const mockIncidents = {
        incidents: [
          {
            id: 'incident-1',
            incidentType: 'ALLERGIC_REACTION',
            severity: 'MILD',
            createdAt: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockReq.query = {
        page: '1',
        limit: '10',
        severity: 'MILD'
      };

      medicalService.getMedicalIncidents.mockResolvedValue(mockIncidents);

      await medicalController.getMedicalIncidents(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockIncidents.incidents,
        meta: { pagination: mockIncidents.pagination }
      });
    });
  });

  describe('updateMedicalConsent', () => {
    it('should update medical consent successfully', async () => {
      const mockConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: 'DATA_PROCESSING',
        granted: true,
        version: '1.0'
      };

      mockReq.body = {
        consentType: 'DATA_PROCESSING',
        granted: true,
        version: '1.0'
      };

      medicalService.updateMedicalConsent.mockResolvedValue(mockConsent);

      await medicalController.updateMedicalConsent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockConsent,
        message: expect.any(String)
      });
    });
  });

  describe('exportMedicalData', () => {
    it('should export medical data for GDPR compliance', async () => {
      const mockExport = {
        userId: 'user-1',
        exportDate: new Date(),
        data: {
          medicalProfile: {},
          incidents: [],
          consents: []
        }
      };

      medicalService.exportMedicalData.mockResolvedValue(mockExport);

      await medicalController.exportMedicalData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockExport,
        message: expect.any(String)
      });
    });
  });

  describe('deleteMedicalData', () => {
    it('should delete medical data for GDPR right to be forgotten', async () => {
      mockReq.body = {
        confirmDeletion: true
      };

      medicalService.deleteMedicalData.mockResolvedValue({ deleted: true });

      await medicalController.deleteMedicalData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('should require confirmation for deletion', async () => {
      mockReq.body = {
        confirmDeletion: false
      };

      await medicalController.deleteMedicalData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'DELETION_NOT_CONFIRMED',
          message: expect.any(String)
        })
      });
    });
  });

  describe('addIngredient', () => {
    it('should add new ingredient (Admin only)', async () => {
      const mockIngredient = {
        id: 'ingredient-1',
        name: 'Peanuts',
        nameArabic: 'فول سوداني',
        category: 'NUTS',
        commonAllergens: ['NUTS'],
        medicalWarnings: ['SEVERE_ALLERGY_RISK']
      };

      mockReq.body = {
        name: 'Peanuts',
        nameArabic: 'فول سوداني',
        category: 'NUTS',
        commonAllergens: ['NUTS'],
        medicalWarnings: ['SEVERE_ALLERGY_RISK']
      };

      medicalService.addIngredient.mockResolvedValue(mockIngredient);

      await medicalController.addIngredient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockIngredient,
        message: expect.any(String)
      });
    });
  });

  describe('searchIngredients', () => {
    it('should search ingredients successfully', async () => {
      const mockResults = [
        {
          id: 'ingredient-1',
          name: 'Peanuts',
          category: 'NUTS',
          commonAllergens: ['NUTS']
        }
      ];

      mockReq.query = {
        query: 'peanut',
        category: 'NUTS'
      };

      medicalService.searchIngredients.mockResolvedValue(mockResults);

      await medicalController.searchIngredients(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults
      });
    });
  });
});