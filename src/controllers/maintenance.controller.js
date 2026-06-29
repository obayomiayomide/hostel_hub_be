const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

const fullInclude = {
  student: { select: { id: true, fullName: true, email: true } },
  room: { include: { hostel: true } },
  handledBy: { select: { id: true, fullName: true } },
};

// @route   POST /api/v1/maintenance
// @access  Private/Student
const createMaintenanceRequest = asyncHandler(async (req, res) => {
  const { roomId, category, priority, description, photoUrl } = req.body;

  let resolvedRoomId = roomId;
  if (!resolvedRoomId) {
    const allocation = await prisma.allocation.findFirst({
      where: { studentId: req.user.id, status: 'ACTIVE' },
      include: { bed: true },
    });
    if (allocation) resolvedRoomId = allocation.bed.roomId;
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      studentId: req.user.id,
      roomId: resolvedRoomId,
      category,
      priority,
      description,
      photoUrl,
    },
    include: fullInclude,
  });

  sendResponse(res, 201, 'Maintenance request submitted successfully', request);
});

// @route   GET /api/v1/maintenance/me
// @access  Private/Student
const getMyMaintenanceRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.maintenanceRequest.findMany({
    where: { studentId: req.user.id },
    include: fullInclude,
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, 'Your maintenance requests fetched successfully', requests);
});

// @route   GET /api/v1/maintenance
// @access  Private/Admin/Warden
const getMaintenanceRequests = asyncHandler(async (req, res) => {
  const { status, category, priority } = req.query;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: fullInclude,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
  sendResponse(res, 200, 'Maintenance requests fetched successfully', requests);
});

// @route   GET /api/v1/maintenance/:id
// @access  Private
const getMaintenanceRequestById = asyncHandler(async (req, res) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: fullInclude,
  });
  if (!request) throw new AppError('Maintenance request not found.', 404);

  if (req.user.role === 'STUDENT' && request.studentId !== req.user.id) {
    throw new AppError('You are not authorized to view this request.', 403);
  }
  sendResponse(res, 200, 'Maintenance request fetched successfully', request);
});

// @route   PATCH /api/v1/maintenance/:id
// @access  Private/Admin/Warden
const updateMaintenanceRequest = asyncHandler(async (req, res) => {
  const { status, priority, handledById } = req.body;
  const data = { priority, handledById };
  if (status) {
    data.status = status;
    if (status === 'RESOLVED') data.resolvedAt = new Date();
  }

  const request = await prisma.maintenanceRequest.update({
    where: { id: Number(req.params.id) },
    data,
    include: fullInclude,
  });

  await prisma.notification.create({
    data: {
      userId: request.studentId,
      title: 'Maintenance Request Updated',
      message: `Your maintenance request "${request.category}" is now ${request.status}.`,
    },
  });

  sendResponse(res, 200, 'Maintenance request updated successfully', request);
});

module.exports = {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
};
