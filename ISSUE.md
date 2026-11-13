# ISSUE #02 — Implementasi Endpoint `GET /api/employees` (Daftar Karyawan, Live Search & Proteksi Autentikasi)

- **Proyek:** Warga Halim (`warga-halim`)
- **Target Branch:** `features/users`
- **Target Pembaca:** Junior Fullstack Developer & AI Coding Model
- **Status:** `Open` (Tahap 3 — API Data Login)
- **Dokumen Referensi Wajib:**
  - [docs/PRD.md](./docs/PRD.md) — Bagian F2 (Karyawan dan Biodata) & Bagian 9 (Technical Requirements)
  - [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) — Bagian 3.2 (`GET /api/employees`)
  - [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) — Bagian 3.2 (Tabel `employees`)
  - [docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) — Task `T-09`
  - [docs/TEST_PLAN.md](./docs/TEST_PLAN.md) — `TC-F2-01`, `TC-F2-02`, `TC-F2-03`, `TC-SPEC-07`, `TC-SPEC-08`

---

## Ringkasan Tugas

Buat endpoint **`GET /api/employees`** untuk mengambil daftar ringkasan karyawan yang telah diterbitkan (`status = 'published'`). Endpoint ini digunakan oleh halaman front-end `/karyawan` untuk menampilkan grid kartu karyawan dan mendukung **pencarian nama langsung (live search)** melalui query parameter `?search=`.

Contoh pemanggilan pencarian:
```http
GET /api/employees?search=andi
```

---

## Aturan Emas & Guardrails Wajib (PENTING DIBACA SEBELUM CODING)

Junior programmer dan model AI **wajib** mengikuti aturan-aturan berikut:

1. **HAK AKSES WAJIB LOGIN (`401 UNAUTHORIZED`):**
   - Halaman daftar karyawan dan endpoint `GET /api/employees` **BUKAN ENDPOINT PUBLIK**.
   - Pengunjung tanpa login yang memanggil endpoint ini **WAJIB DITOLAK** dengan HTTP `401 Unauthorized` dan pesan bahasa Indonesia: `"Akses ditolak. Token autentikasi tidak ditemukan"`.
   - Hanya user atau admin yang login dengan token JWT sah dan berstatus aktif (`is_active = 1`) yang diizinkan mengambil data. Akun nonaktif wajib ditolak dengan HTTP `403 Forbidden`.

2. **HANYA DATA TERBIT (`status = 'published'`):**
   - Karyawan berstatus `draft` **TIDAK BOLEH** muncul pada endpoint ini.
   - Status `draft` hanya boleh dikelola oleh admin di modul Panel Admin (`/api/admin/employees`).

3. **PROTEKSI DATA PRIBADI (KARTU RINGKAS SAJA):**
   - Sesuai aturan khusus Warga Halim: *"User melihat daftar karyawan: Biodata lengkap hanya melalui endpoint detail yang terlindungi"*.
   - Endpoint `GET /api/employees` **HANYA MENGEMBALIKAN DATA KARTU RINGKAS**:
     - `id`: number
     - `full_name`: string
     - `nickname`: string
     - `photo_url`: string | null
     - `initials`: string (dihitung otomatis dari nama)
   - **DILARANG MENGEMBALIKAN KOLOM BIODATA LENGKAP** seperti `hometown`, `hobby`, `contact`, `favorite_quote`, riwayat kenangan, maupun pesan pada endpoint list ini. Biodata lengkap hanya boleh diakses melalui endpoint detail `GET /api/employees/:id`.

4. **KOLOM `position` / JABATAN SUDAH DIHAPUS PERMANEN:**
   - **JANGAN PERNAH** menambahkan, menyeleksi (`SELECT position ...`), atau mengembalikan field `position`, `division`, `year_joined`, atau `year_left`.
   - Seluruh kolom tersebut telah resmi dihapus dari skema database dan dokumentasi Warga Halim.

5. **ANTI SQL INJECTION (WAJIB PARAMETERIZED QUERY `?`):**
   - Query pencarian nama **WAJIB** menggunakan placeholder `?` dari library `mysql2/promise`.
   - **DILARANG KERAS** melakukan penggabungan string (string interpolation/concatenation) seperti:
     ```typescript
     // SALAH BESAR (RENTAN SQL INJECTION):
     `SELECT ... WHERE full_name LIKE '%${search}%'`
     ```
   - **BENTUK YANG BENAR:**
     ```typescript
     // BENAR & AMAN:
     const query = `
       SELECT id, full_name, nickname, photo_url
       FROM employees
       WHERE status = 'published' AND (full_name LIKE ? OR nickname LIKE ?)
       ORDER BY full_name ASC
     `;
     const searchPattern = `%${search}%`;
     const [rows] = await pool.query(query, [searchPattern, searchPattern]);
     ```

6. **FORMAT RESPONS API STANDAR:**
   - Wajib mengikuti format seragam Warga Halim:
     ```json
     {
       "success": true,
       "data": [
         {
           "id": 1,
           "full_name": "Andi Budi Santoso",
           "nickname": "Andi",
           "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg",
           "initials": "AB"
         }
       ],
       "message": "Daftar karyawan berhasil diambil"
     }
     ```

7. **KEAMANAN KREDENSIAL (ZERO CREDENTIAL LEAK):**
   - File `.env` lokal tidak boleh di-push ke Git (sudah diblokir oleh `.gitignore`).
   - Jangan menuliskan password database, `JWT_SECRET`, atau token apa pun di dalam kode sumber. Selalu impor konfigurasi dari `src/config/env.ts`.

---

## Struktur Folder Arsitektur Fitur

Untuk menjaga aplikasi tetap kecil, rapi, dan modular, letakkan kode pada struktur folder berikut:

```text
server/
├── src/
│   ├── config/
│   │   └── env.ts                      # Konfigurasi environment tervalidasi (Zod)
│   ├── db/
│   │   ├── pool.ts                     # Koneksi MySQL2 connection pool
│   │   ├── schema.sql                  # DDL 5 tabel (referensi kolom employees)
│   │   └── seed.sql                    # Data seed karyawan contoh
│   ├── utils/
│   │   ├── response.ts                 # Helper sendSuccess dan sendError
│   │   └── avatar.ts                   # [BARU] Helper pembuat avatar inisial nama
│   ├── middleware/
│   │   ├── auth.middleware.ts          # [BARU] Middleware verifikasi JWT & akun aktif
│   │   └── error.middleware.ts         # Handler 404 & global server error
│   ├── schemas/
│   │   └── employee.schema.ts          # [BARU] Validasi Zod untuk query parameter ?search=
│   ├── controllers/
│   │   └── employee.controller.ts      # [BARU] Logika query database & mapping data
│   ├── routes/
│   │   ├── employee.route.ts           # [BARU] Route GET /employees terproteksi auth
│   │   ├── health.route.ts             # Route GET /health
│   │   └── index.ts                    # Mendaftarkan router ke prefix /api
│   ├── app.ts                          # Express instance
│   └── server.ts                       # Entry point server lokal
```

---

## Rincian Checklist Pekerjaan

- [ ] **1. Buat Helper Inisial Avatar (`src/utils/avatar.ts`)**
- [ ] **2. Buat Middleware Autentikasi (`src/middleware/auth.middleware.ts`)**
- [ ] **3. Buat Schema Validasi Zod Query Parameter (`src/schemas/employee.schema.ts`)**
- [ ] **4. Buat Controller `getEmployees` (`src/controllers/employee.controller.ts`)**
- [ ] **5. Buat Route `employee.route.ts` dan Daftarkan ke `src/routes/index.ts`**
- [ ] **6. Verifikasi & Pengujian Endpoint (Manual & Security Testing)**

---

## Panduan Implementasi Kode (Blueprint)

### 1. Helper Inisial Avatar (`server/src/utils/avatar.ts`)

Avatar inisial digunakan front-end ketika karyawan belum memiliki `photo_url`, atau sebagai teks alternatif.

```typescript
/**
 * Menghasilkan inisial nama 1-2 karakter kapital.
 * Contoh:
 * - "Andi Budi Santoso" -> "AB"
 * - "Nadya" -> "N"
 * - "M Dimas Septaluardi" -> "MD"
 */
export function generateInitials(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'WH';
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'WH';
  }

  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }

  const firstChar = parts[0].charAt(0);
  const secondChar = parts[1].charAt(0);
  return (firstChar + secondChar).toUpperCase();
}
```

---

### 2. Middleware Autentikasi (`server/src/middleware/auth.middleware.ts`)

Endpoint `/api/employees` mewajibkan login. Middleware ini memverifikasi JWT dan memastikan status akun `is_active = 1`.

```typescript
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { sendError } from '../utils/response';
import type { RowDataPacket } from 'mysql2';

export interface AuthenticatedUserPayload {
  id: number;
  email: string;
  role: 'admin' | 'user';
  employee_id: number | null;
}

// Menambahkan user ke tipe Request Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
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

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;

    // Verifikasi bahwa user masih aktif di database
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, role, employee_id, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].is_active !== 1) {
      sendError(res, 403, 'Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan');
      return;
    }

    req.user = {
      id: rows[0].id,
      email: decoded.email,
      role: rows[0].role,
      employee_id: rows[0].employee_id,
    };

    next();
  } catch (error) {
    sendError(res, 401, 'Token autentikasi tidak valid atau telah kedaluwarsa');
  }
}
```

---

### 3. Schema Validasi Query Pencarian (`server/src/schemas/employee.schema.ts`)

Validasi input parameter `?search=` agar aman dan tidak membebani database:

```typescript
import { z } from 'zod';

export const employeeQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Kata kunci pencarian maksimal 100 karakter')
    .optional(),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
```

---

### 4. Controller Daftar Karyawan (`server/src/controllers/employee.controller.ts`)

Mengambil daftar karyawan berstatus `published` dengan parameterized query SQL yang aman:

```typescript
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { employeeQuerySchema } from '../schemas/employee.schema';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface EmployeeCardRow extends RowDataPacket {
  id: number;
  full_name: string;
  nickname: string;
  photo_url: string | null;
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const parseResult = employeeQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    const firstErrorMessage = parseResult.error.issues[0]?.message || 'Parameter pencarian tidak valid';
    sendError(res, 400, firstErrorMessage);
    return;
  }

  const { search } = parseResult.data;

  try {
    let query = `
      SELECT id, full_name, nickname, photo_url
      FROM employees
      WHERE status = 'published'
    `;
    const queryParams: unknown[] = [];

    if (search && search.length > 0) {
      query += ` AND (full_name LIKE ? OR nickname LIKE ?)`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY full_name ASC`;

    const [rows] = await pool.query<EmployeeCardRow[]>(query, queryParams);

    const employees = rows.map((emp) => ({
      id: emp.id,
      full_name: emp.full_name,
      nickname: emp.nickname,
      photo_url: emp.photo_url,
      initials: generateInitials(emp.full_name),
    }));

    sendSuccess(res, 200, employees, 'Daftar karyawan berhasil diambil');
  } catch (error) {
    console.error('[GetEmployees Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar karyawan');
  }
}
```

---

### 5. Route Definition & Registrasi

#### `server/src/routes/employee.route.ts`
```typescript
import { Router } from 'express';
import { getEmployees } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/employees (wajib login)
router.get('/employees', authenticate, getEmployees);

export default router;
```

#### `server/src/routes/index.ts`
```typescript
import { Router } from 'express';
import healthRoutes from './health.route';
import employeeRoutes from './employee.route';

const router = Router();

router.use('/', healthRoutes);
router.use('/', employeeRoutes);

export default router;
```

---

## Panduan Pengujian & Acceptance Criteria

Fitur dinyatakan **SELESAI & LULUS** jika seluruh skenario uji berikut terpenuhi:

| ID Uji | Skenario | Langkah Pengujian | Ekspektasi Hasil |
| --- | --- | --- | --- |
| **TC-01** | Akses tanpa token (Pengunjung) | `curl -i http://localhost:5000/api/employees` | HTTP `401 Unauthorized`. Format JSON `{ "success": false, "data": null, "message": "Akses ditolak. Token autentikasi tidak ditemukan" }`. |
| **TC-02** | Ambil semua karyawan terbit | Kirim request dengan header `Authorization: Bearer <valid_token>`. | HTTP `200 OK`. `data` berupa array karyawan `published`. Setiap objek memiliki `id`, `full_name`, `nickname`, `photo_url`, `initials`. Kolom biodata detail (`contact`, `hometown`, `quote`, dll.) **tidak ada**. |
| **TC-03** | Filter data draft | Periksa database apakah karyawan berstatus `draft` (contoh: Fauziyah `id: 5`) ikut terambil. | Karyawan berstatus `draft` **TIDAK MUNCUL** pada daftar. |
| **TC-04** | Pencarian nama berhasil | `curl -i -H "Authorization: Bearer <token>" "http://localhost:5000/api/employees?search=andi"` | HTTP `200 OK`. Hanya mengembalikan karyawan yang memiliki nama lengkap atau panggilan memuat kata `"andi"` (case-insensitive). |
| **TC-05** | Pencarian tanpa hasil | `curl -i -H "Authorization: Bearer <token>" "http://localhost:5000/api/employees?search=namaTidakMungkinAda123"` | HTTP `200 OK`. `data: []` (array kosong), pesan sukses `"Daftar karyawan berhasil diambil"`. Server tidak boleh error `500`. |
| **TC-06** | Keamanan SQL Injection | `curl -i -H "Authorization: Bearer <token>" "http://localhost:5000/api/employees?search=' OR '1'='1"` | Parameterized query bekerja. Query tidak tembus; server tidak mengembalikan seluruh tabel atau membocorkan data draft, serta tidak mengalami error `500`. |
| **TC-07** | Akun dinonaktifkan (`is_active = 0`) | Kirim token milik user yang statusnya `is_active = 0`. | HTTP `403 Forbidden` (`"Akses ditolak. Akun Anda telah dinonaktifkan..."`). |

---

## Checklist Review Akhir Sebelum Submit

- [ ] Tidak ada tipe `any` pada kode TypeScript (`npm run typecheck` lulus tanpa error).
- [ ] Tidak ada kolom `position` / jabatan yang diseleksi atau dikembalikan.
- [ ] Parameterized query (`?`) digunakan untuk semua parameter pencarian SQL.
- [ ] Middleware `authenticate` terpasang pada route `/employees`.
- [ ] File `.env` tidak masuk ke Git (`git status` bersih dari file secret).
