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

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(5, 'Nama minimal 5 karakter')
      .max(150, 'Nama maksimal 150 karakter'),
    email: z
      .string()
      .trim()
      .min(5, 'Email minimal 5 karakter')
      .max(255, 'Email maksimal 255 karakter')
      .email('Format email tidak valid'),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter')
      .max(100, 'Password maksimal 100 karakter'),
    confirmPassword: z
      .string()
      .min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

