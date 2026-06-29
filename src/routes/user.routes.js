const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require('../controllers/user.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(protect, authorize('ADMIN'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;
