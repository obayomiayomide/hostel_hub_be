const express = require('express');
const router = express.Router();

const {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
} = require('../controllers/hostel.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createHostelSchema, updateHostelSchema } = require('../validators/hostel.validator');

router.use(protect);

router
  .route('/')
  .get(getHostels)
  .post(authorize('ADMIN'), validate(createHostelSchema), createHostel);

router
  .route('/:id')
  .get(getHostelById)
  .patch(authorize('ADMIN'), validate(updateHostelSchema), updateHostel)
  .delete(authorize('ADMIN'), deleteHostel);

module.exports = router;
