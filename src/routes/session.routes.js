const express = require('express');
const router = express.Router();

const { getSessions, getActiveSession, createSession, activateSession } = require('../controllers/session.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(protect);

router.get('/', getSessions);
router.get('/active', getActiveSession);
router.post('/', authorize('ADMIN'), createSession);
router.patch('/:id/activate', authorize('ADMIN'), activateSession);

module.exports = router;
