import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import type { AdminMemoryBodyInput } from '../schemas/admin.memory.schema';
import { AdminServiceError } from '../utils/errors';

export interface AdminMemoryEmployee {
  id: number;
  full_name: string;
  status: 'draft' | 'published';
}

export interface AdminMemoryDetail {
  id: number;
  title: string;
  event_date: string;
  story: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  employee_ids: number[];
  employees: AdminMemoryEmployee[];
}

interface MemoryRow extends RowDataPacket {
  id: number;
  title: string;
  event_date: string;
  story: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface TaggedRow extends RowDataPacket {
  memory_id: number;
  id: number;
  full_name: string;
  status: 'draft' | 'published';
}

export async function listAdminMemories(): Promise<AdminMemoryDetail[]> {
  const [memories] = await pool.query<MemoryRow[]>(
    `SELECT
       id,
       title,
       DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
       story,
       status,
       created_at,
       updated_at
     FROM memories
     ORDER BY event_date DESC, id DESC`
  );

  if (memories.length === 0) {
    return [];
  }

  const [tagged] = await pool.query<TaggedRow[]>(
    `SELECT
       me.memory_id,
       e.id,
       e.full_name,
       e.status
     FROM memory_employees me
     INNER JOIN employees e ON e.id = me.employee_id
     ORDER BY e.full_name ASC`
  );

  const tagsByMemoryId = new Map<number, AdminMemoryEmployee[]>();
  for (const tag of tagged) {
    const list = tagsByMemoryId.get(tag.memory_id) || [];
    list.push({
      id: tag.id,
      full_name: tag.full_name,
      status: tag.status,
    });
    tagsByMemoryId.set(tag.memory_id, list);
  }

  return memories.map((mem) => {
    const emps = tagsByMemoryId.get(mem.id) || [];
    return {
      id: mem.id,
      title: mem.title,
      event_date: mem.event_date,
      story: mem.story,
      status: mem.status,
      created_at: mem.created_at,
      updated_at: mem.updated_at,
      employee_ids: emps.map((e) => e.id),
      employees: emps,
    };
  });
}

export async function getAdminMemoryById(id: number): Promise<AdminMemoryDetail> {
  const [rows] = await pool.query<MemoryRow[]>(
    `SELECT
       id,
       title,
       DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
       story,
       status,
       created_at,
       updated_at
     FROM memories
     WHERE id = ?`,
    [id]
  );

  const memory = rows[0];
  if (!memory) {
    throw new AdminServiceError(404, 'Kenangan tidak ditemukan');
  }

  const [tagged] = await pool.query<TaggedRow[]>(
    `SELECT
       e.id,
       e.full_name,
       e.status
     FROM memory_employees me
     INNER JOIN employees e ON e.id = me.employee_id
     WHERE me.memory_id = ?
     ORDER BY e.full_name ASC`,
    [id]
  );

  const employees: AdminMemoryEmployee[] = tagged.map((t) => ({
    id: t.id,
    full_name: t.full_name,
    status: t.status,
  }));

  return {
    id: memory.id,
    title: memory.title,
    event_date: memory.event_date,
    story: memory.story,
    status: memory.status,
    created_at: memory.created_at,
    updated_at: memory.updated_at,
    employee_ids: employees.map((e) => e.id),
    employees,
  };
}

export async function createAdminMemory(
  input: AdminMemoryBodyInput
): Promise<AdminMemoryDetail> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (input.employee_ids.length > 0) {
      const placeholders = input.employee_ids.map(() => '?').join(', ');
      const [empRows] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id IN (${placeholders})`,
        input.employee_ids
      );
      if (empRows.length !== input.employee_ids.length) {
        throw new AdminServiceError(400, 'Terdapat ID karyawan yang tidak ditemukan');
      }
    }

    const [res] = await connection.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status)
       VALUES (?, ?, ?, ?)`,
      [input.title.trim(), input.event_date, input.story.trim(), input.status]
    );

    const memoryId = res.insertId;

    for (const empId of input.employee_ids) {
      await connection.query(
        `INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)`,
        [memoryId, empId]
      );
    }

    await connection.commit();
    return getAdminMemoryById(memoryId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminMemory(
  id: number,
  input: AdminMemoryBodyInput
): Promise<AdminMemoryDetail> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM memories WHERE id = ?`,
      [id]
    );
    if (existRows.length === 0) {
      throw new AdminServiceError(404, 'Kenangan tidak ditemukan');
    }

    if (input.employee_ids.length > 0) {
      const placeholders = input.employee_ids.map(() => '?').join(', ');
      const [empRows] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id IN (${placeholders})`,
        input.employee_ids
      );
      if (empRows.length !== input.employee_ids.length) {
        throw new AdminServiceError(400, 'Terdapat ID karyawan yang tidak ditemukan');
      }
    }

    await connection.query(
      `UPDATE memories
       SET title = ?,
           event_date = ?,
           story = ?,
           status = ?
       WHERE id = ?`,
      [input.title.trim(), input.event_date, input.story.trim(), input.status, id]
    );

    await connection.query(
      `DELETE FROM memory_employees WHERE memory_id = ?`,
      [id]
    );

    for (const empId of input.employee_ids) {
      await connection.query(
        `INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)`,
        [id, empId]
      );
    }

    await connection.commit();
    return getAdminMemoryById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteAdminMemory(id: number): Promise<{ id: number }> {
  await getAdminMemoryById(id);
  await pool.query('DELETE FROM memories WHERE id = ?', [id]);
  return { id };
}
