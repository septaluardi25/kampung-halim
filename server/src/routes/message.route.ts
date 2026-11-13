import { Router } from 'express';
import { getMessages } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/messages', authenticate, getMessages);

export default router;
