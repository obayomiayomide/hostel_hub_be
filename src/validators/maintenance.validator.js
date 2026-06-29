const { z } = require('zod');

const createMaintenanceSchema = z.object({
  roomId: z.number().int().positive().optional(),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'FURNITURE', 'CLEANING', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  description: z.string().min(5, 'Please provide a more detailed description'),
  photoUrl: z.string().optional(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  handledById: z.number().int().positive().optional(),
});

module.exports = { createMaintenanceSchema, updateMaintenanceSchema };
