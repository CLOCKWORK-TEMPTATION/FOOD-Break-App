/**
 * Tests for PaymentMethod Model
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');

describe('PaymentMethod Model', () => {
  let mockPrisma;
  const PaymentMethod = require('../PaymentMethod');

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      paymentMethod: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('createPaymentMethod', () => {
    it('should create payment method successfully', async () => {
      const methodData = {
        userId: 'user123',
        type: 'CREDIT_CARD',
        provider: 'STRIPE',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025
      };

      mockPrisma.paymentMethod.create.mockResolvedValue({
        id: 'method123',
        ...methodData,
        isDefault: false,
        createdAt: new Date()
      });

      const method = await PaymentMethod.create(methodData);

      expect(method).toHaveProperty('id');
      expect(method.type).toBe('CREDIT_CARD');
      expect(method.last4).toBe('4242');
    });

    it('should set as default if specified', async () => {
      const methodData = {
        userId: 'user123',
        type: 'CREDIT_CARD',
        isDefault: true
      };

      mockPrisma.paymentMethod.create.mockResolvedValue({
        id: 'method123',
        ...methodData
      });

      const method = await PaymentMethod.create(methodData);

      expect(method.isDefault).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find payment method by ID', async () => {
      const methodId = 'method123';

      mockPrisma.paymentMethod.findUnique.mockResolvedValue({
        id: methodId,
        type: 'CREDIT_CARD',
        last4: '4242'
      });

      const method = await PaymentMethod.findById(methodId);

      expect(method.id).toBe(methodId);
    });

    it('should return null if not found', async () => {
      mockPrisma.paymentMethod.findUnique.mockResolvedValue(null);

      const method = await PaymentMethod.findById('invalid_id');

      expect(method).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find all payment methods for user', async () => {
      const userId = 'user123';

      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        { id: 'method1', userId, type: 'CREDIT_CARD', last4: '4242' },
        { id: 'method2', userId, type: 'PAYPAL', email: 'user@example.com' }
      ]);

      const methods = await PaymentMethod.findByUser(userId);

      expect(Array.isArray(methods)).toBe(true);
      expect(methods.length).toBe(2);
    });

    it('should filter by active status', async () => {
      const userId = 'user123';

      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        { id: 'method1', userId, isActive: true }
      ]);

      await PaymentMethod.findByUser(userId, true);

      expect(mockPrisma.paymentMethod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            isActive: true
          })
        })
      );
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should get default payment method for user', async () => {
      const userId = 'user123';

      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        { id: 'method1', userId, isDefault: true, type: 'CREDIT_CARD' }
      ]);

      const defaultMethod = await PaymentMethod.getDefault(userId);

      expect(defaultMethod).toHaveProperty('isDefault', true);
    });

    it('should return null if no default method exists', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([]);

      const defaultMethod = await PaymentMethod.getDefault('user123');

      expect(defaultMethod).toBeNull();
    });
  });

  describe('setAsDefault', () => {
    it('should set payment method as default', async () => {
      const methodId = 'method123';
      const userId = 'user123';

      // First, unset other defaults
      mockPrisma.paymentMethod.update.mockResolvedValue({
        id: methodId,
        isDefault: true
      });

      const updated = await PaymentMethod.setAsDefault(methodId, userId);

      expect(updated.isDefault).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete payment method', async () => {
      const methodId = 'method123';

      mockPrisma.paymentMethod.delete.mockResolvedValue({
        id: methodId
      });

      const deleted = await PaymentMethod.delete(methodId);

      expect(deleted.id).toBe(methodId);
    });
  });

  describe('isExpired', () => {
    it('should return true if card is expired', () => {
      const expiredCard = {
        expiryMonth: 12,
        expiryYear: 2023
      };

      expect(PaymentMethod.isExpired(expiredCard)).toBe(true);
    });

    it('should return false if card is not expired', () => {
      const validCard = {
        expiryMonth: 12,
        expiryYear: 2030
      };

      expect(PaymentMethod.isExpired(validCard)).toBe(false);
    });

    it('should handle current month/year correctly', () => {
      const now = new Date();
      const currentCard = {
        expiryMonth: now.getMonth() + 1,
        expiryYear: now.getFullYear()
      };

      // Should not be expired if it's the current month
      expect(PaymentMethod.isExpired(currentCard)).toBe(false);
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card number correctly', () => {
      const cardNumber = '4242424242424242';

      const masked = PaymentMethod.maskCardNumber(cardNumber);

      expect(masked).toBe('**** **** **** 4242');
    });

    it('should handle short card numbers', () => {
      const cardNumber = '4242';

      const masked = PaymentMethod.maskCardNumber(cardNumber);

      expect(masked).toContain('4242');
    });
  });

  describe('validateCardExpiry', () => {
    it('should validate valid expiry date', () => {
      const isValid = PaymentMethod.validateCardExpiry(12, 2030);

      expect(isValid).toBe(true);
    });

    it('should reject expired date', () => {
      const isValid = PaymentMethod.validateCardExpiry(12, 2020);

      expect(isValid).toBe(false);
    });

    it('should reject invalid month', () => {
      const isValid = PaymentMethod.validateCardExpiry(13, 2030);

      expect(isValid).toBe(false);
    });

    it('should reject invalid month (0)', () => {
      const isValid = PaymentMethod.validateCardExpiry(0, 2030);

      expect(isValid).toBe(false);
    });
  });

  describe('getCardBrand', () => {
    it('should detect Visa', () => {
      const brand = PaymentMethod.getCardBrand('4242424242424242');

      expect(brand).toBe('VISA');
    });

    it('should detect Mastercard', () => {
      const brand = PaymentMethod.getCardBrand('5555555555554444');

      expect(brand).toBe('MASTERCARD');
    });

    it('should detect American Express', () => {
      const brand = PaymentMethod.getCardBrand('378282246310005');

      expect(brand).toBe('AMEX');
    });

    it('should return UNKNOWN for unrecognized patterns', () => {
      const brand = PaymentMethod.getCardBrand('1234567890123456');

      expect(brand).toBe('UNKNOWN');
    });
  });
});
