import { Router } from 'express';
import healthRoutes from './health.route';

const router = Router();

router.use('/', healthRoutes);

export default router;

