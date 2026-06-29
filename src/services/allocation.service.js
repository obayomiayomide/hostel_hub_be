const prisma = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Finds the first available vacant bed in a hostel that matches the
 * student's gender (hostel type must be MIXED or match student gender),
 * ordered by room number / bed number for deterministic, fair (FCFS) allocation.
 */
async function findAvailableBed(hostelId, gender) {
  const bed = await prisma.bed.findFirst({
    where: {
      status: 'VACANT',
      room: {
        hostelId,
        status: { in: ['AVAILABLE'] },
        hostel: {
          type: { in: gender === 'MALE' ? ['MALE', 'MIXED'] : ['FEMALE', 'MIXED'] },
        },
      },
    },
    orderBy: [{ room: { roomNumber: 'asc' } }, { bedNumber: 'asc' }],
    include: { room: true },
  });
  return bed;
}

/**
 * Automatically allocates a bed space to a student for a given approved &
 * paid-for application. This is the core "allocation algorithm" referenced
 * in the project objectives: deterministic, gender-matched, first-come-first-served,
 * and transactionally safe against double-allocation race conditions.
 */
async function autoAllocate(applicationId) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { student: true, allocation: true, hostel: true },
    });

    if (!application) throw new AppError('Application not found.', 404);
    if (application.allocation) {
      throw new AppError('This application already has an active allocation.', 409);
    }
    if (application.status !== 'APPROVED') {
      throw new AppError(
        'Application must be APPROVED (payment confirmed) before allocation.',
        400
      );
    }

    const bed = await tx.bed.findFirst({
      where: {
        status: 'VACANT',
        room: {
          hostelId: application.hostelId,
          status: { in: ['AVAILABLE'] },
          hostel: {
            type: {
              in: application.student.gender === 'MALE' ? ['MALE', 'MIXED'] : ['FEMALE', 'MIXED'],
            },
          },
        },
      },
      orderBy: [{ room: { roomNumber: 'asc' } }, { bedNumber: 'asc' }],
      include: { room: true },
    });

    if (!bed) {
      throw new AppError(
        'No vacant bed space currently available in the selected hostel for this allocation cycle.',
        409
      );
    }

    // Lock the bed
    await tx.bed.update({ where: { id: bed.id }, data: { status: 'OCCUPIED' } });

    // Re-check room occupancy to flip room status to FULL if needed
    const occupiedCount = await tx.bed.count({
      where: { roomId: bed.roomId, status: 'OCCUPIED' },
    });
    if (occupiedCount >= bed.room.capacity) {
      await tx.room.update({ where: { id: bed.roomId }, data: { status: 'FULL' } });
    }

    const allocation = await tx.allocation.create({
      data: {
        studentId: application.studentId,
        bedId: bed.id,
        applicationId: application.id,
        sessionId: application.sessionId,
        status: 'ACTIVE',
      },
      include: { bed: { include: { room: { include: { hostel: true } } } } },
    });

    await tx.application.update({
      where: { id: application.id },
      data: { status: 'ALLOCATED' },
    });

    await tx.notification.create({
      data: {
        userId: application.studentId,
        title: 'Room Allocated',
        message: `You have been allocated Room ${bed.room.roomNumber}, Bed ${bed.bedNumber} in ${application.hostel.name}.`,
      },
    });

    return allocation;
  });
}

/**
 * Allows an admin to manually assign a specific bed to an application,
 * overriding the automatic algorithm (e.g. for special cases).
 */
async function manualAllocate(applicationId, bedId) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { allocation: true, hostel: true },
    });
    if (!application) throw new AppError('Application not found.', 404);
    if (application.allocation) {
      throw new AppError('This application already has an active allocation.', 409);
    }

    const bed = await tx.bed.findUnique({ where: { id: bedId }, include: { room: true } });
    if (!bed) throw new AppError('Bed not found.', 404);
    if (bed.status !== 'VACANT') {
      throw new AppError('Selected bed is not vacant.', 409);
    }

    await tx.bed.update({ where: { id: bed.id }, data: { status: 'OCCUPIED' } });

    const occupiedCount = await tx.bed.count({
      where: { roomId: bed.roomId, status: 'OCCUPIED' },
    });
    if (occupiedCount >= bed.room.capacity) {
      await tx.room.update({ where: { id: bed.roomId }, data: { status: 'FULL' } });
    }

    const allocation = await tx.allocation.create({
      data: {
        studentId: application.studentId,
        bedId: bed.id,
        applicationId: application.id,
        sessionId: application.sessionId,
        status: 'ACTIVE',
      },
    });

    await tx.application.update({
      where: { id: application.id },
      data: { status: 'ALLOCATED' },
    });

    await tx.notification.create({
      data: {
        userId: application.studentId,
        title: 'Room Allocated',
        message: `You have been manually allocated Room ${bed.room.roomNumber}, Bed ${bed.bedNumber}.`,
      },
    });

    return allocation;
  });
}

/**
 * Vacates a bed (e.g. student graduates, withdraws, or is transferred),
 * freeing it up for future allocation and updating room status accordingly.
 */
async function vacate(allocationId) {
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.findUnique({
      where: { id: allocationId },
      include: { bed: true },
    });
    if (!allocation) throw new AppError('Allocation not found.', 404);
    if (allocation.status !== 'ACTIVE') {
      throw new AppError('This allocation is not currently active.', 400);
    }

    await tx.bed.update({ where: { id: allocation.bedId }, data: { status: 'VACANT' } });
    await tx.room.update({ where: { id: allocation.bed.roomId }, data: { status: 'AVAILABLE' } });

    return tx.allocation.update({
      where: { id: allocationId },
      data: { status: 'VACATED', vacatedAt: new Date() },
    });
  });
}

module.exports = { findAvailableBed, autoAllocate, manualAllocate, vacate };
