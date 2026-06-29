const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');
const paymentService = require('../services/payment.service');

// @route   POST /api/v1/payments/initiate
// @access  Private/Student
const initiatePayment = asyncHandler(async (req, res) => {
  const { applicationId, amount } = req.body;
  const result = await paymentService.initiate(req.user.id, applicationId, amount);
  sendResponse(res, 201, 'Payment initiated successfully', result);
});

// @route   POST /api/v1/payments/verify
// @access  Private/Student
// Simulates the gateway callback. In production this would be called by the
// gateway's webhook/redirect, or polled by the frontend after checkout.
const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.body;
  const result = await paymentService.verify(reference);
  sendResponse(res, 200, 'Payment verified successfully', result);
});

// @route   GET /api/v1/payments/me
// @access  Private/Student
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { studentId: req.user.id },
    include: { application: { include: { hostel: true } }, session: true },
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, 'Your payments fetched successfully', payments);
});

// @route   GET /api/v1/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, email: true, matricNumber: true } },
        application: { include: { hostel: true } },
        session: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.payment.count({ where }),
  ]);

  sendResponse(res, 200, 'Payments fetched successfully', payments, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// @route   GET /api/v1/payments/:reference
// @access  Private
const getPaymentByReference = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { reference: req.params.reference },
    include: { application: { include: { hostel: true } }, session: true },
  });
  if (!payment) throw new AppError('Payment not found.', 404);

  if (req.user.role === 'STUDENT' && payment.studentId !== req.user.id) {
    throw new AppError('You are not authorized to view this payment.', 403);
  }

  sendResponse(res, 200, 'Payment fetched successfully', payment);
});

module.exports = {
  initiatePayment,
  verifyPayment,
  getMyPayments,
  getPayments,
  getPaymentByReference,
};
