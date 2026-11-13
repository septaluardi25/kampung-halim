import type { NextFunction, Request, Response } from 'express';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../schemas/auth.schema';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  listAdminUsers,
  updateAdminUser,
} from '../services/admin.user.service';
import { AdminServiceError } from '../utils/errors';
import { sendError, sendSuccess } from '../utils/response';

export async function listAdminUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await listAdminUsers();
    sendSuccess(res, 200, users, 'Daftar user berhasil diambil');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function getAdminUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = userIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID user tidak valid');
      return;
    }

    const user = await getAdminUserById(parsedParams.data.id);
    sendSuccess(res, 200, user, 'Detail user berhasil diambil');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function createAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedBody = createUserSchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data user tidak valid');
      return;
    }

    const user = await createAdminUser(parsedBody.data);
    sendSuccess(res, 201, user, 'User berhasil dibuat');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function updateAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = userIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID user tidak valid');
      return;
    }

    const parsedBody = updateUserSchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data user tidak valid');
      return;
    }

    const currentAdminId = req.user?.id ?? 0;
    const user = await updateAdminUser(
      parsedParams.data.id,
      currentAdminId,
      parsedBody.data
    );

    sendSuccess(res, 200, user, 'User berhasil diperbarui');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}

export async function deleteAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = userIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID user tidak valid');
      return;
    }

    const currentAdminId = req.user?.id ?? 0;
    const result = await deleteAdminUser(parsedParams.data.id, currentAdminId);

    sendSuccess(res, 200, result, 'User berhasil dihapus');
  } catch (error) {
    if (error instanceof AdminServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    next(error);
  }
}
