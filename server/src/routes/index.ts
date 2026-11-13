import { Router } from 'express';
import authRoutes from './auth.route';
import employeeRoutes from './employee.route';
import healthRoutes from './health.route';
import memoryRoutes from './memory.route';
import messageRoutes from './message.route';

const router = Router();

router.use('/', healthRoutes);
router.use('/', authRoutes);
router.use('/', employeeRoutes);
router.use('/', memoryRoutes);
router.use('/', messageRoutes);

export default router;
