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
  - Seluruh endpoint selain `GET /api/photos` dan `POST /api/auth/login` wajib menyertakan token JWT valid **dan** status akun aktif (`is_active = 1`).
  - Rate limiting pada `POST /api/auth/login`: maksimal **5 percobaan per menit**.
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

> **Catatan Scope PRD:** Tidak ada endpoint registrasi publik (`POST /api/auth/register`), tidak ada endpoint pesan milik user (`/api/me/messages`), dan tidak ada endpoint edit pesan (`PUT /api/admin/messages/:id`).

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
        "is_active": true
      }
    },
    "message": "Login berhasil"
  }
  ```

---

## 3. Endpoint Terproteksi (`User` atau `Admin`)

Seluruh endpoint pada bagian ini wajib melewati middleware `authenticate` (JWT valid & `is_active = true`). Pengguna dengan role `user` hanya menerima data berstatus `published`.

### 3.1 `GET /api/auth/me`
- **Akses:** User atau Admin
- **Deskripsi:** Memverifikasi token masih valid dan mengembalikan data akun user terkini dari database.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 2,
      "name": "Andi Budi",
      "email": "andi@example.com",
      "role": "user",
      "is_active": true
    },
    "message": "Data akun berhasil diambil"
  }
  ```

### 3.2 `GET /api/employees`
- **Akses:** User atau Admin
- **Query Param:** `search` (opsional, string pencarian pada `full_name`).
- **Deskripsi:** Mengambil daftar karyawan berstatus `published` untuk halaman `/karyawan`.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "full_name": "Andi Budi",
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

### 3.7 `POST /api/messages` (Tulis Pesan oleh User)
- **Akses:** User login yang profilnya sudah tertaut ke karyawan (`req.user.employee_id IS NOT NULL`).
- **Aturan Khusus & Keamanan:**
  - **User Belum Ditautkan:** Jika akun login belum memiliki relasi ke data karyawan (`req.user.employee_id === null`), server menolak dengan **`403 Forbidden`** (`"Akun belum ditautkan ke data karyawan. Anda tidak dapat menulis pesan."`).
  - **Integritas Kepemilikan (Anti-Impersonasi):** Server **wajib mengambil `sender_employee_id` dari `req.user.employee_id`**, dan **tidak mempercayai** `sender_employee_id` yang dikirim dari payload frontend. Ini menjamin user tidak dapat memalsukan pengirim atau menulis atas nama orang lain.
  - **Cegah Kirim ke Diri Sendiri:** Jika `recipient_employee_id === req.user.employee_id`, server mengembalikan **`400 Bad Request`** (`"Tidak dapat mengirim pesan kepada diri sendiri"`).
- **Request Body (Zod):**
  ```json
  {
    "recipient_employee_id": 1,
    "message": "Terima kasih banyak telah menjadi mentor yang hebat!",
    "impression": "Pekerja keras dan sangat solutif."
  }
  ```
- **Respons `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 6,
      "sender_employee_id": 2,
      "recipient_employee_id": 1,
      "message": "Terima kasih banyak telah menjadi mentor yang hebat!",
      "impression": "Pekerja keras dan sangat solutif.",
      "created_at": "2026-11-13T10:30:00.000Z",
      "updated_at": "2026-11-13T10:30:00.000Z"
    },
    "message": "Pesan dan kesan berhasil dikirim"
  }
  ```

### 3.8 `PUT /api/messages/:id` (Ubah Pesan Sendiri)
- **Akses:** User pemilik pesan (`message.sender_employee_id === req.user.employee_id`).
- **Aturan Proteksi:**
  - Jika pesan dengan `:id` tidak ditemukan, kembalikan **`404 Not Found`**.
  - Jika user mencoba mengubah pesan milik orang lain (`message.sender_employee_id !== req.user.employee_id`), server wajib mengembalikan **`403 Forbidden`** (`"Anda tidak memiliki izin untuk mengubah pesan ini"`).
- **Request Body (Zod):**
  ```json
  {
    "message": "Pesan revisi yang lebih detail...",
    "impression": "Kesan yang diperbarui."
  }
  ```
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 6,
      "sender_employee_id": 2,
      "recipient_employee_id": 1,
      "message": "Pesan revisi yang lebih detail...",
      "impression": "Kesan yang diperbarui.",
      "created_at": "2026-11-13T10:30:00.000Z",
      "updated_at": "2026-11-13T10:45:00.000Z"
    },
    "message": "Pesan berhasil diperbarui"
  }
  ```

### 3.9 `DELETE /api/messages/:id` (Hapus Pesan Sendiri / Admin)
- **Akses:** User pemilik pesan (`message.sender_employee_id === req.user.employee_id`) atau Admin.
- **Aturan:** Jika bukan pemilik pesan dan bukan admin, tolak dengan **`403 Forbidden`**.
- **Respons `200 OK`:**
  ```json
  {
    "success": true,
    "data": null,
    "message": "Pesan berhasil dihapus"
  }
  ```

---

## 4. Endpoint Panel Admin (`Admin` Saja)

Seluruh endpoint di bawah ini wajib melewati middleware `authenticate` dan `authorizeAdmin` (`role === 'admin'`). Jika diakses oleh `user` biasa, server mengembalikan `403 Forbidden`.

### 4.1 Kelola Karyawan (`/api/admin/employees`)

- **`GET /api/admin/employees`**: Mengambil seluruh data karyawan termasuk yang berstatus `draft` (mendukung `?search=` opsional).
- **`GET /api/admin/employees/:id`**: Mengambil detail 1 karyawan (termasuk `draft`) untuk kebutuhan edit form.
- **`POST /api/admin/employees`**: Membuat data karyawan baru.
  - **Body (Zod):** `full_name`, `nickname`, `status` (`draft` | `published`) wajib; `hometown`, `hobby`, `contact`, `favorite_quote` opsional (`null` bila kosong).
  - **Respons:** `201 Created` dengan data karyawan baru.
- **`PUT /api/admin/employees/:id`**: Memperbarui data biodata karyawan (mengembalikan `404` bila ID tidak ditemukan).
- **`DELETE /api/admin/employees/:id`**: Menghapus karyawan (beserta foto di Vercel Blob jika ada; pesan dan tag terkait ikut terhapus `ON DELETE CASCADE`).

### 4.2 Kelola Foto Karyawan (`/api/admin/employees/:id/photo`)

- **`POST /api/admin/employees/:id/photo`**:
  - **Content-Type:** `multipart/form-data` (field `photo`).
  - **Validasi:** Wajib JPG (`image/jpeg`), PNG (`image/png`), atau WebP (`image/webp`), ukuran maksimal **2 MB**.
  - **Proses:** Unggah buffer ke **Vercel Blob**, hapus blob foto lama jika sebelumnya sudah ada, simpan URL baru ke `employees.photo_url`.
  - **Respons `200 OK`:** `{ "success": true, "data": { "photo_url": "https://..." }, "message": "Foto karyawan berhasil diunggah" }`.
- **`DELETE /api/admin/employees/:id/photo`**:
  - Menghapus file foto dari **Vercel Blob** dan mengatur `employees.photo_url = null`.
  - **Respons `200 OK`:** `{ "success": true, "data": { "photo_url": null }, "message": "Foto karyawan berhasil dihapus" }`.

### 4.3 Kelola Kenangan (`/api/admin/memories`)

- **`GET /api/admin/memories`**: Mengambil seluruh kenangan (`draft` dan `published`), urut `event_date DESC`, beserta daftar karyawan yang di-tag.
- **`GET /api/admin/memories/:id`**: Mengambil detail 1 kenangan (termasuk `draft`) beserta `employee_ids` untuk kebutuhan edit form.
- **`POST /api/admin/memories`**:
  - **Body (Zod):** `{ "title": "...", "event_date": "YYYY-MM-DD", "story": "...", "status": "draft" | "published", "employee_ids": [1, 2] }`.
  - Menyimpan `memories` dan `memory_employees` dalam satu transaksi database (`201 Created`).
- **`PUT /api/admin/memories/:id`**: Memperbarui data kenangan dan menyinkronkan `memory_employees` dalam satu transaksi database.
- **`DELETE /api/admin/memories/:id`**: Menghapus kenangan (beserta relasi `memory_employees` secara `CASCADE`).

### 4.4 Kelola Pesan dan Kesan (`/api/admin/messages`)

> **Catatan:** Pesan ditulis dan diedit oleh user pemilik pesan via `/api/messages`. Admin bertindak sebagai pengawas untuk menghapus pesan tidak pantas atau membuat pesan arsip.

- **`GET /api/admin/messages`**: Mengambil seluruh pesan beserta informasi pengirim (`sender_employee_id`) dan penerima (`recipient_employee_id`).
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
  - **Validasi:** `sender_employee_id` dan `recipient_employee_id` wajib merujuk ke karyawan yang ada dan **harus berbeda** (`sender_employee_id !== recipient_employee_id`, bila sama kembalikan `400`). `message` wajib diisi; `impression` opsional (`null` bila kosong).
  - **Respons `201 Created`:** Mengembalikan objek pesan baru.
- **`DELETE /api/admin/messages/:id`**: Menghapus pesan (`200 OK`, atau `404` bila ID tidak ditemukan).

### 4.5 Kelola Akun User (`/api/admin/users`)

- **`GET /api/admin/users`**: Mengambil seluruh daftar akun user (tanpa `password_hash`).
- **`POST /api/admin/users`**:
  - **Body (Zod):** `{ "name": "...", "email": "...", "password": "...", "is_active": true }`.
  - **Validasi Input (Zod):**
    - `name`: string, minimal 5 karakter (`z.string().trim().min(5)`).
    - `email`: string, format email valid, minimal 5 karakter (`z.string().trim().min(5).email()`), wajib unik (jika sudah terdaftar tolak `409 Conflict`).
    - `password`: string, minimal 6 karakter (`z.string().min(6)`).
    - `is_active`: boolean (opsional, default `true`).
  - Server selalu menetapkan `role = 'user'` dan wajib meng-crypt (hash) password menggunakan `bcryptjs` (salt rounds: 10) sebelum disimpan ke kolom `password_hash`.
  - **Respons `201 Created`:** Mengembalikan data akun baru tanpa `password_hash`.
- **`PUT /api/admin/users/:id`**:
  - **Body (Zod):**
    - `name`: opsional, minimal 5 karakter jika diisi.
    - `email`: opsional, format email valid, minimal 5 karakter jika diisi.
    - `is_active`: opsional, boolean.
    - `password`: opsional, minimal 6 karakter jika diisi (wajib di-crypt dengan `bcryptjs` sebelum disimpan).
  - Digunakan untuk mengubah profil akun, mengganti status aktif (`is_active`), atau mengatur ulang password oleh admin. Admin dicegah menonaktifkan akun admin miliknya sendiri (`400`).
- **`DELETE /api/admin/users/:id`**:
  - Menghapus akun user. Admin dicegah menghapus akun admin miliknya sendiri (`400`).

