/**
 * Smoke Tests - Invoice Service
 * اختبارات بسيطة للتغطية السريعة
 */

const invoiceService = require('../invoiceService');

jest.mock('@prisma/client');

describe('InvoiceService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    mockPrisma.invoice.count.mockResolvedValue(0);
    mockPrisma.invoice.create.mockResolvedValue({
      id: '1',
      invoiceNumber: 'INV-202401-0001',
      totalAmount: 100
    });
    mockPrisma.invoice.update.mockResolvedValue({ id: '1' });
    mockPrisma.invoice.findMany.mockResolvedValue([]);
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: '1',
      invoiceNumber: 'INV-202401-0001'
    });
    mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000 } });
    mockPrisma.invoice.delete.mockResolvedValue({ id: '1' });
  });

  it('should not throw when calling createInvoice', async () => {
    await expect(invoiceService.createInvoice({
      userId: 'user-1',
      amount: 100
    })).resolves.not.toThrow();
  });

  it('should not throw when calling generateInvoiceNumber', async () => {
    await expect(invoiceService.generateInvoiceNumber()).resolves.not.toThrow();
  });

  it('should not throw when calling updateInvoiceStatus', async () => {
    await expect(invoiceService.updateInvoiceStatus('invoice-1', 'PAID')).resolves.not.toThrow();
  });

  it('should not throw when calling getUserInvoices', async () => {
    await expect(invoiceService.getUserInvoices('user-1', {})).resolves.not.toThrow();
  });

  it('should not throw when calling getInvoiceById', async () => {
    await expect(invoiceService.getInvoiceById('invoice-1')).resolves.not.toThrow();
  });

  it('should not throw when calling getInvoiceByNumber', async () => {
    await expect(invoiceService.getInvoiceByNumber('INV-202401-0001')).resolves.not.toThrow();
  });

  it('should not throw when calling getInvoiceStatistics', async () => {
    await expect(invoiceService.getInvoiceStatistics({})).resolves.not.toThrow();
  });

  it('should not throw when calling deleteInvoice', async () => {
    await expect(invoiceService.deleteInvoice('invoice-1')).resolves.not.toThrow();
  });
});
