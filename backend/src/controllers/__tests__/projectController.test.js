/**
 * Smoke Tests - Project Controller
 */

jest.mock('@prisma/client');

const projectController = require('../projectController');

describe('ProjectController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'user-1' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it('should load without errors', () => {
    expect(projectController).toBeDefined();
  });
});
