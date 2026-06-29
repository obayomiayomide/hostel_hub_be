const prisma = require('../config/db');

/**
 * Aggregates the key metrics shown on the admin dashboard:
 * occupancy, applications pipeline, payment revenue, and maintenance load.
 */
async function getAdminStats() {
  const [
    totalStudents,
    totalHostels,
    totalRooms,
    totalBeds,
    occupiedBeds,
    pendingApplications,
    approvedApplications,
    allocatedApplications,
    pendingPayments,
    successfulPaymentsAgg,
    openMaintenance,
    maintenanceByStatus,
    applicationsByStatus,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.hostel.count(),
    prisma.room.count(),
    prisma.bed.count(),
    prisma.bed.count({ where: { status: 'OCCUPIED' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.application.count({ where: { status: 'APPROVED' } }),
    prisma.application.count({ where: { status: 'ALLOCATED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.maintenanceRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

  return {
    totalStudents,
    totalHostels,
    totalRooms,
    totalBeds,
    occupiedBeds,
    vacantBeds: totalBeds - occupiedBeds,
    occupancyRate,
    pendingApplications,
    approvedApplications,
    allocatedApplications,
    pendingPayments,
    totalRevenue: successfulPaymentsAgg._sum.amount || 0,
    openMaintenance,
    maintenanceByStatus: maintenanceByStatus.map((m) => ({ status: m.status, count: m._count._all })),
    applicationsByStatus: applicationsByStatus.map((a) => ({ status: a.status, count: a._count._all })),
  };
}

/**
 * Per-hostel occupancy breakdown, useful for bar-chart visualization.
 */
async function getHostelOccupancy() {
  const hostels = await prisma.hostel.findMany({
    include: {
      rooms: { include: { beds: true } },
    },
  });

  return hostels.map((hostel) => {
    const beds = hostel.rooms.flatMap((r) => r.beds);
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    return {
      hostelId: hostel.id,
      hostelName: hostel.name,
      totalBeds: beds.length,
      occupiedBeds: occupied,
      vacantBeds: beds.length - occupied,
      occupancyRate: beds.length > 0 ? Number(((occupied / beds.length) * 100).toFixed(1)) : 0,
    };
  });
}

async function getStudentStats(studentId) {
  const [applications, payments, maintenanceRequests, allocation] = await Promise.all([
    prisma.application.count({ where: { studentId } }),
    prisma.payment.count({ where: { studentId, status: 'SUCCESS' } }),
    prisma.maintenanceRequest.count({ where: { studentId } }),
    prisma.allocation.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: { bed: { include: { room: { include: { hostel: true } } } } },
    }),
  ]);

  return { applications, successfulPayments: payments, maintenanceRequests, currentAllocation: allocation };
}

module.exports = { getAdminStats, getHostelOccupancy, getStudentStats };
