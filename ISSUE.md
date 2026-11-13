# ISSUE #05 — Implementasi Admin API Development (`/api/admin/*`: Employees, Memories + Transaction, Messages, Users, & Photo Upload)

- **Proyek:** Warga Halim (`warga-halim`)
- **Target Pembaca:** Junior Fullstack Developer & AI Coding Model
- **Status:** `Open` (Tahap 4 — `T-12` s.d. `T-16`: Backend Admin API)
- **Dokumen Referensi Wajib:**
  - [docs/PRD.md](./docs/PRD.md) — Sumber requirement utama (`F6 Panel Admin` & Bagian 9)
  - [docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) — Task `T-05`, `T-12`, `T-13`, `T-14`, `T-15`, `T-16`
  - [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) — Skema 5 tabel & Aturan Relasi Bagian 4
  - [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) — Bagian 4 (`4.1` s.d. `4.5`)
  - [docs/TEST_PLAN.md](./docs/TEST_PLAN.md) — Bagian 3.6 (`TC-F6-01` s.d. `TC-F6-07`) & 3.7

---

## Ringkasan Tugas & Prerequisites

### Verifikasi Prerequisites (Sudah Terpenuhi di Repository)
1. **Database MySQL berjalan:** Terkonfigurasi di `server/.env` (`warga_halim`) dengan 5 tabel dari `server/src/db/schema.sql`.
2. **Authentication berfungsi:** `POST /api/auth/login` & `GET /api/auth/me` aktif (`server/src/routes/auth.route.ts`).
3. **JWT Middleware tersedia:** `authenticate` (`server/src/middleware/authenticate.ts`).
4. **Authorization Middleware tersedia:** `authorize` & `authorizeAdmin` (`server/src/middleware/authorize.ts`).
5. **MySQL Connection Pool tersedia:** `pool` (`server/src/db/pool.ts`).

### Dependensi Tambahan yang Wajib Di-install (Modul 5 — Photo Upload)
Sebelum mengerjakan Modul 5, jalankan perintah berikut:
```bash
npm --prefix server install multer @vercel/blob
npm --prefix server install -D @types/multer
```

---

## Urutan Pengerjaan Bertahap (WAJIB BERURUTAN)

Kerjakan secara bertahap per modul dan **jalankan pengujian modul terkait** sebelum melanjutkan ke modul berikutnya. **Jangan mengimplementasikan frontend terlebih dahulu.**

1. **Modul 1 — Employee Management** (`/api/admin/employees`) $\rightarrow$ Uji `TC-ADM-01` s.d. `TC-ADM-04` + proteksi role (`TC-ADM-16`).
2. **Modul 2 — Memory Management** (`/api/admin/memories` + MySQL Transaction) $\rightarrow$ Uji `TC-ADM-05` s.d. `TC-ADM-07`.
3. **Modul 3 — Message Management** (`/api/admin/messages`, tanpa `PUT`/`PATCH`) $\rightarrow$ Uji `TC-ADM-08` s.d. `TC-ADM-10`.
4. **Modul 4 — User Management** (`/api/admin/users` + penautan `employee_id` di `PUT /:id`) $\rightarrow$ Uji `TC-ADM-11` s.d. `TC-ADM-15`.
5. **Modul 5 — Photo Upload** (`/api/admin/employees/:id/photo` + Magic Bytes Validation + Vercel Blob) $\rightarrow$ Uji `TC-ADM-17` s.d. `TC-ADM-20`.

---

## Aturan Emas & Guardrails Wajib

1. **Proteksi Role Admin di Seluruh Endpoint (`/api/admin/*`):**
   - Seluruh router admin wajib dipasang middleware `authenticate` dan `authorize('admin')` (`authorizeAdmin`).
   - User biasa (`role = 'user'`) wajib ditolak dengan **`403 Forbidden`**. Pengunjung tanpa token wajib ditolak **`401 Unauthorized`**.
2. **Arsitektur Berlapis & Strict TypeScript (`no any`):**
   - `routes/` $\rightarrow$ Definisi URL & middleware (`authenticate`, `authorizeAdmin`, `uploadPhoto`).
   - `controllers/` $\rightarrow$ Validasi Zod (`safeParse`), pemanggilan service, pengiriman JSON `{ success, data, message }`.
   - `services/` $\rightarrow$ Business logic, parameterized SQL (`?`), dan pengelolaan transaksi MySQL.
   - `schemas/` $\rightarrow$ Skema validasi Zod (kompatibel dengan Zod v4 yang terpasang di project).
   - **Dilarang keras** menggunakan tipe `any`, membocorkan error mentah SQL ke client, atau menyertakan `password_hash` pada respons mana pun.
3. **Aturan Khusus per Modul:**
   - **Employees:** `full_name` wajib diisi; field opsional (`hometown`, `hobby`, `contact`, `favorite_quote`) dinormalisasi ke `NULL` jika kosong; mendukung status `'draft' | 'published'`; tidak ada kolom `position`.
   - **Memories:** Pembuatan (`POST`) dan pembaruan (`PUT`) memori beserta `employee_ids` pada tabel `memory_employees` **wajib menggunakan MySQL Transaction** (`beginTransaction`, `commit`, `rollback` jika ada kegagalan atau ada ID karyawan tidak valid).
   - **Messages:** **TIDAK BOLEH** membuat endpoint `PUT` atau `PATCH` untuk pesan. `sender_employee_id` dan `recipient_employee_id` harus valid dan **harus berbeda** (`!==`). Pesan yang dibuat admin langsung aktif/terbit.
   - **Users:**
     - `POST /api/admin/users`: Role selalu dikunci `'user'` (abaikan `role` dari body), `employee_id` otomatis `NULL`, password di-hash dengan `hashPassword` (`bcryptjs`), email duplikat ditolak **`409 Conflict`**.
     - `PUT /api/admin/users/:id`: **Satu-satunya endpoint** untuk menautkan atau melepas `employee_id` (`number | null`). Validasi bahwa `employee_id` ada di `employees` (`400`) dan belum dipakai akun user lain (`409 Conflict`). Admin dilarang mengubah `role` atau menonaktifkan dirinya sendiri (`400`).
     - `DELETE /api/admin/users/:id`: Admin dilarang menghapus dirinya sendiri (`400`).
   - **Photo Upload:**
     - Format hanya `image/jpeg`, `image/png`, `image/webp`; maksimal **2 MB**.
     - Wajib periksa **MIME type DAN file signature (magic bytes)** di server agar file dengan ekstensi/MIME palsu ditolak (`400`).
     - Jangan simpan file upload di filesystem lokal serverless (`multer.memoryStorage()`).
     - Gunakan `@vercel/blob` (`put`, `del`) ketika `env.BLOB_READ_WRITE_TOKEN` terisi, dan gunakan fallback URL lokal deterministik ketika `BLOB_READ_WRITE_TOKEN` kosong pada mode lokal/test agar uji otomatis berjalan 100% deterministik.
     - Hapus foto lama saat diganti (`POST`) atau saat dihapus (`DELETE`), serta tangani kegagalan upload/DB secara aman.
4. **Keamanan Git:** Jangan pernah commit `.env` atau token rahasia ke Git.

---

## Struktur Folder Target (`server/src/`)

```text
server/src/
├── config/
│   └── env.ts                               # Sudah ada (memuat BLOB_READ_WRITE_TOKEN)
├── middleware/
│   ├── authenticate.ts                      # Sudah ada
│   ├── authorize.ts                         # Sudah ada
│   ├── error.middleware.ts                  # Sudah ada
│   └── upload.middleware.ts                 # [BARU - Modul 5] Multer memoryStorage 2MB
├── schemas/
│   ├── auth.schema.ts                       # [MODIFIKASI - Modul 4] Tambah employee_id di updateUserSchema & userIdParamSchema
│   ├── admin.employee.schema.ts             # [BARU - Modul 1]
│   ├── admin.memory.schema.ts               # [BARU - Modul 2]
│   └── admin.message.schema.ts              # [BARU - Modul 3]
├── services/
│   ├── auth.service.ts                      # Sudah ada
│   ├── admin.employee.service.ts            # [BARU - Modul 1 & 5]
│   ├── admin.memory.service.ts              # [BARU - Modul 2]
│   ├── admin.message.service.ts             # [BARU - Modul 3]
│   └── admin.user.service.ts                # [BARU - Modul 4]
├── controllers/
│   ├── admin.employee.controller.ts         # [BARU - Modul 1 & 5]
│   ├── admin.memory.controller.ts           # [BARU - Modul 2]
│   ├── admin.message.controller.ts          # [BARU - Modul 3]
│   └── admin.user.controller.ts             # [BARU - Modul 4]
├── routes/
│   ├── admin.employee.route.ts              # [BARU - Modul 1 & 5]
│   ├── admin.memory.route.ts                # [BARU - Modul 2]
│   ├── admin.message.route.ts               # [BARU - Modul 3]
│   ├── admin.user.route.ts                  # [BARU - Modul 4]
│   └── index.ts                             # [MODIFIKASI] Daftarkan 4 route admin
└── utils/
    ├── blob.ts                              # [BARU - Modul 5] Validasi magic bytes & helper Vercel Blob
    ├── crypt.ts                             # Sudah ada (hashPassword)
    └── response.ts                          # Sudah ada (sendSuccess & sendError)
```

---

## Rincian Checklist Pekerjaan

- [x] **Modul 1:** Implementasi CRUD `/api/admin/employees` + lolos `TC-ADM-01` s.d. `TC-ADM-04` & `TC-ADM-16`
- [x] **Modul 2:** Implementasi CRUD `/api/admin/memories` dengan transaksi MySQL + lolos `TC-ADM-05` s.d. `TC-ADM-07`
- [x] **Modul 3:** Implementasi `GET/POST/DELETE /api/admin/messages` (tanpa `PUT`/`PATCH`) + lolos `TC-ADM-08` s.d. `TC-ADM-10`
- [x] **Modul 4:** Implementasi CRUD `/api/admin/users` (penautan `employee_id` eksklusif di `PUT /:id`) + lolos `TC-ADM-11` s.d. `TC-ADM-15`
- [x] **Modul 5:** Install `multer` & `@vercel/blob`, implementasi magic bytes validation & `POST/DELETE /api/admin/employees/:id/photo` + lolos `TC-ADM-17` s.d. `TC-ADM-20`
- [x] **Final Check:** `npm --prefix server run typecheck`, `npm --prefix server run build`, dan seluruh 20 skenario uji lulus setelah reset data (`DELETE FROM ...`).

---

## Panduan Implementasi Kode (Blueprint)

### Helper Bersama untuk Error Service (`AppServiceError`)
Agar controller konsisten menangani error bisnis (`400`, `404`, `409`), tiap service dapat menggunakan class error custom dengan `statusCode` (seperti `AuthServiceError` di `auth.service.ts`), dan memvalidasi parameter `:id` dengan pola Zod v4: `z.coerce.number({ message: 'ID harus berupa angka' }).int('ID harus berupa bilangan bulat').positive('ID harus lebih besar dari 0')`.

---

### MODUL 1: Employee Management (`/api/admin/employees`)

#### 1.1 `server/src/schemas/admin.employee.schema.ts`
```typescript
import { z } from 'zod';

const optionalNullableText = (maxLen: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLen, `${label} maksimal ${maxLen} karakter`)
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') {
        return null;
      }
      return val;
    });

export const adminEmployeeIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID karyawan harus berupa angka' })
    .int('ID karyawan harus berupa bilangan bulat')
    .positive('ID karyawan harus lebih besar dari 0'),
});

export const adminEmployeeQuerySchema = z.object({
  search: z.string().trim().max(150).optional().default(''),
});

export const createAdminEmployeeSchema = z.object({
  full_name: z
    .string({ message: 'Nama lengkap wajib diisi' })
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(150, 'Nama lengkap maksimal 150 karakter'),
  nickname: z
    .string()
    .trim()
    .max(100, 'Nama panggilan maksimal 100 karakter')
    .optional()
    .default(''),
  hometown: optionalNullableText(150, 'Kota asal'),
  hobby: optionalNullableText(255, 'Hobi'),
  contact: optionalNullableText(255, 'Kontak'),
  favorite_quote: optionalNullableText(2000, 'Kutipan favorit'),
  status: z
    .enum(['draft', 'published'], {
      message: 'Status harus bernilai draft atau published',
    })
    .default('draft'),
});

export const updateAdminEmployeeSchema = createAdminEmployeeSchema;

export type CreateAdminEmployeeInput = z.infer<typeof createAdminEmployeeSchema>;
export type UpdateAdminEmployeeInput = z.infer<typeof updateAdminEmployeeSchema>;
```

#### 1.2 `server/src/services/admin.employee.service.ts`
Ketentuan penting:
- `listAdminEmployees(search)`: Query `SELECT id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url, status, created_at, updated_at FROM employees` dengan filter opsional `WHERE full_name LIKE ?` (`%${search}%`), diurutkan `full_name ASC, id ASC` (memuat `draft` dan `published`).
- `getAdminEmployeeById(id)`: Kembalikan detail 1 karyawan; lempar error `404` (`'Karyawan tidak ditemukan'`) jika tidak ada.
- `createAdminEmployee(input)`: Jika `input.nickname` kosong, turunkan otomatis dari kata pertama `input.full_name` (`input.full_name.split(/\s+/)[0]`). Jalankan `INSERT INTO employees ...` dan kembalikan data baris yang baru dibuat (`201 Created`).
- `updateAdminEmployee(id, input)`: Cek eksistensi terlebih dahulu (`404` jika tidak ada), lalu `UPDATE employees SET ... WHERE id = ?` dan kembalikan data terbaru (`200 OK`).
- `deleteAdminEmployee(id)`: Ambil data karyawan (`404` jika tidak ada). Jika `photo_url` ada, hapus foto via `deletePhotoFromBlob(employee.photo_url)` (di Modul 5), lalu jalankan `DELETE FROM employees WHERE id = ?`.

#### 1.3 `server/src/controllers/admin.employee.controller.ts` & `server/src/routes/admin.employee.route.ts`
- `GET /admin/employees`
- `GET /admin/employees/:id`
- `POST /admin/employees`
- `PUT /admin/employees/:id`
- `DELETE /admin/employees/:id`
Semua rute dipasang `authenticate, authorizeAdmin`.

---

### MODUL 2: Memory Management (`/api/admin/memories`)

#### 2.1 `server/src/schemas/admin.memory.schema.ts`
```typescript
import { z } from 'zod';

export const adminMemoryIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID kenangan harus berupa angka' })
    .int('ID kenangan harus berupa bilangan bulat')
    .positive('ID kenangan harus lebih besar dari 0'),
});

export const adminMemoryBodySchema = z.object({
  title: z
    .string({ message: 'Judul kenangan wajib diisi' })
    .trim()
    .min(1, 'Judul kenangan wajib diisi')
    .max(200, 'Judul kenangan maksimal 200 karakter'),
  event_date: z
    .string({ message: 'Tanggal kejadian wajib diisi' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  story: z
    .string({ message: 'Cerita kenangan wajib diisi' })
    .trim()
    .min(1, 'Cerita kenangan wajib diisi'),
  status: z
    .enum(['draft', 'published'], {
      message: 'Status harus bernilai draft atau published',
    })
    .default('draft'),
  employee_ids: z
    .array(
      z.coerce
        .number({ message: 'ID karyawan harus berupa angka' })
        .int('ID karyawan harus berupa bilangan bulat')
        .positive('ID karyawan harus lebih besar dari 0')
    )
    .default([])
    .transform((ids) => Array.from(new Set(ids))),
});

export type AdminMemoryBodyInput = z.infer<typeof adminMemoryBodySchema>;
```

#### 2.2 `server/src/services/admin.memory.service.ts` (Wajib MySQL Transaction)
Pola wajib transaksi untuk `createAdminMemory` dan `updateAdminMemory`:
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();

  // 1. Validasi seluruh employee_ids ada di tabel employees
  if (input.employee_ids.length > 0) {
    const placeholders = input.employee_ids.map(() => '?').join(', ');
    const [empRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM employees WHERE id IN (${placeholders})`,
      input.employee_ids
    );
    if (empRows.length !== input.employee_ids.length) {
      throw new AdminServiceError(400, 'Terdapat ID karyawan yang tidak ditemukan');
    }
  }

  // 2. Insert atau Update tabel memories
  //    (Jika update: pastikan memory ada terlebih dahulu -> jika tidak lempar 404; hapus tag lama di memory_employees)
  // 3. Insert seluruh relasi baru ke memory_employees
  //    INSERT INTO memory_employees (memory_id, employee_id) VALUES ?
  //    (atau loop parameterized INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?))

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```
- `listAdminMemories()`: Mengembalikan seluruh `memories` (`draft` & `published`) terurut `event_date DESC, id DESC`, disertai `employee_ids` dan `employees` (`id`, `full_name`, `status`).
- `getAdminMemoryById(id)`: Mengembalikan detail 1 kenangan beserta `employee_ids` dan `employees` (`404` jika tidak ada).
- `deleteAdminMemory(id)`: Cek ada (`404` jika tidak ada), lalu `DELETE FROM memories WHERE id = ?` (tag di `memory_employees` terhapus otomatis via `ON DELETE CASCADE`).

---

### MODUL 3: Message Management (`/api/admin/messages`)

> **PERINGATAN:** Dilarang membuat route `PUT` atau `PATCH` untuk pesan. Hanya `GET`, `POST`, dan `DELETE`.

#### 3.1 `server/src/schemas/admin.message.schema.ts`
```typescript
import { z } from 'zod';

export const adminMessageIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID pesan harus berupa angka' })
    .int('ID pesan harus berupa bilangan bulat')
    .positive('ID pesan harus lebih besar dari 0'),
});

export const createAdminMessageSchema = z
  .object({
    sender_employee_id: z.coerce
      .number({ message: 'ID karyawan pengirim harus berupa angka' })
      .int('ID karyawan pengirim harus berupa bilangan bulat')
      .positive('ID karyawan pengirim wajib dipilih'),
    recipient_employee_id: z.coerce
      .number({ message: 'ID karyawan penerima harus berupa angka' })
      .int('ID karyawan penerima harus berupa bilangan bulat')
      .positive('ID karyawan penerima wajib dipilih'),
    message: z
      .string({ message: 'Isi pesan wajib diisi' })
      .trim()
      .min(1, 'Isi pesan wajib diisi'),
    impression: z
      .string()
      .trim()
      .max(300, 'Kesan singkat maksimal 300 karakter')
      .optional()
      .nullable()
      .transform((val) => (val === undefined || val === null || val === '' ? null : val)),
  })
  .refine((data) => data.sender_employee_id !== data.recipient_employee_id, {
    message: 'Karyawan pengirim dan penerima tidak boleh sama',
    path: ['recipient_employee_id'],
  });

export type CreateAdminMessageInput = z.infer<typeof createAdminMessageSchema>;
```

#### 3.2 `server/src/services/admin.message.service.ts`
- `listAdminMessages()`: Query `messages` dengan `INNER JOIN employees s` dan `INNER JOIN employees r` terurut `m.created_at DESC, m.id DESC` (menampilkan seluruh pesan termasuk jika karyawan pengirim/penerima masih `draft` untuk kebutuhan moderasi admin).
- `createAdminMessage(input)`:
  1. Validasi kedua karyawan (`sender_employee_id` dan `recipient_employee_id`) benar-benar ada di tabel `employees` (`SELECT id FROM employees WHERE id IN (?, ?)`). Jika kurang dari 2 baris ditemukan $\rightarrow$ lempar `400 Bad Request` (`'Karyawan pengirim atau penerima tidak ditemukan'`).
  2. Insert ke tabel `messages` dan kembalikan data pesan lengkap dengan `sender_name`, `recipient_name`, `sender_initials`, `recipient_initials` (`201 Created`). Pesan langsung aktif/published.
- `deleteAdminMessage(id)`: Cek pesan ada (`404` jika tidak ada), lalu `DELETE FROM messages WHERE id = ?`.

---

### MODUL 4: User Management (`/api/admin/users`)

#### 4.1 Pembaruan `server/src/schemas/auth.schema.ts`
Pertahankan `loginSchema` & `createUserSchema` (`name` min 5, `email` min 5, `password` min 6) yang sudah ada, lalu perbarui `updateUserSchema` dan tambahkan `userIdParamSchema`:
```typescript
export const userIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'ID user harus berupa angka' })
    .int('ID user harus berupa bilangan bulat')
    .positive('ID user harus lebih besar dari 0'),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, 'Nama minimal 5 karakter')
    .optional(),
  email: z
    .string()
    .trim()
    .min(5, 'Email minimal 5 karakter')
    .email('Format email tidak valid')
    .optional(),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .optional(),
  is_active: z.boolean().optional(),
  employee_id: z.coerce
    .number({ message: 'ID karyawan harus berupa angka' })
    .int('ID karyawan harus berupa bilangan bulat')
    .positive('ID karyawan harus lebih besar dari 0')
    .nullable()
    .optional(),
});
```

#### 4.2 `server/src/services/admin.user.service.ts`
- **Jangan pernah** menyeleksi atau mengembalikan `password_hash`.
- `listAdminUsers()`: `SELECT u.id, u.name, u.email, u.role, u.employee_id, u.is_active, u.created_at, u.updated_at, e.full_name AS employee_name FROM users u LEFT JOIN employees e ON e.id = u.employee_id ORDER BY u.id ASC`.
- `createAdminUser(input)`:
  1. Cek apakah `LOWER(email)` sudah ada $\rightarrow$ lempar **`409 Conflict`** (`'Email sudah terdaftar'`).
  2. Hash password dengan `await hashPassword(input.password)`.
  3. Insert dengan `role = 'user'` dan `employee_id = NULL` (abaikan jika frontend mencoba mengirim `role` atau `employee_id`).
- `updateAdminUser(targetId, currentAdminId, input)`:
  1. Ambil user target (`404` jika tidak ditemukan).
  2. Jika `targetId === currentAdminId` dan `input.is_active === false`, lempar **`400 Bad Request`** (`'Anda tidak dapat menonaktifkan akun admin Anda sendiri'`).
  3. **Proteksi Role:** Endpoint ini tidak menerima perubahan `role`; tolak atau abaikan perubahan role (admin tidak bisa diturunkan menjadi `user`, user tidak bisa dinaikkan menjadi `admin`). *Catatan:* Jika payload request menyertakan field `role` selain nilai yang sudah ada (mis. mencoba mengubah `role` admin menjadi `'user'`), tolak dengan **`400 Bad Request`** (`'Perubahan role tidak diizinkan melalui endpoint ini'`).
  4. Jika `input.email` diisi, cek apakah email sudah digunakan oleh user lain (`WHERE LOWER(email) = ? AND id <> ?`) $\rightarrow$ lempar **`409 Conflict`** (`'Email sudah terdaftar oleh akun lain'`).
  5. Jika `input.employee_id !== undefined`:
     - Jika `input.employee_id !== null`:
       - Cek karyawan ada di `employees` (`400 Bad Request`: `'Karyawan yang dipilih tidak ditemukan'`).
       - Cek apakah `employee_id` sudah tertaut ke user lain (`WHERE employee_id = ? AND id <> ?`) $\rightarrow$ lempar **`409 Conflict`** (`'Karyawan ini sudah ditautkan ke akun user lain'`).
  6. Jika `input.password` diisi, hash ulang dengan `hashPassword(input.password)`.
  7. Update ke database dan kembalikan profil user tanpa `password_hash`.
- `deleteAdminUser(targetId, currentAdminId)`:
  1. Jika `targetId === currentAdminId`, lempar **`400 Bad Request`** (`'Anda tidak dapat menghapus akun admin Anda sendiri'`).
  2. Cek user ada (`404` jika tidak ada), lalu hapus.

---

### MODUL 5: Photo Upload (`POST & DELETE /api/admin/employees/:id/photo`)

#### 5.1 `server/src/utils/blob.ts` (Magic Bytes Validation + Vercel Blob)
```typescript
import { del, put } from '@vercel/blob';
import crypto from 'crypto';
import { env } from '../config/env';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Memeriksa kesesuaian MIME type sekaligus magic bytes (file signature) buffer gambar.
 * Mencegah file teks/PDF/executable yang hanya diganti ekstensi atau header MIME-nya.
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredMimeType: string
): 'jpg' | 'png' | 'webp' | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(declaredMimeType)) {
    return null;
  }

  // JPEG: FF D8 FF
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // WebP: RIFF....WEBP
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (declaredMimeType === 'image/jpeg' && isJpeg) return 'jpg';
  if (declaredMimeType === 'image/png' && isPng) return 'png';
  if (declaredMimeType === 'image/webp' && isWebp) return 'webp';

  return null;
}

export async function uploadPhotoToBlob(
  employeeId: number,
  buffer: Buffer,
  extension: 'jpg' | 'png' | 'webp',
  contentType: string
): Promise<string> {
  const filename = `employees/${employeeId}-${crypto.randomUUID()}.${extension}`;

  if (!env.BLOB_READ_WRITE_TOKEN) {
    // Fallback deterministik untuk pengembangan/testing lokal tanpa token Vercel Blob
    return `https://mock-blob.local/${filename}`;
  }

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

export async function deletePhotoFromBlob(photoUrl: string | null): Promise<void> {
  if (!photoUrl || photoUrl.startsWith('https://mock-blob.local/')) {
    return;
  }
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return;
  }
  try {
    await del(photoUrl, { token: env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    console.error('[DeleteBlob Warning]', error);
  }
}
```

#### 5.2 `server/src/middleware/upload.middleware.ts`
```typescript
import type { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { sendError } from '../utils/response';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export function uploadEmployeePhotoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const handler = upload.single('photo');

  handler(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 400, 'Ukuran foto maksimal 2 MB');
        return;
      }
      sendError(res, 400, 'Gagal memproses file foto yang diunggah');
      return;
    }

    if (err) {
      sendError(res, 400, 'Format unggahan foto tidak valid');
      return;
    }

    next();
  });
}
```

#### 5.3 Alur Controller & Service Upload/Delete Foto
- **`POST /api/admin/employees/:id/photo`:**
  1. Validasi `:id` dengan Zod (`400`).
  2. Cek `req.file` tersedia (`400`: `'File foto wajib diunggah pada field photo'`).
  3. Validasi dengan `validateImageBuffer(req.file.buffer, req.file.mimetype)` (`400`: `'Format file tidak didukung atau signature file tidak valid. Gunakan JPG, PNG, atau WebP asli'`).
  4. Cek karyawan ada di database (`404` jika tidak ditemukan).
  5. Upload foto baru ke Blob (`uploadPhotoToBlob`).
  6. Update `employees.photo_url` di database. Jika update DB gagal, hapus blob baru yang barusan terunggah agar tidak menjadi orphan file, lalu lempar `500`.
  7. Jika karyawan sebelumnya memiliki `oldPhotoUrl`, panggil `deletePhotoFromBlob(oldPhotoUrl)` secara aman.
  8. Kembalikan `200 OK` dengan `{ photo_url: newUrl }`.
- **`DELETE /api/admin/employees/:id/photo`:**
  1. Validasi `:id`, cek karyawan ada (`404`).
  2. Jika `employee.photo_url` ada, hapus dari Blob (`deletePhotoFromBlob`), lalu set `photo_url = NULL` di DB.
  3. Kembalikan `200 OK` dengan `{ photo_url: null }`.

---

## Panduan Pengujian & 20 Skenario Test Lengkap (`TC-ADM-01` s.d. `TC-ADM-20`)

### Aturan Wajib Sebelum Setiap Skenario
Jalankan pembersihan seluruh 5 tabel sebelum **setiap** skenario uji agar kondisi selalu konsisten:
```sql
DELETE FROM messages;
DELETE FROM memory_employees;
DELETE FROM memories;
DELETE FROM users;
DELETE FROM employees;
```

### Skenario Modul 1 — Employees
1. **`TC-ADM-01` — Admin Berhasil Menambah Employee (`POST /api/admin/employees` -> `201 Created`)**
   - Request: `{"full_name":"Andi Budi","nickname":"Andi","hometown":"Bandung","hobby":"","status":"draft"}`
   - Expected: `201 Created`, `hometown: "Bandung"`, `hobby: null` (string kosong dinormalisasi ke `NULL`), `status: "draft"`, tanpa data password/akun.
2. **`TC-ADM-02` — Admin Berhasil Mengedit Employee & Mengubah Status `draft` $\leftrightarrow$ `published` (`PUT /api/admin/employees/:id` -> `200 OK`)**
   - Request: `{"full_name":"Andi Budi Santoso","nickname":"Andi","status":"published"}`
   - Expected: `200 OK`, `status: "published"`, kemudian terverifikasi tampil di `GET /api/employees`.
3. **`TC-ADM-03` — Admin Berhasil Mengambil Daftar & Detail Draft (`GET /api/admin/employees` & `/:id` -> `200 OK`)**
   - Expected: Karyawan `draft` dan `published` keduanya muncul pada endpoint admin, mendukung `?search=`.
4. **`TC-ADM-04` — Admin Berhasil Menghapus Employee (`DELETE /api/admin/employees/:id` -> `200 OK`)**
   - Setup: Employee punya message, tag memory, & user tertaut (`employee_id`).
   - Expected: `200 OK`, pesan & tag terhapus otomatis (`CASCADE`), cerita `memories` utuh, akun `users` tetap ada dengan `employee_id = null`.

### Skenario Modul 2 — Memories
5. **`TC-ADM-05` — Admin Berhasil Menambah Memory Beserta Employee Tags dalam Transaksi (`POST /api/admin/memories` -> `201 Created`)**
   - Request Positif: `{"title":"Outing Puncak","event_date":"2022-08-17","story":"Seru!","status":"published","employee_ids":[1,2]}` $\rightarrow$ `201 Created` dan relasi tersimpan di `memory_employees`.
   - Request Negatif (Rollback): `employee_ids: [1, 999]` $\rightarrow$ `400 Bad Request` dan **0 baris** baru tersimpan di `memories` maupun `memory_employees`.
6. **`TC-ADM-06` — Admin Berhasil Mengedit Memory Beserta Tags (`PUT /api/admin/memories/:id` -> `200 OK`)**
   - Request: Ubah `title`, `status: "draft"`, `employee_ids: [2]` $\rightarrow$ `200 OK`, tag `[1]` terganti menjadi `[2]` secara atomik.
7. **`TC-ADM-07` — Admin Berhasil Menghapus Memory (`DELETE /api/admin/memories/:id` -> `200 OK`)**
   - Expected: `200 OK`, baris `memories` dan `memory_employees` terhapus, data `employees` tetap utuh.

### Skenario Modul 3 — Messages
8. **`TC-ADM-08` — Admin Berhasil Menambah Pesan (`POST /api/admin/messages` -> `201 Created`)**
   - Request Positif: `{"sender_employee_id":1,"recipient_employee_id":2,"message":"Terima kasih!","impression":null}` $\rightarrow$ `201 Created`, langsung tampil di `GET /api/messages` (jika keduanya published) dan `GET /api/admin/messages`.
   - Request Negatif (`sender === recipient`): `sender_employee_id: 1, recipient_employee_id: 1` $\rightarrow$ `400 Bad Request`.
9. **`TC-ADM-09` — Admin Berhasil Menghapus Pesan (`DELETE /api/admin/messages/:id` -> `200 OK`)**
   - Expected: `200 OK`, pesan hilang dari `GET /api/admin/messages`.
10. **`TC-ADM-10` — Memastikan TIDAK ADA Endpoint Edit Pesan (`PUT`/`PATCH` -> `404 Not Found`)**
    - Request: `PUT /api/admin/messages/1` dan `PATCH /api/admin/messages/1` dengan token admin.
    - Expected: Keduanya ditolak dengan `404 Not Found` (`"Endpoint tidak ditemukan"`).

### Skenario Modul 4 — Users
11. **`TC-ADM-11` — Admin Berhasil Membuat Akun User (`POST /api/admin/users` -> `201 Created`)**
    - Request: `{"name":"Citra Dewi","email":"citra@wargahalim.id","password":"password123","role":"admin"}`
    - Expected: `201 Created`, `role` tetap terkunci `"user"`, `employee_id: null`, `password_hash` di DB berupa hash bcrypt, tidak ada `password_hash` di JSON response, dan akun bisa login.
12. **`TC-ADM-12` — Email Duplikat Ditolak (`POST` & `PUT /api/admin/users` -> `409 Conflict`)**
    - Expected: `409 Conflict` dengan pesan duplikasi email.
13. **`TC-ADM-13` — Penautan `employee_id` di `PUT` & Penolakan Penautan Ganda (`PUT /api/admin/users/:id` -> `200` / `409 Conflict`)**
    - Setup: Employee 1 sudah tertaut ke User A (`id = 2`). Admin mencoba menautkan `employee_id: 1` ke User B (`id = 3`).
    - Expected: Ditolak **`409 Conflict`** (`"Karyawan ini sudah ditautkan ke akun user lain"`). Juga uji admin mencoba mengirim `role: "user"` untuk akun adminnya sendiri $\rightarrow$ ditolak `400 Bad Request`.
14. **`TC-ADM-14` — Admin Berhasil Menonaktifkan User & Mengubah Password (`PUT /api/admin/users/:id` -> `200 OK`)**
    - Expected: User tidak bisa login setelah `is_active: false` (`403`), password baru ter-hash bcrypt dan berfungsi saat diaktifkan lagi. Admin dilarang menonaktifkan dirinya sendiri (`400`).
15. **`TC-ADM-15` — Admin Berhasil Menghapus User (`DELETE /api/admin/users/:id` -> `200 OK`)**
    - Expected: `200 OK` untuk user lain; `400 Bad Request` bila admin mencoba menghapus dirinya sendiri.

### Skenario Lintas Modul — Proteksi Role
16. **`TC-ADM-16` — User (`role = 'user'`) Ditolak Mengakses SELURUH Endpoint Admin (`403 Forbidden`)**
    - Uji setiap route `/api/admin/employees`, `/api/admin/memories`, `/api/admin/messages`, `/api/admin/users`, dan `/api/admin/employees/1/photo` dengan token `user` biasa.
    - Expected: Seluruhnya membalas **`403 Forbidden`**.

### Skenario Modul 5 — Photo Upload
17. **`TC-ADM-17` — Upload Foto Valid (JPG/PNG/WebP <= 2 MB) & Ganti/Hapus Foto (`200 OK`)**
    - Request: `POST /api/admin/employees/1/photo` dengan buffer PNG valid (`89 50 4E 47 0D 0A 1A 0A ...`).
    - Expected: `200 OK`, `photo_url` tersimpan di DB; upload ulang mengganti URL & memanggil hapus blob lama; `DELETE /api/admin/employees/1/photo` mengatur `photo_url: null`.
18. **`TC-ADM-18` — File Lebih Dari 2 MB Ditolak (`400 Bad Request`)**
    - Request: Buffer gambar > 2 MB (`2 * 1024 * 1024 + 100` bytes).
    - Expected: `400 Bad Request` (`"Ukuran foto maksimal 2 MB"`).
19. **`TC-ADM-19` — File Format Tidak Didukung (PDF/TXT) Ditolak (`400 Bad Request`)**
    - Request: File `application/pdf` atau `text/plain`.
    - Expected: `400 Bad Request`.
20. **`TC-ADM-20` — File dengan MIME Palsu (`image/jpeg` berisi teks/PDF) Ditolak (`400 Bad Request`)**
    - Request: File dengan header MIME `image/jpeg` dan nama `palsu.jpg`, tetapi isi buffer adalah teks ASCII (`"bukan gambar asli"`).
    - Expected: Ditolak oleh pemeriksaan **magic bytes** di server dengan **`400 Bad Request`**.

---

## Laporan Akhir Wajib Setelah Implementasi

Setelah seluruh 5 modul selesai dan diuji, laporan akhir wajib mencantumkan:
1. Daftar lengkap seluruh file yang dibuat atau diubah.
2. Daftar lengkap endpoint beserta proteksi middleware masing-masing.
3. Contoh request & response setiap modul.
4. Hasil eksekusi seluruh 20 skenario pengujian (`TC-ADM-01` s.d. `TC-ADM-20`), `typecheck`, dan `build`.

