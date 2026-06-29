/**
 * Custom application error class.
 * Allows controllers/services to throw an error with a specific HTTP status code
 * and have it handled uniformly by the global error middleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
