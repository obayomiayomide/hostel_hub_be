const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

// @route   GET /api/v1/hostels
// @access  Public (any authenticated user)
const getHostels = asyncHandler(async (req, res) => {
  const { type, isActive } = req.query;
  const where = {};
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const hostels = await prisma.hostel.findMany({
    where,
    include: {
      warden: { select: { id: true, fullName: true, email: true } },
      rooms: { select: { id: true, capacity: true, beds: { select: { status: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const withStats = hostels.map((h) => {
    const beds = h.rooms.flatMap((r) => r.beds);
    const totalBeds = beds.length;
    const vacantBeds = beds.filter((b) => b.status === 'VACANT').length;
    const { rooms, ...hostelData } = h;
    return {
      ...hostelData,
      roomCount: rooms.length,
      totalBeds,
      vacantBeds,
      occupiedBeds: totalBeds - vacantBeds,
    };
  });

  sendResponse(res, 200, 'Hostels fetched successfully', withStats);
});

// @route   GET /api/v1/hostels/:id
// @access  Private
const getHostelById = asyncHandler(async (req, res) => {
  const hostel = await prisma.hostel.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      warden: { select: { id: true, fullName: true, email: true, phone: true } },
      rooms: { include: { beds: true }, orderBy: { roomNumber: 'asc' } },
    },
  });
  if (!hostel) throw new AppError('Hostel not found.', 404);
  sendResponse(res, 200, 'Hostel fetched successfully', hostel);
});

// @route   POST /api/v1/hostels
// @access  Private/Admin
const createHostel = asyncHandler(async (req, res) => {
  const hostel = await prisma.hostel.create({ data: req.body });
  sendResponse(res, 201, 'Hostel created successfully', hostel);
});

// @route   PATCH /api/v1/hostels/:id
// @access  Private/Admin
const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await prisma.hostel.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  sendResponse(res, 200, 'Hostel updated successfully', hostel);
});

// @route   DELETE /api/v1/hostels/:id
// @access  Private/Admin
const deleteHostel = asyncHandler(async (req, res) => {
  await prisma.hostel.delete({ where: { id: Number(req.params.id) } });
  sendResponse(res, 200, 'Hostel deleted successfully');
});

module.exports = { getHostels, getHostelById, createHostel, updateHostel, deleteHostel };
