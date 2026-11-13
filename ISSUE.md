# ISSUE #03 — Implementasi & Pengujian Endpoint `GET /api/memories`, `GET /api/memories/:id`, dan `GET /api/messages`

- **Proyek:** Warga Halim (`warga-halim`)
- **Target Pembaca:** Junior Fullstack Developer & AI Coding Model
- **Status:** `Open` (Tahap 3 — API Data Login: Kenangan & Pesan)
- **Dokumen Referensi Wajib:**
  - [docs/PRD.md](./docs/PRD.md) — Bagian F3 (Kenangan), F4 (Pesan dan Kesan), & Bagian 9 (Technical Requirements)
  - [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) — Bagian 3.4 (`GET /api/memories`), 3.5 (`GET /api/memories/:id`), & 3.6 (`GET /api/messages`)
  - [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) — Bagian 3.2 (`employees`), 3.3 (`memories`), 3.4 (`memory_employees`), 3.5 (`messages`), & Bagian 4 (Aturan Relasi)
  - [docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) — Task `T-10` & `T-11`
  - [docs/TEST_PLAN.md](./docs/TEST_PLAN.md) — `TC-F3-01`, `TC-F3-02`, `TC-F4-01`, & `TC-SPEC-05`

---

## Ringkasan Tugas

Implementasikan dan uji tiga endpoint baca terproteksi login untuk modul **Kenangan** dan **Pesan & Kesan**:

1. **`GET /api/memories`** — Mengambil daftar kenangan berstatus `published` (terbaru di atas berdasarkan `event_date DESC`).
2. **`GET /api/memories/:id`** *(contoh: `GET /api/memories/1`)* — Mengambil detail satu kenangan `published` beserta daftar karyawan `published` yang di-tag pada kenangan tersebut.
3. **`GET /api/messages`** — Mengambil seluruh pesan dan kesan antar karyawan di mana **pengirim dan penerima keduanya** berstatus `published` (terbaru di atas berdasarkan `created_at DESC`).

> **Prinsip Pengujian Wajib:** Setiap skenario pengujian API pada issue ini **WAJIB menghapus/me-reset seluruh data tabel database terlebih dahulu** sebelum memasukkan data uji (*fixture*), agar setiap skenario berjalan terisolasi, bersih, dan hasilnya 100% konsisten.

---

## Aturan Emas & Guardrails Wajib (PENTING DIBACA SEBELUM CODING)

1. **WAJIB LOGIN (`authenticate` Middleware):**
   - Ketiga endpoint **BUKAN** endpoint publik. Pengunjung tanpa header `Authorization: Bearer <token>` wajib ditolak dengan **`401 Unauthorized`** (`"Akses ditolak. Token autentikasi tidak ditemukan"`).
   - Token tidak valid/kedaluwarsa wajib ditolak dengan **`401 Unauthorized`** (`"Token autentikasi tidak valid atau telah kedaluwarsa"`).
   - Akun yang dinonaktifkan (`is_active = 0`) wajib ditolak dengan **`403 Forbidden`** (`"Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan"`).
   - Middleware `authenticate` sudah tersedia di `server/src/middleware/auth.middleware.ts` — langsung gunakan kembali, **jangan menduplikasi** logika verifikasi JWT.

2. **PROTEKSI VISIBILITAS DATA (`status = 'published'`):**
   - **`GET /api/memories`:** Hanya mengembalikan baris `memories` dengan `status = 'published'`. Kenangan `draft` **dilarang** muncul.
   - **`GET /api/memories/:id`:**
     - Jika `:id` tidak ada atau masih berstatus `draft`, kembalikan **`404 Not Found`** (`"Kenangan tidak ditemukan"`). Jangan beri tahu apakah ID tersebut berstatus `draft` untuk mencegah kebocoran informasi.
     - Daftar `employees` yang di-tag melalui tabel `memory_employees` **wajib difilter `e.status = 'published'`**. Jika ada karyawan `draft` ikut di-tag, karyawan tersebut tidak boleh muncul di array `employees`.
   - **`GET /api/messages`:**
     - Hanya mengembalikan pesan jika **kedua** pihak (`sender` DAN `recipient`) berstatus `published` (`s.status = 'published' AND r.status = 'published'`).
     - Jika salah satu dari pengirim atau penerima berstatus `draft`, pesan tersebut **wajib disembunyikan** agar nama karyawan `draft` tidak bocor.

3. **TANPA KOLOM JABATAN (`position`) & TANPA DATA SENSITIF:**
   - Kolom `position` / `sender_position` / `recipient_position` **SUDAH DIHAPUS** dari schema dan dokumentasi. **Dilarang** menyeleksi atau mengembalikan field tersebut.
   - Jangan mengembalikan `password_hash`, `email`, `contact`, `hometown`, atau biodata detail lainnya pada ketiga endpoint ini.
   - Gunakan helper `generateInitials` yang sudah ada di `server/src/utils/avatar.ts` untuk mengisi `initials`, `sender_initials`, dan `recipient_initials`.

4. **FORMAT TANGGAL & URUTAN DATA:**
   - Pada `GET /api/memories` dan `GET /api/memories/:id`, format `event_date` wajib string `"YYYY-MM-DD"` (gunakan `DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date` di SQL agar driver `mysql2` tidak mengubahnya menjadi objek `Date` dengan pergeseran timezone).
   - Urutan `GET /api/memories`: `ORDER BY event_date DESC, id DESC`.
   - Urutan `GET /api/messages`: `ORDER BY m.created_at DESC, m.id DESC`.

5. **VALIDASI ZOD, PARAMETERIZED QUERY, & TYPESCRIPT STRICT:**
   - Validasi parameter `:id` pada `GET /api/memories/:id` dengan Zod (`z.coerce.number().int().positive()`). Jika tidak valid (contoh: `/api/memories/abc` atau `/api/memories/0`), kembalikan **`400 Bad Request`**.
   - Semua query SQL wajib menggunakan placeholder `?` dari `mysql2/promise`. Dilarang melakukan string interpolation di dalam query SQL.
   - Mode TypeScript `strict: true` dan `noImplicitAny: true` — **dilarang memakai tipe `any`**.
   - **Keamanan Kredensial:** File `.env` tidak boleh di-commit ke Git (sudah diblokir `.gitignore`). Jangan pernah menulis password, `JWT_SECRET`, atau kredensial DB di kode sumber atau script test.

---

## Struktur Folder Aplikasi (Kecil, Rapi, & Profesional)

Gunakan struktur modular yang sudah ada di `server/src/`. Tidak perlu menambah lapisan abstraksi berlebihan; cukup pisahkan `schemas/`, `controllers/`, dan `routes/`:

```text
server/
├── .env                                # LOKAL SAJA (terblokir oleh .gitignore)
├── .env.example                        # Template aman untuk Git
├── package.json
├── tsconfig.json
├── vercel.json
└── src/
    ├── config/
    │   └── env.ts                      # Konfigurasi environment tervalidasi (Zod)
    ├── db/
    │   ├── pool.ts                     # Koneksi MySQL2 connection pool (connectionLimit: 5)
    │   ├── schema.sql                  # DDL 5 tabel (employees, users, memories, memory_employees, messages)
    │   └── seed.sql                    # Data awal contoh
    ├── utils/
    │   ├── response.ts                 # Helper sendSuccess & sendError
    │   ├── avatar.ts                   # Helper generateInitials(fullName)
    │   └── crypt.ts                    # Helper bcryptjs
    ├── middleware/
    │   ├── auth.middleware.ts          # Middleware authenticate (JWT + cek is_active = 1)
    │   └── error.middleware.ts         # Handler 404 & global server error
    ├── schemas/
    │   ├── auth.schema.ts              # Validasi Zod login & user
    │   ├── employee.schema.ts          # Validasi Zod query karyawan
    │   └── memory.schema.ts            # [BARU] Validasi Zod parameter :id kenangan
    ├── controllers/
    │   ├── health.controller.ts        # Controller GET /api/health
    │   ├── employee.controller.ts      # Controller GET /api/employees
    │   ├── memory.controller.ts        # [BARU] Controller getMemories & getMemoryById
    │   └── message.controller.ts       # [BARU] Controller getMessages
    ├── routes/
    │   ├── health.route.ts             # Route GET /health
    │   ├── employee.route.ts           # Route GET /employees
    │   ├── memory.route.ts             # [BARU] Route GET /memories & GET /memories/:id
    │   ├── message.route.ts            # [BARU] Route GET /messages
    │   └── index.ts                    # [MODIFIKASI] Daftarkan memoryRoutes & messageRoutes
    ├── app.ts                          # Express app (ekspor tanpa app.listen)
    └── server.ts                       # Entry point lokal
```

---

## Rincian Checklist Pekerjaan

- [x] **1. Buat Schema Validasi Parameter Kenangan (`server/src/schemas/memory.schema.ts`)**
- [x] **2. Buat Controller Kenangan (`server/src/controllers/memory.controller.ts`)**
- [x] **3. Buat Controller Pesan (`server/src/controllers/message.controller.ts`)**
- [x] **4. Buat Route Kenangan & Pesan (`memory.route.ts`, `message.route.ts`) lalu Daftarkan di `routes/index.ts`**
- [x] **5. Jalankan `npm run typecheck` dan `npm run build` (Zero Error, Tanpa `any`)**
- [x] **6. Eksekusi Seluruh 16 Skenario Pengujian (Dengan Reset Data Sebelum Setiap Skenario)**

---

## Panduan Implementasi Kode (Blueprint)

### 1. Schema Validasi Parameter Kenangan (`server/src/schemas/memory.schema.ts`)

```typescript
import { z } from 'zod';

export const memoryIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'ID kenangan harus berupa angka' })
    .int('ID kenangan harus berupa bilangan bulat')
    .positive('ID kenangan harus lebih besar dari 0'),
});

export type MemoryIdParam = z.infer<typeof memoryIdParamSchema>;
```

> **Catatan Zod v4 / TypeScript:** Jika proyek memakai `zod` v4, apabila `invalid_type_error` tidak dikenali pada opsi `z.coerce.number(...)`, gunakan `z.coerce.number().int('ID kenangan harus berupa bilangan bulat').positive('ID kenangan harus lebih besar dari 0')`. Selalu cek dengan `npm run typecheck`.

---

### 2. Controller Kenangan (`server/src/controllers/memory.controller.ts`)

```typescript
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { memoryIdParamSchema } from '../schemas/memory.schema';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface MemoryListRow extends RowDataPacket {
  id: number;
  title: string;
  event_date: string;
  story: string;
  created_at: Date;
}

interface TaggedEmployeeRow extends RowDataPacket {
  id: number;
  full_name: string;
  photo_url: string | null;
}

export async function getMemories(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        id,
        title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
        story,
        created_at
      FROM memories
      WHERE status = 'published'
      ORDER BY event_date DESC, id DESC
    `;

    const [rows] = await pool.query<MemoryListRow[]>(query);

    sendSuccess(res, 200, rows, 'Daftar kenangan berhasil diambil');
  } catch (error) {
    console.error('[GetMemories Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar kenangan');
  }
}

export async function getMemoryById(
  req: Request,
  res: Response
): Promise<void> {
  const parseResult = memoryIdParamSchema.safeParse(req.params);

  if (!parseResult.success) {
    const firstError =
      parseResult.error.issues[0]?.message || 'ID kenangan tidak valid';
    sendError(res, 400, firstError);
    return;
  }

  const { id } = parseResult.data;

  try {
    const memoryQuery = `
      SELECT
        id,
        title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
        story
      FROM memories
      WHERE id = ? AND status = 'published'
      LIMIT 1
    `;

    const [memoryRows] = await pool.query<MemoryListRow[]>(memoryQuery, [id]);

    if (memoryRows.length === 0) {
      sendError(res, 404, 'Kenangan tidak ditemukan');
      return;
    }

    const employeesQuery = `
      SELECT
        e.id,
        e.full_name,
        e.photo_url
      FROM memory_employees me
      INNER JOIN employees e ON e.id = me.employee_id
      WHERE me.memory_id = ? AND e.status = 'published'
      ORDER BY e.full_name ASC
    `;

    const [employeeRows] = await pool.query<TaggedEmployeeRow[]>(
      employeesQuery,
      [id]
    );

    const employees = employeeRows.map((emp) => ({
      id: emp.id,
      full_name: emp.full_name,
      photo_url: emp.photo_url,
      initials: generateInitials(emp.full_name),
    }));

    const memory = memoryRows[0];

    sendSuccess(
      res,
      200,
      {
        id: memory.id,
        title: memory.title,
        event_date: memory.event_date,
        story: memory.story,
        employees,
      },
      'Detail kenangan berhasil diambil'
    );
  } catch (error) {
    console.error('[GetMemoryById Error]', error);
    sendError(res, 500, 'Gagal mengambil detail kenangan');
  }
}
```

---

### 3. Controller Pesan (`server/src/controllers/message.controller.ts`)

```typescript
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { generateInitials } from '../utils/avatar';
import { sendError, sendSuccess } from '../utils/response';

interface MessageRow extends RowDataPacket {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  recipient_employee_id: number;
  recipient_name: string;
  message: string;
  impression: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getMessages(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        m.id,
        m.sender_employee_id,
        s.full_name AS sender_name,
        m.recipient_employee_id,
        r.full_name AS recipient_name,
        m.message,
        m.impression,
        m.created_at,
        m.updated_at
      FROM messages m
      INNER JOIN employees s ON s.id = m.sender_employee_id
      INNER JOIN employees r ON r.id = m.recipient_employee_id
      WHERE s.status = 'published' AND r.status = 'published'
      ORDER BY m.created_at DESC, m.id DESC
    `;

    const [rows] = await pool.query<MessageRow[]>(query);

    const messages = rows.map((row) => ({
      id: row.id,
      sender_employee_id: row.sender_employee_id,
      sender_name: row.sender_name,
      sender_initials: generateInitials(row.sender_name),
      recipient_employee_id: row.recipient_employee_id,
      recipient_name: row.recipient_name,
      recipient_initials: generateInitials(row.recipient_name),
      message: row.message,
      impression: row.impression,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    sendSuccess(res, 200, messages, 'Daftar pesan dan kesan berhasil diambil');
  } catch (error) {
    console.error('[GetMessages Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar pesan dan kesan');
  }
}
```

---

### 4. Route Definition & Registrasi

#### `server/src/routes/memory.route.ts`
```typescript
import { Router } from 'express';
import { getMemories, getMemoryById } from '../controllers/memory.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/memories', authenticate, getMemories);
router.get('/memories/:id', authenticate, getMemoryById);

export default router;
```

#### `server/src/routes/message.route.ts`
```typescript
import { Router } from 'express';
import { getMessages } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/messages', authenticate, getMessages);

export default router;
```

#### `server/src/routes/index.ts`
```typescript
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
```

---

## Panduan Pengujian & Skenario Test Lengkap Per API

### Aturan Wajib Sebelum Setiap Skenario: Hapus Data Terlebih Dahulu (Clean State)

Agar hasil pengujian 100% deterministik dan tidak terpengaruh sisa data skenario lain, **wajib jalankan pembersihan seluruh tabel** sebelum memulai **setiap skenario uji**:

```sql
-- Jalankan SQL Reset ini di awal SETIAP skenario uji (urutan mengikuti Foreign Key)
DELETE FROM messages;
DELETE FROM memory_employees;
DELETE FROM memories;
DELETE FROM users;
DELETE FROM employees;
```

Jika menggunakan Node.js / script uji otomatis (tanpa menyimpan kredensial di repo), buat helper `resetDatabase()` dan `createJwtToken()` yang membaca `pool` dan `env.JWT_SECRET` dari `.env` lokal:

```typescript
// Contoh pola helper reset di test/scratch runner
async function resetDatabase(): Promise<void> {
  await pool.query('DELETE FROM messages');
  await pool.query('DELETE FROM memory_employees');
  await pool.query('DELETE FROM memories');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM employees');
}
```

> **Catatan Token Uji:** Karena endpoint `POST /api/auth/login` belum masuk ke scope issue ini, selama pengujian lokal Anda dapat membuat token JWT uji menggunakan `jsonwebtoken` dengan `JWT_SECRET` dari `server/.env` lokal (`jwt.sign({ id: 2, email: 'andi@wargahalim.id', role: 'user', employee_id: 1 }, env.JWT_SECRET, { expiresIn: '1h' })`) setelah baris `users` dengan `id = 2` di-insert ke database pada skenario terkait.

---

### A. Skenario Uji `GET /api/memories`

#### `TC-MEM-01` — Sukses Mengambil Daftar Kenangan Terbit (Terurut `event_date DESC`, `draft` Disembunyikan)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);

   INSERT INTO memories (id, title, event_date, story, status, created_at) VALUES
     (1, 'Peluncuran Produk Perdana', '2020-11-10', 'Malam begadang bersama tim teknologi.', 'published', '2026-11-12 09:00:00'),
     (2, 'Outing Puncak 2022', '2022-08-17', 'Perjalanan bersama seluruh tim ke Puncak.', 'published', '2026-11-12 10:00:00'),
     (3, 'Catatan Rahasia Draft', '2024-01-01', 'Belum siap terbit.', 'draft', '2026-11-12 11:00:00');
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   *(Perhatikan: ID 2 muncul paling atas karena `2022-08-17` > `2020-11-10`, dan ID 3 `draft` tidak muncul.)*
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 2,
         "title": "Outing Puncak 2022",
         "event_date": "2022-08-17",
         "story": "Perjalanan bersama seluruh tim ke Puncak.",
         "created_at": "2026-11-12T03:00:00.000Z"
       },
       {
         "id": 1,
         "title": "Peluncuran Produk Perdana",
         "event_date": "2020-11-10",
         "story": "Malam begadang bersama tim teknologi.",
         "created_at": "2026-11-12T02:00:00.000Z"
       }
     ],
     "message": "Daftar kenangan berhasil diambil"
   }
   ```

#### `TC-MEM-02` — Data Kenangan Kosong / Hanya Ada Data `draft`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);

   INSERT INTO memories (id, title, event_date, story, status) VALUES
     (1, 'Kenangan Draft Saja', '2023-05-01', 'Belum dipublikasikan.', 'draft');
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   ```json
   {
     "success": true,
     "data": [],
     "message": "Daftar kenangan berhasil diambil"
   }
   ```

#### `TC-MEM-03` — Pengunjung Tanpa Token Mengakses `GET /api/memories`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories"
   ```
3. **Contoh Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Token autentikasi tidak ditemukan"
   }
   ```

#### `TC-MEM-04` — Token JWT Tidak Valid / Rusak
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories" \
     -H "Authorization: Bearer token.palsu.tidakvalid"
   ```
3. **Contoh Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Token autentikasi tidak valid atau telah kedaluwarsa"
   }
   ```

#### `TC-MEM-05` — User Nonaktif (`is_active = 0`) Mengakses `GET /api/memories`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Nonaktif', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 0);
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories" \
     -H "Authorization: Bearer <TOKEN_USER_ID_2>"
   ```
3. **Contoh Response (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan"
   }
   ```

---

### B. Skenario Uji `GET /api/memories/:id` *(Contoh: `GET /api/memories/1`)*

#### `TC-MEM-DTL-01` — Sukses Mengambil Detail `GET /api/memories/1` Beserta Tag Karyawan Terbit (`draft` Terfilter)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO employees (id, full_name, nickname, photo_url, status) VALUES
     (1, 'Andi Budi', 'Andi', 'https://xxx.public.blob.vercel-storage.com/employees/1.jpg', 'published'),
     (2, 'Citra Dewi', 'Citra', NULL, 'published'),
     (3, 'Karyawan Draft', 'Draft', NULL, 'draft');

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', 1, 1);

   INSERT INTO memories (id, title, event_date, story, status) VALUES
     (1, 'Outing Puncak 2022', '2022-08-17', 'Cerita lengkap kenangan bersama di Puncak.', 'published');

   INSERT INTO memory_employees (memory_id, employee_id) VALUES
     (1, 1),
     (1, 2),
     (1, 3);
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/1" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   *(Perhatikan: Karyawan `id: 3` berstatus `draft` tidak ikut muncul di `employees`, dan tidak ada kolom `position`.)*
   ```json
   {
     "success": true,
     "data": {
       "id": 1,
       "title": "Outing Puncak 2022",
       "event_date": "2022-08-17",
       "story": "Cerita lengkap kenangan bersama di Puncak.",
       "employees": [
         {
           "id": 1,
           "full_name": "Andi Budi",
           "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg",
           "initials": "AB"
         },
         {
           "id": 2,
           "full_name": "Citra Dewi",
           "photo_url": null,
           "initials": "CD"
         }
       ]
     },
     "message": "Detail kenangan berhasil diambil"
   }
   ```

#### `TC-MEM-DTL-02` — Sukses Mengambil Detail `GET /api/memories/1` Tanpa Tag Karyawan
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);

   INSERT INTO memories (id, title, event_date, story, status) VALUES
     (1, 'Catatan Awal Berdiri', '2019-02-01', 'Kenangan sebelum ada tag karyawan.', 'published');
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/1" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   ```json
   {
     "success": true,
     "data": {
       "id": 1,
       "title": "Catatan Awal Berdiri",
       "event_date": "2019-02-01",
       "story": "Kenangan sebelum ada tag karyawan.",
       "employees": []
     },
     "message": "Detail kenangan berhasil diambil"
   }
   ```

#### `TC-MEM-DTL-03` — Mengakses `GET /api/memories/1` yang Berstatus `draft`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);

   INSERT INTO memories (id, title, event_date, story, status) VALUES
     (1, 'Draft Rahasia', '2023-05-01', 'Masih disusun admin.', 'draft');
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/1" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`404 Not Found`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Kenangan tidak ditemukan"
   }
   ```

#### `TC-MEM-DTL-04` — ID Kenangan Tidak Ditemukan (`GET /api/memories/999`)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/999" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`404 Not Found`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Kenangan tidak ditemukan"
   }
   ```

#### `TC-MEM-DTL-05` — Parameter ID Tidak Valid (`GET /api/memories/abc` atau `/api/memories/0`)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/abc" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`400 Bad Request`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "ID kenangan harus berupa angka"
   }
   ```

#### `TC-MEM-DTL-06` — Pengunjung Tanpa Token (`401`) & Akun Nonaktif (`403`) pada `GET /api/memories/1`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Nonaktif', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 0);

   INSERT INTO memories (id, title, event_date, story, status) VALUES
     (1, 'Outing Puncak 2022', '2022-08-17', 'Cerita lengkap.', 'published');
   ```
2. **Contoh Request A (Tanpa Token):**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/1"
   ```
   **Response A (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Token autentikasi tidak ditemukan"
   }
   ```
3. **Contoh Request B (Token Akun Nonaktif):**
   ```bash
   curl -i -X GET "http://localhost:5000/api/memories/1" \
     -H "Authorization: Bearer <TOKEN_USER_ID_2>"
   ```
   **Response B (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan"
   }
   ```

---

### C. Skenario Uji `GET /api/messages`

#### `TC-MSG-01` — Sukses Mengambil Pesan Terbit (Urut Terbaru, `impression: null` Aman, Pesan Melibatkan Karyawan `draft` Disembunyikan)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO employees (id, full_name, nickname, status) VALUES
     (1, 'Andi Budi', 'Andi', 'published'),
     (2, 'Citra Dewi', 'Citra', 'published'),
     (3, 'Ziyah Draft', 'Ziyah', 'draft');

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', 1, 1);

   INSERT INTO messages (id, sender_employee_id, recipient_employee_id, message, impression, created_at, updated_at) VALUES
     (1, 1, 2, 'Pesan pertama yang lebih lama.', NULL, '2026-11-12 08:00:00', '2026-11-12 08:00:00'),
     (2, 2, 1, 'Terima kasih selalu membantu saat rilis!', 'Rekan kerja yang sangat sabar.', '2026-11-12 10:00:00', '2026-11-12 10:00:00'),
     (3, 3, 1, 'Pesan dari karyawan draft harus disembunyikan.', 'Draft.', '2026-11-12 12:00:00', '2026-11-12 12:00:00');
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   *(Perhatikan: Pesan ID 2 tampil di atas ID 1; Pesan ID 3 dari pengirim `draft` terfilter keluar; tidak ada `sender_position` / `recipient_position`.)*
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 2,
         "sender_employee_id": 2,
         "sender_name": "Citra Dewi",
         "sender_initials": "CD",
         "recipient_employee_id": 1,
         "recipient_name": "Andi Budi",
         "recipient_initials": "AB",
         "message": "Terima kasih selalu membantu saat rilis!",
         "impression": "Rekan kerja yang sangat sabar.",
         "created_at": "2026-11-12T03:00:00.000Z",
         "updated_at": "2026-11-12T03:00:00.000Z"
       },
       {
         "id": 1,
         "sender_employee_id": 1,
         "sender_name": "Andi Budi",
         "sender_initials": "AB",
         "recipient_employee_id": 2,
         "recipient_name": "Citra Dewi",
         "recipient_initials": "CD",
         "message": "Pesan pertama yang lebih lama.",
         "impression": null,
         "created_at": "2026-11-12T01:00:00.000Z",
         "updated_at": "2026-11-12T01:00:00.000Z"
       }
     ],
     "message": "Daftar pesan dan kesan berhasil diambil"
   }
   ```

#### `TC-MSG-02` — Tabel Pesan Kosong (`data: []`)
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 1);
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   ```json
   {
     "success": true,
     "data": [],
     "message": "Daftar pesan dan kesan berhasil diambil"
   }
   ```

#### `TC-MSG-03` — Konsistensi `ON DELETE CASCADE` Saat Karyawan Dihapus
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO employees (id, full_name, nickname, status) VALUES
     (1, 'Andi Budi', 'Andi', 'published'),
     (2, 'Citra Dewi', 'Citra', 'published');

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Budi', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', 1, 1);

   INSERT INTO messages (id, sender_employee_id, recipient_employee_id, message, impression) VALUES
     (1, 2, 1, 'Pesan untuk Andi.', 'Sabar.');

   -- Simulasi admin menghapus karyawan Citra (id = 2)
   DELETE FROM employees WHERE id = 2;
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages" \
     -H "Authorization: Bearer <VALID_USER_TOKEN>"
   ```
3. **Contoh Response (`200 OK`):**
   *(Pesan ikut terhapus otomatis oleh `ON DELETE CASCADE`, tidak terjadi error JOIN.)*
   ```json
   {
     "success": true,
     "data": [],
     "message": "Daftar pesan dan kesan berhasil diambil"
   }
   ```

#### `TC-MSG-04` — Pengunjung Tanpa Token Mengakses `GET /api/messages`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;
   ```
2. **Contoh Request:**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages"
   ```
3. **Contoh Response (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Token autentikasi tidak ditemukan"
   }
   ```

#### `TC-MSG-05` — Token Rusak (`401`) & Akun Nonaktif (`403`) pada `GET /api/messages`
1. **Reset & Setup Data:**
   ```sql
   DELETE FROM messages; DELETE FROM memory_employees; DELETE FROM memories; DELETE FROM users; DELETE FROM employees;

   INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
     (2, 'Andi Nonaktif', 'andi@wargahalim.id', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS', 'user', NULL, 0);
   ```
2. **Contoh Request A (Token Rusak):**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages" \
     -H "Authorization: Bearer token.rusak.123"
   ```
   **Response A (`401 Unauthorized`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Token autentikasi tidak valid atau telah kedaluwarsa"
   }
   ```
3. **Contoh Request B (Token Akun Nonaktif):**
   ```bash
   curl -i -X GET "http://localhost:5000/api/messages" \
     -H "Authorization: Bearer <TOKEN_USER_ID_2>"
   ```
   **Response B (`403 Forbidden`):**
   ```json
   {
     "success": false,
     "data": null,
     "message": "Akses ditolak. Akun Anda telah dinonaktifkan atau tidak ditemukan"
   }
   ```

---

## Checklist Review Akhir Sebelum Submit PR

- [x] `npm --prefix server run typecheck` dan `npm --prefix server run build` lulus dengan 0 error (tanpa tipe `any`).
- [x] Seluruh 3 endpoint memakai middleware `authenticate` dari `src/middleware/auth.middleware.ts`.
- [x] `GET /api/memories` hanya menampilkan status `published` dan terurut `event_date DESC`.
- [x] `GET /api/memories/:id` memvalidasi `:id` via Zod, mengembalikan `404` untuk `draft`/tidak ada, dan memfilter tag `employees` hanya `published`.
- [x] `GET /api/messages` hanya menampilkan pesan jika `sender` dan `recipient` sama-sama berstatus `published` (tanpa kolom `position`).
- [x] Seluruh 16 skenario pengujian lulus setelah reset data (`DELETE FROM ...`) sebelum tiap skenario.
- [x] File `.env` lokal dan kredensial tidak terlacak Git (`git status` bersih dari secret).

