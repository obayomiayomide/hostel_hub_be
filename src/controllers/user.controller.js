const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { matricNumber: { contains: search } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  sendResponse(res, 200, 'Users fetched successfully', users.map(sanitizeUser), {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new AppError('User not found.', 404);
  sendResponse(res, 200, 'User fetched successfully', sanitizeUser(user));
});

// @route   POST /api/v1/users (admin creates a warden/admin account)
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, gender, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('A user with this email already exists.', 409);

  const hashedPassword = await bcrypt.hash(password || 'Welcome@123', 10);

  const user = await prisma.user.create({
    data: { fullName, email, password: hashedPassword, phone, gender, role: role || 'WARDEN' },
  });

  sendResponse(res, 201, 'User created successfully', sanitizeUser(user));
});

// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { password, ...rest } = req.body;
  const data = { ...rest };
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data });
  sendResponse(res, 200, 'User updated successfully', sanitizeUser(user));
});

// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  sendResponse(res, 200, 'User deleted successfully');
});

// @route   PATCH /api/v1/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new AppError('User not found.', 404);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: !user.isActive },
  });
  sendResponse(res, 200, 'User status updated', sanitizeUser(updated));
});

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus };
