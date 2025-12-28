/**
 * Tests for Medical Service
 */

jest.mock('@prisma/client');
jest.mock('../notificationService');

const { PrismaClient } = require('@prisma/client');
const medicalService = require('../medicalService');
const notificationService = require('../notificationService');

describe('Medical Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      medicalCondition: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      medication: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn()
      },
      emergencyContact: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      user: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
    notificationService.sendEmergencyAlert = jest.fn().mockResolvedValue();
  });

  describe('addMedicalCondition', () => {
    it('should add medical condition successfully', async () => {
      const userId = 'user123';
      const conditionData = {
        name: 'Diabetes',
        severity: 'HIGH',
        notes: 'Type 2 diabetes'
      };

      mockPrisma.medicalCondition.create.mockResolvedValue({
        id: 'condition123',
        userId,
        ...conditionData
      });

      const condition = await medicalService.addMedicalCondition(
        userId,
        conditionData
      );

      expect(condition).toHaveProperty('id');
      expect(condition.name).toBe('Diabetes');
    });
  });

  describe('getMedicalConditions', () => {
    it('should get all medical conditions for user', async () => {
      const userId = 'user123';

      mockPrisma.medicalCondition.findMany.mockResolvedValue([
        { id: 'cond1', name: 'Diabetes', severity: 'HIGH' },
        { id: 'cond2', name: 'Hypertension', severity: 'MEDIUM' }
      ]);

      const conditions = await medicalService.getMedicalConditions(userId);

      expect(Array.isArray(conditions)).toBe(true);
      expect(conditions.length).toBe(2);
    });

    it('should filter by active status', async () => {
      const userId = 'user123';

      mockPrisma.medicalCondition.findMany.mockResolvedValue([
        { id: 'cond1', name: 'Diabetes', isActive: true }
      ]);

      const conditions = await medicalService.getMedicalConditions(
        userId,
        true
      );

      expect(mockPrisma.medicalCondition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            isActive: true
          })
        })
      );
    });
  });

  describe('updateMedicalCondition', () => {
    it('should update medical condition', async () => {
      const conditionId = 'condition123';
      const updateData = { severity: 'MEDIUM', notes: 'Improved' };

      mockPrisma.medicalCondition.update.mockResolvedValue({
        id: conditionId,
        ...updateData
      });

      const updated = await medicalService.updateMedicalCondition(
        conditionId,
        updateData
      );

      expect(updated.severity).toBe('MEDIUM');
    });
  });

  describe('deleteMedicalCondition', () => {
    it('should delete medical condition', async () => {
      const conditionId = 'condition123';

      mockPrisma.medicalCondition.delete.mockResolvedValue({
        id: conditionId
      });

      const deleted = await medicalService.deleteMedicalCondition(conditionId);

      expect(deleted).toHaveProperty('id');
    });
  });

  describe('addMedication', () => {
    it('should add medication successfully', async () => {
      const userId = 'user123';
      const medicationData = {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily'
      };

      mockPrisma.medication.create.mockResolvedValue({
        id: 'med123',
        userId,
        ...medicationData
      });

      const medication = await medicalService.addMedication(
        userId,
        medicationData
      );

      expect(medication).toHaveProperty('id');
      expect(medication.name).toBe('Metformin');
    });
  });

  describe('getMedications', () => {
    it('should get all medications for user', async () => {
      const userId = 'user123';

      mockPrisma.medication.findMany.mockResolvedValue([
        { id: 'med1', name: 'Metformin', dosage: '500mg' },
        { id: 'med2', name: 'Aspirin', dosage: '100mg' }
      ]);

      const medications = await medicalService.getMedications(userId);

      expect(Array.isArray(medications)).toBe(true);
      expect(medications.length).toBe(2);
    });
  });

  describe('addEmergencyContact', () => {
    it('should add emergency contact successfully', async () => {
      const userId = 'user123';
      const contactData = {
        name: 'John Doe',
        relationship: 'Spouse',
        phoneNumber: '+201234567890'
      };

      mockPrisma.emergencyContact.create.mockResolvedValue({
        id: 'contact123',
        userId,
        ...contactData
      });

      const contact = await medicalService.addEmergencyContact(
        userId,
        contactData
      );

      expect(contact).toHaveProperty('id');
      expect(contact.name).toBe('John Doe');
    });

    it('should set primary contact when specified', async () => {
      const userId = 'user123';
      const contactData = {
        name: 'Jane Doe',
        relationship: 'Sister',
        phoneNumber: '+201234567891',
        isPrimary: true
      };

      mockPrisma.emergencyContact.create.mockResolvedValue({
        id: 'contact123',
        userId,
        ...contactData
      });

      const contact = await medicalService.addEmergencyContact(
        userId,
        contactData
      );

      expect(contact.isPrimary).toBe(true);
    });
  });

  describe('getEmergencyContacts', () => {
    it('should get all emergency contacts for user', async () => {
      const userId = 'user123';

      mockPrisma.emergencyContact.findMany.mockResolvedValue([
        { id: 'contact1', name: 'John Doe', isPrimary: true },
        { id: 'contact2', name: 'Jane Doe', isPrimary: false }
      ]);

      const contacts = await medicalService.getEmergencyContacts(userId);

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBe(2);
    });
  });

  describe('triggerEmergencyAlert', () => {
    it('should trigger emergency alert', async () => {
      const userId = 'user123';
      const location = { latitude: 30.0444, longitude: 31.2357 };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        firstName: 'Ahmed',
        lastName: 'Mohamed'
      });

      mockPrisma.emergencyContact.findMany.mockResolvedValue([
        {
          id: 'contact1',
          name: 'Emergency Contact',
          phoneNumber: '+201234567890'
        }
      ]);

      const result = await medicalService.triggerEmergencyAlert(
        userId,
        location,
        'Medical emergency'
      );

      expect(result).toHaveProperty('alertSent');
      expect(notificationService.sendEmergencyAlert).toHaveBeenCalled();
    });

    it('should handle missing emergency contacts', async () => {
      const userId = 'user123';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        firstName: 'Ahmed',
        lastName: 'Mohamed'
      });

      mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

      await expect(
        medicalService.triggerEmergencyAlert(userId, {}, 'Emergency')
      ).rejects.toThrow();
    });
  });

  describe('checkMedicationInteractions', () => {
    it('should check for medication interactions', async () => {
      const userId = 'user123';
      const newMedication = 'Warfarin';

      mockPrisma.medication.findMany.mockResolvedValue([
        { name: 'Aspirin' },
        { name: 'Ibuprofen' }
      ]);

      const interactions = await medicalService.checkMedicationInteractions(
        userId,
        newMedication
      );

      expect(Array.isArray(interactions)).toBe(true);
    });
  });

  describe('getMedicalHistory', () => {
    it('should get complete medical history', async () => {
      const userId = 'user123';

      mockPrisma.medicalCondition.findMany.mockResolvedValue([
        { name: 'Diabetes' }
      ]);

      mockPrisma.medication.findMany.mockResolvedValue([
        { name: 'Metformin' }
      ]);

      mockPrisma.emergencyContact.findMany.mockResolvedValue([
        { name: 'John Doe' }
      ]);

      const history = await medicalService.getMedicalHistory(userId);

      expect(history).toHaveProperty('conditions');
      expect(history).toHaveProperty('medications');
      expect(history).toHaveProperty('emergencyContacts');
    });
  });

  describe('validateMedicationDosage', () => {
    it('should validate safe dosage', () => {
      const medication = 'Aspirin';
      const dosage = '100mg';

      const isValid = medicalService.validateMedicationDosage(
        medication,
        dosage
      );

      expect(typeof isValid).toBe('boolean');
    });

    it('should flag dangerous dosage', () => {
      const medication = 'Aspirin';
      const dosage = '10000mg'; // Unrealistic dosage

      const isValid = medicalService.validateMedicationDosage(
        medication,
        dosage
      );

      expect(typeof isValid).toBe('boolean');
    });
  });
});
