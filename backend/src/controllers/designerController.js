import asyncHandler from 'express-async-handler';
import Designer from '../models/Designer.js';
import User from '../models/User.js';

// GET /api/designers
export const getAllDesigners = asyncHandler(async (req, res) => {
  const { specialty, minPrice, maxPrice, minRating, search, page = 1, limit = 12 } = req.query;

  const filter = {};
  if (specialty) filter.specialties = { $in: [specialty] };
  if (minPrice || maxPrice) {
    filter.pricePerHour = {};
    if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
  }
  if (minRating) filter.rating = { $gte: Number(minRating) };

  let query = Designer.find(filter).populate('user', 'name email avatar');

  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    query = Designer.find({ ...filter, user: { $in: users.map((u) => u._id) } }).populate(
      'user',
      'name email avatar'
    );
  }

  const total = await Designer.countDocuments(filter);
  const designers = await query
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ rating: -1 });

  res.json({ designers, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/designers/:id
export const getDesignerById = asyncHandler(async (req, res) => {
  const designer = await Designer.findById(req.params.id).populate('user', 'name email avatar');
  if (!designer) {
    res.status(404);
    throw new Error('Designer not found');
  }
  res.json(designer);
});

// GET /api/designers/me
export const getMyProfile = asyncHandler(async (req, res) => {
  const designer = await Designer.findOne({ user: req.user._id }).populate(
    'user',
    'name email avatar'
  );
  if (!designer) {
    res.status(404);
    throw new Error('Designer profile not found');
  }
  res.json(designer);
});

// POST /api/designers/profile
export const createProfile = asyncHandler(async (req, res) => {
  const exists = await Designer.findOne({ user: req.user._id });
  if (exists) {
    res.status(400);
    throw new Error('Designer profile already exists');
  }

  await User.findByIdAndUpdate(req.user._id, { role: 'designer' });

  const designer = await Designer.create({ user: req.user._id, ...req.body });
  res.status(201).json(designer);
});

// PUT /api/designers/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const designer = await Designer.findOne({ user: req.user._id });
  if (!designer) {
    res.status(404);
    throw new Error('Designer profile not found');
  }

  const allowed = ['bio', 'specialties', 'pricePerHour', 'experience', 'location', 'languages', 'socialLinks', 'isAvailable'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) designer[field] = req.body[field];
  });

  await designer.save();
  res.json(designer);
});

// POST /api/designers/portfolio
export const addPortfolioItem = asyncHandler(async (req, res) => {
  const designer = await Designer.findOne({ user: req.user._id });
  if (!designer) {
    res.status(404);
    throw new Error('Designer profile not found');
  }

  const { title, description } = req.body;
  const image = req.file?.path;

  if (!image) {
    res.status(400);
    throw new Error('Image is required');
  }

  designer.portfolio.push({ image, title, description });
  await designer.save();
  res.status(201).json(designer.portfolio);
});

// DELETE /api/designers/portfolio/:itemId
export const removePortfolioItem = asyncHandler(async (req, res) => {
  const designer = await Designer.findOne({ user: req.user._id });
  if (!designer) {
    res.status(404);
    throw new Error('Designer profile not found');
  }

  designer.portfolio = designer.portfolio.filter(
    (item) => item._id.toString() !== req.params.itemId
  );
  await designer.save();
  res.json({ message: 'Portfolio item removed' });
});
