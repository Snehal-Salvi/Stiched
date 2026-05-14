import asyncHandler from 'express-async-handler';
import Tailor from '../models/Tailor.js';
import User from '../models/User.js';

// GET /api/tailors
export const getAllTailors = asyncHandler(async (req, res) => {
  const { city, serviceCategory, minRating, search, page = 1, limit = 12 } = req.query;

  const filter = {};
  if (city) filter['location.city'] = { $regex: city, $options: 'i' };
  if (serviceCategory) filter['services.category'] = serviceCategory;
  if (minRating) filter.rating = { $gte: Number(minRating) };

  let baseFilter = { ...filter };

  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    baseFilter.$or = [
      { user: { $in: users.map((u) => u._id) } },
      { shopName: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Tailor.countDocuments(baseFilter);
  const tailors = await Tailor.find(baseFilter)
    .populate('user', 'name email avatar')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ rating: -1 });

  res.json({ tailors, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/tailors/me
export const getMyProfile = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id }).populate('user', 'name email avatar');
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }
  res.json(tailor);
});

// GET /api/tailors/:id
export const getTailorById = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findById(req.params.id).populate('user', 'name email avatar');
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor not found');
  }
  res.json(tailor);
});

// POST /api/tailors/profile
export const createProfile = asyncHandler(async (req, res) => {
  const exists = await Tailor.findOne({ user: req.user._id });
  if (exists) {
    res.status(400);
    throw new Error('Tailor profile already exists');
  }

  validateServices(req.body.services, res);

  await User.findByIdAndUpdate(req.user._id, { role: 'tailor' });

  const tailor = await Tailor.create({ user: req.user._id, ...req.body });
  res.status(201).json(tailor);
});

// PUT /api/tailors/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  validateServices(req.body.services, res);

  const allowed = ['shopName', 'description', 'experience', 'services', 'location', 'socialLinks', 'isAvailable'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) tailor[field] = req.body[field];
  });

  await tailor.save();
  res.json(tailor);
});

// POST /api/tailors/photos
export const addShopPhoto = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  const { caption } = req.body;
  const image = req.file?.path;

  if (!image) {
    res.status(400);
    throw new Error('Image is required');
  }

  tailor.shopPhotos.push({ image, caption: caption || '' });
  await tailor.save();
  res.status(201).json(tailor.shopPhotos);
});

// DELETE /api/tailors/photos/:photoId
export const removeShopPhoto = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  tailor.shopPhotos = tailor.shopPhotos.filter(
    (p) => p._id.toString() !== req.params.photoId
  );
  await tailor.save();
  res.json({ message: 'Photo removed' });
});

// POST /api/tailors/work-samples
export const addWorkSample = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  const { caption } = req.body;
  const image = req.file?.path;

  if (!image) {
    res.status(400);
    throw new Error('Image is required');
  }

  tailor.workSamples.push({ image, caption: caption || '' });
  await tailor.save();
  res.status(201).json(tailor.workSamples);
});

// DELETE /api/tailors/work-samples/:sampleId
export const removeWorkSample = asyncHandler(async (req, res) => {
  const tailor = await Tailor.findOne({ user: req.user._id });
  if (!tailor) {
    res.status(404);
    throw new Error('Tailor profile not found');
  }

  tailor.workSamples = tailor.workSamples.filter(
    (p) => p._id.toString() !== req.params.sampleId
  );
  await tailor.save();
  res.json({ message: 'Work sample removed' });
});

const validateServices = (services, res) => {
  if (!Array.isArray(services)) return;
  const hasInvalidPrice = services.some((service) => Number(service.price) <= 0);
  if (hasInvalidPrice) {
    res.status(400);
    throw new Error('Service price must be greater than 0');
  }
};
