import jwt from 'jsonwebtoken';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { env } from '../config/env';
import { pool } from '../db/pool';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { UserRole } from '../types/express';
import { hashPassword, verifyPassword } from '../utils/crypt';

interface UserAuthRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
}

interface UserProfileRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
}

export interface AuthUserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  employeeId: number | null;
  is_active: boolean;
  isActive: boolean;
}

export interface LoginResult {
  token: string;
  user: AuthUserProfile;
}

export class AuthServiceError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthServiceError';
  }
}

function mapUserProfile(row: {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
}): AuthUserProfile {
  const isActiveBool = row.is_active === 1;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    employee_id: row.employee_id,
    employeeId: row.employee_id,
    is_active: isActiveBool,
    isActive: isActiveBool,
  };
}

export async function registerUser(
  input: RegisterInput
): Promise<AuthUserProfile> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name.trim();

  const [existingRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`,
    [normalizedEmail]
  );

  if (existingRows.length > 0) {
    throw new AuthServiceError(409, 'Email sudah digunakan');
  }

  const passwordHash = await hashPassword(input.password);

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role, employee_id, is_active)
     VALUES (?, ?, ?, 'user', NULL, 0)`,
    [normalizedName, normalizedEmail, passwordHash]
  );

  return mapUserProfile({
    id: insertResult.insertId,
    name: normalizedName,
    email: normalizedEmail,
    role: 'user',
    employee_id: null,
    is_active: 0,
  });
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [rows] = await pool.query<UserAuthRow[]>(
    `SELECT id, name, email, password_hash, role, employee_id, is_active
     FROM users
     WHERE LOWER(email) = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  // Jangan membocorkan apakah email atau password yang salah
  if (rows.length === 0) {
    throw new AuthServiceError(401, 'Email atau password salah');
  }

  const user = rows[0];
  const isPasswordMatch = await verifyPassword(
    input.password,
    user.password_hash
  );

  if (!isPasswordMatch) {
    throw new AuthServiceError(401, 'Email atau password salah');
  }

  if (user.is_active !== 1) {
    throw new AuthServiceError(
      403,
      'Akun Anda belum aktif atau telah dinonaktifkan. Silakan hubungi admin'
    );
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
    },
    env.JWT_SECRET,
    { expiresIn: '1d', algorithm: 'HS256' }
  );

  return {
    token,
    user: mapUserProfile(user),
  };
}

export async function getCurrentUser(
  userId: number
): Promise<AuthUserProfile> {
  const [rows] = await pool.query<UserProfileRow[]>(
    `SELECT id, name, email, role, employee_id, is_active
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new AuthServiceError(404, 'Akun pengguna tidak ditemukan');
  }

  const user = rows[0];

  if (user.is_active !== 1) {
    throw new AuthServiceError(
      403,
      'Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan'
    );
  }

  return mapUserProfile(user);
}
