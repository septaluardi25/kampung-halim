import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import type { CreateAdminMessageInput } from '../schemas/admin.message.schema';
import { generateInitials } from '../utils/avatar';
import { AdminServiceError } from '../utils/errors';

export interface AdminMessageDetail {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  sender_initials: string;
  recipient_employee_id: number;
  recipient_name: string;
  recipient_initials: string;
  message: string;
  impression: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface MessageRow extends RowDataPacket {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  recipient_employee_id: number;
  recipient_name: string;
  message: string;
  impression: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export async function listAdminMessages(): Promise<AdminMessageDetail[]> {
  const query = `
    SELECT
      m.id,
      m.sender_employee_id,
      s.full_name AS sender_name,
      m.recipient_employee_id,
      r.full_name AS recipient_name,
      m.message,
      m.impression,
      m.created_at,
      m.updated_at
    FROM messages m
    INNER JOIN employees s ON s.id = m.sender_employee_id
    INNER JOIN employees r ON r.id = m.recipient_employee_id
    ORDER BY m.created_at DESC, m.id DESC
  `;

  const [rows] = await pool.query<MessageRow[]>(query);

  return rows.map((row) => ({
    id: row.id,
    sender_employee_id: row.sender_employee_id,
    sender_name: row.sender_name,
    sender_initials: generateInitials(row.sender_name),
    recipient_employee_id: row.recipient_employee_id,
    recipient_name: row.recipient_name,
    recipient_initials: generateInitials(row.recipient_name),
    message: row.message,
    impression: row.impression,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function getAdminMessageById(id: number): Promise<AdminMessageDetail> {
  const query = `
    SELECT
      m.id,
      m.sender_employee_id,
      s.full_name AS sender_name,
      m.recipient_employee_id,
      r.full_name AS recipient_name,
      m.message,
      m.impression,
      m.created_at,
      m.updated_at
    FROM messages m
    INNER JOIN employees s ON s.id = m.sender_employee_id
    INNER JOIN employees r ON r.id = m.recipient_employee_id
    WHERE m.id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query<MessageRow[]>(query, [id]);
  const row = rows[0];

  if (!row) {
    throw new AdminServiceError(404, 'Pesan tidak ditemukan');
  }

  return {
    id: row.id,
    sender_employee_id: row.sender_employee_id,
    sender_name: row.sender_name,
    sender_initials: generateInitials(row.sender_name),
    recipient_employee_id: row.recipient_employee_id,
    recipient_name: row.recipient_name,
    recipient_initials: generateInitials(row.recipient_name),
    message: row.message,
    impression: row.impression,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createAdminMessage(
  input: CreateAdminMessageInput
): Promise<AdminMessageDetail> {
  const [empRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM employees WHERE id IN (?, ?)',
    [input.sender_employee_id, input.recipient_employee_id]
  );

  if (empRows.length < 2) {
    throw new AdminServiceError(400, 'Karyawan pengirim atau penerima tidak ditemukan');
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO messages (sender_employee_id, recipient_employee_id, message, impression)
     VALUES (?, ?, ?, ?)`,
    [
      input.sender_employee_id,
      input.recipient_employee_id,
      input.message.trim(),
      input.impression,
    ]
  );

  return getAdminMessageById(result.insertId);
}

export async function deleteAdminMessage(id: number): Promise<{ id: number }> {
  await getAdminMessageById(id);
  await pool.query('DELETE FROM messages WHERE id = ?', [id]);
  return { id };
}
