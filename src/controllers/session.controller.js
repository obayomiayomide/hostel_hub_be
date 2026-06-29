const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

// @route   GET /api/v1/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await prisma.academicSession.findMany({ orderBy: { createdAt: 'desc' } });
  sendResponse(res, 200, 'Academic sessions fetched successfully', sessions);
});

// @route   GET /api/v1/sessions/active
// @access  Private
const getActiveSession = asyncHandler(async (req, res) => {
  const session = await prisma.academicSession.findFirst({ where: { isActive: true } });
  sendResponse(res, 200, 'Active session fetched successfully', session);
});

// @route   POST /api/v1/sessions
// @access  Private/Admin
const createSession = asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body;
  const session = await prisma.academicSession.create({
    data: { name, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null },
  });
  sendResponse(res, 201, 'Academic session created successfully', session);
});

// @route   PATCH /api/v1/sessions/:id/activate
// @access  Private/Admin
const activateSession = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw new AppError('Academic session not found.', 404);

  await prisma.$transaction([
    prisma.academicSession.updateMany({ data: { isActive: false }, where: { isActive: true } }),
    prisma.academicSession.update({ where: { id }, data: { isActive: true } }),
  ]);

  sendResponse(res, 200, 'Academic session activated successfully');
});

module.exports = { getSessions, getActiveSession, createSession, activateSession };
