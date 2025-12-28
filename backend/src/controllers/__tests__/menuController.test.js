/**
 * Smoke Tests - Menu Controller
 */

jest.mock('@prisma/client');

const menuController = require('../menuController');

describe('MenuController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'user-1' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it('should load without errors', () => {
    expect(menuController).toBeDefined();
  });
});
