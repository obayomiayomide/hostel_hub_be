const express = require('express');
const router = express.Router();

const {
  initiatePayment,
  verifyPayment,
  getMyPayments,
  getPayments,
  getPaymentByReference,
} = require('../controllers/payment.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { initiatePaymentSchema, verifyPaymentSchema } = require('../validators/application.validator');

router.use(protect);

router.post('/initiate', authorize('STUDENT'), validate(initiatePaymentSchema), initiatePayment);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);
router.get('/me', authorize('STUDENT'), getMyPayments);
router.get('/', authorize('ADMIN'), getPayments);
router.get('/:reference', getPaymentByReference);

module.exports = router;
