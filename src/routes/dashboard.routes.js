const express = require('express');
const router = express.Router();

const { getAdminDashboard, getOccupancy, getStudentDashboard } = require('../controllers/dashboard.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(protect);

router.get('/admin', authorize('ADMIN', 'WARDEN'), getAdminDashboard);
router.get('/occupancy', authorize('ADMIN', 'WARDEN'), getOccupancy);
router.get('/student', authorize('STUDENT'), getStudentDashboard);

module.exports = router;
