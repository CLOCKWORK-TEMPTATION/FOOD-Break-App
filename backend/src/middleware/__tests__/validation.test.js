const { validateRequest } = require('../../validation');
const { body, validationResult } = require('express-validator');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should pass validation with valid data', async () => {
    req.body = { email: 'test@test.com', password: 'Test123!' };

    const validators = [
      body('email').isEmail(),
      body('password').isLength({ min: 6 })
    ];

    for (const validator of validators) {
      await validator.run(req);
    }

    const errors = validationResult(req);
    expect(errors.isEmpty()).toBe(true);
  });

  it('should fail validation with invalid email', async () => {
    req.body = { email: 'invalid', password: 'Test123!' };

    const validators = [body('email').isEmail()];

    for (const validator of validators) {
      await validator.run(req);
    }

    const errors = validationResult(req);
    expect(errors.isEmpty()).toBe(false);
  });

  it('should fail validation with short password', async () => {
    req.body = { email: 'test@test.com', password: '123' };

    const validators = [body('password').isLength({ min: 6 })];

    for (const validator of validators) {
      await validator.run(req);
    }

    const errors = validationResult(req);
    expect(errors.isEmpty()).toBe(false);
  });
});
