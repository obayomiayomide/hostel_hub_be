const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, gender, matricNumber, department, level, role } =
    req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  if (matricNumber) {
    const matricExists = await prisma.user.findUnique({ where: { matricNumber } });
    if (matricExists) throw new AppError('An account with this matric number already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Only allow self-registration as STUDENT; ADMIN/WARDEN accounts are created by an admin.
  const assignedRole = role === 'STUDENT' || !role ? 'STUDENT' : 'STUDENT';

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      phone,
      gender,
      matricNumber,
      department,
      level,
      role: assignedRole,
    },
  });

  const token = generateToken({ id: user.id, role: user.role });

  sendResponse(res, 201, 'Registration successful', { user: sanitizeUser(user), token });
});

// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password.', 401);

  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const token = generateToken({ id: user.id, role: user.role });

  sendResponse(res, 200, 'Login successful', { user: sanitizeUser(user), token });
});

// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, 'Current user fetched', { user: sanitizeUser(req.user) });
});

// @route   PATCH /api/v1/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
  });
  sendResponse(res, 200, 'Profile updated successfully', { user: sanitizeUser(updated) });
});

// @route   PATCH /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });

  sendResponse(res, 200, 'Password changed successfully');
});

module.exports = { register, login, getMe, updateProfile, changePassword };
