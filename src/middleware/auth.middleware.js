const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Protects routes by requiring a valid Bearer JWT.
 * Attaches the authenticated user (minus password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized. Please log in to access this resource.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired session. Please log in again.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact the administrator.', 403);
  }

  delete user.password;
  req.user = user;
  next();
});

module.exports = protect;
