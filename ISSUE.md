# ISSUE #04 — Implementasi Authentication & Authorization (`POST /api/auth/login`, `GET /api/auth/me`, Service Layer, Middleware `authenticate` & `authorize`, dan Rate Limiter)

- **Proyek:** Warga Halim (`warga-halim`)
- **Target Pembaca:** Junior Fullstack Developer & AI Coding Model
- **Status:** `Open` (Tahap 2 — `T-06` & `T-07`: Login & Keamanan Backend)
- **Dokumen Referensi Wajib:**
  - [docs/PRD.md](./docs/PRD.md) — Bagian 5 (F5 Login & Sesi User) & Bagian 9 (Technical Requirements & Struktur Folder)
  - [docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) — Task `T-06` & `T-07`
  - [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) — Bagian 3.1 (Tabel `users`) & Bagian 4 (Aturan Relasi)
  - [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) — Bagian 1, 2.2 (`POST /api/auth/login`), & 3.1 (`GET /api/auth/me`)
  - [docs/TEST_PLAN.md](./docs/TEST_PLAN.md) — Bagian 3.1 (`TC-AUTH-01` s.d. `TC-AUTH-09`) & 3.7 (Aturan Khusus Wajib)

---

## Ringkasan Tugas

Project sudah memiliki Express + TypeScript, koneksi MySQL pool (`server/src/db/pool.ts`), skema 5 tabel (`server/src/db/schema.sql`), centralized error handler (`server/src/middleware/error.middleware.ts`), utilitas password bcrypt (`server/src/utils/crypt.ts`), validasi Zod auth (`server/src/schemas/auth.schema.ts`), dan beberapa endpoint baca (`GET /api/health`, `GET /api/employees`, `GET /api/memories`, `GET /api/messages`).

Pada issue ini, implementasikan lapisan **Authentication & Authorization** secara bersih dan profesional dengan pemisahan arsitektur (`routes`, `controllers`, `services`, `schemas`, `middleware`, `types`):

1. **`POST /api/auth/login`** — Login user dan admin (validasi Zod, verifikasi `bcryptjs`, cek `is_active`, terbitkan JWT berlaku `1d`, dilindungi rate limiter maksimal **5 percobaan/menit**).
2. **`GET /api/auth/me`** — Mengambil profil akun user/admin yang sedang login berdasarkan token JWT yang tervalidasi dan status terbaru di database.
3. **`middleware/authenticate.ts`** & **`types/express.d.ts`** — Memverifikasi Bearer JWT, memeriksa user & `is_active` terbaru ke MySQL, mengambil `role` & `employee_id` terbaru dari database, serta menyematkannya ke `req.user`.
4. **`middleware/authorize.ts`** — Middleware reusable untuk membatasi akses berdasarkan `role` (`authorize('admin')`, `authorize('admin', 'user')`, dan helper `authorizeAdmin`).
5. **Kompatibilitas Route Eksisting (`middleware/auth.middleware.ts`)** — Re-export `authenticate` dan `authorize` agar route `/employees`, `/memories`, dan `/messages` tetap berjalan tanpa perlu duplikasi kode.

---

## Aturan Emas & Guardrails Wajib (PENTING DIBACA SEBELUM CODING)

Aturan berikut telah disinkronkan dengan seluruh dokumen di folder `docs/` dan keputusan arsitektur proyek:

1. **TIDAK ADA REGISTRASI MANDIRI (`POST /api/auth/register` DITIADAKAN):**
   - Sesuai `PRD.md` (F5), `API_DOCUMENTATION.md`, dan `TEST_PLAN.md` (`TC-AUTH-09`), Warga Halim adalah aplikasi internal tertutup: **tidak ada endpoint `POST /api/auth/register`**.
   - Akun `user` hanya dibuat oleh Admin di modul Panel Admin, sedangkan akun `admin` hanya dibuat melalui file `seed.sql`.
   - Permintaan ke `POST /api/auth/register` wajib otomatis ditolak oleh `notFoundHandler` dengan HTTP **`404 Not Found`**.

2. **ATURAN VALIDASI ZOD USER (SUDAH TERPASANG DI `auth.schema.ts`):**
   - `email`: string, trim, **minimal 5 karakter**, format email valid (`z.string().trim().min(5).email()`).
   - `password`: string, **minimal 6 karakter** (`z.string().min(6)`).
   - `name` (pada create/update user): string, trim, **minimal 5 karakter**.

3. **KEAMANAN PASSWORD & ANTI USER-ENUMERATION:**
   - Wajib menggunakan `verifyPassword` (`bcryptjs`) dari `server/src/utils/crypt.ts`.
   - **JANGAN PERNAH** mengembalikan kolom `password_hash` di response API mana pun.
   - **JANGAN MEMBOCORKAN** apakah `email` tidak ditemukan atau `password` salah: keduanya wajib mengembalikan HTTP **`401 Unauthorized`** dengan pesan seragam `"Email atau password salah"`.
   - Jika email dan password benar tetapi akun nonaktif (`is_active !== 1`), kembalikan HTTP **`403 Forbidden`** dengan pesan `"Akun Anda telah dinonaktifkan. Silakan hubungi admin"`.

4. **KONFIGURASI JWT (`jsonwebtoken`):**
   - Secret wajib berasal dari `env.JWT_SECRET` (`server/src/config/env.ts`, yang membaca `.env`). Jangan hardcode secret di kode!
   - Masa berlaku token: **`expiresIn: '1d'`** (1 hari).
   - Payload minimal JWT berisi: `{ id, email, role, employee_id }`.
   - Saat verifikasi di `authenticate.ts`, **jangan pernah percaya role/status lama di dalam token saja** — selalu query ulang ke database (`SELECT id, name, email, role, employee_id, is_active FROM users WHERE id = ? LIMIT 1`) agar pencabutan akses (`is_active = 0`) atau perubahan `role`/`employee_id` langsung berlaku seketika.

5. **FORMAT RESPONSE STANDAR & KOMPATIBILITAS FIELD (`snake_case` + `camelCase`):**
   - Seluruh respons wajib memakai `sendSuccess` / `sendError` (`{ success, data, message }`).
   - Struktur `POST /api/auth/login` (`200 OK`):
     ```json
     {
       "success": true,
       "data": {
         "token": "<jwt_token>",
         "user": {
           "id": 2,
           "name": "Andi Budi",
           "email": "andi@wargahalim.id",
           "role": "user",
           "employee_id": 1,
           "employeeId": 1,
           "is_active": true,
           "isActive": true
         }
       },
       "message": "Login berhasil"
     }
     ```
   - Struktur `GET /api/auth/me` (`200 OK`):
     ```json
     {
       "success": true,
       "data": {
         "id": 2,
         "name": "Andi Budi",
         "email": "andi@wargahalim.id",
         "role": "user",
         "employee_id": 1,
         "employeeId": 1,
         "is_active": true,
         "isActive": true
       },
       "message": "Data akun berhasil diambil"
     }
     ```

6. **RATE LIMITING (`POST /api/auth/login`):**
   - Gunakan `express-rate-limit`: maksimal **5 request per 1 menit** (`windowMs: 60 * 1000, max: 5`).
   - Jika melebihi batas, kembalikan HTTP **`429 Too Many Requests`** dengan format `{ success: false, data: null, message: "Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit" }`.
   - *Catatan Test:* Untuk pengujian non-test-mode agar unit/integration test tidak terganggu, buat factory atau konfigurasi rate limiter yang jelas dan tetap bisa diuji pada skenario `TC-AUTH-13`.

7. **PEMISAHAN ARSITEKTUR & STRICT TYPESCRIPT:**
   - Pisahkan tanggung jawab secara tegas:
     - `routes/` $\rightarrow$ Definisi endpoint & pemasangan middleware (`rateLimiter`, `authenticate`, `authorize`).
     - `controllers/` $\rightarrow$ Validasi Zod (`safeParse`), pemanggilan service, pengiriman HTTP status & response (`sendSuccess` / `sendError`).
     - `services/` $\rightarrow$ Business logic, query SQL berparameter (`?`), verifikasi password, dan pembuatan JWT.
     - `schemas/` $\rightarrow$ Definisi skema validasi Zod.
     - `middleware/` $\rightarrow$ `authenticate.ts`, `authorize.ts`, `rateLimiter.ts`, `error.middleware.ts`.
     - `types/` $\rightarrow$ `express.d.ts` (TypeScript Request augmentation).
   - Mode TypeScript `"strict": true` — **DILARANG keras memakai tipe `any`**.
   - **JANGAN** mengerjakan modul Admin CRUD (`/api/admin/*`) maupun User Message write API (`POST/PUT/DELETE /api/messages`) di issue ini. Fokus hanya pada Authentication & Authorization.
   - **KEAMANAN GIT:** Jangan pernah commit `.env` atau kredensial apa pun ke Git.

---

## Struktur Folder Target (`server/`)

```text
server/
├── .env                         # [JANGAN DI-COMMIT] Kredensial lokal (wajib ada di .gitignore)
├── .env.example                 # Template env tanpa nilai rahasia
├── package.json
├── tsconfig.json
└── src/
    ├── config/
    │   └── env.ts               # Sudah ada: validasi env termasuk JWT_SECRET
    ├── types/
    │   └── express.d.ts         # [BARU] Request augmentation (req.user)
    ├── db/
    │   ├── pool.ts              # Sudah ada: mysql2 connection pool
    │   ├── schema.sql           # Sudah ada: 5 tabel
    │   └── seed.sql             # Sudah ada: seed admin & sample data
    ├── schemas/
    │   ├── auth.schema.ts       # Sudah ada: loginSchema (email min 5, password min 6)
    │   ├── employee.schema.ts
    │   └── memory.schema.ts
    ├── services/
    │   └── auth.service.ts      # [BARU] Business logic login & getCurrentUser + JWT
    ├── controllers/
    │   ├── auth.controller.ts   # [BARU] Handler HTTP POST /login & GET /me
    │   ├── employee.controller.ts
    │   ├── health.controller.ts
    │   ├── memory.controller.ts
    │   └── message.controller.ts
    ├── middleware/
    │   ├── authenticate.ts      # [BARU] Verifikasi Bearer JWT + cek user & is_active di DB
    │   ├── authorize.ts         # [BARU] Middleware role checker (user/admin) reusable
    │   ├── rateLimiter.ts       # [BARU] express-rate-limit login (max 5 req/menit)
    │   ├── auth.middleware.ts   # [MODIFIKASI] Re-export dari authenticate.ts & authorize.ts
    │   └── error.middleware.ts
    ├── routes/
    │   ├── auth.route.ts        # [BARU] Route POST /auth/login & GET /auth/me
    │   ├── employee.route.ts
    │   ├── health.route.ts
    │   ├── memory.route.ts
    │   ├── message.route.ts
    │   └── index.ts             # [MODIFIKASI] Daftarkan authRoutes
    ├── utils/
    │   ├── avatar.ts
    │   ├── crypt.ts             # Sudah ada: hashPassword & verifyPassword (bcryptjs)
    │   └── response.ts          # Sudah ada: sendSuccess & sendError
    ├── app.ts                   # Sudah ada: Express app (ekspor tanpa app.listen)
    └── server.ts                # Sudah ada: entry point lokal
```

---

## Rincian Checklist Pekerjaan

- [x] **1. Buat TypeScript Request Augmentation (`server/src/types/express.d.ts`)**
- [x] **2. Buat Middleware Autentikasi (`server/src/middleware/authenticate.ts`)**
- [x] **3. Buat Middleware Otorisasi Reusable (`server/src/middleware/authorize.ts`)**
- [x] **4. Perbarui `server/src/middleware/auth.middleware.ts` untuk Re-Export Kompatibilitas**
- [x] **5. Buat Middleware Rate Limiter (`server/src/middleware/rateLimiter.ts`)**
- [x] **6. Buat Service Layer Autentikasi (`server/src/services/auth.service.ts`)**
- [x] **7. Buat Controller Autentikasi (`server/src/controllers/auth.controller.ts`)**
- [x] **8. Buat Route Auth (`server/src/routes/auth.route.ts`) & Daftarkan di `routes/index.ts`**
- [x] **9. Jalankan `npm run typecheck` dan `npm run build` (Zero Error, Tanpa `any`)**
- [x] **10. Buat & Eksekusi Automated Tests (Middleware & Integration API untuk 14 Skenario, dengan Reset Data Sebelum Setiap Skenario)**
- [x] **11. Tulis 6 Poin Penjelasan Wajib di Laporan Akhir**

---

## Panduan Implementasi Kode (Blueprint)

### 1. TypeScript Request Augmentation (`server/src/types/express.d.ts`)

Buat file baru untuk mendeklarasikan tipe `req.user` pada seluruh objek `Express.Request`:

```typescript
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
```

---

### 2. Verifikasi Schema Validasi (`server/src/schemas/auth.schema.ts`)

File `server/src/schemas/auth.schema.ts` **sudah tersedia** dengan aturan yang telah disepakati (`name` min 5, `email` min 5 + format email valid, `password` min 6):

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, 'Email minimal 5 karakter')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
});
```

> Pastikan tetap mempertahankan isi `auth.schema.ts` dan gunakan `loginSchema.safeParse(req.body)` di controller.

---

### 3. Middleware Autentikasi (`server/src/middleware/authenticate.ts`)

Bertanggung jawab penuh atas 8 langkah verifikasi token dan akun dari database:

```typescript
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { env } from '../config/env';
import { pool } from '../db/pool';
import type { UserRole } from '../types/express';
import { sendError } from '../utils/response';

interface JwtTokenPayload {
  id: number;
  email: string;
  role: UserRole;
  employee_id: number | null;
}

interface AuthUserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
}

function isValidJwtPayload(payload: unknown): payload is JwtTokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'admin' || candidate.role === 'user')
  );
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
    return;
  }

  if (!isValidJwtPayload(decoded)) {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
    return;
  }

  try {
    const [rows] = await pool.query<AuthUserRow[]>(
      'SELECT id, name, email, role, employee_id, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].is_active !== 1) {
      sendError(
        res,
        403,
        'Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan'
      );
      return;
    }

    const userRow = rows[0];

    // Selalu gunakan informasi identitas & role terbaru dari database
    req.user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      employee_id: userRow.employee_id,
    };

    next();
  } catch (error) {
    console.error('[Authenticate Error]', error);
    sendError(res, 500, 'Gagal memverifikasi sesi pengguna');
  }
}
```

---

### 4. Middleware Otorisasi Reusable (`server/src/middleware/authorize.ts`)

Middleware fleksibel yang memeriksa `req.user.role` (bukan input frontend):

```typescript
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types/express';
import { sendError } from '../utils/response';

/**
 * Middleware factory reusable untuk membatasi akses endpoint berdasarkan role.
 * Wajib dipanggil SETELAH middleware `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'Akses ditolak. Anda tidak memiliki izin untuk mengakses sumber daya ini'
      );
      return;
    }

    next();
  };
}

/**
 * Shorthand middleware khusus untuk endpoint Panel Admin (`role === 'admin'`).
 */
export const authorizeAdmin = authorize('admin');
```

---

### 5. Update Kompatibilitas (`server/src/middleware/auth.middleware.ts`)

Agar route yang sudah ada (`employee.route.ts`, `memory.route.ts`, `message.route.ts`) tidak perlu dirombak dan tidak ada duplikasi logika maupun bentrokan `declare global`, ubah `server/src/middleware/auth.middleware.ts` menjadi barrel re-export:

```typescript
export { authenticate } from './authenticate';
export { authorize, authorizeAdmin } from './authorize';
export type { AuthenticatedUser as AuthenticatedUserPayload } from '../types/express';
```

---

### 6. Rate Limiter (`server/src/middleware/rateLimiter.ts`)

```typescript
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { sendError } from '../utils/response';

/**
 * Membatasi percobaan login maksimal 5 request per 1 menit per IP.
 */
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      sendError(
        res,
        429,
        'Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit'
      );
    },
  });
}

export const loginRateLimiter = createLoginRateLimiter();
```

> **Catatan Testability:** Dengan mengekspor `createLoginRateLimiter()`, suite integration test dapat membuat instance app terisolasi atau me-reset counter sehingga uji rate limit pada `TC-AUTH-13` deterministik dan tidak memengaruhi skenario tes lainnya.

---

### 7. Service Layer Autentikasi (`server/src/services/auth.service.ts`)

Pisahkan seluruh business logic dan query SQL berparameter ke dalam service:

```typescript
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { env } from '../config/env';
import { pool } from '../db/pool';
import type { LoginInput } from '../schemas/auth.schema';
import type { UserRole } from '../types/express';
import { verifyPassword } from '../utils/crypt';

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
      'Akun Anda telah dinonaktifkan. Silakan hubungi admin'
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
    { expiresIn: '1d' }
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
```

---

### 8. Controller Autentikasi (`server/src/controllers/auth.controller.ts`)

Controller hanya mengurus validasi request HTTP, pemanggilan service, dan penyusunan HTTP response:

```typescript
import type { Request, Response } from 'express';
import { loginSchema } from '../schemas/auth.schema';
import {
  AuthServiceError,
  getCurrentUser,
  loginUser,
} from '../services/auth.service';
import { sendError, sendSuccess } from '../utils/response';

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = String(issue.path[0] ?? 'body');
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    const firstMessage =
      parseResult.error.issues[0]?.message || 'Data login tidak valid';
    sendError(res, 400, firstMessage, { errors: fieldErrors });
    return;
  }

  try {
    const result = await loginUser(parseResult.data);
    sendSuccess(res, 200, result, 'Login berhasil');
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    console.error('[Login Error]', error);
    sendError(res, 500, 'Gagal memproses login');
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 401, 'Akses ditolak. Token autentikasi tidak ditemukan');
    return;
  }

  try {
    const userProfile = await getCurrentUser(req.user.id);
    sendSuccess(res, 200, userProfile, 'Data akun berhasil diambil');
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(res, error.statusCode, error.message);
      return;
    }
    console.error('[AuthMe Error]', error);
    sendError(res, 500, 'Gagal mengambil data akun');
  }
}
```

---

### 9. Route Auth & Registrasi Router (`server/src/routes/`)

#### `server/src/routes/auth.route.ts`
```typescript
import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/auth/login', loginRateLimiter, login);
router.get('/auth/me', authenticate, me);

export default router;
```

#### `server/src/routes/index.ts`
```typescript
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
```

---

## Panduan Pengujian & Skenario Test Lengkap (Dengan Reset Data Sebelum Setiap Skenario)

### Aturan Wajib Sebelum Setiap Skenario

Sebelum memulai **setiap skenario uji**, jalankan pembersihan seluruh tabel agar kondisi database 100% deterministik dan terisolasi:

```sql
DELETE FROM messages;
DELETE FROM memory_employees;
DELETE FROM memories;
DELETE FROM users;
DELETE FROM employees;
```

> **Catatan Pembuatan Hash Uji:** Pada runner automated test, gunakan `hashPassword('password123')` dari `src/utils/crypt.ts` saat menyisipkan fixture ke tabel `users` agar hash 100% cocok dengan `bcryptjs`.

---

### Daftar 14 Skenario Uji Wajib (Unit/Middleware + Integration API)

#### `TC-AUTH-01` — Login Berhasil sebagai User Aktif (`200 OK`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel (`DELETE FROM ...`).
   - Insert `employees (id=1, full_name='Andi Budi', nickname='Andi', status='published')`.
   - Insert `users (id=2, name='Andi Budi', email='andi@wargahalim.id', password_hash=hash('password123'), role='user', employee_id=1, is_active=1)`.
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"andi@wargahalim.id","password":"password123"}'
   ```
3. **Expected Response (`200 OK`):**
   ```json
   {
     "success": true,
     "data": {
       "token": "<jwt_valid_1d>",
       "user": {
         "id": 2,
         "name": "Andi Budi",
         "email": "andi@wargahalim.id",
         "role": "user",
         "employee_id": 1,
         "employeeId": 1,
         "is_active": true,
         "isActive": true
       }
     },
     "message": "Login berhasil"
   }
   ```
   *(Pastikan `password_hash` tidak ada di payload dan JWT memuat `exp` sekitar 24 jam setelah `iat`.)*

---

#### `TC-AUTH-02` — Login Berhasil sebagai Admin Aktif (`200 OK`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel.
   - Insert `users (id=1, name='Admin Halim', email='admin@wargahalim.id', password_hash=hash('admin123'), role='admin', employee_id=NULL, is_active=1)`.
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@wargahalim.id","password":"admin123"}'
   ```
3. **Expected Response (`200 OK`):**
   `data.user.role === "admin"`, `data.user.employee_id === null`, `data.user.employeeId === null`, dan `token` valid.

---

#### `TC-AUTH-03` — Login dengan Password Salah (`401 Unauthorized`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel, insert user aktif `andi@wargahalim.id` dengan password `password123`.
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"andi@wargahalim.id","password":"salahpassword"}'
   ```
3. **Expected Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Email atau password salah"
   }
   ```

---

#### `TC-AUTH-04` — Login dengan Email Tidak Terdaftar (`401 Unauthorized`, Anti User-Enumeration)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel (tabel `users` kosong).
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"tidaktahu@wargahalim.id","password":"password123"}'
   ```
3. **Expected Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Email atau password salah"
   }
   ```
   *(Pesan error identik dengan `TC-AUTH-03` agar tidak membocorkan keberadaan email di sistem.)*

---

#### `TC-AUTH-05` — Login Gagal Validasi Zod (`400 Bad Request`)
1. **Reset & Setup Data:** Bersihkan 5 tabel.
2. **Request A (Password < 6 karakter):**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"andi@wargahalim.id","password":"12345"}'
   ```
   **Expected Response A (`400 Bad Request`):**
   ```json
   {
     "success": false,
     "data": { "errors": { "password": "Password minimal 6 karakter" } },
     "message": "Password minimal 6 karakter"
   }
   ```
3. **Request B (Email < 5 karakter atau format tidak valid):**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"a@b","password":"password123"}'
   ```
   **Expected Response B (`400 Bad Request`):**
   `success: false`, pesan error email minimal 5 karakter / format email tidak valid.

---

#### `TC-AUTH-06` — Login Menggunakan Akun Nonaktif `is_active = 0` (`403 Forbidden`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel.
   - Insert `users (id=2, name='Andi Nonaktif', email='andi@wargahalim.id', password_hash=hash('password123'), role='user', employee_id=NULL, is_active=0)`.
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"andi@wargahalim.id","password":"password123"}'
   ```
3. **Expected Response (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akun Anda telah dinonaktifkan. Silakan hubungi admin"
   }
   ```

---

#### `TC-AUTH-07` — `GET /api/auth/me` Tanpa Token (`401 Unauthorized`)
1. **Reset & Setup Data:** Bersihkan 5 tabel.
2. **Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/auth/me"
   ```
3. **Expected Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Token autentikasi tidak ditemukan"
   }
   ```

---

#### `TC-AUTH-08` — `GET /api/auth/me` dengan Token Valid (`200 OK`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel, insert `employees (id=1)` dan `users (id=2, employee_id=1, is_active=1)`.
   - Login via `POST /api/auth/login` untuk memperoleh `<VALID_TOKEN>`.
2. **Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/auth/me" \
     -H "Authorization: Bearer <VALID_TOKEN>"
   ```
3. **Expected Response (`200 OK`):**
   ```json
   {
     "success": true,
     "data": {
       "id": 2,
       "name": "Andi Budi",
       "email": "andi@wargahalim.id",
       "role": "user",
       "employee_id": 1,
       "employeeId": 1,
       "is_active": true,
       "isActive": true
     },
     "message": "Data akun berhasil diambil"
   }
   ```

---

#### `TC-AUTH-09` — `GET /api/auth/me` dengan Token Kedaluwarsa atau Rusak (`401 Unauthorized`)
1. **Reset & Setup Data:** Bersihkan 5 tabel. Buat expired JWT dengan `jwt.sign({ id: 2, email: 'andi@wargahalim.id', role: 'user', employee_id: null }, env.JWT_SECRET, { expiresIn: '-1s' })`.
2. **Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/auth/me" \
     -H "Authorization: Bearer <EXPIRED_OR_INVALID_TOKEN>"
   ```
3. **Expected Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Token autentikasi tidak valid atau telah kedaluwarsa"
   }
   ```

---

#### `TC-AUTH-10` — Akun Dinonaktifkan Setelah Mendapat Token Ditolak Saat Menggunakan Token (`403 Forbidden`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel, insert `users (id=2, is_active=1)`.
   - Dapatkan `<VALID_TOKEN>` melalui `POST /api/auth/login`.
   - Simulasi admin menonaktifkan user: `UPDATE users SET is_active = 0 WHERE id = 2`.
2. **Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/auth/me" \
     -H "Authorization: Bearer <VALID_TOKEN>"
   ```
3. **Expected Response (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan"
   }
   ```

---

#### `TC-AUTH-11` — Automated Unit/Middleware Test: User (`role = 'user'`) Ditolak di Middleware Admin (`403 Forbidden`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel, insert user `id=2` (`role='user'`, `is_active=1`).
   - Buat rute uji sementara pada Express test harness: `app.get('/api/test-admin', authenticate, authorize('admin'), (_req, res) => sendSuccess(res, 200, { ok: true }, 'OK'))`.
2. **Request:** Kirim `GET /api/test-admin` dengan token `user` (dan uji juga jika token dibuat memalsukan `role: 'admin'` di payload JWT, pastikan `authenticate` membaca `role: 'user'` terbaru dari database sehingga tetap ditolak!).
3. **Expected Response (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Anda tidak memiliki izin untuk mengakses sumber daya ini"
   }
   ```

---

#### `TC-AUTH-12` — Automated Unit/Middleware Test: Admin (`role = 'admin'`) Diizinkan di Middleware Admin (`200 OK`)
1. **Reset & Setup Data:**
   - Bersihkan 5 tabel, insert admin `id=1` (`role='admin'`, `is_active=1`).
2. **Request:** Kirim `GET /api/test-admin` (menggunakan middleware `authenticate, authorize('admin')`) dengan token admin yang sah.
3. **Expected Response (`200 OK`):**
   `status === 200`, `body.success === true`.

---

#### `TC-AUTH-13` — Rate Limiter Login: Percobaan Ke-6 dalam 1 Menit Ditolak (`429 Too Many Requests`)
1. **Reset & Setup Data:** Bersihkan 5 tabel, insert user aktif `andi@wargahalim.id`.
2. **Langkah:** Gunakan instance Express dengan `createLoginRateLimiter()` segar lalu kirim `POST /api/auth/login` sebanyak **6 kali berturut-turut** dalam 1 menit.
3. **Expected Result:**
   - Percobaan ke-1 s.d. ke-5 mendapat status `401` (jika password salah) atau `200`.
   - Percobaan **ke-6** ditolak dengan HTTP **`429 Too Many Requests`**:
     ```json
     {
       "success": false,
       "data": null,
       "message": "Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit"
     }
     ```

---

#### `TC-AUTH-14` — Penolakan Registrasi Mandiri (`POST /api/auth/register`) Termasuk Percobaan Injeksi `role: "admin"` (`404 Not Found`)
1. **Reset & Setup Data:** Bersihkan 5 tabel.
2. **Request:**
   ```bash
   curl -i -X POST "http://localhost:5000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"name":"Hacker","email":"hacker@wargahalim.id","password":"password123","role":"admin"}'
   ```
3. **Expected Response (`404 Not Found`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Endpoint tidak ditemukan"
   }
   ```
   *(Menegaskan bahwa fitur registrasi mandiri ditiadakan dan tidak ada celah privilege escalation.)*

---

## Penjelasan Wajib Setelah Implementasi

Setelah seluruh kode selesai diimplementasikan, diuji, dan lolos `typecheck` + `build`, developer/AI **wajib** menyertakan penjelasan ringkas dan akurat mengenai 6 hal berikut:

1. **Semua file yang dibuat atau diubah** (beserta peran masing-masing file).
2. **Alur login (`POST /api/auth/login`)** dari validasi Zod, rate limiter, pencarian user, verifikasi `bcryptjs`, pengecekan `is_active`, hingga penerbitan JWT.
3. **Alur proteksi registrasi** (penjelasan bahwa registrasi mandiri dinonaktifkan sesuai PRD dan pembuatan akun `user` dikelola oleh Admin / akun `admin` via seed).
4. **Cara kerja JWT di aplikasi ini** (struktur payload, signature dengan `JWT_SECRET`, masa berlaku `1d`, serta verifikasi ulang ke database).
5. **Perbedaan `authenticate` dan `authorize`** (siapa Anda vs apa yang boleh Anda akses).
6. **Hasil eksekusi testing seluruh 14 skenario** beserta bukti lulus tanpa kegagalan.

---

## Checklist Review Akhir Sebelum Submit PR

- [x] `npm --prefix server run typecheck` dan `npm --prefix server run build` lulus dengan 0 error (tanpa tipe `any`).
- [x] Pemisahan folder rapi: `routes/`, `controllers/`, `services/`, `schemas/`, `middleware/`, dan `types/express.d.ts`.
- [x] `POST /api/auth/login` memiliki rate limiter (`max: 5` per menit) dan tidak membocorkan apakah email atau password yang salah.
- [x] `GET /api/auth/me` dilindungi `authenticate` dan mengembalikan `employee_id`/`employeeId` serta `is_active`/`isActive` tanpa `password_hash`.
- [x] Middleware `authenticate` memeriksa status `is_active` dan `role` terbaru langsung dari database MySQL.
- [x] Middleware `authorize` reusable berfungsi menolak `user` biasa dengan `403` dan mengizinkan `admin`.
- [x] Seluruh 14 skenario pengujian lulus setelah reset data (`DELETE FROM ...`) sebelum tiap skenario.
- [x] File `.env` lokal dan kredensial tidak terlacak Git (`git status` bersih dari secret).

