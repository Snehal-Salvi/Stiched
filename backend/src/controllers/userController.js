import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name } = req.body;

  if (name) user.name = name;
  if (req.file?.path) user.avatar = req.file.path;

  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  });
});

// PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.password || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});
