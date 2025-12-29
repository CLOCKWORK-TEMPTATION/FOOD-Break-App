/**
 * Tests for Invoice Model
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');

describe('Invoice Model', () => {
  let mockPrisma;
  const Invoice = require('../Invoice');

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      invoice: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = {
        userId: 'user123',
        orderId: 'order123',
        amount: 500,
        currency: 'EGP',
        invoiceNumber: 'INV-2025-001'
      };

      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice123',
        ...invoiceData,
        createdAt: new Date()
      });

      const invoice = await Invoice.create(invoiceData);

      expect(invoice).toHaveProperty('id');
      expect(invoice.amount).toBe(500);
      expect(invoice.invoiceNumber).toBe('INV-2025-001');
    });

    it('should generate invoice number if not provided', async () => {
      const invoiceData = {
        userId: 'user123',
        amount: 500
      };

      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice123',
        ...invoiceData,
        invoiceNumber: 'INV-2025-001'
      });

      const invoice = await Invoice.create(invoiceData);

      expect(invoice).toHaveProperty('invoiceNumber');
    });
  });

  describe('findById', () => {
    it('should find invoice by ID', async () => {
      const invoiceId = 'invoice123';

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        invoiceNumber: 'INV-2025-001',
        amount: 500
      });

      const invoice = await Invoice.findById(invoiceId);

      expect(invoice.id).toBe(invoiceId);
      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId }
      });
    });

    it('should return null if invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const invoice = await Invoice.findById('invalid_id');

      expect(invoice).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find all invoices for user', async () => {
      const userId = 'user123';

      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'invoice1', userId, amount: 500 },
        { id: 'invoice2', userId, amount: 300 }
      ]);

      const invoices = await Invoice.findByUser(userId);

      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should update invoice', async () => {
      const invoiceId = 'invoice123';
      const updateData = { status: 'PAID', paidAt: new Date() };

      mockPrisma.invoice.update.mockResolvedValue({
        id: invoiceId,
        ...updateData
      });

      const updated = await Invoice.update(invoiceId, updateData);

      expect(updated.status).toBe('PAID');
      expect(updated).toHaveProperty('paidAt');
    });
  });

  describe('delete', () => {
    it('should delete invoice', async () => {
      const invoiceId = 'invoice123';

      mockPrisma.invoice.delete.mockResolvedValue({
        id: invoiceId
      });

      const deleted = await Invoice.delete(invoiceId);

      expect(deleted.id).toBe(invoiceId);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate invoice total correctly', () => {
      const items = [
        { quantity: 2, price: 50 },
        { quantity: 1, price: 100 },
        { quantity: 3, price: 25 }
      ];

      const total = Invoice.calculateTotal(items);

      expect(total).toBe(275); // (2*50) + (1*100) + (3*25)
    });

    it('should handle empty items array', () => {
      const total = Invoice.calculateTotal([]);

      expect(total).toBe(0);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate unique invoice number', () => {
      const invoiceNumber = Invoice.generateInvoiceNumber();

      expect(invoiceNumber).toMatch(/^INV-\d{4}-\d+$/);
    });

    it('should include current year', () => {
      const invoiceNumber = Invoice.generateInvoiceNumber();
      const currentYear = new Date().getFullYear();

      expect(invoiceNumber).toContain(currentYear.toString());
    });
  });

  describe('isPaid', () => {
    it('should return true if invoice is paid', () => {
      const paidInvoice = {
        status: 'PAID',
        paidAt: new Date()
      };

      expect(Invoice.isPaid(paidInvoice)).toBe(true);
    });

    it('should return false if invoice is not paid', () => {
      const unpaidInvoice = {
        status: 'PENDING',
        paidAt: null
      };

      expect(Invoice.isPaid(unpaidInvoice)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true if invoice is overdue', () => {
      const overdueInvoice = {
        dueDate: new Date('2024-01-01'),
        status: 'PENDING'
      };

      expect(Invoice.isOverdue(overdueInvoice)).toBe(true);
    });

    it('should return false if invoice is not overdue', () => {
      const futureInvoice = {
        dueDate: new Date('2026-12-31'),
        status: 'PENDING'
      };

      expect(Invoice.isOverdue(futureInvoice)).toBe(false);
    });

    it('should return false if invoice is paid', () => {
      const paidInvoice = {
        dueDate: new Date('2024-01-01'),
        status: 'PAID'
      };

      expect(Invoice.isOverdue(paidInvoice)).toBe(false);
    });
  });
});
