# ISSUE #06 — Code Review & Hardening Backend Warga Halim

- **Proyek:** Warga Halim (`server/`, Express + TypeScript + MySQL2 + Zod)
- **Target Pembaca:** Junior Developer & AI Coding Model (hemat biaya) — ikuti langkah APA ADANYA, jangan berimprovisasi.
- **Status:** `Open`
- **Hasil Review:** Backend (Public API, Auth, Admin API) sudah berjalan dan 20 skenario admin lulus, namun ditemukan **12 temuan** (3 High, 5 Medium, 4 Low) yang harus diperbaiki + **belum ada automated test di repository**.
- **Dokumen Wajib Dibaca Dulu:** `docs/PRD.md` (sumber requirement utama), `docs/API_DOCUMENTATION.md`, `docs/DATABASE_DESIGN.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/TEST_PLAN.md`.

---

## 0. Keputusan Konflik Aturan (SUDAH DIJAWAB USER — jangan ditanyakan ulang)

| Konflik | Sumber A | Sumber B | **Keputusan** |
|---|---|---|---|
| Registrasi publik | Task 3 lama: `POST /api/auth/register` | PRD §F-auth & `TEST_PLAN TC-AUTH-09`: **tidak ada** register, akun dibuat admin | **Ikuti PRD. JANGAN buat endpoint register.** Docs tidak diubah. |
| Panjang password | Task 3 lama: min 8 | PRD & docs: min **6** | **Min 6** (tidak diubah). |
| Rate limit | Task 3 lama: login + register | PRD: hanya login (5/menit) | Hanya login. |

> Jika menemukan konflik BARU antara kode dan docs: **berhenti, tanya user**, lalu perbaiki docs. Jangan menebak.

---

## 1. Temuan Review (urut prioritas)

### HIGH
| ID | File | Masalah | Perbaikan |
|---|---|---|---|
| H1 | `server/src/schemas/auth.schema.ts` | `createUserSchema` memakai `employee_id: z.any()` dan menerima `role` → melanggar aturan **dilarang `any`** & mengundang mass-assignment. | Hapus `role` & `employee_id` dari `createUserSchema`. Zod `z.object` otomatis membuang key tak dikenal. Di `updateUserSchema` ubah `role: z.string().optional()` menjadi `z.enum(['admin','user']).optional()` (tetap ditolak 400 oleh service bila beda dari role saat ini). |
| H2 | `server/src/app.ts` | Tidak ada `app.set('trust proxy', 1)`. Di Vercel semua request tampak satu IP → rate limiter login memblokir semua orang (atau mudah dibypass lewat header). | Tambah `app.set('trust proxy', 1)` hanya saat `env.NODE_ENV === 'production'`. |
| H3 | `server/src/middleware/error.middleware.ts` | JSON body rusak (`{bad`) dan body > 1 MB menghasilkan **500**, seharusnya **400/413**. Error `ER_DUP_ENTRY` (race `employee_id`/email unik) juga jadi 500. | Di `globalErrorHandler`: jika `err` punya `type === 'entity.parse.failed'` → 400 `Format JSON tidak valid`; `entity.too.large` → 413; jika `code === 'ER_DUP_ENTRY'` → 409 `Data sudah digunakan`. Jangan bocorkan pesan SQL. |

### MEDIUM
| ID | File | Masalah | Perbaikan |
|---|---|---|---|
| M1 | `middleware/authenticate.ts` | `jwt.verify` tanpa pembatasan algoritma. | `jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })` dan pastikan `jwt.sign` di `auth.service.ts` memakai `algorithm: 'HS256'`. |
| M2 | `schemas/admin.memory.schema.ts` | `event_date` hanya regex → `2022-13-45` lolos ke DB (error 500). | Tambah `.refine` yang memvalidasi tanggal nyata: `const d = new Date(v + 'T00:00:00Z'); !isNaN(d.getTime()) && d.toISOString().slice(0,10) === v`. Pesan: `Tanggal tidak valid`. |
| M3 | `services/admin.employee.service.ts` → `deleteAdminEmployee` | Foto Blob dihapus **sebelum** `DELETE` di DB; jika DB gagal foto hilang tapi data masih ada. | Urutan baru: `DELETE` DB dulu → baru `deletePhotoFromBlob` (best-effort, error hanya di-log). |
| M4 | `services/admin.employee.service.ts` → `deleteEmployeePhoto` | Sama seperti M3 (hapus blob dulu lalu set NULL). | `UPDATE photo_url = NULL` dulu → baru hapus blob. |
| M5 | **Repository** | Tidak ada automated test; test-runner dulu dihapus setelah dijalankan → regresi tidak terdeteksi. | Lihat §3 (Vitest + Supertest, wajib masuk Git). |

### LOW
| ID | File | Masalah | Perbaikan |
|---|---|---|---|
| L1 | `db/seed.sql` | Hash bcrypt di seed berupa placeholder (tidak valid) → seed admin tidak bisa login. | Buat `server/src/db/seed-admin.ts` (script `npm run seed:admin`) yang membaca `ADMIN_EMAIL` & `ADMIN_PASSWORD` dari `.env`, hash dengan `hashPassword`, `INSERT ... ON DUPLICATE KEY UPDATE`. Tambahkan dua variabel itu ke `.env.example` (nilai kosong). Hapus hash palsu dari `seed.sql` (user contoh dibuat via script/admin). |
| L2 | `controllers/admin.*.controller.ts` | Blok `try/catch` + `instanceof AdminServiceError` diulang di ±20 handler. | Buat helper `utils/handleServiceError.ts`: `(error, res, next)`; pakai di semua controller. Perilaku HTTP tidak boleh berubah. |
| L3 | `routes/admin.*.route.ts` | `authenticate, authorizeAdmin` dipasang di tiap router. | Pasang sekali di `routes/index.ts`: `router.use('/admin', authenticate, authorizeAdmin)` lalu hapus `router.use(...)` di 4 file route admin. |
| L4 | `middleware/auth.middleware.ts` | File re-export lama (3 baris) membingungkan; dua nama `authenticate`. | Ubah import di `routes/employee.route.ts`, `memory.route.ts`, `message.route.ts` ke `../middleware/authenticate`, lalu hapus file lama. |

---

## 2. Aturan Emas (WAJIB)
1. Dilarang `any`, dilarang `// @ts-ignore`. TypeScript `strict` tetap aktif.
2. Lapisan: `routes → controllers → services → schemas`. Controller tanpa SQL; service tanpa `req/res`.
3. Semua SQL parameterized (`?`). Response selalu `{ success, data, message }`.
4. **Jangan** mengubah kontrak response/endpoint yang sudah ada kecuali tertulis di atas.
5. **Jangan** commit `.env`, token, atau file `prompt.txt`. Cek `git status` sebelum `git add`. Gunakan `git add <file>` eksplisit, bukan `git add .` tanpa melihat statusnya.
6. Kerjakan **satu temuan per commit** (pesan: `fix(<scope>): <ID> <ringkas>`), branch `fix/code-review-hardening` dari `main`.
7. Setelah tiap temuan jalankan: `npm --prefix server run typecheck` lalu tes terkait.

---

## 3. Setup Automated Test (Temuan M5)

1. Install (butuh network): `npm --prefix server install -D vitest supertest @types/supertest`.
2. Tambah script `server/package.json`: `"test": "vitest run --no-file-parallelism"`.
3. Buat `server/vitest.config.ts` (environment `node`, `setupFiles: ['tests/setup.ts']`, `testTimeout: 20000`).
4. Test memakai database **terpisah**: buat DB `warga_halim_test` dan isi `server/.env.test` (sudah ter-ignore oleh `.env.*`). Jangan pernah menjalankan test ke DB utama.
5. `server/tests/setup.ts` wajib: set `process.env.NODE_ENV='test'`, dan menyediakan helper `resetDb()` (urutan: `messages`, `memory_employees`, `memories`, `users`, `employees`), `seedAdmin()`, `seedUser()`, `seedEmployee()`, `loginAs()`.
6. **Aturan konsistensi:** panggil `await resetDb()` di `beforeEach` pada SETIAP file test.
7. Struktur: `server/tests/{health,employees,memories,messages,auth,admin.employees,admin.memories,admin.messages,admin.users,admin.photo,hardening}.test.ts`. Gunakan `request(app)` dari `src/app.ts` (tidak perlu listen port).
8. Setiap test menulis contoh request & response ke ringkasan (gunakan `console.info(JSON.stringify({ req, res }, null, 2))` di test inti) agar bisa disalin ke laporan.

---

## 4. Skenario Test Lengkap per API

> Format: **ID — skenario → status yang diharapkan**. Semua diawali `resetDb()`.

### 4.1 Public (butuh token user/admin)
- `PUB-01` GET `/api/health` → 200.
- `PUB-02` GET `/api/employees` tanpa token → 401; token valid → 200 hanya `published`, urut nama.
- `PUB-03` `?search=` cocok nama/nickname → hasil terfilter; `?search=` > 100 karakter → 400; tak cocok → 200 `[]`.
- `PUB-04` GET `/api/memories` hanya `published`, urut `event_date DESC`.
- `PUB-05` GET `/api/memories/:id` published → 200 + `employees` hanya yang published; draft → 404; `abc`/`0`/`-1` → 400; id tak ada → 404.
- `PUB-06` GET `/api/messages` hanya jika pengirim & penerima `published`; tanpa token → 401.
- `PUB-07` `POST/PUT/PATCH/DELETE /api/messages` → 404 (tidak ada endpoint tulis user).
- `PUB-08` Rute tak dikenal → 404 `Endpoint tidak ditemukan`.

### 4.2 Auth
- `AUTH-01` login benar (admin & user) → 200 `token,id,name,email,role,employeeId`; tanpa `password_hash`.
- `AUTH-02` password salah & email tak terdaftar → 401 dengan **pesan identik**.
- `AUTH-03` akun nonaktif → 403.
- `AUTH-04` validasi: email format salah / <5, password <6 / kosong / body kosong → 400.
- `AUTH-05` percobaan ke-6 dalam 1 menit → 429 (buat limiter baru dengan `skipInTest:false` di test khusus).
- `AUTH-06` `GET /auth/me` tanpa token → 401; token valid → 200 + `employeeId,isActive`; token acak → 401; token kedaluwarsa (sign `expiresIn:'-1s'`) → 401.
- `AUTH-07` user dinonaktifkan setelah dapat token → request berikutnya 403.
- `AUTH-08` role diubah di DB setelah token terbit → middleware memakai role terbaru.
- `AUTH-09` `POST /api/auth/register` → **404** (sesuai PRD).
- `AUTH-10` token dengan `alg: none` / secret salah → 401 (M1).

### 4.3 Admin Employees (`/api/admin/employees`)
- `ADE-01` POST valid → 201; `hobby:""` → `null`; nickname kosong → kata pertama nama.
- `ADE-02` POST `full_name` kosong/hilang / >150 → 400; `status:"x"` → 400.
- `ADE-03` GET list memuat draft+published; `?search=` bekerja; kosong → `[]`.
- `ADE-04` GET `:id` ada → 200; tak ada → 404; `abc` → 400.
- `ADE-05` PUT valid (draft→published) → 200 & muncul di `/api/employees`; id tak ada → 404; body invalid → 400.
- `ADE-06` DELETE → 200; pesan & tag ikut terhapus, memory utuh, user tertaut `employee_id=NULL`; id tak ada → 404.
- `ADE-07` tanpa token → 401; token user → 403 (setiap method).

### 4.4 Admin Memories
- `ADM-01` POST + `employee_ids:[1,2]` → 201, tag tersimpan.
- `ADM-02` `employee_ids` berisi id tak ada → 400 & **0 baris** baru di `memories` dan `memory_employees` (rollback).
- `ADM-03` `employee_ids` duplikat `[1,1]` → disimpan 1 kali.
- `ADM-04` judul kosong, story kosong, tanggal `2022-13-45`/`22-1-1` → 400 (M2).
- `ADM-05` PUT mengganti tag `[1]→[2]` atomik; PUT dengan id tak valid → 400 dan tag lama **tidak berubah**; id memory tak ada → 404.
- `ADM-06` DELETE → 200, tag terhapus, employee utuh; tak ada → 404.
- `ADM-07` GET list/detail memuat draft; `employees` terisi; 404 bila tak ada.
- `ADM-08` 401 tanpa token, 403 untuk user.

### 4.5 Admin Messages
- `ADG-01` POST valid → 201, `impression` opsional (`""`→`null`), muncul di `/api/messages` jika keduanya published.
- `ADG-02` sender == recipient → 400; sender/recipient tak ada → 400; message kosong → 400; impression >300 → 400.
- `ADG-03` GET list termasuk karyawan draft.
- `ADG-04` DELETE → 200; tak ada → 404.
- `ADG-05` `PUT`/`PATCH /api/admin/messages/:id` → 404.
- `ADG-06` 401 / 403.

### 4.6 Admin Users
- `ADU-01` POST valid → 201, `role:"user"` walau body kirim `role:"admin"`, `employee_id:null` walau body kirim angka, hash di DB diawali `$2`, tak ada `password_hash` di response, bisa login (H1).
- `ADU-02` email duplikat (beda huruf besar/kecil) → 409; name <5, email invalid, password <6 → 400.
- `ADU-03` PUT tautkan `employee_id` → 200; karyawan tak ada → 400; sudah dipakai user lain → 409; `null` melepas tautan.
- `ADU-04` PUT ganti email ke milik user lain → 409; ganti password → login password lama gagal, baru berhasil.
- `ADU-05` PUT `is_active:false` → user tak bisa login (403) & token lamanya ditolak; admin menonaktifkan diri sendiri → 400.
- `ADU-06` PUT `role` berbeda dari role saat ini → 400; `role:"superadmin"` → 400 (H1); user tak ada → 404.
- `ADU-07` DELETE user lain → 200; diri sendiri → 400; tak ada → 404.
- `ADU-08` GET list tidak memuat `password_hash`; 401 / 403.

### 4.7 Photo Upload
- `ADP-01` PNG/JPEG/WebP valid ≤2 MB → 200 `photo_url`; unggah ulang → URL berganti; DELETE → `photo_url:null`.
- `ADP-02` >2 MB → 400 `Ukuran foto maksimal 2 MB`.
- `ADP-03` PDF/TXT → 400. `ADP-04` MIME `image/jpeg` berisi teks → 400 (magic bytes). `ADP-05` field bukan `photo` / tanpa file → 400.
- `ADP-06` employee tak ada → 404. `ADP-07` 401 / 403.
- `ADP-08` (M3/M4) mock `deletePhotoFromBlob` melempar error → DELETE employee tetap 200 dan baris terhapus.

### 4.8 Hardening
- `HRD-01` body JSON rusak → 400 (H3). `HRD-02` body >1 MB → 413.
- `HRD-03` `ER_DUP_ENTRY` simulasi (dua PUT paralel tautkan employee sama) → salah satu 409, bukan 500.
- `HRD-04` response error tidak pernah memuat kata `SQL`, `ER_`, atau stack trace.

---

## 5. Keamanan Git (cek sebelum PR)
- `git ls-files | Select-String "\.env"` → hanya `.env.example` yang boleh muncul.
- `git grep -nEi "(password|secret|token)\s*=\s*['\"][^'\"]{6,}"` → tidak ada nilai asli.
- `.gitignore` sudah mencakup `.env*`, `prompt.txt`, `dist/`, `node_modules/`.

---

## 6. Checklist
- [x] H1 `any`/mass-assignment auth schema
- [x] H2 trust proxy
- [x] H3 error handler (400/413/409)
- [x] M1 JWT algoritma
- [x] M2 validasi tanggal nyata
- [x] M3 & M4 urutan hapus blob vs DB
- [x] M5 Vitest + Supertest + `server/.env.test`
- [x] L1 seed admin via script
- [x] L2–L4 refactor kecil (tanpa ubah perilaku)
- [x] Seluruh skenario §4 lulus (`npm --prefix server test`)
- [x] `typecheck` & `build` 0 error
- [x] Cek keamanan Git §5, lalu PR ke `main`

## 7. Laporan Akhir Wajib
1. Daftar file dibuat/diubah. 2. Daftar endpoint + middleware. 3. Contoh request & response tiap endpoint (dari output test). 4. Hasil `npm test` (jumlah lulus/gagal per file), `typecheck`, `build`. 5. Konflik aturan baru (jika ada) dan docs yang diperbarui.

