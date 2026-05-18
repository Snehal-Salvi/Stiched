import { jest } from '@jest/globals';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../config/passport.js';
import User from '../models/User.js';
import { protect, requireRole } from './auth.js';
import { setupTestDB } from '../test/dbSetup.js';

setupTestDB();

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.get('/protected', protect, (req, res) =>
    res.json({ userId: req.user._id.toString(), role: req.user.role })
  );
  app.get('/tailor-only', protect, requireRole('tailor'), (_req, res) =>
    res.json({ ok: true })
  );
  return app;
};

const signTokenFor = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

const createUser = (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `t-${Date.now()}-${Math.random()}@example.com`,
    password: 'hashed-pw',
    isVerified: true,
    ...overrides,
  });

describe('protect middleware', () => {
  test('rejects with 401 when no Authorization header is sent', async () => {
    const res = await request(buildApp()).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('rejects with 401 for a malformed token', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-jwt');

    expect(res.status).toBe(401);
  });

  test('rejects with 401 when the token is valid but the user no longer exists', async () => {
    const token = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  test('allows the request and populates req.user when the token is valid', async () => {
    const user = await createUser({ role: 'customer' });
    const token = signTokenFor(user);

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user._id.toString());
    expect(res.body.role).toBe('customer');
  });
});

describe('requireRole middleware', () => {
  test('allows the request when req.user.role matches one of the allowed roles', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = signTokenFor(user);

    const res = await request(buildApp())
      .get('/tailor-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('rejects with 403 when req.user.role is not in the allowed list', async () => {
    const user = await createUser({ role: 'customer' });
    const token = signTokenFor(user);

    const res = await request(buildApp())
      .get('/tailor-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/insufficient permissions/i);
  });

  test('rejects with 403 when req.user is missing (called without protect)', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireRole('tailor')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
