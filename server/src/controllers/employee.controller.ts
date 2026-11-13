import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { employeeQuerySchema } from '../schemas/employee.schema';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface EmployeeCardRow extends RowDataPacket {
  id: number;
  full_name: string;
  nickname: string;
  photo_url: string | null;
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
