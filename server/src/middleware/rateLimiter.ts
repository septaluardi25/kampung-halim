import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { sendError } from '../utils/response';

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  skipInTest?: boolean;
}

/**
 * Membatasi percobaan login maksimal 5 request per 1 menit per IP.
 */
export function createLoginRateLimiter(options?: RateLimiterOptions) {
  const skipInTest = options?.skipInTest ?? false;

  return rateLimit({
    windowMs: options?.windowMs ?? 60 * 1000, // 1 menit
    max: options?.max ?? 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => skipInTest && process.env.NODE_ENV === 'test',
    handler: (_req: Request, res: Response) => {
      sendError(
        res,
        429,
        'Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit'
      );
    },
  });
}

export const loginRateLimiter = createLoginRateLimiter({ skipInTest: true });

/**
 * Membatasi percobaan registrasi maksimal 5 request per 1 menit per IP.
 */
export function createRegisterRateLimiter(options?: RateLimiterOptions) {
  const skipInTest = options?.skipInTest ?? false;

  return rateLimit({
    windowMs: options?.windowMs ?? 60 * 1000, // 1 menit
    max: options?.max ?? 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => skipInTest && process.env.NODE_ENV === 'test',
    handler: (_req: Request, res: Response) => {
      sendError(
        res,
        429,
        'Terlalu banyak percobaan registrasi. Silakan coba lagi setelah 1 menit'
      );
    },
  });
}

export const registerRateLimiter = createRegisterRateLimiter({ skipInTest: true });
