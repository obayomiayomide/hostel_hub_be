const AppError = require('../utils/AppError');

/**
 * Restricts a route to one or more roles.
 * Usage: router.get('/admin-only', protect, authorize('ADMIN'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized. Please log in.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }
    next();
  };
}

module.exports = authorize;
