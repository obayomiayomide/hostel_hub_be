const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/apiResponse');

// @route   GET /api/v1/rooms?hostelId=
// @access  Private
const getRooms = asyncHandler(async (req, res) => {
  const { hostelId, status } = req.query;
  const where = {};
  if (hostelId) where.hostelId = Number(hostelId);
  if (status) where.status = status;

  const rooms = await prisma.room.findMany({
    where,
    include: { hostel: { select: { id: true, name: true, type: true } }, beds: true },
    orderBy: [{ hostelId: 'asc' }, { roomNumber: 'asc' }],
  });

  const withStats = rooms.map((r) => ({
    ...r,
    vacantBeds: r.beds.filter((b) => b.status === 'VACANT').length,
    occupiedBeds: r.beds.filter((b) => b.status === 'OCCUPIED').length,
  }));

  sendResponse(res, 200, 'Rooms fetched successfully', withStats);
});

// @route   GET /api/v1/rooms/:id
// @access  Private
const getRoomById = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: Number(req.params.id) },
    include: { hostel: true, beds: { orderBy: { bedNumber: 'asc' } } },
  });
  if (!room) throw new AppError('Room not found.', 404);
  sendResponse(res, 200, 'Room fetched successfully', room);
});

// @route   POST /api/v1/rooms
// @access  Private/Admin
// Automatically generates the bed records based on the room's capacity.
const createRoom = asyncHandler(async (req, res) => {
  const { hostelId, roomNumber, floor, capacity, pricePerSession } = req.body;

  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
  if (!hostel) throw new AppError('Hostel not found.', 404);

  const room = await prisma.$transaction(async (tx) => {
    const createdRoom = await tx.room.create({
      data: { hostelId, roomNumber, floor, capacity, pricePerSession },
    });

    const bedsData = Array.from({ length: capacity }, (_, i) => ({
      roomId: createdRoom.id,
      bedNumber: `${roomNumber}-B${i + 1}`,
      status: 'VACANT',
    }));
    await tx.bed.createMany({ data: bedsData });

    await tx.hostel.update({
      where: { id: hostelId },
      data: { totalRooms: { increment: 1 } },
    });

    return tx.room.findUnique({ where: { id: createdRoom.id }, include: { beds: true } });
  });

  sendResponse(res, 201, 'Room created successfully with beds generated', room);
});

// @route   PATCH /api/v1/rooms/:id
// @access  Private/Admin
const updateRoom = asyncHandler(async (req, res) => {
  const room = await prisma.room.update({
    where: { id: Number(req.params.id) },
    data: req.body,
    include: { beds: true },
  });
  sendResponse(res, 200, 'Room updated successfully', room);
});

// @route   DELETE /api/v1/rooms/:id
// @access  Private/Admin
const deleteRoom = asyncHandler(async (req, res) => {
  const roomId = Number(req.params.id);
  const occupiedBeds = await prisma.bed.count({ where: { roomId, status: 'OCCUPIED' } });
  if (occupiedBeds > 0) {
    throw new AppError('Cannot delete a room that currently has occupied beds.', 400);
  }

  await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: roomId } });
    await tx.room.delete({ where: { id: roomId } });
    if (room) {
      await tx.hostel.update({
        where: { id: room.hostelId },
        data: { totalRooms: { decrement: 1 } },
      });
    }
  });

  sendResponse(res, 200, 'Room deleted successfully');
});

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
