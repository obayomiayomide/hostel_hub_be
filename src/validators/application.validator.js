const { z } = require('zod');

const createApplicationSchema = z.object({
  hostelId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  preferredRoomType: z.string().optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAYMENT_PENDING', 'APPROVED', 'ALLOCATED', 'REJECTED', 'CANCELLED']),
  remarks: z.string().optional(),
});

const initiatePaymentSchema = z.object({
  applicationId: z.number().int().positive(),
  amount: z.number().positive('Amount must be greater than zero'),
});

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
});

const manualAllocationSchema = z.object({
  applicationId: z.number().int().positive(),
  bedId: z.number().int().positive(),
});

module.exports = {
  createApplicationSchema,
  updateApplicationStatusSchema,
  initiatePaymentSchema,
  verifyPaymentSchema,
  manualAllocationSchema,
};
