import type { NextFunction, Request, Response } from 'express';
import {
  adminMemoryBodySchema,
  adminMemoryIdParamSchema,
} from '../schemas/admin.memory.schema';
import {
  createAdminMemory,
  deleteAdminMemory,
  getAdminMemoryById,
  listAdminMemories,
  updateAdminMemory,
} from '../services/admin.memory.service';
import { AdminServiceError } from '../utils/errors';
import { sendError, sendSuccess } from '../utils/response';

export async function listAdminMemoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const memories = await listAdminMemories();
    sendSuccess(res, 200, memories, 'Daftar kenangan berhasil diambil');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function getAdminMemoryByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminMemoryIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID kenangan tidak valid');
      return;
    }

    const memory = await getAdminMemoryById(parsedParams.data.id);
    sendSuccess(res, 200, memory, 'Detail kenangan berhasil diambil');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function createAdminMemoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedBody = adminMemoryBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data kenangan tidak valid');
      return;
    }

    const memory = await createAdminMemory(parsedBody.data);
    sendSuccess(res, 201, memory, 'Kenangan berhasil ditambahkan');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function updateAdminMemoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminMemoryIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID kenangan tidak valid');
      return;
    }

    const parsedBody = adminMemoryBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data kenangan tidak valid');
      return;
    }

    const memory = await updateAdminMemory(parsedParams.data.id, parsedBody.data);
    sendSuccess(res, 200, memory, 'Kenangan berhasil diperbarui');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function deleteAdminMemoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminMemoryIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID kenangan tidak valid');
      return;
    }

    const result = await deleteAdminMemory(parsedParams.data.id);
    sendSuccess(res, 200, result, 'Kenangan berhasil dihapus');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}
