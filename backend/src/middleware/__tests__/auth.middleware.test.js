const { auth } = require('../../auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next with valid token', async () => {
    const token = jwt.sign({ userId: 'test-id' }, process.env.JWT_SECRET || 'secret');
    req.headers.authorization = `Bearer ${token}`;

    await auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it('should return 401 without token', async () => {
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with invalid token', async () => {
    req.headers.authorization = 'Bearer invalid-token';

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle malformed authorization header', async () => {
    req.headers.authorization = 'InvalidFormat';

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
