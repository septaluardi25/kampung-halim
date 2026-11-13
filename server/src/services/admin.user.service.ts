import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import type { CreateUserInput, UpdateUserInput } from '../schemas/auth.schema';
import type { UserRole } from '../types/express';
import { hashPassword } from '../utils/crypt';
import { AdminServiceError } from '../utils/errors';

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  employee_name: string | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  employee_name: string | null;
  is_active: number;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapUserRow(row: UserRow): AdminUserListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    employee_id: row.employee_id,
    employee_name: row.employee_name ?? null,
    is_active: row.is_active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.employee_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      e.full_name AS employee_name
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    ORDER BY u.id ASC
  `;

  const [rows] = await pool.query<UserRow[]>(query);
  return rows.map(mapUserRow);
}

export async function getAdminUserById(id: number): Promise<AdminUserListItem> {
  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.employee_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      e.full_name AS employee_name
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query<UserRow[]>(query, [id]);
  const user = rows[0];

  if (!user) {
    throw new AdminServiceError(404, 'User tidak ditemukan');
  }

  return mapUserRow(user);
}

export async function createAdminUser(
  input: CreateUserInput
): Promise<AdminUserListItem> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
    [normalizedEmail]
  );

  if (existing.length > 0) {
    throw new AdminServiceError(409, 'Email sudah terdaftar');
  }

  const hashedPassword = await hashPassword(input.password);
  const isActiveNum = input.is_active !== false ? 1 : 0;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role, employee_id, is_active)
     VALUES (?, ?, ?, 'user', NULL, ?)`,
    [input.name.trim(), normalizedEmail, hashedPassword, isActiveNum]
  );

  return getAdminUserById(result.insertId);
}

export async function updateAdminUser(
  targetId: number,
  currentAdminId: number,
  input: UpdateUserInput
): Promise<AdminUserListItem> {
  const target = await getAdminUserById(targetId);

  if (input.role !== undefined && input.role !== target.role) {
    throw new AdminServiceError(
      400,
      'Perubahan role tidak diizinkan melalui endpoint ini'
    );
  }

  if (targetId === currentAdminId && input.is_active === false) {
    throw new AdminServiceError(
      400,
      'Anda tidak dapat menonaktifkan akun admin Anda sendiri'
    );
  }

  const normalizedEmail = input.email ? input.email.trim().toLowerCase() : null;
  if (normalizedEmail && normalizedEmail !== target.email.toLowerCase()) {
    const [dup] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? AND id <> ? LIMIT 1',
      [normalizedEmail, targetId]
    );

    if (dup.length > 0) {
      throw new AdminServiceError(
        409,
        'Email sudah terdaftar oleh akun lain'
      );
    }
  }

  let resolvedEmployeeId: number | null = target.employee_id;
  if (input.employee_id !== undefined) {
    if (input.employee_id !== null) {
      const [empRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM employees WHERE id = ? LIMIT 1',
        [input.employee_id]
      );

      if (empRows.length === 0) {
        throw new AdminServiceError(
          400,
          'Karyawan yang dipilih tidak ditemukan'
        );
      }

      const [linkedRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE employee_id = ? AND id <> ? LIMIT 1',
        [input.employee_id, targetId]
      );

      if (linkedRows.length > 0) {
        throw new AdminServiceError(
          409,
          'Karyawan ini sudah ditautkan ke akun user lain'
        );
      }

      resolvedEmployeeId = input.employee_id;
    } else {
      resolvedEmployeeId = null;
    }
  }

  let newPasswordHash: string | null = null;
  if (input.password) {
    newPasswordHash = await hashPassword(input.password);
  }

  const newName = input.name !== undefined ? input.name.trim() : target.name;
  const newEmail = normalizedEmail !== null ? normalizedEmail : target.email;
  const newIsActive =
    input.is_active !== undefined
      ? input.is_active
        ? 1
        : 0
      : target.is_active
      ? 1
      : 0;

  if (newPasswordHash) {
    await pool.query<ResultSetHeader>(
      `UPDATE users
       SET name = ?,
           email = ?,
           password_hash = ?,
           employee_id = ?,
           is_active = ?
       WHERE id = ?`,
      [newName, newEmail, newPasswordHash, resolvedEmployeeId, newIsActive, targetId]
    );
  } else {
    await pool.query<ResultSetHeader>(
      `UPDATE users
       SET name = ?,
           email = ?,
           employee_id = ?,
           is_active = ?
       WHERE id = ?`,
      [newName, newEmail, resolvedEmployeeId, newIsActive, targetId]
    );
  }

  return getAdminUserById(targetId);
}

export async function deleteAdminUser(
  targetId: number,
  currentAdminId: number
): Promise<{ id: number }> {
  if (targetId === currentAdminId) {
    throw new AdminServiceError(
      400,
      'Anda tidak dapat menghapus akun admin Anda sendiri'
    );
  }

  await getAdminUserById(targetId);

  await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [targetId]);

  return { id: targetId };
}
