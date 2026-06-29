const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  sendResponse(res, 200, 'Notifications fetched successfully', notifications, { unreadCount });
});

// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: Number(req.params.id) } });
  if (!notification) throw new AppError('Notification not found.', 404);
  if (notification.userId !== req.user.id) {
    throw new AppError('You are not authorized to modify this notification.', 403);
  }
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });
  sendResponse(res, 200, 'Notification marked as read', updated);
});

// @route   PATCH /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  sendResponse(res, 200, 'All notifications marked as read');
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
