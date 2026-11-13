import { Router } from 'express';
import {
  createAdminMemoryHandler,
  deleteAdminMemoryHandler,
  getAdminMemoryByIdHandler,
  listAdminMemoriesHandler,
  updateAdminMemoryHandler,
} from '../controllers/admin.memory.controller';

export const adminMemoryRouter = Router();

adminMemoryRouter.get('/', listAdminMemoriesHandler);
adminMemoryRouter.get('/:id', getAdminMemoryByIdHandler);
adminMemoryRouter.post('/', createAdminMemoryHandler);
adminMemoryRouter.put('/:id', updateAdminMemoryHandler);
adminMemoryRouter.delete('/:id', deleteAdminMemoryHandler);
