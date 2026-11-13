import dotenv from 'dotenv';
dotenv.config();

import { pool } from './pool';
import { hashPassword } from '../utils/crypt';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@wargahalim.id';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  console.log(`[Seed Admin] Menyiapkan akun admin: ${email}`);
  const hashedPassword = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active)
     VALUES (1, 'Admin Warga Halim', ?, ?, 'admin', NULL, 1)
     ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       password_hash = VALUES(password_hash),
       role = 'admin',
       is_active = 1`,
    [email, hashedPassword]
  );

  console.log('[Seed Admin] Akun admin berhasil disiapkan!');
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('[Seed Admin Error]', err);
  process.exit(1);
});
