/**
 * Smoke Tests - Emotion Controller
 */

jest.mock('@prisma/client');

const emotionController = require('../emotionController');

describe('EmotionController - Smoke Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {}, user: { id: 'user-1' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it('should load without errors', () => {
    expect(emotionController).toBeDefined();
  });
});
