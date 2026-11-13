import { z } from 'zod';

export const adminMessageIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID pesan harus berupa angka' })
    .int('ID pesan harus berupa bilangan bulat')
    .positive('ID pesan harus lebih besar dari 0'),
});

export const createAdminMessageSchema = z
  .object({
    sender_employee_id: z.coerce
      .number({ message: 'ID karyawan pengirim harus berupa angka' })
      .int('ID karyawan pengirim harus berupa bilangan bulat')
      .positive('ID karyawan pengirim wajib dipilih'),
    recipient_employee_id: z.coerce
      .number({ message: 'ID karyawan penerima harus berupa angka' })
      .int('ID karyawan penerima harus berupa bilangan bulat')
      .positive('ID karyawan penerima wajib dipilih'),
    message: z
      .string({ message: 'Isi pesan wajib diisi' })
      .trim()
      .min(1, 'Isi pesan wajib diisi'),
    impression: z
      .string()
      .trim()
      .max(300, 'Kesan singkat maksimal 300 karakter')
      .optional()
      .nullable()
      .transform((val) => (val === undefined || val === null || val === '' ? null : val)),
  })
  .refine((data) => data.sender_employee_id !== data.recipient_employee_id, {
    message: 'Karyawan pengirim dan penerima tidak boleh sama',
    path: ['recipient_employee_id'],
  });

export type CreateAdminMessageInput = z.infer<typeof createAdminMessageSchema>;
