import { z } from 'zod';

export const memoryIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int('ID kenangan harus berupa bilangan bulat')
    .positive('ID kenangan harus lebih besar dari 0'),
});

export type MemoryIdParam = z.infer<typeof memoryIdParamSchema>;
