# ISSUE #01 — Setup Backend Express + TypeScript, Konfigurasi Environment, Koneksi MySQL2 Pool, Database Schema, Seed Data, & Health Check

- **Proyek:** Warga Halim (`warga-halim`)
- **Target Branch:** `main`
- **Target Pembaca:** Junior Fullstack Developer & AI Coding Assistant
- **Status:** `Open` (Tahap 1 — Fondasi Backend & Database)
- **Dokumen Referensi Wajib:**
  - [docs/PRD.md](./docs/PRD.md)
  - [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)
  - [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
  - [docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md)
  - [docs/TEST_PLAN.md](./docs/TEST_PLAN.md)

---

## Ringkasan Tujuan

Membangun fondasi backend API **Warga Halim** di dalam folder `server/` menggunakan **Express + TypeScript (strict)**, **validasi environment dengan Zod**, **koneksi pool `mysql2/promise`**, **5 tabel database MySQL**, **data seed awal dengan hash bcrypt**, serta endpoint **`GET /api/health`** untuk memastikan server dan database siap digunakan sebelum fitur autentikasi dan CRUD dikerjakan.

> **Penting:** Kerjakan **hanya** ruang lingkup di Issue ini terlebih dahulu. Jangan membuat endpoint login, CRUD karyawan/kenangan/pesan, atau aplikasi frontend sebelum seluruh checklist di bawah lulus verifikasi.

---

## Aturan Emas (Guardrails Wajib untuk Junior Dev & AI Model)

Baca dan patuhi semua aturan ini tanpa pengecualian:

1. **KEAMANAN KREDENSIAL (ZERO LEAK):**
   - **DILARANG KERAS** meng-commit file `.env`, password database asli, `JWT_SECRET` produksi, atau `BLOB_READ_WRITE_TOKEN` ke Git.
   - Selalu periksa `.gitignore` di root repo sebelum menjalankan `git add`. Yang boleh masuk ke Git hanyalah `.env.example` dengan nilai placeholder kosong/dummy.
   - **DILARANG** menampilkan detail kredensial, password, atau stack trace mentah pada respons JSON error API maupun log produksi.
2. **TYPESCRIPT STRICT (TANPA `any`):**
   - `tsconfig.json` wajib mengaktifkan `"strict": true` dan `"noImplicitAny": true`.
   - **DILARANG** memakai tipe `any`. Gunakan tipe eksplisit, `unknown` (lalu validasi dengan Zod), atau tipe dari `@types/express` & `mysql2`.
3. **SERVERLESS-READY MYSQL POOL:**
   - Target deploy produksi adalah **Vercel Serverless** + MySQL eksternal (Railway / Aiven / TiDB Cloud).
   - **WAJIB** menggunakan `mysql2/promise` dengan **connection pool kecil (`connectionLimit: 5`)**. Jangan membuat koneksi tunggal (`createConnection`) yang membuka-tutup koneksi berulang tanpa pool atau pool besar yang menghabiskan kuota koneksi database eksternal.
   - **WAJIB** memakai parameterized query (`?`) untuk seluruh query SQL agar kebal SQL Injection.
4. **PISAHKAN `app.ts` DAN `server.ts`:**
   - `server/src/app.ts` hanya membuat, mengonfigurasi, dan mengekspor instance Express (`export default app`) **tanpa memanggil `app.listen()`** (kebutuhan Vercel Serverless Function).
   - `server/src/server.ts` bertugas memanggil `app.listen()` untuk dijalankan di komputer lokal.
5. **FORMAT RESPONS API SERAGAM:**
   - Seluruh endpoint API (sukses maupun error) **WAJIB** mengembalikan struktur JSON:
     ```json
     {
       "success": true,
       "data": {},
       "message": "Pesan bahasa Indonesia yang jelas"
     }
     ```
6. **KESESUAIAN SCHEMA & RULE DOMAIN:**
   - Hanya ada **5 tabel**: `employees`, `users`, `memories`, `memory_employees`, `messages`. Jangan menambah tabel di luar PRD (misalnya `company_profile`).
   - Pada tabel `employees`, **DILARANG** menambahkan kolom `position`, `division`, `year_joined`, atau `year_left`.
   - **DILARANG** membuat endpoint registrasi publik (`POST /api/auth/register`). Akun `admin` hanya berasal dari `seed.sql` dengan `bcryptjs`.

---

## Struktur Folder Aplikasi (Kecil, Rapi, & Profesional)

Aplikasi Warga Halim berskala kecil-menengah, sehingga kita menggunakan **Layered Modular Structure** yang ringan namun profesional — jelas pemisahan tanggung jawabnya tanpa *over-engineering* (tidak perlu ORM berat seperti Prisma/TypeORM, tidak perlu CQRS atau *repository-factory* berlapis-lapis).

```text
warga-halim/                       # Root monorepo
├── .gitignore                     # Wajib memblokir .env, node_modules, dist, log, dll.
├── ISSUE.md                       # Dokumen tugas ini
├── docs/                          # Spesifikasi PRD, DB, API, Development Plan, Test Plan
├── client/                        # (Tahap berikutnya) Frontend React 19 + Vite + TypeScript
└── server/                        # Backend Express + TypeScript (FOKUS ISSUE INI)
    ├── .env                       # LOKAL SAJA - rahasia asli (TIDAK BOLEH masuk Git)
    ├── .env.example               # Template env aman untuk dibagikan (WAJIB masuk Git)
    ├── package.json               # Dependensi dan script server
    ├── tsconfig.json              # Konfigurasi TypeScript strict
    ├── vercel.json                # Konfigurasi routing Vercel Serverless ke src/app.ts
    └── src/
        ├── config/
        │   └── env.ts             # Load dotenv + validasi ketat seluruh env var dengan Zod
        ├── db/
        │   ├── pool.ts            # Koneksi MySQL2 connection pool + helper cek koneksi
        │   ├── schema.sql         # DDL 5 tabel utama (InnoDB, utf8mb4) - SUDAH TERSEDIA
        │   └── seed.sql           # Data contoh + 1 admin bcrypt - SUDAH TERSEDIA
        ├── utils/
        │   └── response.ts        # Helper standardisasi JSON { success, data, message }
        ├── middleware/
        │   └── error.middleware.ts# Handler 404 Not Found & Global Error Handler
        ├── controllers/
        │   └── health.controller.ts # Logika endpoint GET /api/health (SELECT 1 ke DB)
        ├── routes/
        │   ├── health.route.ts    # Definisi route GET /health
        │   └── index.ts           # Pengumpul semua route di bawah prefix /api
        ├── app.ts                 # Inisialisasi Express + security middleware + routes (tanpa listen)
        └── server.ts              # Entry point lokal: validasi env, cek DB, jalankan app.listen()
```

### Mengapa struktur ini dipilih?
- **`config/env.ts`**: Menjamin aplikasi langsung gagal dengan pesan jelas saat startup (*fail-fast*) jika ada variabel `.env` yang lupa diisi, daripada error misterius di tengah runtime.
- **`utils/response.ts`**: Menghindari duplikasi format respons di setiap controller.
- **`routes/` + `controllers/`**: Memisahkan pemetaan URL (`routes`) dari logika bisnis/query (`controllers`) agar mudah diuji dan dikembangkan pada Issue selanjutnya.
- **`app.ts` vs `server.ts`**: Memenuhi syarat deploy Vercel Serverless tanpa mengganggu kenyamanan development lokal (`tsx watch`).

---

## Checklist Pekerjaan Utama

- [ ] **1. Setup Express + TypeScript (Inisialisasi Backend Project)**
- [ ] **2. Environment Configuration (Setup `.env`, `.env.example`, dan Validasi Environment)**
- [ ] **3. MySQL Connection (Membuat Koneksi Menggunakan `mysql2` Connection Pool)**
- [ ] **4. Database Schema (Membuat Lima Tabel Sesuai `DATABASE_DESIGN.md`)**
- [ ] **5. Seed Data (Membuat Data Awal dan Satu Akun Admin dengan Bcrypt Hash)**
- [ ] **6. Health Check (Endpoint `GET /api/health` Verifikasi Server & Database)**

---

## Panduan Implementasi Detail Per Checklist

### [ ] 1. Setup Express + TypeScript (Inisialisasi Backend Project)

#### Langkah 1.1 — Inisialisasi & Instalasi Dependensi
Masuk ke folder `server/` lalu inisialisasi `package.json` dan pasang paket yang dibutuhkan:

```bash
cd server
npm init -y

# Dependensi produksi
npm install express mysql2 dotenv zod cors helmet express-rate-limit bcryptjs jsonwebtoken

# Dependensi development & TypeScript
npm install -D typescript tsx @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
```

> **Catatan:** Paket `bcryptjs`, `jsonwebtoken`, dan `express-rate-limit` ikut dipasang sekarang sebagai fondasi dependensi backend standar Warga Halim agar siap dipakai di Issue Auth berikutnya, namun **jangan membuat route auth** di Issue ini.

#### Langkah 1.2 — Konfigurasi `server/package.json`
Pastikan bagian `main` dan `scripts` di `server/package.json` menggunakan bentuk berikut:

```json
{
  "name": "warga-halim-server",
  "version": "1.0.0",
  "private": true,
  "description": "Backend API Warga Halim (Express + TypeScript + MySQL2)",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

#### Langkah 1.3 — Konfigurasi `server/tsconfig.json`
Buat `server/tsconfig.json` dengan mode `strict` penuh:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### Langkah 1.4 — Helper Respons (`server/src/utils/response.ts`)
Buat helper untuk menjaga format respons selalu konsisten `{ success, data, message }`:

```typescript
import type { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data: T,
  message: string
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null
): Response<ApiResponse<unknown>> {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
}
```

#### Langkah 1.5 — Error & 404 Middleware (`server/src/middleware/error.middleware.ts`)
Buat penangan route tidak ditemukan dan global error handler bahasa Indonesia:

```typescript
import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'Endpoint tidak ditemukan');
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('[Server Error]', err);
  } else {
    console.error('[Server Error]', err.message);
  }

  sendError(res, 500, 'Terjadi kesalahan pada server');
}
```

#### Langkah 1.6 — Express App (`server/src/app.ts`), Local Entry (`server/src/server.ts`), dan `server/vercel.json`

**`server/src/app.ts`** (tidak memanggil `app.listen`):
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiRoutes from './routes';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
```

**`server/src/server.ts`** (entry point lokal):
```typescript
import app from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './db/pool';

async function startServer(): Promise<void> {
  try {
    await checkDatabaseConnection();
    console.log('[DB] Koneksi pool MySQL berhasil diverifikasi.');

    app.listen(env.PORT, () => {
      console.log(`[Server] Berjalan di http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('[Startup Error] Gagal menyalakan server:', error);
    process.exit(1);
  }
}

void startServer();
```

**`server/vercel.json`** (routing serverless Vercel):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.ts"
    }
  ]
}
```

---

### [ ] 2. Environment Configuration (Setup `.env`, `.env.example`, dan Validasi Environment)

#### Langkah 2.1 — Buat `server/.env.example` (Aman di-commit ke Git)
File ini menjadi dokumentasi variabel wajib bagi developer lain tanpa membocorkan rahasia apa pun:

```dotenv
# Konfigurasi Server
PORT=5000
NODE_ENV=development

# Konfigurasi Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=warga_halim

# Keamanan & Autentikasi
# Gunakan string acak minimal 32 karakter untuk produksi
JWT_SECRET=ganti_dengan_secret_panjang_minimal_32_karakter

# Frontend Origin (CORS)
CLIENT_URL=http://localhost:5173

# Vercel Blob (Upload Foto Karyawan - diisi saat fitur upload/deploy)
BLOB_READ_WRITE_TOKEN=
```

#### Langkah 2.2 — Buat `server/.env` (Lokal Saja, DILARANG Masuk Git)
Salin `.env.example` menjadi `server/.env` dan sesuaikan dengan kredensial MySQL lokal Anda:

```bash
cp server/.env.example server/.env
```
Verifikasi dengan `git status` bahwa `server/.env` **tidak muncul** sebagai *untracked file* (sudah terblokir oleh `.gitignore` di root).

#### Langkah 2.3 — Validasi Environment dengan Zod (`server/src/config/env.ts`)
Buat modul validasi `env.ts` agar seluruh tipe environment terjamin valid saat aplikasi mulai berjalan:

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DB_HOST: z.string().min(1, 'DB_HOST wajib diisi'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1, 'DB_USER wajib diisi'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME wajib diisi'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET wajib diisi minimal 16 karakter'),
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL harus berupa URL valid (contoh: http://localhost:5173)')
    .default('http://localhost:5173'),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Env Error] Konfigurasi environment tidak valid:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
```

---

### [ ] 3. MySQL Connection (Membuat Koneksi Menggunakan `mysql2` Connection Pool)

Buat file `server/src/db/pool.ts`:

```typescript
import mysql from 'mysql2/promise';
import { env } from '../config/env';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function checkDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}
```

**Detail Penting:**
1. Selalu gunakan `connection.release()` di dalam blok `finally` (atau gunakan `pool.query(...)` / `pool.execute(...)` langsung untuk query tunggal) agar koneksi tidak pernah bocor (*connection leak*).
2. `connectionLimit: 5` sengaja dijaga kecil agar aman saat berjalan di lingkungan Vercel Serverless.

---

### [ ] 4. Database Schema (Membuat Lima Tabel Sesuai `DATABASE_DESIGN.md`)

File DDL sudah disiapkan di [server/src/db/schema.sql](./server/src/db/schema.sql) dan telah disinkronkan 100% dengan [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md). Tugas pada langkah ini adalah memastikan schema dijalankan pada database MySQL target dan memverifikasi kelima tabel beserta relasi dan index-nya:

1. **`employees`** — `id`, `full_name` (INDEXED), `nickname`, `hometown`, `hobby`, `contact`, `favorite_quote`, `photo_url`, `status` (`draft` | `published`, INDEXED), `created_at`, `updated_at`. *(Tanpa kolom `position`, `division`, `year_joined`, `year_left`)*.
2. **`users`** — `id`, `name`, `email` (UNIQUE), `password_hash`, `role` (`admin` | `user`), `employee_id` (`NULL`, `UNIQUE`, FK ke `employees(id)` dengan `ON DELETE SET NULL ON UPDATE CASCADE`), `is_active`, `created_at`, `updated_at`.
3. **`memories`** — `id`, `title`, `event_date` (INDEXED), `story`, `status` (`draft` | `published`), `created_at`, `updated_at`.
4. **`memory_employees`** — Pivot many-to-many `(memory_id, employee_id)` composite PK, `ON DELETE CASCADE` ke `memories` dan `employees`, `created_at` (tanpa `updated_at`).
5. **`messages`** — `id`, `sender_employee_id`, `recipient_employee_id` (keduanya `ON DELETE CASCADE` ke `employees`), `message`, `impression`, `created_at`, `updated_at`.

#### Cara Menjalankan Schema di MySQL Lokal:
```sql
CREATE DATABASE IF NOT EXISTS warga_halim
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```
Kemudian eksekusi `schema.sql`:
```bash
mysql -u root -p warga_halim < server/src/db/schema.sql
```
*(Di PowerShell Windows, gunakan `Get-Content server/src/db/schema.sql | mysql -u root -p warga_halim` atau jalankan lewat MySQL Workbench / DBeaver).*

---

### [ ] 5. Seed Data (Membuat Data Awal dan Satu Akun Admin dengan Bcrypt Hash)

File seed sudah disiapkan di [server/src/db/seed.sql](./server/src/db/seed.sql). Pastikan hal-hal berikut terpenuhi saat dijalankan:

1. **Akun Admin Tunggal:** Dibuat dari `seed.sql` dengan `email = 'admin@wargahalim.id'`, `role = 'admin'`, `employee_id = NULL`, dan `password_hash` berbentuk hash `bcryptjs` valid (`$2a$10$...`). **Tidak ada password plaintext.**
2. **Data Contoh Lengkap:**
   - 5 data `employees` (`id` 1–4 berstatus `published`, `id` 5 berstatus `draft`).
   - 4 contoh akun `users`: 3 user sudah tertaut ke karyawan (`employee_id` 1, 2, 3) dan 1 user **belum tertaut** (`employee_id = NULL`) untuk keperluan uji skenario khusus pada `TEST_PLAN.md`.
   - 4 contoh `memories` (3 `published`, 1 `draft`) dan tag `memory_employees`.
   - 4 contoh `messages` antar karyawan.

#### Cara Menjalankan Seed Data:
```bash
mysql -u root -p warga_halim < server/src/db/seed.sql
```

*(Opsional untuk development lokal):* Jika ingin mengganti hash contoh pada `seed.sql` agar Anda tahu password lokal yang pasti bisa dipakai login nanti, generate hash bcrypt melalui Node CLI **tanpa menyimpannya sebagai plaintext di repo**:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('PasswordLokalAnda123!', 10));"
```

---

### [ ] 6. Health Check (`GET /api/health`)

Buat controller dan route untuk memeriksa bahwa Express dan koneksi pool MySQL benar-benar hidup:

#### `server/src/controllers/health.controller.ts`
```typescript
import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/pool';
import { sendError, sendSuccess } from '../utils/response';

export async function getHealthStatus(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    await checkDatabaseConnection();

    sendSuccess(
      res,
      200,
      {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      'Server dan database berjalan normal'
    );
  } catch (error) {
    console.error('[Health Check Error]', error);
    sendError(res, 500, 'Gagal terhubung ke database', {
      status: 'error',
      database: 'disconnected',
    });
  }
}
```

#### `server/src/routes/health.route.ts`
```typescript
import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';

const router = Router();

router.get('/health', getHealthStatus);

export default router;
```

#### `server/src/routes/index.ts`
```typescript
import { Router } from 'express';
import healthRoutes from './health.route';

const router = Router();

router.use('/', healthRoutes);

export default router;
```

---

## Panduan Verifikasi & Acceptance Criteria (Langkah Uji Wajib)

Issue ini dinyatakan **SELESAI** hanya jika seluruh pemeriksaan di bawah ini berhasil:

### 1. Verifikasi TypeScript & Build (Zero Error)
Jalankan dari folder `server/`:
```bash
npm run typecheck
npm run build
```
- **Ekspektasi:** Keluar dengan exit code `0`, tidak ada error TypeScript, tidak ada tipe `any`, dan folder `server/dist/` terbentuk.

### 2. Verifikasi Database Schema & Seed di MySQL
Jalankan query verifikasi berikut di MySQL:
```sql
USE warga_halim;
SHOW TABLES;
DESCRIBE employees;
SELECT id, name, email, role, employee_id, is_active, LEFT(password_hash, 7) AS hash_prefix FROM users;
```
- **Ekspektasi:**
  - `SHOW TABLES` menampilkan tepat 5 tabel: `employees`, `memories`, `memory_employees`, `messages`, `users`.
  - `DESCRIBE employees` **tidak memiliki** kolom `position`, `division`, `year_joined`, atau `year_left`.
  - Seluruh baris `users` memiliki `hash_prefix` berawalan `$2a$` atau `$2b$` (bukan plaintext) dan terdapat tepat 1 baris `role = 'admin'`.

### 3. Verifikasi Endpoint Health Check
Jalankan server lokal:
```bash
npm run dev
```
Lalu uji endpoint (gunakan `curl` atau browser/Postman):
```bash
curl -i http://localhost:5000/api/health
```
- **Ekspektasi Sukses (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "database": "connected",
      "timestamp": "2026-11-13T..."
    },
    "message": "Server dan database berjalan normal"
  }
  ```
- **Uji Negatif 404:** Panggil `curl -i http://localhost:5000/api/tidak-ada` -> harus mengembalikan `404 Not Found` dengan `{ "success": false, "data": null, "message": "Endpoint tidak ditemukan" }`.
- **Uji Negatif DB Mati (opsional):** Ubah sementara `DB_PORT` di `.env` lokal ke port salah -> restart server / panggil `/api/health` -> harus gagal dengan pesan ramah tanpa membocorkan `DB_PASSWORD` atau kredensial di respons JSON.

### 4. Verifikasi Keamanan Git (Anti-Credential Leak)
Jalankan dari root repo:
```bash
git status
```
- **Ekspektasi:**
  - File `server/.env` **TIDAK BOLEH** muncul di output `git status` (terabaikan oleh `.gitignore`).
  - Folder `server/node_modules/` dan `server/dist/` **TIDAK BOLEH** terlacak Git.
  - File `server/.env.example` **BOLEH** dan **HARUS** terlacak Git tanpa isi rahasia.

---

## Jebakan Umum yang Harus Dihindari (Checklist Review)

- **Jebakan 1 — Memanggil `app.listen()` di `app.ts`:** Ini akan menyebabkan Vercel Serverless gagal menjalankan fungsi. Pastikan `app.listen()` hanya ada di `server.ts`.
- **Jebakan 2 — Mengembalikan kolom `position` atau membuat tabel tambahan:** Selalu ikuti `schema.sql` dan `docs/DATABASE_DESIGN.md` versi terbaru.
- **Jebakan 3 — Membaca `process.env` langsung di banyak file tanpa validasi:** Selalu impor `env` dari `src/config/env.ts` agar tipe data (`number` untuk `PORT` dan `DB_PORT`, `string` tervalidasi untuk `JWT_SECRET`) terjamin oleh TypeScript.
- **Jebakan 4 — Lupa melepas koneksi pool:** Jika menggunakan `pool.getConnection()`, wajib bungkus dengan `try { ... } finally { connection.release(); }`.
- **Jebakan 5 — Meng-commit `.env`:** Selalu cek `git status` dan `git diff --cached` sebelum `git commit`.
