import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DB_HOST: z.string().min(1, 'DB_HOST wajib diisi'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1, 'DB_USER wajib diisi'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME wajib diisi'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET wajib diisi minimal 16 karakter'),
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL harus berupa URL valid (contoh: http://localhost:5173)')
    .default('http://localhost:5173'),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Env Error] Konfigurasi environment tidak valid:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

