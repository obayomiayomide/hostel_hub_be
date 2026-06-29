/**
 * Sends a consistent JSON success response shape across the whole API.
 * Shape: { success: true, message, data, meta? }
 */
function sendResponse(res, statusCode, message, data = null, meta = null) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

module.exports = sendResponse;
