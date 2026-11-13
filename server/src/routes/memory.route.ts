import { Router } from 'express';
import { getMemories, getMemoryById } from '../controllers/memory.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/memories', authenticate, getMemories);
router.get('/memories/:id', authenticate, getMemoryById);

export default router;
