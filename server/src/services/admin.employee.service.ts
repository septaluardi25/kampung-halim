import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import type {
  CreateAdminEmployeeInput,
  UpdateAdminEmployeeInput,
} from '../schemas/admin.employee.schema';
import { deletePhotoFromBlob, uploadPhotoToBlob } from '../utils/blob';
import { AdminServiceError } from '../utils/errors';

export interface AdminEmployeeRow extends RowDataPacket {
  id: number;
  full_name: string;
  nickname: string;
  hometown: string | null;
  hobby: string | null;
  contact: string | null;
  favorite_quote: string | null;
  photo_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export async function listAdminEmployees(search: string = ''): Promise<AdminEmployeeRow[]> {
  const trimmed = search.trim();
  if (trimmed) {
    const [rows] = await pool.query<AdminEmployeeRow[]>(
      `SELECT id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url, status, created_at, updated_at
       FROM employees
       WHERE full_name LIKE ?
       ORDER BY full_name ASC, id ASC`,
      [`%${trimmed}%`]
    );
    return rows;
  }

  const [rows] = await pool.query<AdminEmployeeRow[]>(
    `SELECT id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url, status, created_at, updated_at
     FROM employees
     ORDER BY full_name ASC, id ASC`
  );
  return rows;
}

export async function getAdminEmployeeById(id: number): Promise<AdminEmployeeRow> {
  const [rows] = await pool.query<AdminEmployeeRow[]>(
    `SELECT id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url, status, created_at, updated_at
     FROM employees
     WHERE id = ?`,
    [id]
  );

  const employee = rows[0];
  if (!employee) {
    throw new AdminServiceError(404, 'Karyawan tidak ditemukan');
  }

  return employee;
}

export async function createAdminEmployee(
  input: CreateAdminEmployeeInput
): Promise<AdminEmployeeRow> {
  const resolvedNickname =
    input.nickname && input.nickname.trim() !== ''
      ? input.nickname.trim()
      : input.full_name.trim().split(/\s+/)[0] || input.full_name.trim();

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO employees (full_name, nickname, hometown, hobby, contact, favorite_quote, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.full_name.trim(),
      resolvedNickname,
      input.hometown,
      input.hobby,
      input.contact,
      input.favorite_quote,
      input.status,
    ]
  );

  return getAdminEmployeeById(result.insertId);
}

export async function updateAdminEmployee(
  id: number,
  input: UpdateAdminEmployeeInput
): Promise<AdminEmployeeRow> {
  await getAdminEmployeeById(id);

  const resolvedNickname =
    input.nickname && input.nickname.trim() !== ''
      ? input.nickname.trim()
      : input.full_name.trim().split(/\s+/)[0] || input.full_name.trim();

  await pool.query<ResultSetHeader>(
    `UPDATE employees
     SET full_name = ?,
         nickname = ?,
         hometown = ?,
         hobby = ?,
         contact = ?,
         favorite_quote = ?,
         status = ?
     WHERE id = ?`,
    [
      input.full_name.trim(),
      resolvedNickname,
      input.hometown,
      input.hobby,
      input.contact,
      input.favorite_quote,
      input.status,
      id,
    ]
  );

  return getAdminEmployeeById(id);
}

export async function deleteAdminEmployee(id: number): Promise<{ id: number }> {
  const employee = await getAdminEmployeeById(id);

  if (employee.photo_url) {
    await deletePhotoFromBlob(employee.photo_url);
  }

  await pool.query<ResultSetHeader>('DELETE FROM employees WHERE id = ?', [id]);

  return { id };
}

export async function updateEmployeePhoto(
  id: number,
  buffer: Buffer,
  extension: 'jpg' | 'png' | 'webp',
  mimeType: string
): Promise<string> {
  const employee = await getAdminEmployeeById(id);
  const oldPhotoUrl = employee.photo_url;

  const newPhotoUrl = await uploadPhotoToBlob(id, buffer, extension, mimeType);

  try {
    await pool.query<ResultSetHeader>(
      'UPDATE employees SET photo_url = ? WHERE id = ?',
      [newPhotoUrl, id]
    );
  } catch (error) {
    await deletePhotoFromBlob(newPhotoUrl);
    throw error;
  }

  if (oldPhotoUrl) {
    await deletePhotoFromBlob(oldPhotoUrl);
  }

  return newPhotoUrl;
}

export async function deleteEmployeePhoto(id: number): Promise<void> {
  const employee = await getAdminEmployeeById(id);

  if (employee.photo_url) {
    await deletePhotoFromBlob(employee.photo_url);
  }

  await pool.query<ResultSetHeader>(
    'UPDATE employees SET photo_url = NULL WHERE id = ?',
    [id]
  );
}
