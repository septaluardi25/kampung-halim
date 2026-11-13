import { z } from 'zod';

export const employeeQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Kata kunci pencarian maksimal 100 karakter')
    .optional(),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
