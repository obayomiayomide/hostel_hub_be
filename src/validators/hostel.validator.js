const { z } = require('zod');

const createHostelSchema = z.object({
  name: z.string().min(2, 'Hostel name is required'),
  type: z.enum(['MALE', 'FEMALE', 'MIXED']),
  description: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  wardenId: z.number().int().positive().optional().nullable(),
});

const updateHostelSchema = createHostelSchema.partial();

const createRoomSchema = z.object({
  hostelId: z.number().int().positive(),
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.string().optional(),
  capacity: z.number().int().min(1).max(20).default(4),
  pricePerSession: z.number().nonnegative().default(0),
});

const updateRoomSchema = createRoomSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'FULL', 'MAINTENANCE', 'CLOSED']).optional(),
});

module.exports = {
  createHostelSchema,
  updateHostelSchema,
  createRoomSchema,
  updateRoomSchema,
};
