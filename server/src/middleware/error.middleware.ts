import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';

interface CustomError extends Error {
  type?: string;
  code?: string;
  statusCode?: number;
  status?: number;
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'Endpoint tidak ditemukan');
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const customErr = err as CustomError;

  if (customErr.type === 'entity.parse.failed') {
    sendError(res, 400, 'Format JSON tidak valid');
    return;
  }

  if (
    customErr.type === 'entity.too.large' ||
    customErr.status === 413 ||
    customErr.statusCode === 413
  ) {
    sendError(res, 413, 'Ukuran request terlalu besar');
    return;
  }

  if (customErr.code === 'ER_DUP_ENTRY') {
    sendError(res, 409, 'Data sudah digunakan');
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('[Server Error]', err);
  } else {
    console.error('[Server Error]', err.message);
  }

  sendError(res, 500, 'Terjadi kesalahan pada server');
}
