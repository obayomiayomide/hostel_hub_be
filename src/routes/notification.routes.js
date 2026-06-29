const express = require('express');
const router = express.Router();

const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const protect = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
