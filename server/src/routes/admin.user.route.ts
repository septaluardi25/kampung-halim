import { Router } from 'express';
import {
  createAdminUserHandler,
  deleteAdminUserHandler,
  getAdminUserByIdHandler,
  listAdminUsersHandler,
  updateAdminUserHandler,
} from '../controllers/admin.user.controller';

export const adminUserRouter = Router();

adminUserRouter.get('/', listAdminUsersHandler);
adminUserRouter.get('/:id', getAdminUserByIdHandler);
adminUserRouter.post('/', createAdminUserHandler);
adminUserRouter.put('/:id', updateAdminUserHandler);
adminUserRouter.delete('/:id', deleteAdminUserHandler);
