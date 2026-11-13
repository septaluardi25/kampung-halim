import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { sendError } from '../utils/response';
import type { RowDataPacket } from 'mysql2';

export interface AuthenticatedUserPayload {
  id: number;
  email: string;
  role: 'admin' | 'user';
  employee_id: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

interface UserRow extends RowDataPacket {
  id: number;
  role: 'admin' | 'user';
  employee_id: number | null;
  is_active: number;
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

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;

    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, role, employee_id, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].is_active !== 1) {
      sendError(res, 403, 'Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan');
      return;
    }

    req.user = {
      id: rows[0].id,
      email: decoded.email,
      role: rows[0].role,
      employee_id: rows[0].employee_id,
    };

    next();
  } catch {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
  }
}
