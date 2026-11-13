import { z } from 'zod';

export const employeeQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Kata kunci pencarian maksimal 100 karakter')
    .optional(),
});

export const employeeIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int('ID karyawan harus berupa bilangan bulat')
    .positive('ID karyawan harus lebih dari 0'),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
export type EmployeeIdParamInput = z.infer<typeof employeeIdParamSchema>;

