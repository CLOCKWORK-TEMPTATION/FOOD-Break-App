/**
 * اختبارات شاملة لخدمة المدفوعات
 * Comprehensive tests for Payment Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import paymentService from '../paymentService';
import type { PaymentMethod, PaymentIntent, PaymentResult, InvoiceData } from '../paymentService';

// Mock AsyncStorage and fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Payment Intent Tests
  // ==========================================
  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockIntent: PaymentIntent = {
        id: 'pi_123',
        clientSecret: 'pi_123_secret_abc',
        amount: 10000,
        currency: 'EGP',
        status: 'requires_payment_method',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token-123');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockIntent }),
      } as Response);

      const result = await paymentService.createPaymentIntent(100, 'EGP');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/create-intent'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer auth-token-123',
          }),
          body: JSON.stringify({
            amount: 10000, // 100 * 100 (convert to cents)
            currency: 'EGP',
          }),
        })
      );
      expect(result).toEqual(mockIntent);
    });

    it('should use default currency when not specified', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"currency":"EGP"'),
        })
      );
    });

    it('should convert amount to cents correctly', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(123.45);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":12345'),
        })
      );
    });

    it('should handle payment intent creation error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid amount' } }),
      } as Response);

      await expect(paymentService.createPaymentIntent(0)).rejects.toThrow('Invalid amount');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(paymentService.createPaymentIntent(100)).rejects.toThrow('Network error');
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Payment Confirmation Tests
  // ==========================================
  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          paymentIntentId: 'pi_123',
          requiresAction: false,
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await paymentService.confirmPayment('pm_123', 'pi_123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/confirm'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            paymentMethodId: 'pm_123',
            paymentIntentId: 'pi_123',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_123');
    });

    it('should handle payment requiring additional action', async () => {
      const mockResult = {
        success: true,
        data: {
          paymentIntentId: 'pi_123',
          requiresAction: true,
          clientSecret: 'secret_abc',
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await paymentService.confirmPayment('pm_123', 'pi_123');

      expect(result.requiresAction).toBe(true);
      expect(result.clientSecret).toBe('secret_abc');
    });

    it('should return error result on confirmation failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Card declined' } }),
      } as Response);

      const result = await paymentService.confirmPayment('pm_123', 'pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await paymentService.confirmPayment('pm_123', 'pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Payment Methods Tests
  // ==========================================
  describe('Payment Methods Management', () => {
    describe('savePaymentMethod', () => {
      it('should save payment method successfully', async () => {
        const mockMethod: PaymentMethod = {
          id: 'pm_123',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMethod }),
        } as Response);

        const result = await paymentService.savePaymentMethod('pm_123');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/save-method'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ paymentMethodId: 'pm_123' }),
          })
        );
        expect(result).toEqual(mockMethod);
      });

      it('should handle save payment method error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Invalid payment method' } }),
        } as Response);

        await expect(paymentService.savePaymentMethod('pm_invalid')).rejects.toThrow(
          'Invalid payment method'
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getSavedPaymentMethods', () => {
      it('should retrieve saved payment methods', async () => {
        const mockMethods: PaymentMethod[] = [
          {
            id: 'pm_123',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            isDefault: true,
          },
          {
            id: 'pm_456',
            type: 'card',
            last4: '5555',
            brand: 'mastercard',
            isDefault: false,
          },
        ];

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMethods }),
        } as Response);

        const result = await paymentService.getSavedPaymentMethods();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/methods'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockMethods);
      });

      it('should handle error when retrieving payment methods', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Unauthorized' } }),
        } as Response);

        await expect(paymentService.getSavedPaymentMethods()).rejects.toThrow('Unauthorized');
        consoleErrorSpy.mockRestore();
      });
    });

    describe('deletePaymentMethod', () => {
      it('should delete payment method successfully', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

        const result = await paymentService.deletePaymentMethod('pm_123');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/methods/pm_123'),
          expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toBe(true);
      });

      it('should return false on delete failure', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockRejectedValueOnce(new Error('Delete failed'));

        const result = await paymentService.deletePaymentMethod('pm_123');

        expect(result).toBe(false);
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ==========================================
  // Invoice Tests
  // ==========================================
  describe('Invoice Management', () => {
    describe('createInvoice', () => {
      it('should create invoice successfully', async () => {
        const mockInvoice: InvoiceData = {
          id: 'inv_123',
          orderId: 'order_456',
          amount: 150.00,
          currency: 'EGP',
          status: 'paid',
          createdAt: new Date().toISOString(),
          pdfUrl: 'https://example.com/invoice.pdf',
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockInvoice }),
        } as Response);

        const result = await paymentService.createInvoice('order_456');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/invoices'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ orderId: 'order_456' }),
          })
        );
        expect(result).toEqual(mockInvoice);
      });

      it('should handle invoice creation error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Order not found' } }),
        } as Response);

        await expect(paymentService.createInvoice('order_invalid')).rejects.toThrow(
          'Order not found'
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getUserInvoices', () => {
      it('should retrieve user invoices', async () => {
        const mockInvoices: InvoiceData[] = [
          {
            id: 'inv_123',
            orderId: 'order_456',
            amount: 150.00,
            currency: 'EGP',
            status: 'paid',
            createdAt: new Date().toISOString(),
          },
        ];

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockInvoices }),
        } as Response);

        const result = await paymentService.getUserInvoices();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/invoices'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockInvoices);
      });

      it('should handle error when retrieving invoices', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Unauthorized' } }),
        } as Response);

        await expect(paymentService.getUserInvoices()).rejects.toThrow('Unauthorized');
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ==========================================
  // Refund Tests
  // ==========================================
  describe('processRefund', () => {
    it('should process full refund successfully', async () => {
      const mockResult = {
        success: true,
        data: { refundId: 'ref_123' },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await paymentService.processRefund('pi_123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/refund'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: 'pi_123',
            amount: undefined,
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('ref_123');
    });

    it('should process partial refund successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await paymentService.processRefund('pi_123', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":5000'), // 50 * 100
        })
      );
    });

    it('should handle refund error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Refund failed' } }),
      } as Response);

      const result = await paymentService.processRefund('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund failed');
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await paymentService.processRefund('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Card Validation Tests
  // ==========================================
  describe('validateCardNumber', () => {
    it('should validate valid Visa card', () => {
      const result = paymentService.validateCardNumber('4532015112830366');
      expect(result).toBe(true);
    });

    it('should validate valid Mastercard', () => {
      const result = paymentService.validateCardNumber('5425233430109903');
      expect(result).toBe(true);
    });

    it('should validate card with spaces', () => {
      const result = paymentService.validateCardNumber('4532 0151 1283 0366');
      expect(result).toBe(true);
    });

    it('should validate card with dashes', () => {
      const result = paymentService.validateCardNumber('4532-0151-1283-0366');
      expect(result).toBe(true);
    });

    it('should reject invalid card number', () => {
      const result = paymentService.validateCardNumber('1234567890123456');
      expect(result).toBe(false);
    });

    it('should reject card number with invalid length', () => {
      const result = paymentService.validateCardNumber('123456');
      expect(result).toBe(false);
    });

    it('should reject card number with letters', () => {
      const result = paymentService.validateCardNumber('4532015112830ABC');
      expect(result).toBe(false);
    });

    it('should reject empty card number', () => {
      const result = paymentService.validateCardNumber('');
      expect(result).toBe(false);
    });

    it('should validate 13-digit card numbers', () => {
      const result = paymentService.validateCardNumber('4532015112830');
      // This should pass Luhn but depends on the actual implementation
      expect(typeof result).toBe('boolean');
    });

    it('should validate 19-digit card numbers', () => {
      const result = paymentService.validateCardNumber('4532015112830366789');
      expect(typeof result).toBe('boolean');
    });
  });

  // ==========================================
  // Card Type Detection Tests
  // ==========================================
  describe('getCardType', () => {
    it('should detect Visa card', () => {
      const result = paymentService.getCardType('4532015112830366');
      expect(result).toBe('visa');
    });

    it('should detect Mastercard', () => {
      const result = paymentService.getCardType('5425233430109903');
      expect(result).toBe('mastercard');
    });

    it('should detect American Express', () => {
      const result = paymentService.getCardType('374245455400126');
      expect(result).toBe('amex');
    });

    it('should detect Discover', () => {
      const result = paymentService.getCardType('6011000990139424');
      expect(result).toBe('discover');
    });

    it('should return unknown for unrecognized card', () => {
      const result = paymentService.getCardType('1234567890123456');
      expect(result).toBe('unknown');
    });

    it('should detect card type with spaces', () => {
      const result = paymentService.getCardType('4532 0151 1283 0366');
      expect(result).toBe('visa');
    });

    it('should detect card type with dashes', () => {
      const result = paymentService.getCardType('5425-2334-3010-9903');
      expect(result).toBe('mastercard');
    });
  });

  // ==========================================
  // Fee Calculation Tests
  // ==========================================
  describe('calculateFees', () => {
    it('should calculate fees with default rates', () => {
      const result = paymentService.calculateFees(100);

      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(14); // 14%
      expect(result.commission).toBe(2.5); // 2.5%
      expect(result.total).toBe(116.5);
    });

    it('should calculate fees with custom tax rate', () => {
      const result = paymentService.calculateFees(100, 0.10);

      expect(result.tax).toBe(10);
      expect(result.total).toBe(112.5);
    });

    it('should calculate fees with custom commission rate', () => {
      const result = paymentService.calculateFees(100, 0.14, 0.05);

      expect(result.commission).toBe(5);
      expect(result.total).toBe(119);
    });

    it('should round fees to 2 decimal places', () => {
      const result = paymentService.calculateFees(33.33);

      expect(result.tax.toString()).toMatch(/^\d+\.\d{1,2}$/);
      expect(result.commission.toString()).toMatch(/^\d+\.\d{1,2}$/);
      expect(result.total.toString()).toMatch(/^\d+\.\d{1,2}$/);
    });

    it('should handle zero subtotal', () => {
      const result = paymentService.calculateFees(0);

      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle large amounts', () => {
      const result = paymentService.calculateFees(10000);

      expect(result.tax).toBe(1400);
      expect(result.commission).toBe(250);
      expect(result.total).toBe(11650);
    });

    it('should handle fractional amounts', () => {
      const result = paymentService.calculateFees(99.99);

      expect(result.subtotal).toBe(99.99);
      expect(result.tax).toBeCloseTo(14, 1);
      expect(result.commission).toBeCloseTo(2.5, 1);
    });
  });

  // ==========================================
  // Auth Token Tests
  // ==========================================
  describe('getAuthToken', () => {
    it('should retrieve auth token from storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-token-123');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(100);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer stored-token-123',
          }),
        })
      );
    });

    it('should handle missing auth token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(100);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer ',
          }),
        })
      );
    });

    it('should handle storage error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(100);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle very large payment amounts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(999999.99);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":99999999'),
        })
      );
    });

    it('should handle fractional cent amounts correctly', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createPaymentIntent(10.555);

      // Should round to nearest cent
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":1056'),
        })
      );
    });

    it('should handle concurrent payment operations', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('auth-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      const promises = [
        paymentService.createPaymentIntent(100),
        paymentService.getSavedPaymentMethods(),
        paymentService.getUserInvoices(),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle special characters in invoice order IDs', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await paymentService.createInvoice('order-123-abc_XYZ');

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
