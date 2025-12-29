/**
 * Smoke Tests - Auth Controller
 */

jest.mock('@prisma/client');

const authController = require('../authController');

describe('AuthController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: { email: 'test@test.com', password: '123456' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
    mockPrisma.user.create.mockResolvedValue({ id: '1' });
  });

  it('should load without errors', () => {
    expect(authController).toBeDefined();
  });
});
