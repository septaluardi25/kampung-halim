import { Router } from 'express';
import {
  createAdminMessageHandler,
  deleteAdminMessageHandler,
  listAdminMessagesHandler,
} from '../controllers/admin.message.controller';

export const adminMessageRouter = Router();

adminMessageRouter.get('/', listAdminMessagesHandler);
adminMessageRouter.post('/', createAdminMessageHandler);
adminMessageRouter.delete('/:id', deleteAdminMessageHandler);
