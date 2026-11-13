# ISSUE #08 — Fitur User Registration (Backend `POST /api/auth/register` & Frontend `/register`)

> **Ditujukan untuk:** Junior Fullstack Developer & AI Coding Model  
> **Sumber Requirement Utama:** `docs/PRD.md` *(telah diperbarui untuk mendukung User Registration)*  
> **Referensi Pendukung:** `docs/DEVELOPMENT_PLAN.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DOCUMENTATION.md`, `docs/TEST_PLAN.md`

---

## 0. Ringkasan Perubahan PRD & Aturan Wajib Sebelum Coding

1. **Sinkronisasi Dokumentasi (`docs/`):**
   - Seluruh dokumen di folder `docs/` (`PRD.md`, `DEVELOPMENT_PLAN.md`, `DATABASE_DESIGN.md`, `API_DOCUMENTATION.md`, dan `TEST_PLAN.md`) telah diperbarui dan disinkronkan untuk menambahkan fitur **User Registration**.
   - Konfigurasi maupun deployment ke **Vercel dihiraukan terlebih dahulu** — fokus 100% pada pengembangan dan pengujian di environment lokal (`client` + `server` + MySQL lokal).

2. **Alur Bisnis Resmi User Registration (Wajib Dipatuhi):**
   ```text
   Pengunjung buka /register
        │
        ▼ (Isi Nama, Email, Password, Konfirmasi Password -> POST /api/auth/register)
   Akun tersimpan di tabel `users`:
     - role        = 'user'       (DIKUNCI DI SERVER)
     - employee_id = NULL         (penautan karyawan tetap oleh Admin)
     - is_active   = 0 (false)    (MENUNGGU PERSETUJUAN ADMIN)
     - TIDAK mengembalikan token JWT maupun password_hash
        │
        ▼
   Jika user langsung mencoba POST /api/auth/login -> DITOLAK 403 Forbidden
        │
        ▼
   Admin mengaktifkan akun melalui PUT /api/admin/users/:id { "is_active": true }
        │
        ▼
   User berhasil POST /api/auth/login -> 200 OK + Token JWT
   ```

3. **Larangan Keras (Hard Constraints):**
   - **DILARANG** langsung mengaktifkan user hasil registrasi (`is_active` wajib `0`/`false`) atau mengembalikan token JWT di response `/api/auth/register`.
   - **DILARANG** mempercayai field `role`, `is_active`, atau `employee_id` dari `req.body` pada `/api/auth/register`.
   - **DILARANG** mengembalikan `password_hash` di response API mana pun.
   - **DILARANG** menggunakan `React Context` (`createContext`, `useContext`) atau `useReducer` di `client/` (wajib tetap memakai Zustand `authStore`).
   - **DILARANG** menggunakan tipe `any` di TypeScript (`strict: true`).
   - **DILARANG** meng-upload `.env`, password produksi, atau kredensial apa pun ke Git.
   - **JANGAN** mengubah perilaku `POST /api/admin/users` (akun yang dibuat Admin secara default tetap `is_active = true`, kecuali Admin mengirim `is_active: false`).

---

## 1. Struktur File yang Disentuh (Tetap Rapi & Profesional)

Aplikasi ini menjaga struktur arsitektur modular yang ringkas tanpa menambah folder yang tidak perlu:

```text
server/
├── src/
│   ├── schemas/auth.schema.ts          <-- [UPDATE] tambah registerSchema & RegisterInput
│   ├── middleware/rateLimiter.ts       <-- [UPDATE] tambah createRegisterRateLimiter & registerRateLimiter
│   ├── services/auth.service.ts        <-- [UPDATE] tambah registerUser & perjelas pesan 403 akun belum aktif
│   ├── controllers/auth.controller.ts  <-- [UPDATE] tambah handler register
│   └── routes/auth.route.ts            <-- [UPDATE] tambah POST /auth/register (pakai registerRateLimiter)
└── tests/
    └── auth.test.ts                    <-- [UPDATE] update AUTH-09 & tambah skenario lengkap REG-01 s.d. REG-07

client/
└── src/
    ├── types/auth.ts                   <-- [UPDATE] tambah RegisterRequest & RegisterResponseData
    ├── schemas/auth.schema.ts          <-- [UPDATE] tambah registerSchema (dengan confirmPassword)
    ├── pages/
    │   ├── RegisterPage.tsx            <-- [BARU] halaman publik /register (Form + state sukses menunggu admin)
    │   ├── LoginPage.tsx               <-- [UPDATE] tambah tautan "Daftar akun di sini" -> /register
    │   └── HomePage.tsx                <-- [UPDATE] tambah tombol/tautan sekunder ke /register untuk pengunjung
    ├── components/layout/
    │   └── Header.tsx                  <-- [UPDATE] tambah tautan "Daftar" untuk pengunjung belum login
    ├── App.tsx                         <-- [UPDATE] daftarkan <Route path="/register" element={<RegisterPage />} />
    └── tests/
        ├── registerPage.test.tsx       <-- [BARU] test validasi Zod, submit sukses, error 409, & error jaringan
        └── routeGuards.test.tsx        <-- [UPDATE] cek akses /register saat guest vs sudah login
```

---

## 2. Tahap A — Implementasi Backend (`server/`)

### 2.1 `server/src/schemas/auth.schema.ts`
Tambahkan `registerSchema` (ikuti batas kolom di `docs/DATABASE_DESIGN.md` & validasi di `docs/API_DOCUMENTATION.md`):
```ts
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, 'Nama minimal 5 karakter')
    .max(150, 'Nama maksimal 150 karakter'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, 'Email minimal 5 karakter')
    .max(255, 'Email maksimal 255 karakter')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```
*(Catatan: Validasi `confirmPassword` dilakukan di frontend; backend cukup memvalidasi `name`, `email`, dan `password` sesuai standar REST API).*

### 2.2 `server/src/middleware/rateLimiter.ts`
Buat helper `createRegisterRateLimiter(options?: RateLimiterOptions)` menggunakan pola yang sama persis dengan `createLoginRateLimiter` agar unit/integration test rate limiter mudah diuji tanpa memengaruhi test lainnya:
- `windowMs`: `60 * 1000` (1 menit)
- `max`: `5` (maksimal 5 percobaan registrasi per menit per IP)
- `skip`: `() => skipInTest && process.env.NODE_ENV === 'test'`
- Handler HTTP `429`: `'Terlalu banyak percobaan registrasi. Silakan coba lagi setelah 1 menit'`
- Ekspor juga: `export const registerRateLimiter = createRegisterRateLimiter({ skipInTest: true });`

### 2.3 `server/src/services/auth.service.ts`
Implementasikan `registerUser(input: RegisterInput): Promise<AuthUserProfile>`:
1. Normalisasi email: `const normalizedEmail = input.email.trim().toLowerCase();`
2. Cek apakah email sudah ada (parameterized query):
   ```sql
   SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1
   ```
   Jika sudah ada (`rows.length > 0`), lempar `new AuthServiceError(409, 'Email sudah digunakan')`.
3. Hash password menggunakan `hashPassword(input.password)` dari `../utils/crypt` (menggunakan `bcryptjs` salt rounds 10).
4. Simpan user baru (parameterized query):
   ```sql
   INSERT INTO users (name, email, password_hash, role, employee_id, is_active)
   VALUES (?, ?, ?, 'user', NULL, 0)
   ```
   - `role` selalu `'user'`
   - `employee_id` selalu `NULL`
   - `is_active` selalu `0` (`false`)
5. Ambil baris user yang baru dibuat (atau susun objek `AuthUserProfile` tanpa `password_hash`):
   ```sql
   SELECT id, name, email, role, employee_id, is_active
   FROM users
   WHERE id = ?
   LIMIT 1
   ```
6. Kembalikan `mapUserProfile(row)` (`id`, `name`, `email`, `role: 'user'`, `employee_id: null`, `employeeId: null`, `is_active: false`, `isActive: false`).
7. **Pesan Login untuk Akun Nonaktif (`loginUser`):**
   Pastikan pesan pada `if (user.is_active !== 1)` ramah untuk kedua kasus (baru daftar atau dinonaktifkan), misalnya:
   `'Akun Anda belum aktif atau telah dinonaktifkan. Silakan hubungi admin'`
   *(Periksa seluruh test existing di `auth.test.ts` & `admin.users.test.ts` agar perubahan pesan ini tidak mematahkan assertion status `403` / string existing — saat ini `AUTH-03` dan `ADU-05` hanya memeriksa `status === 403`, tetap verifikasi sebelum mengubah).*

### 2.4 `server/src/controllers/auth.controller.ts`
Tambahkan `export async function register(req: Request, res: Response): Promise<void>`:
1. Validasi `req.body` dengan `registerSchema.safeParse(req.body)`.
2. Jika gagal -> kembalikan `400 Bad Request` dengan `fieldErrors` pada `data: { errors: fieldErrors }` (sama persis seperti pola controller `login`).
3. Panggil `await registerUser(parseResult.data)`.
4. Jika berhasil -> kembalikan `201 Created`:
   ```ts
   sendSuccess(
     res,
     201,
     createdUser,
     'Registrasi berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan untuk masuk.'
   );
   ```
5. Tangani error:
   - Jika `error instanceof AuthServiceError` -> `sendError(res, error.statusCode, error.message)`.
   - Jika MySQL duplicate key (`ER_DUP_ENTRY`) lolos race condition -> biarkan terlempar ke global `errorHandler` (yang memetakan ke `409`) atau tangani eksplisit sebagai `409 Conflict` (`'Email sudah digunakan'`).
   - Selain itu -> `500 Internal Server Error` tanpa membocorkan SQL/stack trace ke client.

### 2.5 `server/src/routes/auth.route.ts`
Daftarkan endpoint publik baru sebelum `/auth/login`:
```ts
router.post('/auth/register', registerRateLimiter, register);
router.post('/auth/login', loginRateLimiter, login);
router.get('/auth/me', authenticate, me);
```

---

## 3. Tahap B — Implementasi Frontend (`client/`)

### 3.1 `client/src/types/auth.ts`
Tambahkan tipe request & response registrasi:
```ts
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponseData {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: boolean;
}
```

### 3.2 `client/src/schemas/auth.schema.ts`
Tambahkan `registerSchema` dengan validasi konfirmasi password menggunakan `.refine(...)`:
```ts
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(5, 'Nama minimal 5 karakter')
      .max(150, 'Nama maksimal 150 karakter'),
    email: z
      .string()
      .trim()
      .min(5, 'Email minimal 5 karakter')
      .max(255, 'Email maksimal 255 karakter')
      .email('Format email tidak valid'),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter')
      .max(100, 'Password maksimal 100 karakter'),
    confirmPassword: z
      .string()
      .min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

### 3.3 `client/src/pages/RegisterPage.tsx`
Buat halaman registrasi mengikuti estetika & aturan UI Warga Halim (`White #FFFFFF`, `Sky Blue #8ECDF2`, aksen tombol utama `Scarlet #E32636`, judul serif, isi >= `16px`, responsif mulai `360px`):
1. **Proteksi Redirect Jika Sudah Login:**
   ```ts
   if (isHydrated && isAuthenticated) {
     return <Navigate to="/karyawan" replace />;
   }
   ```
2. **Form (`react-hook-form` + `zodResolver(registerSchema)`):**
   - Input `Nama Lengkap` (`id="name"`, min 5 karakter) + pesan error merah tepat di bawah input.
   - Input `Email` (`id="email"`, `type="email"`) + pesan error tepat di bawah input.
   - Input `Password` (`id="password"`, `type="password"`) + pesan error tepat di bawah input.
   - Input `Konfirmasi Password` (`id="confirmPassword"`, `type="password"`) + pesan error tepat di bawah input.
   - Tombol Submit: teks `"Daftar"` (saat `isPending`: `disabled` dan teks `"Memproses..."`).
3. **Mutasi API (`useMutation`):**
   - Memanggil `apiRequest<RegisterResponseData>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })` — **jangan** mengirim `confirmPassword`, `role`, atau `is_active` ke API.
   - **Saat Sukses (`201`):**
     - **JANGAN** memanggil `setAuth` (karena belum ada JWT dan `is_active === false`).
     - Tampilkan `toast.success('Registrasi berhasil! Menunggu persetujuan admin.')`.
     - Ubah tampilan menjadi kartu konfirmasi ramah berbahasa Indonesia:
       - Judul: `"Pendaftaran Berhasil Dikirim"`
       - Keterangan jelas: *"Akun Anda (`<email>`) telah terdaftar dengan status menunggu persetujuan Admin. Anda dapat masuk setelah Admin mengaktifkan akun Anda."*
       - Tombol menuju `/login` (`"Ke Halaman Masuk"`) dan tautan kembali ke `/` (`"Kembali ke Beranda"`).
   - **Saat Gagal (`400` / `409` / `429` / error server):**
     - Tampilkan `toast.error(message)` dan **pertahankan** nilai input nama & email di form agar user mudah memperbaiki.
4. **Tautan Bawah Form:** `"Sudah punya akun? Masuk di sini"` -> `<Link to="/login">`.

### 3.4 Integrasi Navigasi (`/register`)
1. **`client/src/App.tsx`:** Tambahkan rute publik `<Route path="/register" element={<RegisterPage />} />`.
2. **`client/src/pages/LoginPage.tsx`:** Tambahkan tautan di bawah tombol Masuk: `"Belum punya akun? Daftar di sini"` -> `<Link to="/register">`.
3. **`client/src/components/layout/Header.tsx`:** Pada mode **belum login** (desktop dan mobile), tampilkan tautan `"Daftar"` (`/register`) bersebelahan dengan tombol `"Masuk"` (`/login`).
4. **`client/src/pages/HomePage.tsx`:** Pada hero pengunjung belum login, tambahkan tautan/tombol sekunder `"Daftar Akun Baru"` menuju `/register` di samping tombol utama `"Masuk untuk Membuka Data"`.

---

## 4. Skenario Testing Wajib & Contoh Request–Response Lengkap

> **ATURAN WAJIB TESTING:**
> 1. **Reset Data Setiap Skenario (`beforeEach`):** Pada backend test (`server/tests/auth.test.ts`), setiap blok `it(...)` **WAJIB** didahului pembersihan seluruh tabel (sudah terpasang di `server/tests/setup.ts`):
>    ```sql
>    DELETE FROM messages;
>    DELETE FROM memory_employees;
>    DELETE FROM memories;
>    DELETE FROM users;
>    DELETE FROM employees;
>    ```
> 2. **Reset State Frontend (`beforeEach`):** Pada frontend test (`client/src/tests/`), setiap test wajib menjalankan `localStorage.clear()`, reset `useAuthStore`, dan `queryClient.clear()` (sudah terpasang di `client/src/tests/setup.ts`).
> 3. **Tanpa Kredensial Produksi:** Semua akun dan token di test hanya memakai data dummy lokal.

### 4.1 Contoh Request & Response Per Endpoint Terkait Registrasi

#### 1. `POST /api/auth/register` (Publik + Rate Limit 5x/menit)
- **Request Valid:**
  ```http
  POST /api/auth/register
  Content-Type: application/json

  {
    "name": "Budi Santoso",
    "email": "Budi@WargaHalim.id",
    "password": "UserPass123!"
  }
  ```
- **Response Sukses (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 12,
      "name": "Budi Santoso",
      "email": "budi@wargahalim.id",
      "role": "user",
      "employee_id": null,
      "employeeId": null,
      "is_active": false,
      "isActive": false
    },
    "message": "Registrasi berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan untuk masuk."
  }
  ```
- **Response Error Validasi (`400 Bad Request`):**
  ```json
  {
    "success": false,
    "data": {
      "errors": {
        "name": "Nama minimal 5 karakter",
        "email": "Format email tidak valid",
        "password": "Password minimal 6 karakter"
      }
    },
    "message": "Nama minimal 5 karakter"
  }
  ```
- **Response Error Email Duplikat (`409 Conflict`):**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Email sudah digunakan"
  }
  ```
- **Response Rate Limit (`429 Too Many Requests`):**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Terlalu banyak percobaan registrasi. Silakan coba lagi setelah 1 menit"
  }
  ```

#### 2. `POST /api/auth/login` (Uji Akun Baru Sebelum vs Sesudah Aktivasi Admin)
- **Request:**
  ```http
  POST /api/auth/login
  Content-Type: application/json

  {
    "email": "budi@wargahalim.id",
    "password": "UserPass123!"
  }
  ```
- **Response Sebelum Diaktifkan Admin (`403 Forbidden`):**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Akun Anda belum aktif atau telah dinonaktifkan. Silakan hubungi admin"
  }
  ```
- **Response Setelah Diaktifkan Admin (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "token": "<jwt_token>",
      "user": {
        "id": 12,
        "name": "Budi Santoso",
        "email": "budi@wargahalim.id",
        "role": "user",
        "employee_id": null,
        "employeeId": null,
        "is_active": true,
        "isActive": true
      }
    },
    "message": "Login berhasil"
  }
  ```

#### 3. `PUT /api/admin/users/:id` (Aktivasi Akun Pendaftar Baru oleh Admin)
- **Request:**
  ```http
  PUT /api/admin/users/12
  Authorization: Bearer <admin_jwt_token>
  Content-Type: application/json

  {
    "is_active": true
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 12,
      "name": "Budi Santoso",
      "email": "budi@wargahalim.id",
      "role": "user",
      "employee_id": null,
      "employeeId": null,
      "is_active": true,
      "isActive": true
    },
    "message": "Akun user berhasil diperbarui"
  }
  ```

---

### 4.2 Matriks Skenario Test Backend (`server/tests/auth.test.ts`)

*(Catatan: Perbarui `AUTH-09` yang sebelumnya menguji bahwa `/api/auth/register` adalah `404` menjadi suite test registrasi di bawah ini; pastikan `beforeEach` tetap mengosongkan database setiap skenario).*

| ID | Endpoint | Skenario | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `REG-01` | `POST /api/auth/register` | Registrasi valid dengan data bersih | `201 Created`; `role === 'user'`, `employee_id === null`, `is_active === false`; tidak ada `token` maupun `password_hash`; password di DB ter-hash bcrypt (`$2b$`/`$2a$`) dan cocok dengan `verifyPassword`. |
| `REG-02` | `POST /api/auth/register` | Email duplikat (sama persis & beda huruf besar-kecil, mis. `Budi@Test.id` vs `budi@test.id`) | `409 Conflict` (`"Email sudah digunakan"`). Jumlah baris di tabel `users` tetap 1. |
| `REG-03` | `POST /api/auth/register` | Validasi input Zod (`name` < 5, email format salah / < 5, `password` < 6, body kosong) | `400 Bad Request` beserta `data.errors` per field dalam bahasa Indonesia. |
| `REG-04` | `POST /api/auth/register` | Uji privilege escalation (`{ name, email, password, role: 'admin', is_active: true, employee_id: 1 }`) | Tetap tersimpan di DB sebagai `role = 'user'`, `is_active = 0`, `employee_id = NULL`. Client tidak diberi akses admin maupun aktif otomatis. |
| `REG-05` | `POST /api/auth/register` + `/login` | Pendaftar baru langsung mencoba login sebelum diaktifkan Admin | `POST /api/auth/login` menolak dengan `403 Forbidden` dan pesan bahwa akun belum aktif/nonaktif. |
| `REG-06` | `PUT /api/admin/users/:id` + `/login` + `/auth/me` | Alur penuh: Register -> ditolak login (`403`) -> Admin aktifkan (`is_active: true`) -> User berhasil login (`200`) & akses `GET /api/auth/me` (`200`) | Seluruh alur end-to-end berhasil sesuai kontrak. |
| `REG-07` | `POST /api/auth/register` | Rate limiter registrasi (`createRegisterRateLimiter`) pada percobaan ke-6 dalam 1 menit | Percobaan 1–5 lolos dari limiter, percobaan ke-6 ditolak `429 Too Many Requests`. |

---

### 4.3 Matriks Skenario Test Frontend (`client/src/tests/`)

| ID | File Test | Skenario | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `FE-REG-01` | `registerPage.test.tsx` | Validasi Zod (`name` < 5, email invalid, `password` < 6, `confirmPassword` tidak cocok) | Pesan error bahasa Indonesia tampil tepat di bawah masing-masing input dan **tidak** memanggil `fetch`. |
| `FE-REG-02` | `registerPage.test.tsx` | Submit registrasi sukses (`201 Created`) | Payload ke server hanya berisi `{ name, email, password }`. `useAuthStore.getState().isAuthenticated` tetap `false`. Tampil kartu konfirmasi menunggu persetujuan Admin & tombol menuju `/login`. |
| `FE-REG-03` | `registerPage.test.tsx` | Registrasi gagal (`409 Email sudah digunakan`) | Toast error muncul dengan pesan dari server; input `name` & `email` di form tetap terjaga (tidak terhapus). |
| `FE-REG-04` | `registerPage.test.tsx` | State loading tombol saat submit | Saat request pending, tombol berubah menjadi `"Memproses..."` dan berstatus `disabled`. |
| `FE-GUARD-03` | `routeGuards.test.tsx` | Akses `/register` saat guest vs saat sudah login, serta cek `/daftar` | Pengunjung belum login dapat melihat form `/register`; user yang sudah login otomatis di-redirect dari `/register` ke `/karyawan`; `/daftar` tetap menampilkan halaman `404`. |

---

## 5. Verifikasi Akhir & Format Laporan Wajib

Setelah selesai mengimplementasikan seluruh poin di atas, jalankan seluruh verifikasi berikut:

1. **Backend (`server/`):**
   - `npm run typecheck` (wajib 0 error)
   - `npm test` (wajib seluruh skenario lulus 100%)
2. **Frontend (`client/`):**
   - `npm run typecheck` (wajib 0 error, `strict: true`)
   - `npm run build` (wajib sukses)
   - `npm test` (wajib seluruh skenario lulus 100%)
3. **Audit Kode & Keamanan Git:**
   - Pastikan 0 kemunculan `createContext`, `useReducer`, `: any`, atau `as any` di `client/src/` dan `server/src/`.
   - Jalankan `git status` dan pastikan **tidak ada** `.env`, password, atau token yang masuk staging/commit.

### Laporan yang Wajib Diserahkan Setelah Implementasi:
1. Daftar file yang dibuat dan dimodifikasi di `docs/`, `server/`, dan `client/`.
2. Daftar endpoint auth & registrasi beserta aturan akses dan rate limit-nya.
3. Contoh Request & Response aktual untuk `POST /api/auth/register` (201, 400, 409, 429), `POST /api/auth/login` (403 sebelum aktivasi & 200 setelah aktivasi), dan `PUT /api/admin/users/:id` (aktivasi).
4. Hasil pengujian lengkap (`typecheck`, `build`, dan `vitest` backend & frontend).

