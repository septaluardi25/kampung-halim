import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { env } from '../config/env';
import { pool } from '../db/pool';
import type { UserRole } from '../types/express';
import { sendError } from '../utils/response';

interface JwtTokenPayload {
  id: number;
  email: string;
  role: UserRole;
  employee_id: number | null;
}

interface AuthUserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
}

function isValidJwtPayload(payload: unknown): payload is JwtTokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'admin' || candidate.role === 'user')
  );
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
    return;
  }

  if (!isValidJwtPayload(decoded)) {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
    return;
  }

  try {
    const [rows] = await pool.query<AuthUserRow[]>(
      'SELECT id, name, email, role, employee_id, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].is_active !== 1) {
      sendError(
        res,
        403,
        'Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan'
      );
      return;
    }

    const userRow = rows[0];

    req.user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      employee_id: userRow.employee_id,
    };

    next();
  } catch (error) {
    console.error('[Authenticate Error]', error);
    sendError(res, 500, 'Gagal memverifikasi sesi pengguna');
  }
}
