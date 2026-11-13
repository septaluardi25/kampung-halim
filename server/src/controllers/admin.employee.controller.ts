import type { NextFunction, Request, Response } from 'express';
import {
  adminEmployeeIdParamSchema,
  adminEmployeeQuerySchema,
  createAdminEmployeeSchema,
  updateAdminEmployeeSchema,
} from '../schemas/admin.employee.schema';
import {
  createAdminEmployee,
  deleteAdminEmployee,
  deleteEmployeePhoto,
  getAdminEmployeeById,
  listAdminEmployees,
  updateAdminEmployee,
  updateEmployeePhoto,
} from '../services/admin.employee.service';
import { validateImageBuffer } from '../utils/blob';
import { handleServiceError } from '../utils/handleServiceError';
import { sendError, sendSuccess } from '../utils/response';

export async function listAdminEmployeesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedQuery = adminEmployeeQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      sendError(res, 400, parsedQuery.error.issues[0]?.message ?? 'Query parameter tidak valid');
      return;
    }

    const employees = await listAdminEmployees(parsedQuery.data.search);
    sendSuccess(res, 200, employees, 'Daftar karyawan berhasil diambil');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function getAdminEmployeeByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminEmployeeIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID karyawan tidak valid');
      return;
    }

    const employee = await getAdminEmployeeById(parsedParams.data.id);
    sendSuccess(res, 200, employee, 'Detail karyawan berhasil diambil');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function createAdminEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedBody = createAdminEmployeeSchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data karyawan tidak valid');
      return;
    }

    const employee = await createAdminEmployee(parsedBody.data);
    sendSuccess(res, 201, employee, 'Karyawan berhasil ditambahkan');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function updateAdminEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminEmployeeIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID karyawan tidak valid');
      return;
    }

    const parsedBody = updateAdminEmployeeSchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendError(res, 400, parsedBody.error.issues[0]?.message ?? 'Data karyawan tidak valid');
      return;
    }

    const employee = await updateAdminEmployee(parsedParams.data.id, parsedBody.data);
    sendSuccess(res, 200, employee, 'Karyawan berhasil diperbarui');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function deleteAdminEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminEmployeeIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID karyawan tidak valid');
      return;
    }

    const result = await deleteAdminEmployee(parsedParams.data.id);
    sendSuccess(res, 200, result, 'Karyawan berhasil dihapus');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function uploadEmployeePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminEmployeeIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID karyawan tidak valid');
      return;
    }

    if (!req.file) {
      sendError(res, 400, 'File foto wajib diunggah pada field photo');
      return;
    }

    const detectedExt = validateImageBuffer(req.file.buffer, req.file.mimetype);
    if (!detectedExt) {
      sendError(
        res,
        400,
        'Format file tidak didukung atau signature file tidak valid. Gunakan JPG, PNG, atau WebP asli'
      );
      return;
    }

    const photoUrl = await updateEmployeePhoto(
      parsedParams.data.id,
      req.file.buffer,
      detectedExt,
      req.file.mimetype
    );

    sendSuccess(res, 200, { photo_url: photoUrl }, 'Foto karyawan berhasil diperbarui');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function deleteEmployeePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = adminEmployeeIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendError(res, 400, parsedParams.error.issues[0]?.message ?? 'ID karyawan tidak valid');
      return;
    }

    await deleteEmployeePhoto(parsedParams.data.id);
    sendSuccess(res, 200, { photo_url: null }, 'Foto karyawan berhasil dihapus');
  } catch (error) {
    handleServiceError(error, res, next);
  }
}
