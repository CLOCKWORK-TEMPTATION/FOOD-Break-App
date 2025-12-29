/**
 * Invoice Service Tests
 * اختبارات خدمة الفواتير
 */

const invoiceService = require('../../../src/services/invoiceService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Invoice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInvoice', () => {
    it('should generate invoice for order', async () => {
      const mockOrder = {
        id: 'order-123',
        total: 100,
        userId: 'user-123',
        orderItems: []
      };
      global.mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      global.mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-123', orderId: 'order-123' });

      const result = await invoiceService.generateInvoice('order-123');

      expect(result).toHaveProperty('id');
      expect(global.mockPrisma.invoice.create).toHaveBeenCalled();
    });
  });

  describe('getInvoiceById', () => {
    it('should get invoice by id', async () => {
      const mockInvoice = { id: 'inv-123', orderId: 'order-123' };
      global.mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await invoiceService.getInvoiceById('inv-123');

      expect(result).toEqual(mockInvoice);
    });
  });

  describe('getUserInvoices', () => {
    it('should get all invoices for user', async () => {
      const mockInvoices = [{ id: 'inv-1' }, { id: 'inv-2' }];
      global.mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await invoiceService.getUserInvoices('user-123');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should send invoice via email', async () => {
      global.mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-123',
        order: { user: { email: 'test@test.com' } }
      });

      await invoiceService.sendInvoiceEmail('inv-123');

      expect(global.mockPrisma.invoice.findUnique).toHaveBeenCalled();
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF for invoice', async () => {
      global.mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-123',
        orderId: 'order-123'
      });

      const result = await invoiceService.generatePDF('inv-123');

      expect(result).toBeDefined();
    });
  });
});
