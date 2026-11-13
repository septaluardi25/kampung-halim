import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface MessageRow extends RowDataPacket {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  recipient_employee_id: number;
  recipient_name: string;
  message: string;
  impression: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getMessages(
  _req: Request,
  res: Response
): Promise<void> {
  try {
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
      WHERE s.status = 'published' AND r.status = 'published'
      ORDER BY m.created_at DESC, m.id DESC
    `;

    const [rows] = await pool.query<MessageRow[]>(query);

    const messages = rows.map((row) => ({
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

    sendSuccess(res, 200, messages, 'Daftar pesan dan kesan berhasil diambil');
  } catch (error) {
    console.error('[GetMessages Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar pesan dan kesan');
  }
}
