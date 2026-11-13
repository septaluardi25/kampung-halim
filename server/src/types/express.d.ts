import 'multer';

export type UserRole = 'admin' | 'user';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
