import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types/express';
import { sendError } from '../utils/response';

/**
 * Middleware factory reusable untuk membatasi akses endpoint berdasarkan role.
 * Wajib dipanggil SETELAH middleware `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'Akses ditolak. Anda tidak memiliki izin untuk mengakses sumber daya ini'
      );
      return;
    }

    next();
  };
}

/**
 * Shorthand middleware khusus untuk endpoint Panel Admin (`role === 'admin'`).
 */
export const authorizeAdmin = authorize('admin');
