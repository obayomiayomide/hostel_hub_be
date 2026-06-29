/* eslint-disable no-unused-vars */

/**
 * Converts known Prisma error codes into friendly AppError-like responses.
 */
function handlePrismaError(err) {
  if (err.code === 'P2002') {
    const field = err.meta && err.meta.target ? err.meta.target : 'field';
    return { statusCode: 409, message: `A record with this ${field} already exists.` };
  }
  if (err.code === 'P2025') {
    return { statusCode: 404, message: 'The requested record was not found.' };
  }
  if (err.code === 'P2003') {
    return { statusCode: 400, message: 'This action references a record that does not exist.' };
  }
  return null;
}

/**
 * 404 handler for unmatched routes. Mounted after all routes.
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralized error handler. Mounted last in the middleware chain.
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma known request errors carry a `code` property
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    const prismaError = handlePrismaError(err);
    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = { notFound, errorHandler };
