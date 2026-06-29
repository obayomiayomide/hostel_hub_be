const express = require('express');
const router = express.Router();

const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/room.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createRoomSchema, updateRoomSchema } = require('../validators/hostel.validator');

router.use(protect);

router
  .route('/')
  .get(getRooms)
  .post(authorize('ADMIN'), validate(createRoomSchema), createRoom);

router
  .route('/:id')
  .get(getRoomById)
  .patch(authorize('ADMIN'), validate(updateRoomSchema), updateRoom)
  .delete(authorize('ADMIN'), deleteRoom);

module.exports = router;
