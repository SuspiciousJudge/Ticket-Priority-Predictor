jest.mock('../models/User', () => ({ findOne: jest.fn() }));
jest.mock('../utils/passwordResetDelivery', () => ({
  sendPasswordResetEmail: jest.fn(async () => ({ delivered: false, development: true, resetUrl: 'http://localhost:5173/reset-password?token=test-token' })),
}));

const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/passwordResetDelivery');
const authController = require('../controllers/authController');

function responseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('password reset flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.PASSWORD_RESET_URL_BASE = 'http://localhost:5173/reset-password';
  });

  test('returns a generic response for an unknown email', async () => {
    User.findOne.mockResolvedValue(null);
    const res = responseMock();

    await authController.forgotPassword({ body: { email: 'unknown@example.com' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'If that email exists, we sent reset instructions',
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('stores a hashed expiring token and returns only a development reset URL', async () => {
    const user = { email: 'alice@example.com', save: jest.fn() };
    User.findOne.mockResolvedValue(user);
    const res = responseMock();

    await authController.forgotPassword({ body: { email: user.email } }, res, jest.fn());

    expect(user.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.resetPasswordExpire).toBeGreaterThan(Date.now());
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ resetUrl: expect.stringContaining('reset-password') }));
  });

  test('validates and consumes a reset token once', async () => {
    const token = 'a'.repeat(64);
    const user = {
      password: 'old-hash',
      save: jest.fn(),
    };
    User.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
    const firstResponse = responseMock();
    const secondResponse = responseMock();

    await authController.resetPassword({ params: { token }, body: { password: 'NewPassword1' } }, firstResponse, jest.fn());
    await authController.resetPassword({ params: { token }, body: { password: 'NewPassword1' } }, secondResponse, jest.fn());

    expect(user.password).not.toBe('old-hash');
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpire).toBeUndefined();
    expect(firstResponse.json).toHaveBeenCalledWith({ success: true, message: 'Password has been reset successfully' });
    expect(secondResponse.status).toHaveBeenCalledWith(400);
  });

  test('rejects a weak reset password before database lookup', async () => {
    const res = responseMock();

    await authController.resetPassword({ params: { token: crypto.randomBytes(32).toString('hex') }, body: { password: 'weakpassword' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });
});
