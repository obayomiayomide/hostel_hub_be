/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // -------------------------------------------------------------------------
  // Admin account
  // -------------------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostel.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'ADMIN',
      gender: 'MALE',
      phone: '08000000000',
    },
  });
  console.log(`✔ Admin ready: ${admin.email} / ${adminPassword}`);

  // -------------------------------------------------------------------------
  // Warden account
  // -------------------------------------------------------------------------
  const wardenPassword = 'Warden@123';
  const warden = await prisma.user.upsert({
    where: { email: 'warden@hostel.edu' },
    update: {},
    create: {
      fullName: 'Mrs. Grace Okafor',
      email: 'warden@hostel.edu',
      password: await bcrypt.hash(wardenPassword, 10),
      role: 'WARDEN',
      gender: 'FEMALE',
      phone: '08011111111',
    },
  });
  console.log(`✔ Warden ready: ${warden.email} / ${wardenPassword}`);

  // -------------------------------------------------------------------------
  // Sample student account
  // -------------------------------------------------------------------------
  const studentPassword = 'Student@123';
  const student = await prisma.user.upsert({
    where: { email: 'student@hostel.edu' },
    update: {},
    create: {
      fullName: 'John Adeyemi',
      email: 'student@hostel.edu',
      password: await bcrypt.hash(studentPassword, 10),
      role: 'STUDENT',
      gender: 'MALE',
      matricNumber: 'CSC/2021/001',
      department: 'Computer Science',
      level: '300',
      phone: '08022222222',
    },
  });
  console.log(`✔ Student ready: ${student.email} / ${studentPassword}`);

  // -------------------------------------------------------------------------
  // Academic session
  // -------------------------------------------------------------------------
  const session = await prisma.academicSession.upsert({
    where: { name: '2025/2026' },
    update: { isActive: true },
    create: { name: '2025/2026', isActive: true, startDate: new Date('2025-09-01') },
  });
  console.log(`✔ Active session: ${session.name}`);

  // -------------------------------------------------------------------------
  // Hostels + Rooms + Beds
  // -------------------------------------------------------------------------
  const hostelsData = [
    { name: 'Unity Hall', type: 'MALE', location: 'North Campus', description: 'Premier male hostel with 24/7 security and water supply.' },
    { name: 'Liberty Hall', type: 'FEMALE', location: 'South Campus', description: 'Female hostel with study lounges on every floor.' },
    { name: 'Heritage Suites', type: 'MIXED', location: 'East Campus', description: 'Modern mixed-gender postgraduate accommodation.' },
  ];

  for (const h of hostelsData) {
    const existing = await prisma.hostel.findFirst({ where: { name: h.name } });
    if (existing) continue;

    const hostel = await prisma.hostel.create({
      data: { ...h, wardenId: h.type === 'MALE' ? warden.id : null },
    });

    const roomCount = 6;
    for (let i = 1; i <= roomCount; i += 1) {
      const roomNumber = `${100 + i}`;
      const capacity = i % 2 === 0 ? 4 : 2;
      const room = await prisma.room.create({
        data: {
          hostelId: hostel.id,
          roomNumber,
          floor: i <= 3 ? 'Ground Floor' : 'First Floor',
          capacity,
          pricePerSession: capacity === 2 ? 75000 : 45000,
        },
      });

      await prisma.bed.createMany({
        data: Array.from({ length: capacity }, (_, idx) => ({
          roomId: room.id,
          bedNumber: `${roomNumber}-B${idx + 1}`,
        })),
      });
    }

    await prisma.hostel.update({ where: { id: hostel.id }, data: { totalRooms: roomCount } });
    console.log(`✔ Hostel created: ${hostel.name} (${roomCount} rooms)`);
  }

  console.log('🌱 Seeding complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
