const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const sendResponse = require('../utils/apiResponse');
const allocationService = require('../services/allocation.service');

const fullInclude = {
  student: { select: { id: true, fullName: true, email: true, matricNumber: true } },
  bed: { include: { room: { include: { hostel: true } } } },
  application: true,
  session: true,
};

// @route   POST /api/v1/allocations/auto/:applicationId
// @access  Private/Admin
const autoAllocate = asyncHandler(async (req, res) => {
  const allocation = await allocationService.autoAllocate(Number(req.params.applicationId));
  sendResponse(res, 201, 'Bed space automatically allocated', allocation);
});

// @route   POST /api/v1/allocations/manual
// @access  Private/Admin
const manualAllocate = asyncHandler(async (req, res) => {
  const { applicationId, bedId } = req.body;
  const allocation = await allocationService.manualAllocate(applicationId, bedId);
  sendResponse(res, 201, 'Bed space manually allocated', allocation);
});

// @route   PATCH /api/v1/allocations/:id/vacate
// @access  Private/Admin
const vacateAllocation = asyncHandler(async (req, res) => {
  const allocation = await allocationService.vacate(Number(req.params.id));
  sendResponse(res, 200, 'Allocation vacated successfully', allocation);
});

// @route   GET /api/v1/allocations
// @access  Private/Admin
const getAllocations = asyncHandler(async (req, res) => {
  const { status, sessionId, hostelId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (sessionId) where.sessionId = Number(sessionId);
  if (hostelId) where.bed = { room: { hostelId: Number(hostelId) } };

  const allocations = await prisma.allocation.findMany({
    where,
    include: fullInclude,
    orderBy: { allocatedAt: 'desc' },
  });
  sendResponse(res, 200, 'Allocations fetched successfully', allocations);
});

// @route   GET /api/v1/allocations/me
// @access  Private/Student
const getMyAllocation = asyncHandler(async (req, res) => {
  const allocation = await prisma.allocation.findFirst({
    where: { studentId: req.user.id, status: 'ACTIVE' },
    include: fullInclude,
  });
  sendResponse(res, 200, 'Current allocation fetched', allocation);
});

module.exports = { autoAllocate, manualAllocate, vacateAllocation, getAllocations, getMyAllocation };
