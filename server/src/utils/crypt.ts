import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Meng-crypt (hash) password plaintext menggunakan bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Memverifikasi kecocokan password plaintext terhadap hash bcrypt.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
