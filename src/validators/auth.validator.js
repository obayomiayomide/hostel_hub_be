const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('A valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Gender must be MALE or FEMALE' }),
  }),
  matricNumber: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
  role: z.enum(['STUDENT', 'WARDEN', 'ADMIN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
  avatarUrl: z.string().optional(),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema };
