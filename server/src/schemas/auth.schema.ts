import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, 'Email minimal 5 karakter')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID user harus berupa angka' })
    .int('ID user harus berupa bilangan bulat')
    .positive('ID user harus lebih besar dari 0'),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, 'Nama minimal 5 karakter'),
  email: z
    .string()
    .trim()
    .min(5, 'Email minimal 5 karakter')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
  is_active: z.boolean().default(true),
  role: z.string().optional(),
  employee_id: z.any().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, 'Nama minimal 5 karakter')
    .optional(),
  email: z
    .string()
    .trim()
    .min(5, 'Email minimal 5 karakter')
    .email('Format email tidak valid')
    .optional(),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .optional(),
  is_active: z.boolean().optional(),
  role: z.string().optional(),
  employee_id: z.coerce
    .number({ message: 'ID karyawan harus berupa angka' })
    .int('ID karyawan harus berupa bilangan bulat')
    .positive('ID karyawan harus lebih besar dari 0')
    .nullable()
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
