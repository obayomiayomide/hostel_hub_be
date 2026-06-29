const express = require('express');
const router = express.Router();

const {
  autoAllocate,
  manualAllocate,
  vacateAllocation,
  getAllocations,
  getMyAllocation,
} = require('../controllers/allocation.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { manualAllocationSchema } = require('../validators/application.validator');

router.use(protect);

router.get('/me', authorize('STUDENT'), getMyAllocation);
router.get('/', authorize('ADMIN', 'WARDEN'), getAllocations);
router.post('/auto/:applicationId', authorize('ADMIN'), autoAllocate);
router.post('/manual', authorize('ADMIN'), validate(manualAllocationSchema), manualAllocate);
router.patch('/:id/vacate', authorize('ADMIN'), vacateAllocation);

module.exports = router;
