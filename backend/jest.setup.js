// Mock Logger to prevent console noise during tests
jest.mock('./src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock Prisma Client globally
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock Payment Controller to avoid Stripe/PayPal init issues
jest.mock('./src/controllers/paymentControllerNew', () => ({
  createPaymentIntent: jest.fn((req, res) => res.status(200).send('mock')),
  confirmPayment: jest.fn((req, res) => res.status(200).send('mock')),
  getUserPayments: jest.fn((req, res) => res.status(200).send('mock')),
  createInvoice: jest.fn((req, res) => res.status(200).send('mock')),
  getUserInvoices: jest.fn((req, res) => res.status(200).send('mock')),
  processRefund: jest.fn((req, res) => res.status(200).send('mock')),
  handleStripeWebhook: jest.fn((req, res) => res.status(200).send('mock')),
  getPaymentStatistics: jest.fn((req, res) => res.status(200).send('mock')),
}));

// Global teardown
afterAll(async () => {
  // Add any global cleanup here
});
