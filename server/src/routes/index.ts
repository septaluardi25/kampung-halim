import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { adminEmployeeRouter } from './admin.employee.route';
import { adminMemoryRouter } from './admin.memory.route';
import { adminMessageRouter } from './admin.message.route';
import { adminUserRouter } from './admin.user.route';
import authRoutes from './auth.route';
import employeeRoutes from './employee.route';
import healthRoutes from './health.route';
import memoryRoutes from './memory.route';
import messageRoutes from './message.route';
import photoRoutes from './photo.route';

const router = Router();

router.use('/', healthRoutes);
router.use('/', photoRoutes);
router.use('/', authRoutes);
router.use('/', employeeRoutes);
router.use('/', memoryRoutes);
router.use('/', messageRoutes);

// Admin API Routes (Protected by authenticate & authorizeAdmin)
router.use('/admin', authenticate, authorizeAdmin);
router.use('/admin/employees', adminEmployeeRouter);
router.use('/admin/memories', adminMemoryRouter);
router.use('/admin/messages', adminMessageRouter);
router.use('/admin/users', adminUserRouter);

export default router;
