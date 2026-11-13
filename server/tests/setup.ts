import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { afterAll, beforeEach } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { hashPassword } from '../src/utils/crypt';

process.env.NODE_ENV = 'test';

export async function resetDb() {
  await pool.query('DELETE FROM messages');
  await pool.query('DELETE FROM memory_employees');
  await pool.query('DELETE FROM memories');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM employees');
}

export async function seedAdmin(
  name = 'Administrator',
  email = 'admin@wargahalim.id',
  password = 'AdminPass123!'
): Promise<number> {
  const hash = await hashPassword(password);
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role, employee_id, is_active)
     VALUES (?, ?, ?, 'admin', NULL, 1)`,
    [name, email, hash]
  );
  return res.insertId;
}

export async function seedUser(
  name = 'User Biasa',
  email = 'user@wargahalim.id',
  password = 'UserPass123!',
  employeeId: number | null = null,
  isActive = 1
): Promise<number> {
  const hash = await hashPassword(password);
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role, employee_id, is_active)
     VALUES (?, ?, ?, 'user', ?, ?)`,
    [name, email, hash, employeeId, isActive]
  );
  return res.insertId;
}

export async function seedEmployee(
  fullName: string,
  nickname = '',
  status: 'draft' | 'published' = 'published',
  hometown: string | null = 'Jakarta',
  hobby: string | null = 'Membaca',
  contact: string | null = '08123456789',
  quote: string | null = 'Tetap semangat'
): Promise<number> {
  const nick = nickname || fullName.split(/\s+/)[0] || fullName;
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO employees (full_name, nickname, hometown, hobby, contact, favorite_quote, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fullName, nick, hometown, hobby, contact, quote, status]
  );
  return res.insertId;
}

export async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});
