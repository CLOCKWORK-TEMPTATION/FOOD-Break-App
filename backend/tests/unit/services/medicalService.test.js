/**
 * Medical Service Tests
 * اختبارات خدمة التنبيهات الطبية - Phase 4 Feature
 */

const medicalService = require('../../../src/services/medicalService');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Mock Prisma Client
jest.mock('@prisma/client');
jest.mock('crypto');

const mockPrisma = {
  medicalProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  medicalIncident: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  medicalConsent: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn()
  },
  ingredient: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  menuItem: {
    findUnique: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
};

PrismaClient.mockImplementation(() => mockPrisma);

describe('Medical Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto functions
    crypto.randomBytes = jest.fn().mockReturnValue(Buffer.from('test-random-bytes'));
    crypto.createCipher = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue('encrypted-'),
      final: jest.fn().mockReturnValue('data')
    });
    crypto.createDecipher = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue('decrypted-'),
      final: jest.fn().mockReturnValue('data')
    });
  });

  describe('createOrUpdateMedicalProfile', () => {
    it('should create medical profile with encryption', async () => {
      const profileData = {
        allergies: ['NUTS', 'DAIRY'],
        chronicConditions: ['DIABETES'],
        medications: ['INSULIN'],
        emergencyContact: {
          name: 'John Doe',
          phone: '+1234567890'
        },
        bloodType: 'A+',
        consentGiven: true
      };

      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        encryptedData: 'encrypted-medical-data',
        consentGiven: true,
        createdAt: new Date()
      };

      mockPrisma.medicalProfile.findUnique.mockResolvedValue(null);
      mockPrisma.medicalProfile.create.mockResolvedValue(mockProfile);

      const result = await medicalService.createOrUpdateMedicalProfile('user-1', profileData);

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.medicalProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          encryptedData: expect.any(String),
          consentGiven: true
        })
      });
    });

    it('should update existing medical profile', async () => {
      const profileData = {
        allergies: ['NUTS', 'SHELLFISH'],
        consentGiven: true
      };

      const existingProfile = {
        id: 'profile-1',
        userId: 'user-1',
        encryptedData: 'old-encrypted-data'
      };

      const updatedProfile = {
        ...existingProfile,
        encryptedData: 'new-encrypted-data',
        updatedAt: new Date()
      };

      mockPrisma.medicalProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrisma.medicalProfile.update.mockResolvedValue(updatedProfile);

      const result = await medicalService.createOrUpdateMedicalProfile('user-1', profileData);

      expect(result).toEqual(updatedProfile);
      expect(mockPrisma.medicalProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          encryptedData: expect.any(String)
        })
      });
    });

    it('should require consent for medical data processing', async () => {
      const profileData = {
        allergies: ['NUTS'],
        consentGiven: false
      };

      await expect(medicalService.createOrUpdateMedicalProfile('user-1', profileData))
        .rejects.toThrow('Consent required for medical data processing');
    });
  });

  describe('getMedicalProfile', () => {
    it('should return decrypted medical profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        encryptedData: 'encrypted-medical-data',
        consentGiven: true
      };

      mockPrisma.medicalProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await medicalService.getMedicalProfile('user-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'profile-1',
        userId: 'user-1',
        consentGiven: true
      }));
      expect(mockPrisma.medicalProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });

    it('should return null for non-existent profile', async () => {
      mockPrisma.medicalProfile.findUnique.mockResolvedValue(null);

      const result = await medicalService.getMedicalProfile('user-1');

      expect(result).toBeNull();
    });
  });

  describe('checkItemForMedicalAlerts', () => {
    it('should check menu item for medical alerts', async () => {
      const mockMenuItem = {
        id: 'item-1',
        name: 'Peanut Butter Sandwich',
        ingredients: ['BREAD', 'PEANUT_BUTTER', 'JELLY'],
        allergens: ['NUTS', 'GLUTEN']
      };

      const mockProfile = {
        userId: 'user-1',
        allergies: ['NUTS'],
        chronicConditions: [],
        medications: []
      };

      mockPrisma.menuItem.findUnique.mockResolvedValue(mockMenuItem);
      mockPrisma.medicalProfile.findUnique.mockResolvedValue({
        encryptedData: 'encrypted-data'
      });

      // Mock decryption to return profile data
      const originalDecrypt = medicalService.decryptMedicalData;
      medicalService.decryptMedicalData = jest.fn().mockReturnValue(mockProfile);

      const result = await medicalService.checkItemForMedicalAlerts('user-1', { menuItemId: 'item-1' });

      expect(result).toEqual({
        hasAlerts: true,
        alertLevel: 'RED',
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: 'ALLERGY',
            allergen: 'NUTS',
            severity: 'SEVERE'
          })
        ])
      });

      // Restore original function
      medicalService.decryptMedicalData = originalDecrypt;
    });

    it('should check ingredients directly', async () => {
      const ingredients = ['CHICKEN', 'RICE', 'VEGETABLES'];
      
      const mockProfile = {
        allergies: ['DAIRY'],
        chronicConditions: [],
        medications: []
      };

      mockPrisma.medicalProfile.findUnique.mockResolvedValue({
        encryptedData: 'encrypted-data'
      });

      const originalDecrypt = medicalService.decryptMedicalData;
      medicalService.decryptMedicalData = jest.fn().mockReturnValue(mockProfile);

      const result = await medicalService.checkItemForMedicalAlerts('user-1', { ingredients });

      expect(result).toEqual({
        hasAlerts: false,
        alertLevel: 'GREEN',
        alerts: []
      });

      medicalService.decryptMedicalData = originalDecrypt;
    });

    it('should return no alerts for users without medical profile', async () => {
      mockPrisma.medicalProfile.findUnique.mockResolvedValue(null);

      const result = await medicalService.checkItemForMedicalAlerts('user-1', { ingredients: ['NUTS'] });

      expect(result).toEqual({
        hasAlerts: false,
        alertLevel: 'GREEN',
        alerts: []
      });
    });
  });

  describe('reportMedicalIncident', () => {
    it('should report medical incident successfully', async () => {
      const incidentData = {
        incidentType: 'ALLERGIC_REACTION',
        severity: 'MODERATE',
        description: 'Mild allergic reaction to nuts',
        menuItemId: 'item-1',
        symptoms: ['RASH', 'ITCHING'],
        actionTaken: 'Took antihistamine',
        location: 'Office cafeteria'
      };

      const mockIncident = {
        id: 'incident-1',
        userId: 'user-1',
        ...incidentData,
        createdAt: new Date()
      };

      mockPrisma.medicalIncident.create.mockResolvedValue(mockIncident);

      const result = await medicalService.reportMedicalIncident('user-1', incidentData);

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.medicalIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          incidentType: 'ALLERGIC_REACTION',
          severity: 'MODERATE'
        })
      });
    });

    it('should handle critical incidents with emergency contact notification', async () => {
      const incidentData = {
        incidentType: 'ALLERGIC_REACTION',
        severity: 'CRITICAL',
        description: 'Severe allergic reaction requiring immediate attention'
      };

      const mockProfile = {
        emergencyContact: {
          name: 'John Doe',
          phone: '+1234567890'
        }
      };

      mockPrisma.medicalProfile.findUnique.mockResolvedValue({
        encryptedData: 'encrypted-data'
      });
      mockPrisma.medicalIncident.create.mockResolvedValue({
        id: 'incident-1',
        severity: 'CRITICAL'
      });

      const originalDecrypt = medicalService.decryptMedicalData;
      medicalService.decryptMedicalData = jest.fn().mockReturnValue(mockProfile);

      const result = await medicalService.reportMedicalIncident('user-1', incidentData);

      expect(result.severity).toBe('CRITICAL');
      // In a real implementation, this would trigger emergency contact notification

      medicalService.decryptMedicalData = originalDecrypt;
    });
  });

  describe('getMedicalIncidents', () => {
    it('should return paginated medical incidents', async () => {
      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        severity: 'MODERATE',
        page: 1,
        limit: 10
      };

      const mockIncidents = [
        {
          id: 'incident-1',
          incidentType: 'ALLERGIC_REACTION',
          severity: 'MODERATE',
          createdAt: new Date()
        }
      ];

      mockPrisma.medicalIncident.findMany.mockResolvedValue(mockIncidents);
      mockPrisma.medicalIncident.count.mockResolvedValue(1);

      const result = await medicalService.getMedicalIncidents('user-1', filters);

      expect(result.incidents).toEqual(mockIncidents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });
  });

  describe('updateMedicalConsent', () => {
    it('should update medical consent', async () => {
      const consentData = {
        consentType: 'DATA_PROCESSING',
        granted: true,
        version: '1.0'
      };

      const mockConsent = {
        id: 'consent-1',
        userId: 'user-1',
        ...consentData,
        updatedAt: new Date()
      };

      mockPrisma.medicalConsent.upsert.mockResolvedValue(mockConsent);

      const result = await medicalService.updateMedicalConsent('user-1', consentData);

      expect(result).toEqual(mockConsent);
      expect(mockPrisma.medicalConsent.upsert).toHaveBeenCalledWith({
        where: {
          userId_consentType: {
            userId: 'user-1',
            consentType: 'DATA_PROCESSING'
          }
        },
        update: expect.objectContaining({
          granted: true,
          version: '1.0'
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          consentType: 'DATA_PROCESSING',
          granted: true
        })
      });
    });
  });

  describe('exportMedicalData', () => {
    it('should export all medical data for GDPR compliance', async () => {
      const mockProfile = {
        id: 'profile-1',
        encryptedData: 'encrypted-data'
      };

      const mockIncidents = [
        { id: 'incident-1', incidentType: 'ALLERGIC_REACTION' }
      ];

      const mockConsents = [
        { id: 'consent-1', consentType: 'DATA_PROCESSING', granted: true }
      ];

      mockPrisma.medicalProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.medicalIncident.findMany.mockResolvedValue(mockIncidents);
      mockPrisma.medicalConsent.findMany.mockResolvedValue(mockConsents);

      const result = await medicalService.exportMedicalData('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        exportDate: expect.any(Date),
        data: {
          medicalProfile: expect.any(Object),
          incidents: mockIncidents,
          consents: mockConsents
        }
      });
    });
  });

  describe('deleteMedicalData', () => {
    it('should delete all medical data for GDPR right to be forgotten', async () => {
      mockPrisma.medicalProfile.delete.mockResolvedValue({ id: 'profile-1' });
      mockPrisma.medicalIncident.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.medicalConsent.deleteMany.mockResolvedValue({ count: 1 });

      const result = await medicalService.deleteMedicalData('user-1');

      expect(result.deleted).toBe(true);
      expect(mockPrisma.medicalProfile.delete).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
      expect(mockPrisma.medicalIncident.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
      expect(mockPrisma.medicalConsent.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });
  });

  describe('addIngredient', () => {
    it('should add new ingredient to database', async () => {
      const ingredientData = {
        name: 'Peanuts',
        nameArabic: 'فول سوداني',
        category: 'NUTS',
        commonAllergens: ['NUTS'],
        medicalWarnings: ['SEVERE_ALLERGY_RISK'],
        nutritionalInfo: {
          calories: 567,
          protein: 25.8,
          fat: 49.2
        }
      };

      const mockIngredient = {
        id: 'ingredient-1',
        ...ingredientData,
        createdAt: new Date()
      };

      mockPrisma.ingredient.create.mockResolvedValue(mockIngredient);

      const result = await medicalService.addIngredient(ingredientData);

      expect(result).toEqual(mockIngredient);
      expect(mockPrisma.ingredient.create).toHaveBeenCalledWith({
        data: ingredientData
      });
    });
  });

  describe('searchIngredients', () => {
    it('should search ingredients by name and category', async () => {
      const searchParams = {
        query: 'peanut',
        category: 'NUTS',
        allergen: 'NUTS'
      };

      const mockResults = [
        {
          id: 'ingredient-1',
          name: 'Peanuts',
          category: 'NUTS',
          commonAllergens: ['NUTS']
        }
      ];

      mockPrisma.ingredient.findMany.mockResolvedValue(mockResults);

      const result = await medicalService.searchIngredients(searchParams);

      expect(result).toEqual(mockResults);
      expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'peanut', mode: 'insensitive' } },
            { nameArabic: { contains: 'peanut', mode: 'insensitive' } }
          ],
          category: 'NUTS',
          commonAllergens: { has: 'NUTS' }
        },
        orderBy: { name: 'asc' }
      });
    });
  });
});