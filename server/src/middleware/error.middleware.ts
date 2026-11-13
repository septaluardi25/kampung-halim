import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'Endpoint tidak ditemukan');
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('[Server Error]', err);
  } else {
    console.error('[Server Error]', err.message);
  }

  sendError(res, 500, 'Terjadi kesalahan pada server');
}

