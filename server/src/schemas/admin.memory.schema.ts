import { z } from 'zod';

export const adminMemoryIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID kenangan harus berupa angka' })
    .int('ID kenangan harus berupa bilangan bulat')
    .positive('ID kenangan harus lebih besar dari 0'),
});

export const adminMemoryBodySchema = z.object({
  title: z
    .string({ message: 'Judul kenangan wajib diisi' })
    .trim()
    .min(1, 'Judul kenangan wajib diisi')
    .max(200, 'Judul kenangan maksimal 200 karakter'),
  event_date: z
    .string({ message: 'Tanggal kejadian wajib diisi' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .refine(
      (val) => {
        const d = new Date(val + 'T00:00:00Z');
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
      },
      { message: 'Tanggal tidak valid' }
    ),
  story: z
    .string({ message: 'Cerita kenangan wajib diisi' })
    .trim()
    .min(1, 'Cerita kenangan wajib diisi'),
  status: z
    .enum(['draft', 'published'], {
      message: 'Status harus bernilai draft atau published',
    })
    .default('draft'),
  employee_ids: z
    .array(
      z.coerce
        .number({ message: 'ID karyawan harus berupa angka' })
        .int('ID karyawan harus berupa bilangan bulat')
        .positive('ID karyawan harus lebih besar dari 0')
    )
    .default([])
    .transform((ids) => Array.from(new Set(ids))),
});

export type AdminMemoryBodyInput = z.infer<typeof adminMemoryBodySchema>;
