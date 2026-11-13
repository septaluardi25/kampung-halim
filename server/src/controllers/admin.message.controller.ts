import type { NextFunction, Request, Response } from 'express';
import {
  adminMessageIdParamSchema,
  createAdminMessageSchema,
} from '../schemas/admin.message.schema';
import {
  createAdminMessage,
  deleteAdminMessage,
  listAdminMessages,
} from '../services/admin.message.service';
import { AdminServiceError } from '../utils/errors';
import { sendError, sendSuccess } from '../utils/response';

export async function listAdminMessagesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const messages = await listAdminMessages();
    sendSuccess(res, 200, messages, 'Daftar pesan berhasil diambil');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function createAdminMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedBody = createAdminMessageSchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data pesan tidak valid');
      return;
    }

    const message = await createAdminMessage(parsedBody.data);
    sendSuccess(res, 201, message, 'Pesan berhasil ditambahkan');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function deleteAdminMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminMessageIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID pesan tidak valid');
      return;
    }

    const result = await deleteAdminMessage(parsedParams.data.id);
    sendSuccess(res, 200, result, 'Pesan berhasil dihapus');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}
