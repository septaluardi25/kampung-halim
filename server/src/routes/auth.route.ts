import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/auth/login', loginRateLimiter, login);
router.get('/auth/me', authenticate, me);

export default router;
