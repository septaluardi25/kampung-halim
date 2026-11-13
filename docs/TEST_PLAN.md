# Test Plan — Warga Halim

Dokumen pengujian ini disusun berdasarkan [PRD.md](file:///c:/Users/dimas/Desktop/Belajar/github/4-kampung-halim/docs/PRD.md), [DATABASE_DESIGN.md](file:///c:/Users/dimas/Desktop/Belajar/github/4-kampung-halim/docs/DATABASE_DESIGN.md), dan [API_DOCUMENTATION.md](file:///c:/Users/dimas/Desktop/Belajar/github/4-kampung-halim/docs/API_DOCUMENTATION.md).

---

## 1. Tujuan & Ruang Lingkup Pengujian

Memastikan seluruh fitur MVP (F1–F6), aturan hak akses (Pengunjung, User, Admin), keamanan API & autentikasi, validasi dua lapis (Zod client & server), upload/hapus foto ke Vercel Blob, relasi database MySQL, responsivitas (`360px` & desktop), aksesibilitas dasar, serta performa halaman utama (< 3 detik) berjalan sesuai PRD sebelum dan sesudah deployment ke Vercel.

---

## 2. Matriks Akses & Ekspektasi Peran

| Rute / Endpoint | Pengunjung (Tanpa Login) | User Login (`role = user`) | Admin Login (`role = admin`) |
| --- | --- | --- | --- |
| `/` (Home) & `GET /api/photos` | **Boleh** (hanya lihat foto-foto & tombol Masuk) | **Boleh** (lihat menu & ringkasan) | **Boleh** |
| `/login` & `POST /api/auth/login` | **Boleh** (rate limit 5x/menit) | **Boleh** (redirect bila sudah login) | **Boleh** |
| `*` (URL tidak ada) | **Boleh** (halaman "tidak ditemukan") | **Boleh** | **Boleh** |
| `/karyawan`, `/karyawan/:id` & `GET /api/employees*` | **Ditolak** (`401` API, redirect `/login` di UI) | **Boleh** (hanya `published`) | **Boleh** |
| `/kenangan`, `/kenangan/:id` & `GET /api/memories*` | **Ditolak** (`401` API, redirect `/login` di UI) | **Boleh** (hanya `published`) | **Boleh** |
| `/pesan` & `GET /api/messages` | **Ditolak** (`401` API, redirect `/login` di UI) | **Boleh** (baca seluruh pesan terbit) | **Boleh** (lihat semua pesan) |
| `/admin/*` & `/api/admin/*` | **Ditolak** (`401` API, redirect `/login` di UI) | **Ditolak** (`403` API, ditolak di UI) | **Boleh** (termasuk data `draft`) |
| `/daftar` & `POST /api/auth/register` | **Tidak Ada** (`404` / `*`) | **Tidak Ada** | **Tidak Ada** |

---

## 3. Skenario Uji Fungsional & Keamanan

### 3.1 Autentikasi, Sesi Zustand, & Keamanan (`F5`, `TC-AUTH`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-AUTH-01` | Login sukses sebagai User | Buka `/login`, masukkan email & password user aktif valid, klik Masuk. | Token JWT diterima & disimpan di Zustand (`localStorage`), tombol Masuk nonaktif saat loading, muncul toast sukses, header menampilkan **nama user + tombol Keluar** (tanpa menu Panel Admin), diarahkan ke halaman terproteksi. |
| `TC-AUTH-02` | Login sukses sebagai Admin | Buka `/login`, masukkan email & password admin valid, klik Masuk. | Berhasil login, header menampilkan **nama admin, tautan Panel Admin, dan tombol Keluar**, admin dapat mengakses `/admin/*`. |
| `TC-AUTH-03` | Login gagal (password salah) | Masukkan email benar + password salah, klik Masuk. | Server membalas `401`, muncul toast error ramah bahasa Indonesia, form tetap mempertahankan input email. |
| `TC-AUTH-04` | Validasi form login (Zod) | Submit form dengan email format salah / < 5 karakter, atau password < 6 karakter / kosong. | Muncul pesan error bahasa Indonesia tepat di bawah kolom terkait (email minimal 5 karakter & format valid, password minimal 6 karakter) tanpa mengirim request ke server. |
| `TC-AUTH-05` | Rate limit login (5x/menit) | Kirim `POST /api/auth/login` salah sebanyak 6 kali dalam 1 menit. | Percobaan ke-6 ditolak server dengan HTTP `429` dan pesan bahasa Indonesia. |
| `TC-AUTH-06` | Akun dinonaktifkan (`is_active = 0`) | Admin menonaktifkan user, lalu user mencoba login atau memakai token JWT lama ke `GET /api/auth/me`. | Login maupun endpoint terproteksi menolak dengan `403` dan sesi client dibersihkan. |
| `TC-AUTH-07` | Token kedaluwarsa (`401`) | Gunakan token kedaluwarsa/rusak lalu muat ulang halaman atau panggil endpoint terproteksi. | Server membalas `401`, Zustand `authStore` dikosongkan, dan browser otomatis mengarahkan ke `/login`. |
| `TC-AUTH-08` | Logout | Klik tombol `Keluar` di header saat sedang login. | Token & data user di Zustand dihapus, pengguna kembali melihat tampilan pengunjung (Home + Masuk), rute terproteksi tidak bisa diakses lagi. |
| `TC-AUTH-09` | Tidak ada halaman registrasi & Akun Saya | Akses `/daftar`, `/akun`, dan `POST /api/auth/register`. | Frontend menampilkan halaman `NotFound` (`*`), API mengembalikan `404`. |

---

### 3.2 Halaman Home / Pengunjung Tanpa Login (`F1`, `TC-F1`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-F1-01` | Akses `/` tanpa login | Buka `/` dalam keadaan belum login. | Hanya tampil galeri foto-foto (dari `GET /api/photos`), ajakan & tombol Masuk (`/login`). Tidak ada nama lengkap, biodata, kenangan, maupun pesan yang tampil atau terkirim di network payload. |
| `TC-F1-02` | Payload `GET /api/photos` aman | Panggil `GET /api/photos` tanpa token (ketika ada karyawan `published` berfoto, `published` tanpa foto, dan `draft` berfoto). | Hanya mengembalikan `{ id, photo_url }` karyawan `published` yang memiliki foto. Karyawan `draft` dan kolom biodata tidak pernah muncul. |
| `TC-F1-03` | Pengunjung akses rute terproteksi | Tanpa login, buka langsung URL `/karyawan`, `/karyawan/1`, `/kenangan`, `/kenangan/1`, `/pesan`, `/admin`. | Semua rute langsung mengarahkan ke `/login`. |
| `TC-F1-04` | Pengunjung tembak API data langsung | Tanpa token, panggil `GET /api/employees`, `GET /api/employees/1`, `GET /api/memories`, `GET /api/messages`. | Seluruh request ditolak server dengan HTTP `401`. |

---

### 3.3 Karyawan dan Biodata (`F2`, `TC-F2`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-F2-01` | Daftar karyawan saat login | Login sebagai `user`, buka `/karyawan`. | Seluruh karyawan berstatus `published` tampil (karyawan `draft` tidak muncul); kartu menampilkan foto (bila ada) atau avatar inisial warna konsisten, nama panggilan dan nama lengkap. |
| `TC-F2-02` | Pencarian nama langsung | Ketik sebagian nama pada kolom pencarian di `/karyawan`. | Daftar langsung terfilter sesuai ketikan; jika tidak ada hasil tampil empty state yang ramah. |
| `TC-F2-03` | Uji SQL injection di pencarian | Kirim `?search=' OR '1'='1` ke `GET /api/employees`. | Parameterized query mencegah injeksi SQL; tidak membocorkan seluruh data `draft`/tabel lain dan server tidak error `500`. |
| `TC-F2-04` | Detail biodata lengkap & field `NULL` | Buka `/karyawan/:id` untuk karyawan yang kolom opsionalnya (`hometown`, `hobby`, `contact`, `favorite_quote`, `photo_url`) ada yang `NULL`. | Biodata tampil lengkap, avatar inisial menggantikan foto bila `photo_url` null, kolom kosong ditangani rapi tanpa merusak layout, kenangan & pesan terkait tampil. |
| `TC-F2-05` | User buka karyawan `draft` | Login sebagai `user`, akses `/karyawan/:id` atau `GET /api/employees/:id` milik karyawan `draft`. | Server membalas `404` dan UI menampilkan state ramah / tidak membocorkan data `draft`. |

---

### 3.4 Kenangan (`F3`, `TC-F3`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-F3-01` | Urutan daftar kenangan | Login sebagai `user`, buka `/kenangan`. | Hanya kenangan `published` yang tampil, terurut berdasarkan `event_date` terbaru di atas. |
| `TC-F3-02` | Detail kenangan & klik tag karyawan | Buka `/kenangan/:id`, periksa cerita lengkap dan daftar karyawan ter-tag, lalu klik nama salah satu karyawan. | Cerita lengkap tampil; tag hanya memuat karyawan `published`; klik nama karyawan membuka `/karyawan/:id`. |

---

### 3.5 Pesan dan Kesan (`F4`, `TC-F4`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-F4-01` | Baca semua pesan sebagai User | Login sebagai `user`, buka `/pesan` dan panggil `GET /api/messages`. | Seluruh pesan antar karyawan (di mana pengirim & penerima `published`) tampil dengan label jelas pengirim -> penerima dan kesan opsional. Tidak ada tombol tulis/ubah/hapus pesan bagi user biasa. |

*(Pengujian penambahan dan penghapusan pesan oleh Admin dicakup pada `TC-F6-05`.)*

---

### 3.6 Panel Admin (`F6`, `TC-F6`)

| ID | Skenario Uji | Langkah | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `TC-F6-01` | Proteksi role Admin | Login sebagai `user` biasa, coba buka `/admin/employees` dan panggil seluruh endpoint `/api/admin/*`. | UI menolak akses `/admin/*`; seluruh endpoint `/api/admin/*` membalas HTTP `403 Forbidden`. |
| `TC-F6-02` | CRUD Karyawan + Draft/Terbit | Tambah karyawan `Draft`, cek di `/karyawan` sebagai user (tidak ada), lalu ubah ke `Terbit`, cek lagi; lakukan edit dan hapus dengan konfirmasi. | Draft tersembunyi dari user, Terbit langsung muncul, tombol Simpan nonaktif saat loading, hapus meminta konfirmasi, dan setiap aksi memunculkan toast sukses/gagal. |
| `TC-F6-03` | Upload, ganti, & hapus foto (Vercel Blob + Magic Bytes) | Unggah file PDF/TXT, gambar > 2 MB, atau file teks dengan MIME palsu `image/jpeg` (uji negatif), lalu unggah JPG/PNG/WebP <= 2 MB yang valid (uji positif), ganti foto, lalu hapus foto. | File > 2 MB, format salah, maupun MIME palsu (magic bytes tidak cocok) ditolak di server (`400`); foto valid terunggah ke Vercel Blob (atau URL lokal saat test), `photo_url` tersimpan, foto lama terhapus saat ganti/hapus foto. |
| `TC-F6-04` | CRUD Kenangan + Tag Karyawan | Buat/ubah kenangan dengan beberapa tag karyawan dalam transaksi DB, hapus salah satu tag, coba tag ID tidak valid, lalu hapus kenangan. | Relasi `memory_employees` tersinkronisasi secara atomik (rollback jika gagal); ID karyawan tidak valid ditolak (`400`); menghapus kenangan tidak menghapus karyawan. |
| `TC-F6-05` | Tambah & Hapus Pesan (Tanpa Fitur Edit) | Coba kirim pesan dengan pengirim dan penerima sama; kirim pesan valid; cek tidak ada endpoint `PUT`/`PATCH` pesan; hapus pesan setelah konfirmasi. | Pengirim = penerima ditolak (`400`); pesan valid langsung aktif/tampil di `GET /api/messages`; request `PUT`/`PATCH` ke `/api/admin/messages/:id` mengembalikan `404`; hapus langsung menghilangkan pesan. |
| `TC-F6-06` | Kelola Akun User & Penautan Karyawan | Buat user baru (nama min 5, email min 5, password min 6), coba email duplikat (`409`), tautkan `employee_id` lewat `PUT /api/admin/users/:id`, coba tautkan `employee_id` yang sama ke user lain (`409`), nonaktifkan user, lalu hapus user lain. | Password di-crypt `bcryptjs`, `role` terkunci `'user'`, email duplikat ditolak `409`, 1 `employee_id` hanya bisa ke 1 user (`409`), admin tidak bisa menonaktifkan/menghapus dirinya sendiri (`400`), dan status `is_active` langsung memengaruhi login/token. |
| `TC-F6-07` | Cascade delete karyawan | Hapus seorang karyawan yang punya pesan (sebagai pengirim & penerima), tag kenangan, dan akun user tertaut. | Pesan dan tag terkait ikut terhapus (`ON DELETE CASCADE`), cerita kenangan di `memories` tetap utuh, dan akun user tetap ada dengan `employee_id = NULL` (`ON DELETE SET NULL`). |

---

### 3.7 Aturan Khusus Warga Halim (Mandatory Verification Matrix)

Tabel berikut memetakan pengujian aturan khusus wajib aplikasi Warga Halim:

| Skenario | Hasil yang Diharapkan | Mekanisme & Penanganan Sistem | Kode Test Case |
| --- | --- | --- | --- |
| **Pengunjung membuka biodata** | Ditolak dan diarahkan login | Request `GET /api/employees/:id` tanpa token ditolak HTTP `401`; router frontend langsung me-redirect ke `/login`. | `TC-F1-03`, `TC-F2-05` |
| **User membuka panel admin** | Ditolak | Akses `/admin/*` di frontend dicegat guard; seluruh endpoint `/api/admin/*` membalas HTTP `403 Forbidden`. | `TC-F6-01` |
| **User mengubah/menambah/menghapus pesan** | Ditolak (`404` / tidak tersedia) | Sesuai PRD terbaru, tidak ada endpoint tulis/ubah/hapus pesan untuk user dan tidak ada fitur edit pesan (`PUT`/`PATCH`) di aplikasi. | `TC-F4-01`, `TC-F6-05` |
| **Admin menghapus karyawan** | Pesan dan tag terkait ikut terhapus, akun tetap ada | Database MySQL mengeksekusi `ON DELETE CASCADE` pada tabel `messages` dan `memory_employees`, serta `ON DELETE SET NULL` pada kolom `users.employee_id` (akun user tidak terhapus). | `TC-F6-07` |
| **User nonaktif login** | Ditolak | Login akun dengan `is_active = 0` ditolak HTTP `403`; token aktif dari akun yang baru dinonaktifkan ditolak middleware `authenticate` dengan HTTP `403 Forbidden`. | `TC-AUTH-06` |
| **Pengunjung melihat daftar karyawan** | Ditolak dan diarahkan login (hanya melihat foto di Home) | Pengunjung belum login hanya boleh melihat foto di Home (`/`); rute `/karyawan` terproteksi login dan kolom `position`/jabatan telah ditiadakan. | `TC-F1-01`, `TC-F1-03` |
| **User melihat daftar karyawan** | Biodata lengkap hanya melalui endpoint detail yang terlindungi | Endpoint daftar `GET /api/employees` hanya mengembalikan data kartu ringkas (nama lengkap, panggilan, foto/avatar); biodata lengkap hanya dapat diakses via `GET /api/employees/:id`. | `TC-F2-01`, `TC-F2-04` |
| **1 Employee maksimal 1 Akun User** | Penautan ganda ditolak server | Penautan `employee_id` hanya diizinkan lewat `PUT /api/admin/users/:id` dan menolak `409 Conflict` jika karyawan sudah ditautkan ke user lain. | `TC-F6-06` |

---

## 4. Uji UI/UX, Kondisi Wajib, Responsivitas, & Performa (`TC-UI`)

| ID | Aspek Uji | Kriteria Lulus |
| --- | --- | --- |
| `TC-UI-01` | Tiga kondisi wajib halaman data | Setiap halaman data (`/`, `/karyawan`, `/karyawan/:id`, `/kenangan`, `/kenangan/:id`, `/pesan`, serta tabel admin) menampilkan **skeleton loading** saat memuat, **empty state** ramah saat data kosong, dan **error state + tombol Coba Lagi** saat API gagal. |
| `TC-UI-02` | Responsivitas `360px` & Desktop | Diuji di viewport `360px` (HP) dan desktop (>= `1280px`): grid kartu `1` kolom (HP), `2` kolom (tablet), `3` kolom (desktop), tidak ada horizontal overflow atau teks terpotong. |
| `TC-UI-03` | Tipografi & Palet Warna | Warna menggunakan palet Warga Halim: Sky Blue (`#8ECDF2`), White (`#FFFFFF`), dan Scarlet (`#E32636`) yang difokuskan sebagai aksen tombol utama (tidak mendominasi seluruh tampilan); judul memakai font serif, teks isi sans-serif berukuran minimal `16px`. |
| `TC-UI-04` | Aksesibilitas dasar | Kontras teks terbaca jelas, seluruh tombol/form dapat dinavigasi lewat keyboard (`Tab` / `Enter`), dan seluruh foto/avatar memiliki atribut `alt` / label bermakna. |
| `TC-UI-05` | Performa Lighthouse | Waktu muat halaman utama (`/`) di produksi Vercel di bawah **3 detik** pada koneksi normal. |

---

## 5. Checklist Definisi Selesai (Release Gate)

Seluruh poin berikut wajib bernilai **LULUS** sebelum proyek dinyatakan selesai:

- [ ] Fitur **F1 sampai F6** lulus seluruh test case terkait di atas.
- [ ] Frontend menggunakan **Vite + React 19 + TypeScript (`strict`, tanpa `any`)**, **TanStack Query**, dan **Zustand** (terverifikasi tidak ada `React Context` dan `useReducer`).
- [ ] Data peluncuran terpenuhi: minimal **10 akun user**, minimal **10 karyawan lengkap (target 25)**, minimal **5 kenangan terbit**, dan minimal **10 pesan & kesan**.
- [ ] Pengunjung belum login hanya bisa melihat foto-foto di Home (`/`) dan Login (`/login`).
- [ ] User login bisa membaca semua data terbit dan tidak dapat menambah, mengubah, atau menghapus data apa pun.
- [ ] Admin dapat mengelola seluruh data, foto ke Vercel Blob, akun user, dan menghapus pesan.
- [ ] Tampilan teruji di `360px` (HP) dan desktop tanpa error serta waktu muat utama < 3 detik (Lighthouse).
- [ ] Ter-deploy di Vercel (client, server, MySQL eksternal, Vercel Blob), password admin bukan password seed, `.env` tidak masuk Git, dan `README.md` tersedia.

