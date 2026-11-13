import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import {
  loginRateLimiter,
  registerRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.post('/auth/register', registerRateLimiter, register);
router.post('/auth/login', loginRateLimiter, login);
router.get('/auth/me', authenticate, me);

export default router;
