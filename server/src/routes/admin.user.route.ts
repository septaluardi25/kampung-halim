import { Router } from 'express';
import {
  createAdminUserHandler,
  deleteAdminUserHandler,
  getAdminUserByIdHandler,
  listAdminUsersHandler,
  updateAdminUserHandler,
} from '../controllers/admin.user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorizeAdmin);

adminUserRouter.get('/', listAdminUsersHandler);
adminUserRouter.get('/:id', getAdminUserByIdHandler);
adminUserRouter.post('/', createAdminUserHandler);
adminUserRouter.put('/:id', updateAdminUserHandler);
adminUserRouter.delete('/:id', deleteAdminUserHandler);
