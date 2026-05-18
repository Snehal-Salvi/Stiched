import { jest } from '@jest/globals';
import { notFound, errorHandler } from './errorHandler.js';

const buildRes = (initialStatusCode = 200) => {
  const res = { statusCode: initialStatusCode };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(() => res);
  return res;
};

describe('notFound', () => {
  test('sets 404 status and forwards an error mentioning the URL', () => {
    const req = { originalUrl: '/api/missing' };
    const res = buildRes();
    const next = jest.fn();

    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('/api/missing');
  });
});

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('uses 500 when res.statusCode is still 200', () => {
    const res = buildRes(200);
    const err = new Error('boom');

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' })
    );
  });

  test('preserves a non-200 status code that a controller already set', () => {
    const res = buildRes(404);
    const err = new Error('not found');

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'not found' })
    );
  });

  test('includes the stack trace outside production', () => {
    process.env.NODE_ENV = 'development';
    const res = buildRes(500);
    const err = new Error('dev error');

    errorHandler(err, {}, res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBe(err.stack);
  });

  test('hides the stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const res = buildRes(500);
    const err = new Error('prod error');

    errorHandler(err, {}, res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBeNull();
  });
});
