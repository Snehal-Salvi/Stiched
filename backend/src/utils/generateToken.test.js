import jwt from 'jsonwebtoken';
import generateToken from './generateToken.js';

describe('generateToken', () => {
  test('returns a JWT string that decodes with id and role payload', () => {
    const token = generateToken('user-123', 'customer');

    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('customer');
  });

  test('embeds an expiry claim matching JWT_EXPIRE', () => {
    const token = generateToken('user-456', 'tailor');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.exp).toBeGreaterThan(decoded.iat);
    expect(decoded.exp - decoded.iat).toBe(60 * 60);
  });

  test('token is rejected when verified with a different secret', () => {
    const token = generateToken('user-789', 'customer');

    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});
