import { jest } from '@jest/globals';
import request from 'supertest';
import { setupTestDB } from '../test/dbSetup.js';

const fakeUploadSingle = () => (req, _res, next) => {
  if (req.headers['x-attach-file'] !== 'false') {
    req.file = { path: 'https://fake-cloud.test/photo.jpg' };
  }
  next();
};

jest.unstable_mockModule('../middleware/upload.js', () => ({
  upload: { single: jest.fn(fakeUploadSingle) },
  cloudinary: {},
}));

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { default: Tailor } = await import('../models/Tailor.js');

setupTestDB();

const createUser = (overrides = {}) =>
  User.create({
    name: 'User',
    email: `u-${Date.now()}-${Math.random()}@example.com`,
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

const createTailor = (user, overrides = {}) =>
  Tailor.create({
    user: user._id,
    shopName: 'Shop',
    location: { city: 'Mumbai' },
    services: [{ name: 'Blouse', category: 'blouse', price: 500 }],
    rating: 4,
    ...overrides,
  });

const makeTailorWithAuth = async (overrides = {}, tailorOverrides = {}) => {
  const user = await createUser({ role: 'tailor', ...overrides });
  const token = await loginAs(user);
  const tailor = await createTailor(user, tailorOverrides);
  return { user, tailor, token };
};

describe('GET /api/tailors', () => {
  test('returns paginated tailors with total and page metadata', async () => {
    await makeTailorWithAuth({ email: 'a@x.com' });
    await makeTailorWithAuth({ email: 'b@x.com' });

    const res = await request(app).get('/api/tailors');

    expect(res.status).toBe(200);
    expect(res.body.tailors).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.pages).toBe(1);
  });

  test('filters by city (case-insensitive substring)', async () => {
    await makeTailorWithAuth({ email: 'mum@x.com' }, { location: { city: 'Mumbai' } });
    await makeTailorWithAuth({ email: 'del@x.com' }, { location: { city: 'Delhi' } });

    const res = await request(app).get('/api/tailors?city=mum');

    expect(res.body.tailors).toHaveLength(1);
    expect(res.body.tailors[0].location.city).toBe('Mumbai');
  });

  test('filters by serviceCategory', async () => {
    await makeTailorWithAuth(
      { email: 'lehenga@x.com' },
      { services: [{ name: 'Lehenga', category: 'lehenga', price: 2000 }] }
    );
    await makeTailorWithAuth(
      { email: 'shirt@x.com' },
      { services: [{ name: 'Shirt', category: 'shirt', price: 800 }] }
    );

    const res = await request(app).get('/api/tailors?serviceCategory=lehenga');

    expect(res.body.tailors).toHaveLength(1);
  });

  test('filters by minimum rating', async () => {
    await makeTailorWithAuth({ email: 'low@x.com' }, { rating: 3 });
    await makeTailorWithAuth({ email: 'high@x.com' }, { rating: 4.7 });

    const res = await request(app).get('/api/tailors?minRating=4');

    expect(res.body.tailors).toHaveLength(1);
    expect(res.body.tailors[0].rating).toBeGreaterThanOrEqual(4);
  });

  test('searches by user name and shop name (OR)', async () => {
    const namedUser = await createUser({ name: 'Priya Sharma', role: 'tailor', email: 'priya@x.com' });
    await createTailor(namedUser, { shopName: 'Different Shop' });

    const otherUser = await createUser({ name: 'Other', role: 'tailor', email: 'other@x.com' });
    await createTailor(otherUser, { shopName: 'Priya Tailors' });

    const thirdUser = await createUser({ name: 'Nobody', role: 'tailor', email: 'nobody@x.com' });
    await createTailor(thirdUser, { shopName: 'Nobody Shop' });

    const res = await request(app).get('/api/tailors?search=priya');

    expect(res.body.tailors).toHaveLength(2);
  });

  test('respects page and limit', async () => {
    for (let i = 0; i < 3; i += 1) {
      await makeTailorWithAuth({ email: `p${i}@x.com` });
    }

    const res = await request(app).get('/api/tailors?page=2&limit=2');

    expect(res.body.tailors).toHaveLength(1);
    expect(res.body.page).toBe(2);
    expect(res.body.pages).toBe(2);
  });
});

describe('GET /api/tailors/:id', () => {
  test('returns 404 when tailor does not exist', async () => {
    const res = await request(app).get('/api/tailors/507f1f77bcf86cd799439011');

    expect(res.status).toBe(404);
  });

  test('returns the tailor when found', async () => {
    const { tailor } = await makeTailorWithAuth();

    const res = await request(app).get(`/api/tailors/${tailor._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(tailor._id.toString());
  });
});

describe('GET /api/tailors/me', () => {
  test('returns 404 when the authenticated tailor has no profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .get('/api/tailors/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('returns the tailor profile of the authenticated user', async () => {
    const { tailor, token } = await makeTailorWithAuth();

    const res = await request(app)
      .get('/api/tailors/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(tailor._id.toString());
  });
});

describe('POST /api/tailors/profile', () => {
  test('rejects with 400 when a profile already exists for the user', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopName: 'Another' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('rejects with 400 when a service price is not positive', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopName: 'Shop',
        services: [{ name: 'Blouse', category: 'blouse', price: 0 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/price/i);
  });

  test('creates the profile and promotes the user to tailor', async () => {
    const user = await createUser({ role: 'customer' });
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopName: 'New Shop',
        services: [{ name: 'Blouse', category: 'blouse', price: 500 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.shopName).toBe('New Shop');

    const refreshed = await User.findById(user._id);
    expect(refreshed.role).toBe('tailor');
  });
});

describe('PUT /api/tailors/profile', () => {
  test('returns 404 when no profile exists', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .put('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopName: 'Updated' });

    expect(res.status).toBe(404);
  });

  test('rejects with 400 when a service price is not positive', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .put('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ services: [{ name: 'Bad', category: 'x', price: 0 }] });

    expect(res.status).toBe(400);
  });

  test('updates writable fields and ignores unknown fields', async () => {
    const { tailor, token } = await makeTailorWithAuth();

    const res = await request(app)
      .put('/api/tailors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopName: 'Updated Name',
        rating: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.shopName).toBe('Updated Name');

    const refreshed = await Tailor.findById(tailor._id);
    expect(refreshed.shopName).toBe('Updated Name');
    expect(refreshed.rating).toBe(tailor.rating);
  });
});

describe('POST /api/tailors/photos', () => {
  test('returns 404 when the user has no tailor profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/tailors/photos')
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'My shop' });

    expect(res.status).toBe(404);
  });

  test('returns 400 when no image was uploaded', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/photos')
      .set('Authorization', `Bearer ${token}`)
      .set('x-attach-file', 'false')
      .send({ caption: 'Missing image' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image is required/i);
  });

  test('appends the photo to the tailor and returns the array', async () => {
    const { tailor, token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/photos')
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Front view' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].image).toBe('https://fake-cloud.test/photo.jpg');
    expect(res.body[0].caption).toBe('Front view');

    const refreshed = await Tailor.findById(tailor._id);
    expect(refreshed.shopPhotos).toHaveLength(1);
  });

  test('defaults caption to empty string when not provided', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/photos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body[0].caption).toBe('');
  });
});

describe('DELETE /api/tailors/photos/:photoId', () => {
  test('returns 404 when the user has no tailor profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .delete('/api/tailors/photos/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('removes the matching photo and leaves others intact', async () => {
    const { tailor, token } = await makeTailorWithAuth(
      {},
      {
        shopPhotos: [
          { image: 'a.jpg', caption: 'keep' },
          { image: 'b.jpg', caption: 'delete' },
        ],
      }
    );
    const toDelete = tailor.shopPhotos[1]._id.toString();

    const res = await request(app)
      .delete(`/api/tailors/photos/${toDelete}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const refreshed = await Tailor.findById(tailor._id);
    expect(refreshed.shopPhotos).toHaveLength(1);
    expect(refreshed.shopPhotos[0].caption).toBe('keep');
  });
});

describe('POST /api/tailors/work-samples', () => {
  test('returns 404 when the user has no tailor profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/tailors/work-samples')
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'work' });

    expect(res.status).toBe(404);
  });

  test('returns 400 when no image was uploaded', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/work-samples')
      .set('Authorization', `Bearer ${token}`)
      .set('x-attach-file', 'false')
      .send({ caption: 'no file' });

    expect(res.status).toBe(400);
  });

  test('appends the work sample to the tailor', async () => {
    const { tailor, token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/work-samples')
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Bridal lehenga' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);

    const refreshed = await Tailor.findById(tailor._id);
    expect(refreshed.workSamples).toHaveLength(1);
  });

  test('defaults caption to empty string when not provided', async () => {
    const { token } = await makeTailorWithAuth();

    const res = await request(app)
      .post('/api/tailors/work-samples')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body[0].caption).toBe('');
  });
});

describe('DELETE /api/tailors/work-samples/:sampleId', () => {
  test('returns 404 when the user has no tailor profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .delete('/api/tailors/work-samples/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('removes the matching work sample', async () => {
    const { tailor, token } = await makeTailorWithAuth(
      {},
      {
        workSamples: [
          { image: 'a.jpg', caption: 'keep' },
          { image: 'b.jpg', caption: 'delete' },
        ],
      }
    );
    const toDelete = tailor.workSamples[1]._id.toString();

    const res = await request(app)
      .delete(`/api/tailors/work-samples/${toDelete}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const refreshed = await Tailor.findById(tailor._id);
    expect(refreshed.workSamples).toHaveLength(1);
    expect(refreshed.workSamples[0].caption).toBe('keep');
  });
});
