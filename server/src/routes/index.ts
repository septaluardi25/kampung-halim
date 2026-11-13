import { Router } from 'express';
import healthRoutes from './health.route';
import employeeRoutes from './employee.route';
import memoryRoutes from './memory.route';
import messageRoutes from './message.route';

const router = Router();

router.use('/', healthRoutes);
router.use('/', employeeRoutes);
router.use('/', memoryRoutes);
router.use('/', messageRoutes);

export default router;
