/**
 * Tests for Medical Controller
 */

jest.mock('../../services/medicalService');

const medicalController = require('../medicalController');
const medicalService = require('../../services/medicalService');

describe('Medical Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('addMedicalCondition', () => {
    it('should add medical condition successfully', async () => {
      req.body = {
        name: 'Diabetes',
        severity: 'HIGH',
        diagnosedDate: '2024-01-01',
        notes: 'Type 2 diabetes'
      };

      medicalService.addMedicalCondition = jest.fn().mockResolvedValue({
        id: 'condition123',
        userId: 'user123',
        ...req.body
      });

      await medicalController.addMedicalCondition(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getMedicalConditions', () => {
    it('should get all medical conditions', async () => {
      medicalService.getMedicalConditions = jest.fn().mockResolvedValue([
        { id: 'cond1', name: 'Diabetes', severity: 'HIGH' },
        { id: 'cond2', name: 'Hypertension', severity: 'MEDIUM' }
      ]);

      await medicalController.getMedicalConditions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('addMedication', () => {
    it('should add medication successfully', async () => {
      req.body = {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        startDate: '2024-01-01'
      };

      medicalService.addMedication = jest.fn().mockResolvedValue({
        id: 'med123',
        userId: 'user123',
        ...req.body
      });

      await medicalController.addMedication(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getMedications', () => {
    it('should get all medications', async () => {
      medicalService.getMedications = jest.fn().mockResolvedValue([
        { id: 'med1', name: 'Metformin', dosage: '500mg' },
        { id: 'med2', name: 'Aspirin', dosage: '100mg' }
      ]);

      await medicalController.getMedications(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('addEmergencyContact', () => {
    it('should add emergency contact', async () => {
      req.body = {
        name: 'John Doe',
        relationship: 'Spouse',
        phoneNumber: '+201234567890',
        isPrimary: true
      };

      medicalService.addEmergencyContact = jest.fn().mockResolvedValue({
        id: 'contact123',
        userId: 'user123',
        ...req.body
      });

      await medicalController.addEmergencyContact(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getEmergencyContacts', () => {
    it('should get emergency contacts', async () => {
      medicalService.getEmergencyContacts = jest.fn().mockResolvedValue([
        { id: 'contact1', name: 'John Doe', isPrimary: true },
        { id: 'contact2', name: 'Jane Doe', isPrimary: false }
      ]);

      await medicalController.getEmergencyContacts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('triggerEmergencyAlert', () => {
    it('should trigger emergency alert', async () => {
      req.body = {
        location: { latitude: 30.0444, longitude: 31.2357 },
        message: 'Medical emergency'
      };

      medicalService.triggerEmergencyAlert = jest.fn().mockResolvedValue({
        alertSent: true,
        contactsNotified: 2
      });

      await medicalController.triggerEmergencyAlert(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getMedicalHistory', () => {
    it('should get complete medical history', async () => {
      medicalService.getMedicalHistory = jest.fn().mockResolvedValue({
        conditions: [{ name: 'Diabetes' }],
        medications: [{ name: 'Metformin' }],
        emergencyContacts: [{ name: 'John Doe' }]
      });

      await medicalController.getMedicalHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});
