import { z } from 'zod';

const optionalNullableText = (maxLen: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLen, `${label} maksimal ${maxLen} karakter`)
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') {
        return null;
      }
      return val;
    });

export const adminEmployeeIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID karyawan harus berupa angka' })
    .int('ID karyawan harus berupa bilangan bulat')
    .positive('ID karyawan harus lebih besar dari 0'),
});

export const adminEmployeeQuerySchema = z.object({
  search: z.string().trim().max(150).optional().default(''),
});

export const createAdminEmployeeSchema = z.object({
  full_name: z
    .string({ message: 'Nama lengkap wajib diisi' })
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(150, 'Nama lengkap maksimal 150 karakter'),
  nickname: z
    .string()
    .trim()
    .max(100, 'Nama panggilan maksimal 100 karakter')
    .optional()
    .default(''),
  hometown: optionalNullableText(150, 'Kota asal'),
  hobby: optionalNullableText(255, 'Hobi'),
  contact: optionalNullableText(255, 'Kontak'),
  favorite_quote: optionalNullableText(2000, 'Kutipan favorit'),
  status: z
    .enum(['draft', 'published'], {
      message: 'Status harus bernilai draft atau published',
    })
    .default('draft'),
});

export const updateAdminEmployeeSchema = createAdminEmployeeSchema;

export type CreateAdminEmployeeInput = z.infer<typeof createAdminEmployeeSchema>;
export type UpdateAdminEmployeeInput = z.infer<typeof updateAdminEmployeeSchema>;
