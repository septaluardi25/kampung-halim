import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import {
  AuthServiceError,
  getCurrentUser,
  loginUser,
  registerUser,
} from '../services/auth.service';
import { sendError, sendSuccess } from '../utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = String(issue.path[0] ?? 'body');
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    const firstMessage =
      parseResult.error.issues[0]?.message || 'Data registrasi tidak valid';
    sendError(res, 400, firstMessage, { errors: fieldErrors });
    return;
  }

  try {
    const createdUser = await registerUser(parseResult.data);
    sendSuccess(
      res,
      201,
      createdUser,
      'Registrasi berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan untuk masuk.'
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    console.error('[Register Error]', error);
    sendError(res, 500, 'Gagal memproses registrasi');
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = String(issue.path[0] ?? 'body');
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    const firstMessage =
      parseResult.error.issues[0]?.message || 'Data login tidak valid';
    sendError(res, 400, firstMessage, { errors: fieldErrors });
    return;
  }

  try {
    const result = await loginUser(parseResult.data);
    sendSuccess(res, 200, result, 'Login berhasil');
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    console.error('[Login Error]', error);
    sendError(res, 500, 'Gagal memproses login');
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  try {
    const userProfile = await getCurrentUser(req.user.id);
    sendSuccess(res, 200, userProfile, 'Data akun berhasil diambil');
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    console.error('[AuthMe Error]', error);
    sendError(res, 500, 'Gagal mengambil data akun');
  }
}
