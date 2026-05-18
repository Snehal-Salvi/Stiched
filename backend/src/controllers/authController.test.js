import { jest } from '@jest/globals';
import request from 'supertest';
import { setupTestDB } from '../test/dbSetup.js';

const sendOTPEmailMock = jest.fn().mockResolvedValue({});

jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  sendOTPEmail: sendOTPEmailMock,
}));

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { googleCallback } = await import('./authController.js');

setupTestDB();

const registerPayload = (overrides = {}) => ({
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret123',
  ...overrides,
});

const createVerifiedUser = async (overrides = {}) =>
  User.create({
    name: 'Existing',
    email: 'existing@example.com',
    password: 'secret123',
    isVerified: true,
    role: 'customer',
    ...overrides,
  });

describe('POST /api/auth/register', () => {
  test('rejects with 400 when name, email, or password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('rejects with 400 when email is already registered', async () => {
    await createVerifiedUser({ email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ email: 'taken@example.com' }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test('rejects with 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ role: 'admin' }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid account type/i);
  });

  test('creates a customer and returns a token by default', async () => {
    const res = await request(app).post('/api/auth/register').send(registerPayload());

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.isVerified).toBe(true);
  });

  test('creates a tailor when role=tailor is sent', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ role: 'tailor' }));

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('tailor');
  });

  test('normalizes legacy role "user" to customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ role: 'user' }));

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });
});

describe('POST /api/auth/verify-otp', () => {
  test('rejects with 400 when email or otp is missing', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  test('rejects with 400 when no user with that email exists', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'nobody@example.com', otp: '123456' });
    expect(res.status).toBe(400);
  });

  test('rejects with 400 when user has no OTP set', async () => {
    await createVerifiedUser({ email: 'no-otp@example.com' });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'no-otp@example.com', otp: '123456' });

    expect(res.status).toBe(400);
  });

  test('rejects with 400 when OTP has expired', async () => {
    await createVerifiedUser({
      email: 'expired@example.com',
      otp: '123456',
      otpExpiry: new Date(Date.now() - 1000),
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'expired@example.com', otp: '123456' });

    expect(res.status).toBe(400);
  });

  test('rejects with 400 when OTP digits do not match', async () => {
    await createVerifiedUser({
      email: 'mismatch@example.com',
      otp: '123456',
      otpExpiry: new Date(Date.now() + 60000),
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'mismatch@example.com', otp: '999999' });

    expect(res.status).toBe(400);
  });

  test('rejects with 400 when OTP length differs from stored OTP', async () => {
    await createVerifiedUser({
      email: 'wronglen@example.com',
      otp: '123456',
      otpExpiry: new Date(Date.now() + 60000),
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'wronglen@example.com', otp: '12345' });

    expect(res.status).toBe(400);
  });

  test('succeeds, clears OTP fields, and returns a token on match', async () => {
    await createVerifiedUser({
      email: 'good@example.com',
      isVerified: false,
      otp: '123456',
      otpExpiry: new Date(Date.now() + 60000),
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'good@example.com', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.isVerified).toBe(true);

    const refreshed = await User.findOne({ email: 'good@example.com' });
    expect(refreshed.otp).toBeUndefined();
    expect(refreshed.otpExpiry).toBeUndefined();
  });
});

describe('POST /api/auth/login', () => {
  test('rejects with 401 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(401);
  });

  test('rejects with 401 when no user exists with that email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'secret123' });
    expect(res.status).toBe(401);
  });

  test('rejects with 401 when the user has no password (Google-only account)', async () => {
    await User.create({
      name: 'Google',
      email: 'google@example.com',
      googleId: 'google-id',
      isVerified: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'google@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
  });

  test('rejects with 401 when the user is not verified', async () => {
    await User.create({
      name: 'Unverified',
      email: 'unverified@example.com',
      password: 'secret123',
      isVerified: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  test('rejects with 401 when password does not match', async () => {
    await createVerifiedUser({ email: 'wrong-pw@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong-pw@example.com', password: 'WRONG' });

    expect(res.status).toBe(401);
  });

  test('returns a token on successful login', async () => {
    await createVerifiedUser({ email: 'ok@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ok@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('ok@example.com');
  });
});

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => sendOTPEmailMock.mockClear());

  test('rejects with 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 when no user exists with that email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(404);
  });

  test('saves an OTP and sends an email on success', async () => {
    await createVerifiedUser({ email: 'forgot@example.com' });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'forgot@example.com' });

    expect(res.status).toBe(200);
    expect(sendOTPEmailMock).toHaveBeenCalledTimes(1);
    const [emailArg, otpArg] = sendOTPEmailMock.mock.calls[0];
    expect(emailArg).toBe('forgot@example.com');
    expect(otpArg).toMatch(/^\d{6}$/);

    const user = await User.findOne({ email: 'forgot@example.com' });
    expect(user.otp).toBe(otpArg);
    expect(user.otpExpiry.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/reset-password', () => {
  test('rejects with 400 when any required field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'a@b.com', otp: '123456' });
    expect(res.status).toBe(400);
  });

  test('rejects with 400 when OTP is invalid or expired', async () => {
    await createVerifiedUser({
      email: 'reset-bad@example.com',
      otp: '123456',
      otpExpiry: new Date(Date.now() - 1000),
    });

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset-bad@example.com',
      otp: '123456',
      newPassword: 'newpass123',
    });

    expect(res.status).toBe(400);
  });

  test('updates the password and clears the OTP on success', async () => {
    await createVerifiedUser({
      email: 'reset-ok@example.com',
      otp: '654321',
      otpExpiry: new Date(Date.now() + 60000),
    });

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset-ok@example.com',
      otp: '654321',
      newPassword: 'brandnewpass',
    });

    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-ok@example.com', password: 'brandnewpass' });
    expect(login.status).toBe(200);

    const user = await User.findOne({ email: 'reset-ok@example.com' });
    expect(user.otp).toBeUndefined();
    expect(user.otpExpiry).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  test('returns the sanitized authenticated user', async () => {
    const reg = await request(app).post('/api/auth/register').send(registerPayload());
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.password).toBeUndefined();
    expect(res.body.otp).toBeUndefined();
  });
});

describe('googleCallback', () => {
  test('redirects to CLIENT_URL with token and role in query', async () => {
    const user = { _id: 'fake-id', role: 'customer' };
    const redirect = jest.fn();
    await googleCallback({ user }, { redirect });

    expect(redirect).toHaveBeenCalledTimes(1);
    const url = redirect.mock.calls[0][0];
    expect(url).toContain(process.env.CLIENT_URL);
    expect(url).toContain('token=');
    expect(url).toContain('role=customer');
  });
});
