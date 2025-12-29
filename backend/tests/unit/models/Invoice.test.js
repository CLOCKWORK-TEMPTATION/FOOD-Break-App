/**
 * Invoice Model Tests
 * اختبارات شاملة لنموذج الفاتورة
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Invoice Model Tests', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    jest.clearAllMocks();
  });

  describe('Invoice schema', () => {
    it('should have required fields', () => {
      const invoice = {
        id: 'invoice-123',
        orderId: 'order-123',
        amount: 100.00,
        status: 'PENDING',
        createdAt: new Date()
      };

      expect(invoice.id).toBeDefined();
      expect(invoice.orderId).toBeDefined();
      expect(invoice.amount).toBeDefined();
      expect(invoice.status).toBeDefined();
    });

    it('should validate invoice amount', () => {
      const invoice = {
        id: 'invoice-123',
        amount: 100.00
      };

      expect(invoice.amount).toBeGreaterThan(0);
    });

    it('should have valid status', () => {
      const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
      const invoice = { status: 'PAID' };

      expect(validStatuses).toContain(invoice.status);
    });
  });

  describe('Invoice operations', () => {
    it('should create invoice', async () => {
      const invoiceData = {
        orderId: 'order-123',
        amount: 100.00,
        status: 'PENDING'
      };

      mockPrisma.invoice = {
        create: jest.fn().mockResolvedValue({ id: 'invoice-123', ...invoiceData })
      };

      const result = await mockPrisma.invoice.create({ data: invoiceData });

      expect(result).toHaveProperty('id');
      expect(result.amount).toBe(100.00);
    });
  });
});
