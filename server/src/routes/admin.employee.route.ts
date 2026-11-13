import { Router } from 'express';
import {
  createAdminEmployeeHandler,
  deleteAdminEmployeeHandler,
  deleteEmployeePhotoHandler,
  getAdminEmployeeByIdHandler,
  listAdminEmployeesHandler,
  updateAdminEmployeeHandler,
  uploadEmployeePhotoHandler,
} from '../controllers/admin.employee.controller';
import { uploadEmployeePhotoMiddleware } from '../middleware/upload.middleware';

export const adminEmployeeRouter = Router();

adminEmployeeRouter.get('/', listAdminEmployeesHandler);
adminEmployeeRouter.get('/:id', getAdminEmployeeByIdHandler);
adminEmployeeRouter.post('/', createAdminEmployeeHandler);
adminEmployeeRouter.put('/:id', updateAdminEmployeeHandler);
adminEmployeeRouter.delete('/:id', deleteAdminEmployeeHandler);

adminEmployeeRouter.post(
  '/:id/photo',
  uploadEmployeePhotoMiddleware,
  uploadEmployeePhotoHandler
);
adminEmployeeRouter.delete('/:id/photo', deleteEmployeePhotoHandler);
