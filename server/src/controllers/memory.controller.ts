import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { memoryIdParamSchema } from '../schemas/memory.schema';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface MemoryListRow extends RowDataPacket {
  id: number;
  title: string;
  event_date: string;
  story: string;
  created_at: Date;
}

interface TaggedEmployeeRow extends RowDataPacket {
  id: number;
  full_name: string;
  photo_url: string | null;
}

export async function getMemories(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        id,
        title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
        story,
        created_at
      FROM memories
      WHERE status = 'published'
      ORDER BY event_date DESC, id DESC
    `;

    const [rows] = await pool.query<MemoryListRow[]>(query);

    sendSuccess(res, 200, rows, 'Daftar kenangan berhasil diambil');
  } catch (error) {
    console.error('[GetMemories Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar kenangan');
  }
}

export async function getMemoryById(
  req: Request,
  res: Response
): Promise<void> {
  const parseResult = memoryIdParamSchema.safeParse(req.params);

  if (!parseResult.success) {
    const firstError =
      parseResult.error.issues[0]?.message || 'ID kenangan tidak valid';
    sendError(res, 400, firstError);
    return;
  }

  const { id } = parseResult.data;

  try {
    const memoryQuery = `
      SELECT
        id,
        title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
        story
      FROM memories
      WHERE id = ? AND status = 'published'
      LIMIT 1
    `;

    const [memoryRows] = await pool.query<MemoryListRow[]>(memoryQuery, [id]);

    if (memoryRows.length === 0) {
      sendError(res, 404, 'Kenangan tidak ditemukan');
      return;
    }

    const employeesQuery = `
      SELECT
        e.id,
        e.full_name,
        e.photo_url
      FROM memory_employees me
      INNER JOIN employees e ON e.id = me.employee_id
      WHERE me.memory_id = ? AND e.status = 'published'
      ORDER BY e.full_name ASC
    `;

    const [employeeRows] = await pool.query<TaggedEmployeeRow[]>(
      employeesQuery,
      [id]
    );

    const employees = employeeRows.map((emp) => ({
      id: emp.id,
      full_name: emp.full_name,
      photo_url: emp.photo_url,
      initials: generateInitials(emp.full_name),
    }));

    const memory = memoryRows[0];

    sendSuccess(
      res,
      200,
      {
        id: memory.id,
        title: memory.title,
        event_date: memory.event_date,
        story: memory.story,
        employees,
      },
      'Detail kenangan berhasil diambil'
    );
  } catch (error) {
    console.error('[GetMemoryById Error]', error);
    sendError(res, 500, 'Gagal mengambil detail kenangan');
  }
}
