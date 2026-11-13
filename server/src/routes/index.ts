import { Router } from 'express';
import healthRoutes from './health.route';
import employeeRoutes from './employee.route';

const router = Router();

router.use('/', healthRoutes);
router.use('/', employeeRoutes);

export default router;
