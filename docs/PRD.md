# PRD Warga Halim

Nov 12, 2026 · @samid

## 1. Ringkasan dan Asumsi

Warga Halim adalah website kenangan untuk satu perusahaan yang sudah bubar, dengan fokus utama pada profil para mantan karyawannya. Pengunjung yang belum login hanya dapat melihat foto-foto di halaman Home (`/`). Untuk melihat biodata karyawan maupun seluruh data lainnya (daftar karyawan, kenangan bersama, serta pesan dan kesan), pengguna wajib login terlebih dahulu. Semua user yang sudah login dapat melihat seluruh data yang berstatus terbit. Pesan dan kesan antar karyawan (satu karyawan dapat memiliki banyak pesan untuk karyawan lainnya) hanya dikelola oleh admin (tambah dan hapus, tanpa fitur edit pesan), sehingga user biasa tidak dapat menambahkan maupun mengubah pesan apa pun.

**Asumsi yang dipakai dokumen ini** (ubah jika keliru):

- Ada dua peran yang punya akun: Admin (1 orang) dan User (mantan karyawan yang akunnya dibuat oleh admin dengan email dan password).
- Biodata karyawan, kenangan bersama, dan pesan dan kesan sepenuhnya diisi/dikelola oleh admin. User tidak dapat menambahkan, mengubah, atau menghapus pesan apa pun.
- Pengunjung tanpa login hanya dapat melihat foto-foto di halaman Home (`/`), tanpa nama lengkap/biodata karyawan, kenangan, maupun pesan. Jika ingin melihat biodata karyawan dan semua data lainnya, pengunjung harus login terlebih dahulu.
- User yang sudah login (dan admin) dapat melihat semua data terbit: daftar karyawan, biodata lengkap semua karyawan, kenangan bersama, dan pesan dan kesan.
- Foto hanya diunggah oleh admin, user tidak bisa upload. Di halaman detail karyawan (khusus login), jika belum ada foto, karyawan ditampilkan dengan avatar inisial (misalnya "AB" untuk Andi Budi).
- Aplikasi berfokus pada data karyawan, kenangan bersama, serta pesan dan kesan, tanpa tabel profil perusahaan terpisah.
- Target "minimal 10 user" dibaca sebagai minimal 10 akun user yang dibuat oleh admin saat peluncuran.
- Bahasa antarmuka: Indonesia. Hosting: Vercel. Login: JWT. Tidak ada deadline.

## 2. Goals dan Metrik Keberhasilan

Tujuan utama: memberi mantan karyawan satu tempat yang rapi untuk mengenang rekan kerja mereka, kenangan bersama, serta pesan dan kesan antar karyawan.

**Goals**

1. Menampilkan daftar dan biodata sekitar 25 mantan karyawan sebagai fokus utama aplikasi (khusus user yang login).
2. Menyajikan galeri foto-foto sebagai pratinjau publik di Home bagi pengunjung yang belum login sebelum masuk ke aplikasi.
3. Menyimpan kenangan bersama dalam bentuk cerita bertanggal yang tertaut ke karyawan terkait.
4. Menyediakan pesan dan kesan dari satu karyawan untuk karyawan lainnya (1 karyawan dapat memiliki banyak pesan untuk karyawan lainnya) yang dikelola oleh admin.
5. Memberi admin panel sederhana untuk mengelola semua konten (karyawan, kenangan, tambah/hapus pesan) dan akun user tanpa menyentuh database langsung.

**Non-goals** (sengaja tidak dikerjakan di versi pertama)

- Penambahan, pengeditan, atau penghapusan pesan oleh user.
- Fitur edit pesan oleh admin maupun user.
- Upload foto oleh user, dan upload video.
- Registrasi mandiri oleh pengunjung/user secara terbuka.
- Aplikasi mobile native.

**Metrik keberhasilan**

| Metrik | Target | Cara cek |
| --- | --- | --- |
| Akun user terdaftar | Minimal 10 saat peluncuran | Hitung baris `users` dengan role user |
| Profil karyawan terisi lengkap | Minimal 10 saat peluncuran, target 25 | Hitung baris di tabel karyawan |
| Kenangan terpublikasi | Minimal 5 | Hitung baris kenangan berstatus terbit |
| Pesan dan kesan tersimpan | Minimal 10 | Hitung baris di tabel `messages` |
| Halaman Home dan halaman terproteksi terbuka di HP dan desktop | Tanpa error | Tes manual di 2 ukuran layar |
| Waktu muat halaman utama | Di bawah 3 detik di koneksi biasa | Cek dengan Lighthouse |

## 3. Target User dan Peran

Pengguna utama adalah mantan karyawan yang ingin bernostalgia. Ada tiga peran: pengunjung (tanpa login), user (mantan karyawan dengan akun dari admin), dan admin.

| Peran | Siapa | Login? | Boleh apa |
| --- | --- | --- | --- |
| Pengunjung | Siapa pun yang punya link | Tidak | Hanya melihat foto-foto di halaman Home (`/`) dan halaman Login (`/login`). Tidak bisa melihat daftar/biodata karyawan, kenangan, maupun pesan dan kesan |
| User | Mantan karyawan yang akunnya dibuat admin | Ya, email dan password | Melihat semua data terbit: daftar karyawan, biodata lengkap dirinya sendiri maupun semua karyawan lain, kenangan, serta pesan dan kesan. Tidak dapat menambahkan, mengubah, atau menghapus data apa pun |
| Admin | Pemilik proyek (1 orang) | Ya, email dan password | Semua hak user, ditambah mengelola karyawan, kenangan, menambah dan menghapus pesan (tanpa edit pesan), mengelola akun user, serta satu-satunya yang bisa mengunggah foto |

**Gambaran pengguna:** mantan karyawan yang membuka link dari grup chat di HP, melihat foto-foto di Home, lalu login dengan akun dari admin untuk melihat biodata rekan kerja, kenangan, serta pesan dan kesan. Karena itu halaman harus ringan, nyaman di HP, dan tulisannya besar serta jelas.

## 4. Scope Proyek

Versi pertama (MVP) hanya mengerjakan kolom Must-have. Kolom Nice-to-have dikerjakan setelah MVP selesai dan stabil.

| Area | Must-have (MVP) | Nice-to-have (setelah MVP) |
| --- | --- | --- |
| Beranda (Home) | Halaman pembuka publik: menampilkan foto-foto karyawan yang tersedia, tombol Masuk (`/login`), dan navigasi menu setelah login | - |
| Karyawan | Daftar kartu dan halaman detail biodata (khusus yang sudah login), pencarian nama, foto karyawan yang diunggah admin | User mengubah biodatanya sendiri |
| Kenangan | Daftar kenangan bertanggal dan halaman detail (khusus yang login), tag karyawan yang terlibat | Foto untuk kenangan (diunggah admin) |
| Pesan dan kesan | Daftar pesan antar karyawan (1 karyawan dapat membuat/memiliki banyak pesan untuk karyawan lainnya), khusus dibaca oleh user login, dan hanya ditambah/dihapus oleh admin (tanpa edit pesan) | - |
| Akun user | Login, logout (menu nama user dan tombol Keluar di header), admin membuat dan mengelola akun user | Lupa password lewat email, ganti password |
| Admin | Login JWT, CRUD karyawan dan kenangan, tambah & hapus pesan (tanpa edit), kelola akun user, unggah foto karyawan | Dashboard ringkasan angka |
| Tampilan | Responsif HP dan desktop, bahasa Indonesia | Dark mode, export PDF |

**Di luar scope (tidak dikerjakan):** registrasi mandiri oleh user, input/edit/hapus pesan oleh user, edit pesan oleh admin, upload foto oleh user, upload video, login lewat Google atau media sosial, komentar publik tanpa moderasi, notifikasi email, multi-bahasa.

## 5. Detail Fitur

Setiap fitur ditulis dengan aturan sederhana dan kriteria penerimaan (acceptance criteria) supaya mudah dicek: kalau semua poin terpenuhi, fitur dianggap selesai.

### F1. Halaman Beranda / Home (publik)

- Halaman pembuka yang dapat diakses tanpa login, berfokus pada galeri foto-foto karyawan yang sudah diunggah admin (tanpa menampilkan biodata karyawan, kenangan, maupun pesan).
- Menampilkan tombol Masuk (`/login`) bagi pengunjung yang belum login dan ajakan login untuk melihat biodata karyawan serta seluruh data lainnya.
- Setelah login, user dapat melihat seluruh menu navigasi menuju Karyawan, Kenangan, dan Pesan dan Kesan, serta nama user dan tombol Keluar di header.
- Selesai jika: pengunjung tanpa login hanya bisa melihat foto-foto dan tombol Masuk di Home, dan langsung diarahkan ke `/login` saat mencoba membuka menu atau URL data lainnya.

### F2. Karyawan dan Biodata (khusus login)

- Daftar karyawan berbentuk kartu: foto (jika sudah diunggah admin; jika belum ada memakai avatar inisial), nama panggilan dan nama lengkap. Hanya admin yang dapat mengunggah, mengubah, atau menghapus foto karyawan.
- Kolom pencarian nama yang memfilter daftar langsung saat mengetik.
- Halaman daftar maupun halaman detail biodata hanya bisa diakses user yang sudah login (baik untuk mengakses biodata dirinya sendiri maupun orang lain; pengunjung tanpa login diarahkan ke `/login`).
- Halaman detail berisi foto (atau avatar inisial jika belum ada foto) dan biodata: nama lengkap, nama panggilan, kota asal (opsional), hobi (opsional), kontak (opsional), dan kutipan favorit (opsional), serta kenangan dan pesan kesannya.
- Selesai jika: semua data karyawan muncul setelah login, pencarian bekerja, pengunjung tanpa login tidak bisa membuka daftar maupun detail biodata, dan data kosong (misalnya tanpa kontak) tidak merusak tampilan.

### F3. Kenangan (khusus login)

- Daftar kenangan, terbaru di atas (hanya dapat diakses setelah login). Tiap kartu berisi judul, tanggal kejadian, dan potongan cerita.
- Halaman detail menampilkan cerita lengkap dan daftar karyawan yang di-tag.
- Selesai jika: pengunjung tanpa login diarahkan ke `/login`, kenangan bisa dibuka dari daftar setelah login, dan klik nama karyawan membuka biodatanya.

### F4. Pesan dan Kesan (khusus login)

- Satu pesan menghubungkan satu karyawan pengirim (*dari*) ke satu karyawan penerima (*untuk*). **Satu karyawan dapat memiliki banyak pesan untuk karyawan lainnya.** Berisi isi pesan dan, opsional, kesan singkat (satu kalimat).
- Halaman pesan hanya dapat diakses oleh user yang sudah login (`GET /api/messages`).
- **Hak Akses Pesan:**
  - User yang sudah login hanya dapat membaca seluruh pesan dan kesan antar karyawan berstatus `published`. User tidak dapat menambah, mengubah, maupun menghapus pesan.
  - Penambahan dan penghapusan pesan sepenuhnya dikelola oleh Admin melalui Panel Admin (`/admin/*`), **tanpa fitur edit pesan (`PUT`/`PATCH`)** baik untuk user maupun admin.
- Halaman khusus (`/pesan`) menampilkan semua pesan terbit; di halaman detail karyawan (`/karyawan/:id`) menampilkan pesan terkait karyawan tersebut.
- Selesai jika: pengunjung tanpa login diarahkan ke `/login`, user login bisa membaca seluruh pesan terbit dengan identitas pengirim dan penerima yang jelas, dan pesan hanya dapat ditambah/dihapus oleh Admin tanpa fitur edit.

### F5. Login dan Sesi User

- Tidak ada halaman registrasi `/daftar` dan endpoint `POST /auth/register`; akun user dibuat oleh admin melalui Panel Admin.
- Tidak ada halaman terpisah Akun Saya; setelah login, header cukup menampilkan **nama user** dan tombol **Keluar** (admin juga melihat tautan Panel Admin).
- Login dengan email dan password, satu halaman login (`/login`) untuk admin dan user. Berhasil: server mengirim token JWT, disimpan di Zustand (`localStorage`), dipakai di setiap request yang butuh login.
- Selesai jika: login berhasil dengan akun yang dibuat admin, nama user dan tombol Keluar muncul di header, token kedaluwarsa mengarahkan kembali ke login, dan user biasa tidak bisa membuka halaman admin.

### F6. Panel Admin (khusus admin)

- Halaman admin (`/admin/*`):
  - Kelola **Karyawan**: tambah, ubah, hapus, status `Draft`/`Terbit`, serta unggah, mengganti, atau menghapus foto (JPG, PNG, atau WebP, maksimal 2 MB).
  - Kelola **Kenangan**: tambah, ubah, hapus, status `Draft`/`Terbit`, serta tag karyawan.
  - Kelola **Pesan dan Kesan**: hanya **tambah** (pilih karyawan pengirim, karyawan penerima yang berbeda, isi pesan, kesan opsional) dan **hapus** pesan (**tidak ada fitur edit pesan**). Pesan yang ditambahkan admin langsung tampil.
  - Kelola **Akun User**: tambah, ubah, aktif/nonaktifkan, dan hapus akun user.
- Konten `employees` dan `memories` punya status Draft atau Terbit; hanya yang Terbit tampil di sisi user.
- Hapus selalu meminta konfirmasi. Setiap aksi menampilkan toast sukses atau gagal.
- Selesai jika: halaman admin tidak bisa dibuka tanpa login sebagai admin, admin bisa menambah/menghapus pesan (tanpa edit), dan perubahan di panel langsung terlihat di sisi user setelah login.

## 6. User Flow

Ada tiga alur: pengunjung (belum login) hanya melihat foto-foto di Home dan diarahkan ke Login untuk melihat data lainnya, user (mantan karyawan yang sudah login) dapat melihat seluruh data (biodata semua karyawan, kenangan, pesan dan kesan), dan admin mengelola semua data serta akun user.

&#91;embedded content: alur admin, user, dan pengunjung · 3 jalur, 12 langkah\]

### Alur pengunjung

1. Membuka link dari grup chat dan masuk ke Beranda / Home (`/`).
2. Melihat galeri foto-foto karyawan yang tersedia dan tombol Masuk (`/login`).
3. Jika mencoba membuka menu atau URL Karyawan, detail biodata, Kenangan, maupun Pesan dan Kesan tanpa login, pengunjung otomatis diarahkan ke halaman Login (`/login`).
4. Jika alamat tidak ada, melihat halaman "tidak ditemukan" dengan tombol kembali ke Home (`/`).

### Alur admin

1. Membuka `/login`, mengisi email dan password.
2. Jika benar, token disimpan di Zustand dan panel admin terbuka. Jika salah, muncul toast error dan form tetap ada.
3. Membuka menu Akun User untuk membuat akun user baru, mengubah, menonaktifkan, atau menghapus akun.
4. Memilih modul Karyawan atau Kenangan untuk menambah, mengubah (Draft/Terbit), atau menghapus data serta mengunggah/mengganti foto karyawan.
5. Memilih modul Pesan dan Kesan untuk menambahkan pesan baru (memilih karyawan pengirim -> karyawan penerima, pesan, dan kesan opsional) atau menghapus pesan (tanpa fitur edit).
6. Setiap aksi simpan atau hapus menampilkan toast sukses/gagal, dan data terbit langsung terlihat oleh user yang login.
7. Jika token kedaluwarsa, admin otomatis diarahkan ke halaman login.

### Alur user

1. Akun didaftarkan oleh admin sehingga tidak ada form registrasi mandiri.
2. Login di `/login`. Setelah berhasil, token disimpan di Zustand, header menampilkan nama user dan tombol Keluar, dan user dapat membuka seluruh data: daftar karyawan, biodata lengkap dirinya maupun semua karyawan lain, kenangan, serta pesan dan kesan.
3. User hanya dapat membaca data dan tidak dapat menambahkan, mengubah, atau menghapus apa pun.
4. Jika token kedaluwarsa, user diarahkan ke halaman login.

## 7. UI/UX

Nuansa yang dituju: hangat, tenang, nostalgia. Bukan terasa seperti website bisnis, tapi seperti album kenangan. Menggunakan warna biru langit dan putih lalu diberikan tambahan merah scarlet.

### Daftar halaman

| Halaman | Alamat (route) | Akses | Isi utama |
| --- | --- | --- | --- |
| Beranda (Home) | `/` | Publik | Galeri foto-foto (tanpa biodata) dan tombol Masuk bagi pengunjung belum login; ringkasan & navigasi menu bagi user login |
| Daftar Karyawan | `/karyawan` | User | Kolom cari, grid kartu karyawan (nama lengkap dan nama panggilan). Pengunjung diarahkan ke login |
| Detail Karyawan | `/karyawan/:id` | User | Foto, biodata lengkap, kenangan terkait, pesan kesan (yang dikirim/diterima). Pengunjung diarahkan ke login |
| Daftar Kenangan | `/kenangan` | User | Daftar kartu kenangan. Pengunjung diarahkan ke login |
| Detail Kenangan | `/kenangan/:id` | User | Cerita lengkap, karyawan yang di-tag. Pengunjung diarahkan ke login |
| Pesan dan Kesan | `/pesan` | User | Semua pesan antar karyawan (pengirim -> penerima) untuk dibaca user login. Pengunjung diarahkan ke login |
| Login | `/login` | Publik | Form email dan password untuk admin dan user |
| Panel Admin | `/admin/*` | Admin | Kelola karyawan (+ foto), kenangan, pesan (tambah & hapus), dan akun user |
| Tidak ditemukan | `*` | Publik | Pesan "Halaman tidak ditemukan" dan tombol ke Home |

### Sketsa tata letak (teks)

```
BERANDA (HOME - PENGUNJUNG)
+--------------------------------------+
| Menu: Home  [Masuk]                  |
+--------------------------------------+
|        WARGA HALIM                   |
|  [Foto] [Foto] [Foto] [Foto]         |
|  [Masuk untuk melihat biodata & data]|
+--------------------------------------+
| Footer: dibuat dengan kenangan       |
+--------------------------------------+

DETAIL KARYAWAN (USER LOGIN)
+--------------------------------------+
| (AB)  Andi Budi (Andi)               |
+--------------------------------------+
| Biodata: kota, hobi ...              |
| Pesan dan Kesan                      |
| Kenangan bersama                     |
+--------------------------------------+
```

### Aturan tampilan

- **Responsif:** mulai dari HP (lebar 360 px) lalu melebar ke desktop. Grid kartu: 1 kolom di HP, 2 di tablet, 3 di desktop.
- **Gaya & Palet Warna:**
  - **Sky Blue (`#8ECDF2`)**: Warna nuansa utama/latar header/aksen lembut yang memberikan kesan hangat dan ramah.
  - **White (`#FFFFFF`)**: Warna dasar latar kartu, form container, dan teks kontras.
  - **Scarlet (`#E32636`)**: Warna aksen untuk tombol utama (primary button) dan elemen penting, bukan memenuhi seluruh tampilan.
  - *(Catatan: Palet ini merupakan contoh palet awal yang harmonis, bukan kode mutlak yang mengunci; aksen scarlet difokuskan pada tombol aksi utama).*
  - **Tipografi:** huruf serif untuk judul dan sans-serif untuk isi, ukuran isi minimal 16 px.
- **Avatar:** lingkaran berisi inisial nama, warna ditentukan dari nama agar konsisten. Di daftar maupun detail karyawan (user login), foto dari admin menggantikan inisial jika ada; hanya admin yang dapat mengunggah atau mengubah foto.
- **Tiga kondisi wajib di setiap halaman data:** loading (tampilkan kerangka kosong), kosong ("Belum ada data"), dan error (pesan ramah plus tombol coba lagi).
- **Toast** muncul di pojok untuk hasil aksi: sukses (hijau), gagal (merah).
- **Form admin & login:** tiap kolom punya label, pesan error dalam bahasa Indonesia tepat di bawah kolom, dan tombol Simpan/Masuk nonaktif saat sedang memproses.
- **Aksesibilitas dasar:** kontras teks cukup, semua tombol bisa dipakai dengan keyboard, gambar atau ikon bermakna punya teks alternatif.
- **Menu atas:** pengunjung yang belum login hanya melihat Home dan tombol Masuk. Setelah login, menu menampilkan Home, Karyawan, Kenangan, Pesan dan Kesan, serta **nama user dan tombol Keluar** di header (admin juga melihat tautan Panel Admin).

## 8. Database Overview

Database: MySQL, diakses lewat library `mysql2`. Ada 5 tabel. Semua tabel memakai `utf8mb4` dan punya kolom `created_at` serta `updated_at` kecuali dicatat lain.

| Tabel | Fungsi | Kolom utama |
| --- | --- | --- |
| `users` | Akun login: admin (1 baris) dan user (mantan karyawan) | `id`, `name`, `email` (unik), `password_hash`, `role` (`admin` atau `user`), `is_active` |
| `employees` | Biodata karyawan | `id`, `full_name`, `nickname`, `hometown`, `hobby`, `contact`, `favorite_quote`, `photo_url`, `status` |
| `memories` | Kenangan bersama | `id`, `title`, `event_date`, `story`, `status` |
| `memory_employees` | Penghubung kenangan dan karyawan yang di-tag (tanpa `updated_at`) | `memory_id`, `employee_id` (keduanya jadi primary key) |
| `messages` | Pesan dan kesan antar karyawan | `id`, `sender_employee_id`, `recipient_employee_id`, `message`, `impression`, `created_at`, `updated_at` |

**Relasi**

- Satu karyawan dapat membuat banyak pesan untuk karyawan lainnya (`messages.sender_employee_id` mengarah ke `employees.id`), dan satu karyawan dapat menerima banyak pesan (`messages.recipient_employee_id` mengarah ke `employees.id`), dengan syarat pengirim dan penerima adalah karyawan yang berbeda (`sender_employee_id <> recipient_employee_id`).
- Satu kenangan bisa melibatkan banyak karyawan, dan satu karyawan bisa ada di banyak kenangan (many-to-many lewat `memory_employees`).
- Menghapus karyawan ikut menghapus seluruh pesan di mana ia menjadi pengirim atau penerima serta tag kenangannya (`ON DELETE CASCADE`). Kenangan tidak ikut terhapus.

**Aturan data**

- `status` di `employees` dan `memories` bernilai `draft` atau `published`. Sisi user hanya membaca `published`. Seluruh pesan pada `messages` langsung aktif/terbit saat dibuat admin dan dapat dihapus jika diperlukan (di sisi user hanya tampil jika kedua karyawan terkait berstatus `published`).
- `password_hash` berisi hasil hash bcrypt, jangan pernah menyimpan password asli.
- `contact`, `hobby`, `hometown`, `impression`, `favorite_quote`, dan `photo_url` boleh kosong (`NULL`). Kolom lain wajib diisi.
- Foto tidak disimpan di database. Kolom `photo_url` hanya berisi alamat file di penyimpanan eksternal.
- Index tambahan: `employees.full_name` (untuk pencarian) dan `memories.event_date` (untuk urutan).
- Tidak ada registrasi publik; akun `user` dibuat oleh admin melalui Panel Admin. Akun `admin` hanya dibuat lewat file seed.
- Siapkan file seed berisi 1 akun admin dan data contoh karyawan, kenangan, pesan antar karyawan, serta user agar bisa didemokan.

## 9. Technical Requirements

Aplikasi dibagi dua: **client** (tampilan, React) dan **server** (API, Express). Client memanggil server lewat HTTP, server membaca dan menulis ke MySQL.

### Stack dan tugas tiap library

| Library | Dipakai untuk |
| --- | --- |
| Vite + React 19 + TypeScript | Tampilan, build cepat, tipe data yang aman |
| React Router | Perpindahan halaman (route di bagian UI/UX) |
| TanStack Query | Mengambil data dari API, cache, status loading dan error |
| Zustand | Menyimpan token login, data user, dan status admin di client (tanpa React Context dan tanpa `useReducer`) |
| React Hook Form + Zod | Form login & admin beserta validasinya (lewat `zodResolver`) |
| react-hot-toast | Notifikasi sukses atau gagal |
| Express + TypeScript | Server API |
| mysql2 | Koneksi dan query ke MySQL (pakai connection pool dan query berparameter) |
| Zod (di server) | Validasi isi request sebelum masuk database |
| dotenv | Membaca file `.env` di server (client memakai `import.meta.env`) |
| bcryptjs, jsonwebtoken | Hash password dan token JWT |
| cors, helmet, express-rate-limit | Keamanan dasar, batas percobaan login |

**Aturan state client:** Authentication dan global client state wajib menggunakan **Zustand**. **Tidak menggunakan React Context maupun `useReducer`.**

### Struktur folder

```
warga-halim/
  client/
    src/
      pages/        halaman (Home, Employees, EmployeeDetail, ...)
      components/   komponen kecil (EmployeeCard, MemoryCard, ...)
      features/     per modul: api, hooks, schema Zod
      stores/       Zustand (authStore)
      lib/          axios/fetch helper, util
  server/
    src/
      routes/       definisi URL
      controllers/  penanganan HTTP request dan response
      services/     business logic dan query database
      schemas/      Zod untuk validasi
      middleware/   auth JWT (authenticate, authorize), rate limiter, error handler
      types/        TypeScript request augmentation (express.d.ts)
      db/           koneksi pool, file schema.sql, seed.sql
      app.ts        membuat Express app
```

### Daftar endpoint API

Semua dimulai dengan `/api`. Respons selalu berbentuk `{ success, data, message }`.

| Method | Path | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/photos` | Publik | Daftar URL foto karyawan terbit yang memiliki foto (tanpa biodata) untuk tampilan Home pengunjung |
| GET | `/employees?search=` | User atau Admin | Daftar karyawan terbit, bisa dicari (wajib token login) |
| GET | `/employees/:id` | User atau Admin | Detail biodata karyawan + foto + pesan terkait + kenangan (wajib token login) |
| GET | `/memories` dan `/memories/:id` | User atau Admin | Daftar dan detail kenangan terbit (wajib token login) |
| GET | `/messages` | User atau Admin | Semua pesan terbit beserta info karyawan pengirim dan penerima (wajib token login) |
| POST | `/auth/login` | Publik | Kirim email dan password, terima token JWT |
| GET | `/auth/me` | User atau Admin | Cek token masih valid, kembalikan data akun |
| GET, POST, PUT, DELETE | `/admin/employees`, `/admin/memories` | Admin | Kelola data karyawan dan kenangan (daftar admin juga memuat draft) |
| GET, POST, DELETE | `/admin/messages` | Admin | Lihat, tambah, dan hapus pesan antar karyawan (tanpa endpoint edit/PUT) |
| POST, DELETE | `/admin/employees/:id/photo` | Admin | Unggah atau hapus foto karyawan (JPG, PNG, WebP, maks 2 MB) |
| GET, POST, PUT, DELETE | `/admin/users` | Admin | Lihat, tambah, ubah, nonaktifkan, atau hapus akun user |

### Aturan teknis

- **Keamanan & Akses (Setting Default):**
  - Password wajib di-crypt (di-hash) menggunakan `bcryptjs` (salt rounds: 10) dan jangan pernah disimpan sebagai plaintext.
  - Token JWT ditandatangani dan diverifikasi menggunakan `JWT_SECRET` yang aman (berlaku 1 hari / `1d`).
  - Validasi akun user: nama minimal 5 karakter, email minimal 5 karakter (format email valid), password minimal 6 karakter.
  - Semua query memakai parameter (`?`) agar kebal SQL injection, login dibatasi 5 percobaan per menit, CORS hanya untuk alamat client.
  - Server memeriksa token dan role (`admin` atau `user`) serta status `is_active` pada setiap endpoint terproteksi.
  - Tanpa token valid, publik hanya bisa mengakses `POST /auth/login` dan `GET /photos` (yang hanya mengembalikan foto-foto tanpa biodata).
  - User dengan role `user` hanya melihat data berstatus `published`; data `draft` hanya terlihat oleh `admin`.
- **Validasi dua lapis:** Zod di form (cek cepat untuk pengguna) dan Zod di server (pengaman sebenarnya).
- **Error (Setting Default):** Server menggunakan kode HTTP standar (`400` input/file tidak valid, `401` belum login/token tidak valid atau kedaluwarsa, `403` akses ditolak/role tidak cukup/akun nonaktif, `404` data tidak ditemukan atau masih `draft` untuk non-admin, `409` konflik data unik seperti email duplikat, `429` terlalu banyak percobaan login, `500` error server). Client menampilkan pesan bahasa Indonesia yang ramah lewat toast.
- **Environment (`.env`):** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `CLIENT_URL`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob) di server; `VITE_API_URL` di client. File `.env` tidak boleh masuk Git; sediakan `.env.example`.
- **TypeScript:** mode `strict` aktif, tidak memakai tipe `any`.
- **Deploy di Vercel:** client dan server di-deploy sebagai dua project Vercel. Express dijalankan sebagai serverless function (`app.ts` mengekspor app, ada `vercel.json` untuk mengarahkan `/api`). Vercel tidak menyediakan MySQL, jadi database harus di-host di layanan eksternal yang bisa diakses dari internet (misalnya Railway, Aiven, atau TiDB Cloud), dengan ukuran pool kecil karena serverless membuat banyak koneksi.
- **Upload foto:** hanya admin yang boleh (server memeriksa role). Format JPG, PNG, atau WebP, maksimal 2 MB, dicek di client dan di server. Vercel tidak menyimpan file di server secara permanen, jadi foto disimpan di **Vercel Blob** dan database hanya menyimpan URL-nya.

## 10. Definisi Selesai, Tahapan, dan Risiko

Proyek dianggap selesai (MVP) jika semua kotak di bawah tercentang.

### Definisi selesai

- [ ] Seluruh fitur F1 sampai F6 lulus kriteria penerimaan masing-masing.
- [ ] Frontend dibangun menggunakan Vite + React 19 + TypeScript, TanStack Query, dan **Zustand** (tanpa React Context dan tanpa `useReducer`).
- [ ] Minimal 10 akun user dibuat oleh admin, minimal 10 karyawan terisi lengkap (target 25), minimal 5 kenangan terbit, dan minimal 10 pesan dan kesan terbit.
- [ ] Halaman Home (`/`), halaman Login (`/login`), seluruh halaman user yang terproteksi, dan Panel Admin tampil benar di HP (lebar 360 px) dan desktop, tanpa teks terpotong.
- [ ] Pengunjung yang belum login hanya dapat melihat foto-foto di halaman Home (`/`) dan halaman Login (`/login`), serta tidak dapat mengakses daftar/biodata karyawan, kenangan, pesan dan kesan, maupun Panel Admin.
- [ ] Semua user yang sudah login dapat melihat semua data terbit (karyawan, biodata, kenangan, pesan antar karyawan) dan tidak dapat menambah, mengubah, atau menghapus data apa pun.
- [ ] Admin dapat menambah dan menghapus pesan antar karyawan (1 karyawan dapat memiliki banyak pesan untuk karyawan lainnya) tanpa fitur edit pesan, serta user biasa tidak dapat mengakses `/admin/*`.
- [ ] Sudah ter-deploy di Vercel (client, server, dan Vercel Blob untuk foto) dan bisa dibuka lewat satu link publik.
- [ ] Password admin bukan password dari file seed, dan file `.env` tidak ada di Git.
- [ ] README menjelaskan cara menjalankan di komputer lokal dan cara deploy.

### Tahapan pengerjaan

Kerjakan berurutan. Jangan lanjut ke tahap berikutnya sebelum tahap sebelumnya bisa dites.

1. **Persiapan:** buat repo, folder `client` (Vite + React 19 + TypeScript + Zustand) dan `server`, koneksi MySQL, file `schema.sql` (5 tabel) dan `seed.sql`. Selesai jika server menyala dan bisa membaca satu tabel.
2. **Login & Keamanan:** endpoint `/auth/login` dan `/auth/me`, hash password, JWT, role admin dan user, pengecekan `is_active`, rate limit 5x/menit, serta middleware pelindung. Selesai jika endpoint terproteksi ditolak (`401`/`403`) tanpa token atau role yang sesuai.
3. **API Foto Publik & Data Login:** endpoint `GET /photos` (publik, hanya URL foto) serta endpoint `GET` khusus login untuk karyawan (`/employees`, `/employees/:id`), kenangan (`/memories`, `/memories/:id`), dan pesan (`/messages`). Selesai jika pengunjung tanpa token hanya bisa mengambil `GET /photos` dan ditolak (`401`) di endpoint data lain.
4. **API Admin:** tambah, ubah, hapus untuk karyawan (+ unggah foto ke penyimpanan eksternal), kenangan, akun user, serta tambah & hapus pesan (tanpa edit pesan), lengkap dengan validasi Zod. Selesai jika input salah dan file foto yang tidak sesuai ditolak dengan pesan jelas.
5. **Halaman Home, Login, & Halaman User:** layout, header (nama user + tombol Keluar saat login), Zustand `authStore`, halaman Home (`/`) berisi foto-foto untuk publik, halaman Login (`/login`), serta halaman terproteksi (`/karyawan`, `/karyawan/:id`, `/kenangan`, `/kenangan/:id`, `/pesan`) dengan TanStack Query. Selesai jika pengunjung hanya bisa melihat foto-foto di Home & Login, semua halaman data punya kondisi loading, kosong, dan error, serta user login bisa melihat semua data.
6. **Panel admin:** shell `/admin/*`, tabel dan form (React Hook Form + Zod), toast, konfirmasi hapus, kelola karyawan + foto, kenangan, pesan (tambah & hapus saja), dan akun user. Selesai jika admin bisa mengelola semua data dan akun user dari browser.
7. **Isi data dan uji:** masukkan data asli, tes manual semua alur di HP dan desktop. Selesai jika definisi selesai di atas tercentang.
8. **Deploy:** siapkan database eksternal, deploy server lalu client, atur environment variable. Selesai jika website bisa dibuka dari HP lewat link publik.
9. **REMINDER:** jangan pernah upload data penting seperti api key, env password dan data credential lainnya.

### Risiko dan penanganan

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Data karyawan belum lengkap | Halaman terlihat kosong | Isi bertahap, gunakan status draft, kolom opsional boleh kosong |
| Express di Vercel serverless dan MySQL eksternal | Koneksi database gagal atau lambat | Tes deploy sederhana di tahap 1, pool koneksi kecil |
| Privasi biodata karyawan diakses publik tanpa izin | Data pribadi mantan karyawan tersebar | Pengunjung tanpa login hanya melihat foto-foto di Home; seluruh endpoint dan halaman daftar/biodata karyawan, kenangan, serta pesan wajib login |
| Admin lupa password | Tidak bisa mengelola konten | Sediakan skrip reset password yang menulis ulang hash di database |
| Pesan tidak akurat atau salah tulis karena tidak ada fitur edit | Pesan keliru tampil | Admin dapat menghapus pesan yang keliru lalu membuat pesan baru |
| Percobaan tebak password pada `/login` | Risiko akses tidak sah | Batas 5 percobaan per menit di `/auth/login`, admin bisa menonaktifkan akun |
| Foto terlalu besar atau format salah | Halaman lambat atau upload gagal | Batas 2 MB, hanya JPG, PNG, WebP, file lain ditolak di server |
| Penyimpanan file eksternal belum disiapkan | Foto tidak bisa diunggah setelah deploy | Siapkan penyimpanan di tahap 1 bersama database, uji satu unggahan |
