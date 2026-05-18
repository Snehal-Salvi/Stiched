import { jest } from '@jest/globals';
import request from 'supertest';
import { setupTestDB } from '../test/dbSetup.js';

const fakeUploadSingle = () => (req, _res, next) => {
  if (req.headers['x-attach-file'] !== 'false') {
    req.file = { path: 'https://fake-cloud.test/avatar.jpg' };
  }
  next();
};

jest.unstable_mockModule('../middleware/upload.js', () => ({
  upload: { single: jest.fn(fakeUploadSingle) },
  cloudinary: {},
}));

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');

setupTestDB();

const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random()}@example.com`;

const createUser = (overrides = {}) =>
  User.create({
    name: 'User',
    email: uniqueEmail('u'),
    password: 'secret123',
    isVerified: true,
    role: 'customer',
    ...overrides,
  });

const loginAs = async (user, password = 'secret123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password });
  return res.body.token;
};

describe('GET /api/users/profile', () => {
  test('returns the authenticated user', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id.toString());
    expect(res.body.email).toBe(user.email);
  });
});

describe('PUT /api/users/profile', () => {
  test('updates name when provided', async () => {
    const user = await createUser({ name: 'Old' });
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-attach-file', 'false')
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  test('updates avatar when a file is uploaded', async () => {
    const user = await createUser({ name: 'Old' });
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBe('https://fake-cloud.test/avatar.jpg');
  });

  test('keeps existing fields when nothing is sent', async () => {
    const user = await createUser({ name: 'Keep', avatar: '' });
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-attach-file', 'false');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Keep');
    expect(res.body.avatar).toBe('');
  });
});

describe('PUT /api/users/change-password', () => {
  test('rejects with 401 when the current password is wrong', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WRONG', newPassword: 'newpass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/current password/i);
  });

  test('rejects with 401 for Google-only accounts (no password set)', async () => {
    const googleUser = await User.create({
      name: 'Google',
      email: uniqueEmail('g'),
      googleId: 'g-123',
      isVerified: true,
    });

    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign(
      { id: googleUser._id.toString(), role: googleUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'anything', newPassword: 'newpass123' });

    expect(res.status).toBe(401);
  });

  test('updates the password and lets the user log in with it', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'secret123', newPassword: 'brandnewpw' });

    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'brandnewpw' });
    expect(login.status).toBe(200);
  });
});
