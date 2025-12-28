/**
 * Smoke Tests - Medical Service
 * اختبارات بسيطة للتغطية السريعة
 */

const medicalService = require('../medicalService');

jest.mock('@prisma/client');
jest.mock('crypto');

describe('MedicalService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.medicalProfile.upsert.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      allergies: []
    });
    mockPrisma.medicalProfile.findUnique.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      allergies: [],
      medications: []
    });
    mockPrisma.menuItem.findUnique.mockResolvedValue({
      id: 'item-1',
      name: 'Test Item',
      ingredients: []
    });
    mockPrisma.medicalCheck.create.mockResolvedValue({ id: '1' });
    mockPrisma.medicalIncident.create.mockResolvedValue({ id: '1' });
    mockPrisma.emergencyAlert.create.mockResolvedValue({ id: '1' });
    mockPrisma.emergencyContactNotification.create.mockResolvedValue({ id: '1' });
    mockPrisma.medicalIncident.findMany.mockResolvedValue([]);
    mockPrisma.medicalIncident.count.mockResolvedValue(0);
    mockPrisma.medicalConsent.upsert.mockResolvedValue({ id: '1' });
    mockPrisma.medicalConsent.findMany.mockResolvedValue([]);
    mockPrisma.ingredient.create.mockResolvedValue({ id: '1' });
    mockPrisma.ingredient.findMany.mockResolvedValue([]);
    mockPrisma.drugFoodInteraction.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
    mockPrisma.medicalProfile.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.medicalDataDeletion.create.mockResolvedValue({ id: '1' });
    mockPrisma.medicalDataAccessLog.create.mockResolvedValue({ id: '1' });
  });

  it('should not throw when calling createOrUpdateMedicalProfile', async () => {
    await expect(medicalService.createOrUpdateMedicalProfile('user-1', {
      allergies: [],
      chronicConditions: []
    })).resolves.not.toThrow();
  });

  it('should not throw when calling getMedicalProfile', async () => {
    await expect(medicalService.getMedicalProfile('user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling checkItemForMedicalAlerts', async () => {
    await expect(medicalService.checkItemForMedicalAlerts('user-1', {
      menuItemId: 'item-1',
      ingredients: ['flour', 'eggs']
    })).resolves.not.toThrow();
  });

  it('should not throw when calling reportMedicalIncident', async () => {
    await expect(medicalService.reportMedicalIncident('user-1', {
      severity: 'MODERATE',
      description: 'Test Incident'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling triggerEmergencyProtocol', async () => {
    const incident = { id: '1', severity: 'SEVERE', description: 'Test' };
    await expect(medicalService.triggerEmergencyProtocol('user-1', incident)).resolves.not.toThrow();
  });

  it('should not throw when calling notifyEmergencyContact', async () => {
    const emergencyContact = { name: 'Test', phone: '123456' };
    const incident = { id: '1', description: 'Test' };
    await expect(medicalService.notifyEmergencyContact(emergencyContact, 'user-1', incident)).resolves.not.toThrow();
  });

  it('should not throw when calling getMedicalIncidents', async () => {
    await expect(medicalService.getMedicalIncidents('user-1', {
      page: 1,
      limit: 10
    })).resolves.not.toThrow();
  });

  it('should not throw when calling updateMedicalConsent', async () => {
    await expect(medicalService.updateMedicalConsent('user-1', {
      consentType: 'DATA_PROCESSING',
      granted: true
    })).resolves.not.toThrow();
  });

  it('should not throw when calling getMedicalConsent', async () => {
    await expect(medicalService.getMedicalConsent('user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling addIngredient', async () => {
    await expect(medicalService.addIngredient({
      name: 'Test Ingredient',
      category: 'VEGETABLE'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling searchIngredients', async () => {
    await expect(medicalService.searchIngredients({
      query: 'test'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling exportUserMedicalData', async () => {
    await expect(medicalService.exportUserMedicalData('user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling deleteMedicalData', async () => {
    await expect(medicalService.deleteMedicalData('user-1')).resolves.not.toThrow();
  });
});
