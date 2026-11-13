import type { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data: T,
  message: string
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null
): Response<ApiResponse<unknown>> {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
}

