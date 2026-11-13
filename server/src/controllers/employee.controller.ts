import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import {
  employeeIdParamSchema,
  employeeQuerySchema,
} from '../schemas/employee.schema';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface EmployeeCardRow extends RowDataPacket {
  id: number;
  full_name: string;
  nickname: string;
  photo_url: string | null;
}

interface EmployeeDetailRow extends RowDataPacket {
  id: number;
  full_name: string;
  nickname: string;
  hometown: string | null;
  hobby: string | null;
  contact: string | null;
  favorite_quote: string | null;
  photo_url: string | null;
}

interface EmployeeMemoryRow extends RowDataPacket {
  id: number;
  title: string;
  event_date: string;
}

interface EmployeeMessageRow extends RowDataPacket {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  recipient_employee_id: number;
  recipient_name: string;
  message: string;
  impression: string | null;
  created_at: Date;
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const parseResult = employeeQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    const firstErrorMessage =
      parseResult.error.issues[0]?.message || 'Parameter pencarian tidak valid';
    sendError(res, 400, firstErrorMessage);
    return;
  }

  const { search } = parseResult.data;

  try {
    let query = `
      SELECT id, full_name, nickname, photo_url
      FROM employees
      WHERE status = 'published'
    `;
    const queryParams: unknown[] = [];

    if (search && search.length > 0) {
      query += ` AND (full_name LIKE ? OR nickname LIKE ?)`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY full_name ASC`;

    const [rows] = await pool.query<EmployeeCardRow[]>(query, queryParams);

    const employees = rows.map((emp) => ({
      id: emp.id,
      full_name: emp.full_name,
      nickname: emp.nickname,
      photo_url: emp.photo_url,
      initials: generateInitials(emp.full_name),
    }));

    sendSuccess(res, 200, employees, 'Daftar karyawan berhasil diambil');
  } catch (error) {
    console.error('[GetEmployees Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar karyawan');
  }
}

export async function getEmployeeById(
  req: Request,
  res: Response
): Promise<void> {
  const parseResult = employeeIdParamSchema.safeParse(req.params);

  if (!parseResult.success) {
    const firstErrorMessage =
      parseResult.error.issues[0]?.message || 'ID karyawan tidak valid';
    sendError(res, 400, firstErrorMessage);
    return;
  }

  const { id } = parseResult.data;

  try {
    const employeeQuery = `
      SELECT
        id,
        full_name,
        nickname,
        hometown,
        hobby,
        contact,
        favorite_quote,
        photo_url
      FROM employees
      WHERE id = ? AND status = 'published'
      LIMIT 1
    `;

    const [employeeRows] = await pool.query<EmployeeDetailRow[]>(
      employeeQuery,
      [id]
    );

    if (employeeRows.length === 0) {
      sendError(res, 404, 'Karyawan tidak ditemukan');
      return;
    }

    const emp = employeeRows[0];

    const memoriesQuery = `
      SELECT
        m.id,
        m.title,
        DATE_FORMAT(m.event_date, '%Y-%m-%d') AS event_date
      FROM memory_employees me
      INNER JOIN memories m ON m.id = me.memory_id
      WHERE me.employee_id = ? AND m.status = 'published'
      ORDER BY m.event_date DESC, m.id DESC
    `;

    const [memoryRows] = await pool.query<EmployeeMemoryRow[]>(memoriesQuery, [
      id,
    ]);

    const messagesQuery = `
      SELECT
        msg.id,
        msg.sender_employee_id,
        s.full_name AS sender_name,
        msg.recipient_employee_id,
        r.full_name AS recipient_name,
        msg.message,
        msg.impression,
        msg.created_at
      FROM messages msg
      INNER JOIN employees s ON s.id = msg.sender_employee_id
      INNER JOIN employees r ON r.id = msg.recipient_employee_id
      WHERE (msg.sender_employee_id = ? OR msg.recipient_employee_id = ?)
        AND s.status = 'published'
        AND r.status = 'published'
      ORDER BY msg.created_at DESC, msg.id DESC
    `;

    const [messageRows] = await pool.query<EmployeeMessageRow[]>(messagesQuery, [
      id,
      id,
    ]);

    const messages = messageRows.map((msg) => ({
      id: msg.id,
      sender_employee_id: msg.sender_employee_id,
      sender_name: msg.sender_name,
      sender_initials: generateInitials(msg.sender_name),
      recipient_employee_id: msg.recipient_employee_id,
      recipient_name: msg.recipient_name,
      recipient_initials: generateInitials(msg.recipient_name),
      message: msg.message,
      impression: msg.impression,
      created_at: msg.created_at,
    }));

    sendSuccess(
      res,
      200,
      {
        id: emp.id,
        full_name: emp.full_name,
        nickname: emp.nickname,
        hometown: emp.hometown,
        hobby: emp.hobby,
        contact: emp.contact,
        favorite_quote: emp.favorite_quote,
        photo_url: emp.photo_url,
        initials: generateInitials(emp.full_name),
        memories: memoryRows,
        messages,
      },
      'Detail biodata karyawan berhasil diambil'
    );
  } catch (error) {
    console.error('[GetEmployeeById Error]', error);
    sendError(res, 500, 'Gagal mengambil detail biodata karyawan');
  }
}

