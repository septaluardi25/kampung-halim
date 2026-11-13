# API Documentation — Warga Halim

Dokumen ini mendefinisikan kontrak REST API berdasarkan [PRD.md](file:///c:/Users/dimas/Desktop/Belajar/github/4-kampung-halim/docs/PRD.md) (Bagian 5, 8, dan 9).

---

## 1. Konvensi & Aturan Umum

- **Base Path:** `/api`
- **Format Request/Response:** `application/json`, kecuali unggah foto menggunakan `multipart/form-data`.
- **Format Respons Standar (Wajib di seluruh endpoint):**
  ```json
  {
    "success": true,
    "data": {},
    "message": "Pesan ringkas dalam bahasa Indonesia"
  }
  ```
- **Format Respons Error:**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Pesan error dalam bahasa Indonesia"
  }
  ```
  *(Untuk error validasi Zod `400`, `data` dapat menyertakan `{ "errors": { "field": "pesan" } }` agar form client dapat menampilkan error di bawah kolom terkait, sementara `message` tetap berisi ringkasan ramah dalam bahasa Indonesia.)*
- **Autentikasi:** JWT Bearer Token pada header `Authorization: Bearer <token>`, masa berlaku **1 hari** (`1d`).
- **Keamanan Wajib:**
  - Seluruh endpoint selain `GET /api/photos`, `POST /api/auth/register`, dan `POST /api/auth/login` wajib menyertakan token JWT valid **dan** status akun aktif (`is_active = 1`).
  - Rate limiting pada `POST /api/auth/login` dan `POST /api/auth/register`: maksimal **5 percobaan per menit**.
  - Validasi input menggunakan **Zod** di server pada seluruh endpoint `POST`/`PUT`.
  - Seluruh query MySQL wajib menggunakan *parameterized query* (`?`).
  - `cors` hanya mengizinkan origin `CLIENT_URL`; proteksi header menggunakan `helmet`.
- **Kode Status HTTP (Setting Default):**
  - `200 OK` / `201 Created`: Permintaan berhasil.
  - `400 Bad Request`: Input atau file unggahan tidak valid.
  - `401 Unauthorized`: Token tidak ada, tidak valid, atau kedaluwarsa; atau kredensial login salah.
  - `403 Forbidden`: Role tidak memiliki izin (mis. `user` mengakses `/api/admin/*`) atau akun dinonaktifkan (`is_active = false`).
  - `404 Not Found`: Data tidak ditemukan (atau konten masih `draft` saat diakses oleh `user` non-admin).
  - `409 Conflict`: Konflik data unik (mis. email sudah digunakan).
  - `429 Too Many Requests`: Melebihi batas percobaan login (5x/menit).
  - `500 Internal Server Error`: Kesalahan server.

> **Catatan Scope PRD:** Akun hasil `POST /api/auth/register` selalu memiliki `role = 'user'`, `employee_id = NULL`, dan `is_active = false` (menunggu persetujuan Admin melalui Panel Admin). Tetap tidak ada endpoint tulis/ubah/hapus pesan oleh user (`/api/messages` hanya `GET`), dan tidak ada endpoint edit pesan (`PUT`/`PATCH`) di mana pun.

---

## 2. Endpoint Publik (Tanpa Login)

### 2.1 `GET /api/photos`
- **Akses:** Publik
- **Deskripsi:** Mengambil daftar URL foto karyawan berstatus `published` yang sudah memiliki foto (`photo_url IS NOT NULL`) untuk galeri halaman Home (`/`) bagi pengunjung tanpa login. **Tidak mengembalikan** nama ataupun biodata apa pun.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg"
      }
    ],
    "message": "Daftar foto berhasil diambil"
  }
  ```

### 2.2 `POST /api/auth/login`
- **Akses:** Publik (Rate limit: maksimal 5 percobaan per menit)
- **Body Request (Zod):**
  ```json
  {
    "email": "andi@example.com",
    "password": "password123"
  }
  ```
- **Validasi Input (Zod):**
  - `email`: string, format email valid, minimal 5 karakter (`z.string().min(5).email()`).
  - `password`: string, minimal 6 karakter (`z.string().min(6)`).
- **Aturan:**
  - Password diverifikasi menggunakan `bcryptjs` (mencocokkan plaintext dengan hash bcrypt pada kolom `password_hash`).
  - Jangan membocorkan apakah email atau password yang salah: jika user tidak ditemukan atau password tidak cocok, kembalikan `401 Unauthorized` dengan pesan yang sama (`"Email atau password salah"`).
  - Jika `is_active = false` (0), tolak dengan `403 Forbidden`.
  - Jika berhasil, buat JWT (`expiresIn: '1d'`) yang ditandatangani menggunakan `JWT_SECRET`, berisi payload `{ id, email, role, employee_id }`.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "token": "<jwt_token>",
      "user": {
        "id": 2,
        "name": "Andi Budi",
        "email": "andi@example.com",
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

### 2.3 `POST /api/auth/register`
- **Akses:** Publik (Rate limit: maksimal 5 percobaan per menit per IP)
- **Deskripsi:** Mendaftarkan akun user baru dengan status awal nonaktif (`is_active = false`), sehingga user **belum dapat login** sampai disetujui/diaktifkan oleh Admin melalui `PUT /api/admin/users/:id`.
- **Body Request (Zod):**
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123"
  }
  ```
- **Validasi Input (Zod):**
  - `name`: string (`trim`), minimal 5 karakter, maksimal 150 karakter (`z.string().trim().min(5).max(150)`).
  - `email`: string (`trim`, dinormalisasi huruf kecil), format email valid, minimal 5 karakter, maksimal 255 karakter (`z.string().trim().toLowerCase().min(5).max(255).email()`).
  - `password`: string, minimal 6 karakter, maksimal 100 karakter (`z.string().min(6).max(100)`).
- **Aturan Keamanan:**
  - Server **wajib mengabaikan** field `role`, `is_active`, atau `employee_id` jika dikirim oleh client, dan memaksa `role = 'user'`, `is_active = 0` (`false`), serta `employee_id = NULL`.
  - Cek keunikan email (case-insensitive). Jika email sudah terdaftar, tolak dengan `409 Conflict` (`"Email sudah digunakan"`).
  - Password di-hash menggunakan `bcryptjs` (`salt rounds: 10`) sebelum disimpan ke `password_hash`.
  - **Jangan** mengembalikan token JWT dan **jangan** mengembalikan `password_hash`.
- **Respons `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 12,
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "role": "user",
      "employee_id": null,
      "employeeId": null,
      "is_active": false,
      "isActive": false
    },
    "message": "Registrasi berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan untuk masuk."
  }
  ```
- **Respons Error Umum:**
  - `400 Bad Request`: input tidak valid (mis. nama < 5 karakter, format email salah, password < 6 karakter).
  - `409 Conflict`: `{ "success": false, "data": null, "message": "Email sudah digunakan" }`.
  - `429 Too Many Requests`: melebihi 5 percobaan per menit per IP.

---

## 3. Endpoint Terproteksi (`User` atau `Admin`)

Seluruh endpoint pada bagian ini wajib melewati middleware `authenticate` (JWT valid & `is_active = true`). Pengguna dengan role `user` hanya menerima data berstatus `published`.

### 3.1 `GET /api/auth/me`
- **Akses:** User atau Admin
- **Deskripsi:** Memverifikasi token masih valid dan mengembalikan data akun user terkini dari database (termasuk `employee_id`/`employeeId` dan `is_active`/`isActive`, tanpa `password_hash`).
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 2,
      "name": "Andi Budi",
      "email": "andi@example.com",
      "role": "user",
      "employee_id": 1,
      "employeeId": 1,
      "is_active": true,
      "isActive": true
    },
    "message": "Data akun berhasil diambil"
  }
  ```

### 3.2 `GET /api/employees`
- **Akses:** User atau Admin
- **Query Param:** `search` (opsional, string pencarian pada `full_name` atau `nickname`).
- **Deskripsi:** Mengambil daftar karyawan berstatus `published` untuk halaman `/karyawan` (menampilkan nama panggilan, nama lengkap, serta foto atau inisial sesuai PRD).
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "full_name": "Andi Budi",
        "nickname": "Andi",
        "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg",
        "initials": "AB"
      }
    ],
    "message": "Daftar karyawan berhasil diambil"
  }
  ```

### 3.3 `GET /api/employees/:id`
- **Akses:** User atau Admin
- **Deskripsi:** Mengambil detail biodata lengkap satu karyawan, foto (`photo_url`), daftar kenangan terkait (`published`), dan daftar pesan terkait (yang diterima maupun yang dikirim oleh karyawan tersebut, di mana kedua karyawan berstatus `published`).
- **Aturan:** Jika ID tidak ada atau berstatus `draft` (untuk role `user`), kembalikan `404 Not Found`.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "full_name": "Andi Budi",
      "nickname": "Andi",
      "hometown": "Bandung",
      "hobby": "Bersepeda",
      "contact": null,
      "favorite_quote": "Terus belajar.",
      "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg",
      "initials": "AB",
      "memories": [
        {
          "id": 2,
          "title": "Outing Puncak 2022",
          "event_date": "2022-08-17"
        }
      ],
      "messages": [
        {
          "id": 5,
          "sender_employee_id": 3,
          "sender_name": "Citra Dewi",
          "sender_initials": "CD",
          "recipient_employee_id": 1,
          "recipient_name": "Andi Budi",
          "recipient_initials": "AB",
          "message": "Terima kasih selalu membantu saat rilis!",
          "impression": "Rekan kerja yang sangat sabar.",
          "created_at": "2026-11-12T10:00:00.000Z"
        }
      ]
    },
    "message": "Detail karyawan berhasil diambil"
  }
  ```

### 3.4 `GET /api/memories`
- **Akses:** User atau Admin
- **Deskripsi:** Mengambil daftar kenangan berstatus `published`, diurutkan `event_date DESC` (terbaru di atas).
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "title": "Outing Puncak 2022",
        "event_date": "2022-08-17",
        "story": "Cerita kenangan...",
        "created_at": "2026-11-12T10:00:00.000Z"
      }
    ],
    "message": "Daftar kenangan berhasil diambil"
  }
  ```

### 3.5 `GET /api/memories/:id`
- **Akses:** User atau Admin
- **Deskripsi:** Mengambil detail satu kenangan (`published`) beserta daftar karyawan (`published`) yang di-tag pada kenangan tersebut.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 2,
      "title": "Outing Puncak 2022",
      "event_date": "2022-08-17",
      "story": "Cerita lengkap kenangan...",
      "employees": [
        {
          "id": 1,
          "full_name": "Andi Budi",
          "photo_url": "https://xxx.public.blob.vercel-storage.com/employees/1.jpg",
          "initials": "AB"
        }
      ]
    },
    "message": "Detail kenangan berhasil diambil"
  }
  ```

### 3.6 `GET /api/messages`
- **Akses:** User atau Admin
- **Deskripsi:** Mengambil seluruh pesan antar karyawan di mana pengirim dan penerima berstatus `published`, diurutkan terbaru di atas (`created_at DESC`).
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 5,
        "sender_employee_id": 3,
        "sender_name": "Citra Dewi",
        "sender_initials": "CD",
        "recipient_employee_id": 1,
        "recipient_name": "Andi Budi",
        "recipient_initials": "AB",
        "message": "Terima kasih selalu membantu saat rilis!",
        "impression": "Rekan kerja yang sangat sabar.",
        "created_at": "2026-11-12T10:00:00.000Z",
        "updated_at": "2026-11-12T10:00:00.000Z"
      }
    ],
    "message": "Daftar pesan dan kesan berhasil diambil"
  }
  ```

---

## 4. Endpoint Panel Admin (`Admin` Saja)

Seluruh endpoint di bawah ini wajib melewati middleware `authenticate` dan `authorizeAdmin` (`role === 'admin'`). Jika diakses oleh `user` biasa, server mengembalikan `403 Forbidden`.

### 4.1 Kelola Karyawan (`/api/admin/employees`)

- **`GET /api/admin/employees`**: Mengambil seluruh data karyawan termasuk yang berstatus `draft` dan `published` (mendukung `?search=` opsional pada `full_name`).
- **`GET /api/admin/employees/:id`**: Mengambil detail 1 karyawan (termasuk `draft`) untuk kebutuhan edit form.
- **`POST /api/admin/employees`**: Membuat data karyawan baru.
  - **Body (Zod):** `full_name` wajib diisi; `nickname` wajib atau diturunkan dari kata pertama jika opsional, `status` (`draft` | `published`, default `'draft'`); `hometown`, `hobby`, `contact`, `favorite_quote` opsional (`null` bila kosong).
  - **Respons:** `201 Created` dengan data karyawan baru (tanpa data akun/password).
- **`PUT /api/admin/employees/:id`**: Memperbarui data biodata dan status (`draft`/`published`) karyawan (mengembalikan `404` bila ID tidak ditemukan).
- **`DELETE /api/admin/employees/:id`**: Menghapus karyawan (beserta foto di Vercel Blob jika ada; pesan dan tag terkait ikut terhapus `ON DELETE CASCADE`, sementara `users.employee_id` di-set `NULL` via `ON DELETE SET NULL`).

### 4.2 Kelola Foto Karyawan (`/api/admin/employees/:id/photo`)

- **`POST /api/admin/employees/:id/photo`**:
  - **Content-Type:** `multipart/form-data` (field `photo`).
  - **Validasi Ganda di Server:** Wajib JPG (`image/jpeg`), PNG (`image/png`), atau WebP (`image/webp`), ukuran maksimal **2 MB**, serta pemeriksaan **file signature (magic bytes)** buffer gambar (`FF D8 FF` untuk JPG, `89 50 4E 47 0D 0A 1A 0A` untuk PNG, `RIFF....WEBP` untuk WebP). File dengan MIME/ekstensi palsu ditolak dengan `400 Bad Request`.
  - **Proses:** Unggah buffer ke **Vercel Blob** (atau fallback URL lokal bila `BLOB_READ_WRITE_TOKEN` kosong pada mode uji lokal), hapus blob foto lama jika sebelumnya sudah ada, lalu simpan URL baru ke `employees.photo_url`. Kegagalan upload atau DB ditangani secara aman tanpa meninggalkan file yatim.
  - **Respons `200 OK`:** `{ "success": true, "data": { "photo_url": "https://..." }, "message": "Foto karyawan berhasil diunggah" }`.
- **`DELETE /api/admin/employees/:id/photo`**:
  - Menghapus file foto dari **Vercel Blob** dan mengatur `employees.photo_url = null`.
  - **Respons `200 OK`:** `{ "success": true, "data": { "photo_url": null }, "message": "Foto karyawan berhasil dihapus" }`.

### 4.3 Kelola Kenangan (`/api/admin/memories`)

- **`GET /api/admin/memories`**: Mengambil seluruh kenangan (`draft` dan `published`), urut `event_date DESC, id DESC`, beserta daftar `employees` yang di-tag.
- **`GET /api/admin/memories/:id`**: Mengambil detail 1 kenangan (termasuk `draft`) beserta `employee_ids` dan `employees` untuk kebutuhan edit form.
- **`POST /api/admin/memories`**:
  - **Body (Zod):** `{ "title": "...", "event_date": "YYYY-MM-DD", "story": "...", "status": "draft" | "published", "employee_ids": [1, 2] }`.
  - Memvalidasi bahwa seluruh ID pada `employee_ids` adalah karyawan yang valid (`400 Bad Request` bila ada ID yang tidak ditemukan).
  - Menyimpan `memories` dan `memory_employees` dalam **satu transaksi MySQL** (`beginTransaction` -> `commit`, atau `rollback` otomatis jika salah satu gagal). Mengembalikan `201 Created`.
- **`PUT /api/admin/memories/:id`**: Memperbarui judul, tanggal, cerita, status, dan menyinkronkan `memory_employees` dalam **satu transaksi MySQL** (`rollback` jika gagal).
- **`DELETE /api/admin/memories/:id`**: Menghapus kenangan (beserta relasi `memory_employees` secara `CASCADE`).

### 4.4 Kelola Pesan dan Kesan (`/api/admin/messages`)

> **Catatan:** Pesan hanya dapat dilihat, ditambahkan, dan dihapus oleh Admin melalui endpoint di bawah ini. **Tidak boleh ada endpoint `PUT` atau `PATCH` untuk pesan.** Pesan yang dibuat oleh Admin langsung aktif/terbit.

- **`GET /api/admin/messages`**: Mengambil seluruh pesan beserta informasi pengirim (`sender_employee_id`, `sender_name`) dan penerima (`recipient_employee_id`, `recipient_name`).
- **`POST /api/admin/messages`**:
  - **Body (Zod):**
    ```json
    {
      "sender_employee_id": 3,
      "recipient_employee_id": 1,
      "message": "Terima kasih selalu membantu saat rilis!",
      "impression": "Rekan kerja yang sangat sabar."
    }
    ```
  - **Validasi:** `sender_employee_id` dan `recipient_employee_id` wajib merujuk ke karyawan yang ada di tabel `employees` dan **harus berbeda** (`sender_employee_id !== recipient_employee_id`, bila sama kembalikan `400`). `message` wajib diisi; `impression` opsional (`null` bila kosong).
  - **Respons `201 Created`:** Mengembalikan objek pesan baru.
- **`DELETE /api/admin/messages/:id`**: Menghapus pesan (`200 OK`, atau `404` bila ID tidak ditemukan).

### 4.5 Kelola Akun User (`/api/admin/users`)

- **`GET /api/admin/users`**: Mengambil seluruh daftar akun user beserta info `employee_id` (tanpa `password_hash`).
- **`POST /api/admin/users`**:
  - **Body (Zod):** `{ "name": "...", "email": "...", "password": "...", "is_active": true }`.
  - **Validasi Input (Zod):**
    - `name`: string, minimal 5 karakter (`z.string().trim().min(5)`).
    - `email`: string, format email valid, minimal 5 karakter (`z.string().trim().min(5).email()`), wajib unik (jika sudah terdaftar tolak `409 Conflict`).
    - `password`: string, minimal 6 karakter (`z.string().min(6)`).
    - `is_active`: boolean (opsional, default `true`).
  - Server selalu menetapkan `role = 'user'` dan `employee_id = NULL` (penautan karyawan dilakukan di `PUT /api/admin/users/:id`), serta wajib meng-crypt (hash) password menggunakan `bcryptjs` (salt rounds: 10) sebelum disimpan ke kolom `password_hash`.
  - **Respons `201 Created`:** Mengembalikan data akun baru tanpa `password_hash`.
- **`PUT /api/admin/users/:id`**:
  - **Body (Zod):**
    - `name`: opsional, minimal 5 karakter jika diisi.
    - `email`: opsional, format email valid, minimal 5 karakter jika diisi (tolak `409` jika bentrok dengan email user lain).
    - `password`: opsional, minimal 6 karakter jika diisi (wajib di-crypt dengan `bcryptjs` sebelum disimpan).
    - `is_active`: opsional, boolean.
    - `employee_id`: opsional, `number | null` — **satu-satunya endpoint untuk menautkan atau melepas tautan akun user dengan karyawan**. Validasi bahwa `employee_id` ada di tabel `employees` (`400` jika tidak ditemukan) dan belum tertaut ke akun user lain (`409 Conflict` jika sudah dipakai user lain).
  - **Proteksi Keamanan:** Admin tidak boleh mengubah `role` akun maupun menonaktifkan akun admin miliknya sendiri (`400 Bad Request`).
- **`DELETE /api/admin/users/:id`**:
  - Menghapus akun user. Admin dicegah menghapus akun admin miliknya sendiri (`400 Bad Request`).

