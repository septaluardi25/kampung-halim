import { Router } from 'express';
import {
  createAdminMemoryHandler,
  deleteAdminMemoryHandler,
  getAdminMemoryByIdHandler,
  listAdminMemoriesHandler,
  updateAdminMemoryHandler,
} from '../controllers/admin.memory.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export const adminMemoryRouter = Router();

adminMemoryRouter.use(authenticate, authorizeAdmin);

adminMemoryRouter.get('/', listAdminMemoriesHandler);
adminMemoryRouter.get('/:id', getAdminMemoryByIdHandler);
adminMemoryRouter.post('/', createAdminMemoryHandler);
adminMemoryRouter.put('/:id', updateAdminMemoryHandler);
adminMemoryRouter.delete('/:id', deleteAdminMemoryHandler);
