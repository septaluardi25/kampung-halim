import { Router } from 'express';
import {
  createAdminMessageHandler,
  deleteAdminMessageHandler,
  listAdminMessagesHandler,
} from '../controllers/admin.message.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export const adminMessageRouter = Router();

adminMessageRouter.use(authenticate, authorizeAdmin);

adminMessageRouter.get('/', listAdminMessagesHandler);
adminMessageRouter.post('/', createAdminMessageHandler);
adminMessageRouter.delete('/:id', deleteAdminMessageHandler);
