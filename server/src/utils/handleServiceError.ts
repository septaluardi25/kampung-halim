import type { NextFunction, Response } from 'express';
import { AdminServiceError } from './errors';
import { sendError } from './response';

export function handleServiceError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AdminServiceError) {
    sendError(res, error.statusCode, error.message);
    return;
  }

  next(error);
}
