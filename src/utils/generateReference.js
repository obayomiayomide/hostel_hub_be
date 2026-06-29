/**
 * Generates a unique, human-readable payment reference.
 * Format: HMS-<timestamp36>-<random5>
 */
function generateReference(prefix = 'HMS') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = generateReference;
