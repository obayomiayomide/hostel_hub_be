const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

const fullInclude = {
  student: { select: { id: true, fullName: true, email: true, matricNumber: true, gender: true } },
  hostel: { select: { id: true, name: true, type: true } },
  session: true,
  payments: true,
  allocation: { include: { bed: { include: { room: true } } } },
};

// @route   POST /api/v1/applications
// @access  Private/Student
const createApplication = asyncHandler(async (req, res) => {
  const { hostelId, sessionId, preferredRoomType } = req.body;
  const studentId = req.user.id;

  const existing = await prisma.application.findFirst({
    where: { studentId, sessionId, status: { notIn: ['REJECTED', 'CANCELLED'] } },
  });
  if (existing) {
    throw new AppError('You already have an active application for this academic session.', 409);
  }

  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
  if (!hostel) throw new AppError('Hostel not found.', 404);
  if (hostel.type !== 'MIXED' && hostel.type !== req.user.gender) {
    throw new AppError(`This hostel is only open to ${hostel.type} students.`, 400);
  }

  const application = await prisma.application.create({
    data: { studentId, hostelId, sessionId, preferredRoomType, status: 'PENDING' },
    include: fullInclude,
  });

  await prisma.notification.create({
    data: {
      userId: studentId,
      title: 'Application Submitted',
      message: `Your application for ${hostel.name} has been received and is pending review.`,
    },
  });

  sendResponse(res, 201, 'Application submitted successfully', application);
});

// @route   GET /api/v1/applications/me
// @access  Private/Student
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { studentId: req.user.id },
    include: fullInclude,
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, 'Your applications fetched successfully', applications);
});

// @route   GET /api/v1/applications
// @access  Private/Admin/Warden
const getApplications = asyncHandler(async (req, res) => {
  const { status, hostelId, sessionId, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (hostelId) where.hostelId = Number(hostelId);
  if (sessionId) where.sessionId = Number(sessionId);

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: fullInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.application.count({ where }),
  ]);

  sendResponse(res, 200, 'Applications fetched successfully', applications, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// @route   GET /api/v1/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: Number(req.params.id) },
    include: fullInclude,
  });
  if (!application) throw new AppError('Application not found.', 404);

  if (req.user.role === 'STUDENT' && application.studentId !== req.user.id) {
    throw new AppError('You are not authorized to view this application.', 403);
  }

  sendResponse(res, 200, 'Application fetched successfully', application);
});

// @route   PATCH /api/v1/applications/:id/status
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const application = await prisma.application.findUnique({ where: { id: Number(req.params.id) } });
  if (!application) throw new AppError('Application not found.', 404);

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { status, remarks },
    include: fullInclude,
  });

  await prisma.notification.create({
    data: {
      userId: application.studentId,
      title: 'Application Status Updated',
      message: `Your application status has been updated to ${status}.${remarks ? ` Remark: ${remarks}` : ''}`,
    },
  });

  sendResponse(res, 200, 'Application status updated successfully', updated);
});

// @route   PATCH /api/v1/applications/:id/cancel
// @access  Private/Student
const cancelApplication = asyncHandler(async (req, res) => {
  const application = await prisma.application.findUnique({ where: { id: Number(req.params.id) } });
  if (!application) throw new AppError('Application not found.', 404);
  if (application.studentId !== req.user.id) {
    throw new AppError('You are not authorized to cancel this application.', 403);
  }
  if (['ALLOCATED'].includes(application.status)) {
    throw new AppError('Cannot cancel an application that already has an active allocation.', 400);
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { status: 'CANCELLED' },
  });
  sendResponse(res, 200, 'Application cancelled successfully', updated);
});

module.exports = {
  createApplication,
  getMyApplications,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  cancelApplication,
};
