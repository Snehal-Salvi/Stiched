import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

const asString = (v) => (typeof v === 'string' ? v : '');
const normalizeEmail = (v) => asString(v).trim().toLowerCase();

const otpsMatch = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const name = asString(req.body.name).trim();
  const password = asString(req.body.password);
  const normalizedRole = normalizeRole(req.body.role);

  if (!email || !name || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already registered');
  }

  if (!normalizedRole) {
    res.status(400);
    throw new Error('Invalid account type');
  }

  const user = await User.create({ name, email, password, role: normalizedRole, isVerified: true });

  res.status(201).json({ token: generateToken(user._id, user.role), user: sanitize(user) });
});

// POST /api/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = asString(req.body.otp);

  if (!email || !otp) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  const user = await User.findOne({ email });

  if (
    !user ||
    !user.otp ||
    !user.otpExpiry ||
    user.otpExpiry < new Date() ||
    !otpsMatch(user.otp, otp)
  ) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ token: generateToken(user._id, user.role), user: sanitize(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = asString(req.body.password);

  if (!email || !password) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const user = await User.findOne({ email });

  if (!user || !user.password) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (!user.isVerified) {
    res.status(401);
    throw new Error('Please verify your email first');
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({ token: generateToken(user._id, user.role), user: sanitize(user) });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No account found with this email');
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendOTPEmail(email, otp);

  res.json({ message: 'OTP sent to your email' });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = asString(req.body.otp);
  const newPassword = asString(req.body.newPassword);

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  const user = await User.findOne({ email });

  if (
    !user ||
    !user.otp ||
    !user.otpExpiry ||
    user.otpExpiry < new Date() ||
    !otpsMatch(user.otp, otp)
  ) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(sanitize(req.user));
});

// GET /api/auth/google/callback – handled in routes, this builds the response
export const googleCallback = asyncHandler(async (req, res) => {
  const token = generateToken(req.user._id, req.user.role);
  res.redirect(`${process.env.CLIENT_URL}/auth/google?token=${token}&role=${req.user.role}`);
});

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
});

const normalizeRole = (role) => {
  if (!role) return 'customer';
  if (role === 'user') return 'customer';
  if (role === 'designer') return 'tailor';
  if (['customer', 'tailor'].includes(role)) return role;
  return null;
};
