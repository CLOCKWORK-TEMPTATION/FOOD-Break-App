/**
 * Smoke Tests - Payment Controller New
 */

jest.mock('@prisma/client');

const paymentControllerNew = require('../paymentControllerNew');

describe('PaymentControllerNew - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'user-1' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it('should load without errors', () => {
    expect(paymentControllerNew).toBeDefined();
  });
});
