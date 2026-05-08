import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['patient', 'doctor']).default('patient'),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  experience: z.coerce.number().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'doctor') {
    return !!data.specialization && !!data.licenseNumber && data.experience !== undefined;
  }
  return true;
}, {
  message: "Specialization, license number, and experience are required for doctors",
  path: ["specialization"], // Attaching error to specialization as a generic fallback
});
