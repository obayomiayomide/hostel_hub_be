const express = require('express');
const router = express.Router();

const {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
} = require('../controllers/maintenance.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createMaintenanceSchema, updateMaintenanceSchema } = require('../validators/maintenance.validator');

router.use(protect);

router
  .route('/')
  .get(authorize('ADMIN', 'WARDEN'), getMaintenanceRequests)
  .post(authorize('STUDENT'), validate(createMaintenanceSchema), createMaintenanceRequest);

router.get('/me', authorize('STUDENT'), getMyMaintenanceRequests);
router.get('/:id', getMaintenanceRequestById);
router.patch(
  '/:id',
  authorize('ADMIN', 'WARDEN'),
  validate(updateMaintenanceSchema),
  updateMaintenanceRequest
);

module.exports = router;
