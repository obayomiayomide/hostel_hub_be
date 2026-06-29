const express = require('express');
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  cancelApplication,
} = require('../controllers/application.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createApplicationSchema,
  updateApplicationStatusSchema,
} = require('../validators/application.validator');

router.use(protect);

router
  .route('/')
  .get(authorize('ADMIN', 'WARDEN'), getApplications)
  .post(authorize('STUDENT'), validate(createApplicationSchema), createApplication);

router.get('/me', authorize('STUDENT'), getMyApplications);
router.get('/:id', getApplicationById);
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);
router.patch('/:id/cancel', authorize('STUDENT'), cancelApplication);

module.exports = router;
