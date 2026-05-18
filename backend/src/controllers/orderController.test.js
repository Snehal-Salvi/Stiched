import request from 'supertest';
import { setupTestDB } from '../test/dbSetup.js';
import app from '../app.js';
import User from '../models/User.js';
import Tailor from '../models/Tailor.js';
import Order from '../models/Order.js';

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

const makeCustomer = async () => {
  const user = await createUser({ role: 'customer' });
  const token = await loginAs(user);
  return { user, token };
};

const makeTailor = async () => {
  const user = await createUser({ role: 'tailor' });
  const token = await loginAs(user);
  const tailor = await Tailor.create({
    user: user._id,
    shopName: 'Test Shop',
    services: [{ name: 'Blouse', category: 'blouse', price: 500 }],
  });
  return { user, tailor, token };
};

const orderPayload = (tailorId, overrides = {}) => ({
  tailorId,
  serviceName: 'Blouse',
  garmentType: 'blouse',
  measurementType: 'custom',
  measurements: { bust: 36 },
  notes: 'urgent',
  price: 500,
  paymentMethod: 'cod',
  ...overrides,
});

const placeOrder = async ({ customer, tailor, status = 'pending', overrides = {} }) => {
  const order = await Order.create({
    customer: customer._id,
    tailor: tailor._id,
    serviceName: 'Blouse',
    garmentType: 'blouse',
    measurementType: 'custom',
    measurements: { bust: 36 },
    price: 500,
    paymentMethod: 'cod',
    status,
    ...overrides,
  });
  return order;
};

describe('POST /api/orders', () => {
  test('returns 404 when the target tailor does not exist', async () => {
    const { token } = await makeCustomer();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderPayload('507f1f77bcf86cd799439011'));

    expect(res.status).toBe(404);
  });

  test('creates an order and stores measurements when measurementType is custom', async () => {
    const { token, user: customer } = await makeCustomer();
    const { tailor } = await makeTailor();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderPayload(tailor._id.toString()));

    expect(res.status).toBe(201);
    expect(res.body.customer).toBe(customer._id.toString());
    expect(res.body.tailor).toBe(tailor._id.toString());
    expect(res.body.measurements).toEqual({ bust: 36 });
    expect(res.body.status).toBe('pending');
    expect(res.body.notes).toBe('urgent');
  });

  test('zeroes out measurements when measurementType is send_sample', async () => {
    const { token } = await makeCustomer();
    const { tailor } = await makeTailor();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(
        orderPayload(tailor._id.toString(), {
          measurementType: 'send_sample',
          measurements: { bust: 99 },
        })
      );

    expect(res.status).toBe(201);
    expect(res.body.measurements || {}).toEqual({});
  });

  test('defaults notes to empty string when not provided', async () => {
    const { token } = await makeCustomer();
    const { tailor } = await makeTailor();

    const payload = orderPayload(tailor._id.toString());
    delete payload.notes;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe('');
  });

  test('defaults measurements to {} when measurementType=custom but measurements omitted', async () => {
    const { token } = await makeCustomer();
    const { tailor } = await makeTailor();

    const payload = orderPayload(tailor._id.toString());
    delete payload.measurements;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.measurements || {}).toEqual({});
  });
});

describe('GET /api/orders/my-orders', () => {
  test('returns only the calling customer’s orders, newest first', async () => {
    const { user: c1, token } = await makeCustomer();
    const { user: c2 } = await makeCustomer();
    const { tailor } = await makeTailor();

    const older = await placeOrder({ customer: c1, tailor });
    const newer = await placeOrder({ customer: c1, tailor });
    await placeOrder({ customer: c2, tailor });

    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const ids = res.body.map((o) => o._id);
    expect(ids).toContain(older._id.toString());
    expect(ids).toContain(newer._id.toString());
  });
});

describe('GET /api/orders/incoming', () => {
  test('returns 404 when the user has no tailor profile', async () => {
    const user = await createUser({ role: 'tailor' });
    const token = await loginAs(user);

    const res = await request(app)
      .get('/api/orders/incoming')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('returns only orders for the calling tailor', async () => {
    const { tailor: tailorA, token: tokenA } = await makeTailor();
    const { tailor: tailorB } = await makeTailor();
    const { user: customer } = await makeCustomer();

    await placeOrder({ customer, tailor: tailorA });
    await placeOrder({ customer, tailor: tailorA });
    await placeOrder({ customer, tailor: tailorB });

    const res = await request(app)
      .get('/api/orders/incoming')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('PUT /api/orders/:id/status (state machine)', () => {
  test('returns 404 when order does not exist', async () => {
    const { token } = await makeTailor();

    const res = await request(app)
      .put('/api/orders/507f1f77bcf86cd799439011/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(404);
  });

  test('returns 403 when a different tailor tries to update', async () => {
    const { tailor: tailorA } = await makeTailor();
    const { token: tokenB } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor: tailorA });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(403);
  });

  test('rejects an invalid transition with 400', async () => {
    const { tailor, token } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor, status: 'pending' });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot transition/i);
  });

  test('rejects any transition out of a terminal status (completed)', async () => {
    const { tailor, token } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor, status: 'completed' });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(400);
  });

  test('allows pending → accepted', async () => {
    const { tailor, token } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor, status: 'pending' });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  test('walks the full happy path: pending → accepted → in_progress → completed', async () => {
    const { tailor, token } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor, status: 'pending' });
    const url = `/api/orders/${order._id}/status`;
    const auth = `Bearer ${token}`;

    for (const status of ['accepted', 'in_progress', 'completed']) {
      const res = await request(app).put(url).set('Authorization', auth).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  test('sets deliveryDate when included in the request', async () => {
    const { tailor, token } = await makeTailor();
    const { user: customer } = await makeCustomer();
    const order = await placeOrder({ customer, tailor, status: 'accepted' });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress', deliveryDate: '2026-06-01' });

    expect(res.status).toBe(200);
    expect(new Date(res.body.deliveryDate).toISOString()).toBe(
      new Date('2026-06-01').toISOString()
    );
  });
});

describe('POST /api/orders/:id/review', () => {
  test('returns 404 when the order does not exist', async () => {
    const { token } = await makeCustomer();

    const res = await request(app)
      .post('/api/orders/507f1f77bcf86cd799439011/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'great' });

    expect(res.status).toBe(404);
  });

  test('returns 403 when a different customer tries to review', async () => {
    const { user: customerA } = await makeCustomer();
    const { token: tokenB } = await makeCustomer();
    const { tailor } = await makeTailor();
    const order = await placeOrder({ customer: customerA, tailor, status: 'completed' });

    const res = await request(app)
      .post(`/api/orders/${order._id}/review`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ rating: 5, comment: 'fake' });

    expect(res.status).toBe(403);
  });

  test('rejects review for an order that is not completed', async () => {
    const { user: customer, token } = await makeCustomer();
    const { tailor } = await makeTailor();
    const order = await placeOrder({ customer, tailor, status: 'accepted' });

    const res = await request(app)
      .post(`/api/orders/${order._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'early' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/completed/i);
  });

  test('records the review and recomputes the tailor’s average rating', async () => {
    const { user: customer, token } = await makeCustomer();
    const { tailor } = await makeTailor();

    const order1 = await placeOrder({
      customer,
      tailor,
      status: 'completed',
      overrides: { review: { rating: 3, comment: 'ok', createdAt: new Date() } },
    });
    const order2 = await placeOrder({ customer, tailor, status: 'completed' });

    const res = await request(app)
      .post(`/api/orders/${order2._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'amazing' });

    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(5);

    const refreshedTailor = await Tailor.findById(tailor._id);
    expect(refreshedTailor.rating).toBe(4);
    expect(refreshedTailor.totalReviews).toBe(2);
  });
});
