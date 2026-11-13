import { Router } from 'express';
import { getEmployeeById, getEmployees } from '../controllers/employee.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// GET /api/employees (wajib login)
router.get('/employees', authenticate, getEmployees);

// GET /api/employees/:id (wajib login)
router.get('/employees/:id', authenticate, getEmployeeById);

export default router;

