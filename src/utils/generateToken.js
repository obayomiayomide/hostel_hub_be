const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for the given user payload.
 * @param {{id: number, role: string}} payload
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
