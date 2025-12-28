const { validate } = require('../../../src/middleware/validation');
const { validationResult } = require('express-validator');

jest.mock('express-validator');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should pass validation when no errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return errors when validation fails', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { param: 'email', msg: 'Invalid email' },
        { param: 'password', msg: 'Password too short' }
      ]
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ]
    });
    expect(next).not.toHaveBeenCalled();
  });
});
