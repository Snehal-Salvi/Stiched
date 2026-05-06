import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Tailor from '../models/Tailor.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { tailorId, serviceName, garmentType, measurementType, measurements, notes, price, paymentMethod } = req.body;

  const tailor = await Tailor.findById(tailorId);
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor not found');
  }

  const order = await Order.create({
    customer: req.user._id,
    tailor: tailorId,
    serviceName,
    garmentType,
    measurementType,
    measurements: measurementType === 'custom' ? (measurements || {}) : {},
    notes: notes || '',
    price,
    paymentMethod,
  });

  res.status(201).json(order);
});

// GET /api/orders/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate({ path: 'tailor', populate: { path: 'user', select: 'name avatar email' } })
    .sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/incoming
export const getIncomingOrders = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  const orders = await Order.find({ tailor: tailor._id })
    .populate('customer', 'name email avatar')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, deliveryDate } = req.body;
  const order = await Order.findById(req.params.id).populate('tailor');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.tailor.user.toString() === req.user._id.toString();
  if (!isOwner) {
    res.status(403);
    throw new Error('Not authorized');
  }

  order.status = status;
  if (deliveryDate) order.deliveryDate = new Date(deliveryDate);
  await order.save();
  res.json(order);
});

// POST /api/orders/:id/review
export const leaveReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (order.status !== 'completed') {
    res.status(400);
    throw new Error('Can only review completed orders');
  }

  order.review = { rating, comment, createdAt: new Date() };
  await order.save();

  const allOrders = await Order.find({ tailor: order.tailor, 'review.rating': { $exists: true } });
  const avg = allOrders.reduce((sum, o) => sum + o.review.rating, 0) / allOrders.length;
  await Tailor.findByIdAndUpdate(order.tailor, { rating: avg, totalReviews: allOrders.length });

  res.json(order);
});
