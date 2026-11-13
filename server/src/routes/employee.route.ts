import { Router } from 'express';
import { getEmployees } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/employees (wajib login)
router.get('/employees', authenticate, getEmployees);

export default router;
