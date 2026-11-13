# ISSUE #07 — Tahap 5: Fondasi Frontend, Zustand, Halaman Publik/User, Route Guards, & API Prerequisite (`GET /api/photos`, `GET /api/employees/:id`)

> **Ditujukan untuk:** Junior Fullstack Developer & AI Coding Model  
> **Sumber Requirement Utama:** `docs/PRD.md`  
> **Referensi Pendukung:** `docs/DEVELOPMENT_PLAN.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DOCUMENTATION.md`, `docs/TEST_PLAN.md`

---

## 0. Audit Dokumentasi & Peringatan Penting Sebelum Mulai

Sebelum menulis satu baris kode pun, **wajib membaca dan memahami aturan berikut**:

1. **Keselarasan Dokumentasi (`PRD.md` adalah Sumber Kebenaran Utama):**
   - Hasil audit antara `docs/PRD.md` dan `docs/API_DOCUMENTATION.md` menemukan bahwa `PRD.md` (Fitur `F2`) mewajibkan kartu `/karyawan` menampilkan **nama panggilan (`nickname`) dan nama lengkap (`full_name`)**. Bagian `3.2 GET /api/employees` pada `docs/API_DOCUMENTATION.md` telah diperbarui agar mencantumkan field `"nickname"` dan pencarian `full_name` / `nickname` sehingga 100% selaras dengan `PRD.md` dan `server/src/controllers/employee.controller.ts`.
   - Dokumen lainnya (`docs/DEVELOPMENT_PLAN.md`, `docs/DATABASE_DESIGN.md`, `docs/TEST_PLAN.md`) sudah selaras dengan `PRD.md`.
   - Jika suatu saat menemukan ketidaksesuaian baru di dokumentasi, **`docs/PRD.md` selalu menang** — ikuti `PRD.md` lalu perbarui file `docs/` yang bertentangan.
2. **Temuan Penting pada Backend (`server/`) saat ini:**
   - Endpoint `GET /api/photos` (untuk Halaman Home publik) dan `GET /api/employees/:id` (untuk Halaman Detail Biodata Karyawan) **belum diimplementasikan** di `server/src/routes/`.
   - Oleh karena itu, Issue ini dikerjakan berurutan: **Tahap 5A (Menyelesaikan 2 Endpoint Backend Prerequisite + Test)** dilanjutkan **Tahap 5B–5D (Membangun Aplikasi Frontend `client/` + Test)**.
3. **Larangan Keras (Hard Constraints):**
   - **DILARANG** menggunakan `React Context` (`createContext`, `useContext`) atau `useReducer` untuk manajemen state auth/aplikasi. Wajib menggunakan **Zustand** (`client/src/stores/authStore.ts`).
   - **DILARANG** menggunakan tipe `any` di TypeScript (`strict: true` wajib aktif di `tsconfig`).
   - **DILARANG** meng-upload file `.env`, password, token Vercel Blob, atau kredensial apa pun ke Git. Selalu gunakan `.env.example` sebagai template dan pastikan `.env` masuk `.gitignore`.
   - **DILARANG** membuat halaman `/daftar`, `/register`, atau `/akun` (`PRD` mengunci sistem hanya menggunakan akun buatan Admin).
   - **DILARANG** menampilkan tombol tulis, edit, atau hapus pesan pada halaman user (`/pesan` dan `/karyawan/:id`). Fitur user 100% **read-only**.
   - **DILARANG** membocorkan nama, biodata, atau foto karyawan berstatus `draft` ke endpoint publik `GET /api/photos` maupun ke user biasa.
   - **JANGAN** mengimplementasikan modul CRUD Admin UI secara penuh di tahap ini (`/admin/*` cukup dibuatkan route guard + halaman shell/placeholder *"Panel Admin — Akan Diimplementasikan pada Tahap 6"*).

---

## 1. Tujuan & Ringkasan Pekerjaan

Menyelesaikan integrasi akhir API publik/user dan membangun aplikasi frontend **Warga Halim** di folder `client/` dengan stack:

- **React 19** + **Vite** + **TypeScript (`strict: true`)**
- **React Router** (`react-router-dom`)
- **Zustand** (`authStore`)
- **TanStack Query** (`@tanstack/react-query`)
- **React Hook Form** + **Zod** (`@hookform/resolvers/zod`)
- **react-hot-toast** (notifikasi bahasa Indonesia)
- **Tailwind CSS** + **Lucide React** (ikon)

### Palet Warna & Tipografi Resmi (`docs/PRD.md` & `docs/TEST_PLAN.md`)
- **Sky Blue (`#8ECDF2`)** — aksen lembut, badge, latar header/kartu sekunder.
- **White (`#FFFFFF`)** — latar utama yang bersih dan lega.
- **Scarlet (`#E32636`)** — **hanya** untuk aksen tombol aksi utama (*CTA*, tombol Masuk/Keluar penting), **jangan** mendominasi seluruh layar.
- **Tipografi:** Font **Serif** untuk judul (`h1`, `h2`, `h3`, brand logo), dan **Sans-serif** ukuran minimal **`16px`** (`text-base`) untuk teks isi agar nyaman dibaca.
- **Responsivitas Wajib:** Teruji rapi pada lebar layar **`360px`** (HP 1 kolom), tablet (2 kolom), dan desktop (`>= 1280px`, 3 kolom) tanpa horizontal scroll/overflow.

---

## 2. Struktur Folder Profesional (Small-to-Medium App)

### 2.1 Penambahan pada `server/` (Tahap 5A)

```text
server/
├── src/
│   ├── controllers/
│   │   ├── employee.controller.ts   <-- [UPDATE] tambah getEmployeeById
│   │   └── photo.controller.ts      <-- [BARU] getPublicPhotos
│   ├── routes/
│   │   ├── employee.route.ts        <-- [UPDATE] tambah GET /employees/:id
│   │   ├── photo.route.ts           <-- [BARU] tambah GET /photos (tanpa authenticate)
│   │   └── index.ts                 <-- [UPDATE] daftarkan photoRoutes
│   └── schemas/
│       └── employee.schema.ts       <-- [UPDATE] tambah employeeIdParamSchema
└── tests/
    └── public.test.ts               <-- [UPDATE] tambah skenario PUB-01 (photos) & PUB-02B (employee detail)
```

### 2.2 Struktur Lengkap `client/` (Tahap 5B–5D)

```text
client/
├── .env.example                     <-- Template VITE_API_URL (tanpa kredensial)
├── index.html                       <-- Judul "Warga Halim" + font Serif & Sans-serif + viewport
├── package.json
├── tsconfig.json                    <-- strict: true, noUnusedLocals, noImplicitAny
├── tsconfig.app.json
├── vite.config.ts
└── src/
    ├── main.tsx                     <-- Entry point: QueryClientProvider + BrowserRouter + Toaster
    ├── App.tsx                      <-- Hydrate auth saat startup + Routes
    ├── index.css                    <-- Tailwind CSS + base font (>=16px) & palet warna
    ├── types/
    │   ├── api.ts                   <-- Interface ApiResponse<T>
    │   ├── auth.ts                  <-- Interface AuthUser, LoginRequest, LoginResponse
    │   ├── employee.ts              <-- Interface PublicPhoto, EmployeeCard, EmployeeDetail
    │   ├── memory.ts                <-- Interface MemoryItem, MemoryDetail
    │   └── message.ts               <-- Interface MessageItem
    ├── lib/
    │   ├── api.ts                   <-- Fetch wrapper (base VITE_API_URL, Bearer token, auto-logout 401)
    │   ├── queryClient.ts           <-- Konfigurasi TanStack QueryClient
    │   ├── avatar.ts                <-- Helper warna deterministik untuk avatar inisial
    │   └── formatDate.ts            <-- Helper format tanggal Indonesia (mis. "17 Agustus 2022")
    ├── stores/
    │   └── authStore.ts             <-- Zustand store + localStorage sync + hydrateAuth
    ├── schemas/
    │   └── auth.schema.ts           <-- Skema Zod login (pesan bahasa Indonesia)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx           <-- Navbar responsif: logo, link menu, nama user + Keluar / Masuk
    │   │   └── MainLayout.tsx       <-- Pembungkus Header + Main container + Footer sederhana
    │   └── ui/
    │       ├── Avatar.tsx           <-- Foto karyawan atau avatar inisial bulat warna deterministik
    │       ├── LoadingSkeleton.tsx  <-- Skeleton kartu, detail, dan list
    │       ├── EmptyState.tsx       <-- Tampilan data kosong ramah bahasa Indonesia
    │       └── ErrorState.tsx       <-- Tampilan error + tombol "Coba Lagi" wajib
    ├── routes/
    │   ├── ProtectedRoute.tsx       <-- Guard user terautentikasi (`user` & `admin`)
    │   └── AdminRoute.tsx           <-- Guard khusus `role === 'admin'`
    ├── pages/
    │   ├── HomePage.tsx             <-- Publik (/): galeri foto + CTA Masuk / ringkasan user login
    │   ├── LoginPage.tsx            <-- Publik (/login): React Hook Form + Zod + Toast
    │   ├── EmployeesPage.tsx        <-- Protected (/karyawan): live search + grid kartu
    │   ├── EmployeeDetailPage.tsx   <-- Protected (/karyawan/:id): biodata lengkap + memories + messages
    │   ├── MemoriesPage.tsx         <-- Protected (/kenangan): daftar kenangan urut terbaru
    │   ├── MemoryDetailPage.tsx     <-- Protected (/kenangan/:id): cerita lengkap + tag karyawan
    │   ├── MessagesPage.tsx         <-- Protected (/pesan): daftar semua pesan (read-only)
    │   ├── AdminPlaceholderPage.tsx <-- Admin (/admin/*): shell placeholder untuk Tahap 6
    │   └── NotFoundPage.tsx         <-- Fallback (*): halaman 404 bahasa Indonesia
    └── tests/
        ├── setup.ts                 <-- Setup Vitest + @testing-library/jest-dom + reset store
        ├── authStore.test.ts        <-- Unit test Zustand authStore & 401 handler
        ├── routeGuards.test.tsx     <-- Test ProtectedRoute & AdminRoute
        ├── loginPage.test.tsx       <-- Test validasi Zod & submit LoginPage
        └── pages.test.tsx           <-- Test HomePage, EmployeesPage, MemoriesPage, MessagesPage
```

---

## 3. Tahap 5A — Implementasi Backend Prerequisite (`server/`)

> **Aturan Keamanan SQL:** Semua query SQL **WAJIB** menggunakan *parameterized query* (`?`) melalui `pool.query`, dilarang melakukan penggabungan string untuk nilai user, dan hanya memilih kolom yang diperlukan (tanpa `SELECT *` pada tabel `users` atau `employees`).

### 3.1 Endpoint 1: `GET /api/photos` (Publik — Tanpa Token)

**Tujuan:** Memberi daftar foto karyawan ke halaman Home (`/`) untuk pengunjung yang belum login tanpa membocorkan nama lengkap, panggilan, atau biodata apa pun.

- **File baru:**
  - `server/src/controllers/photo.controller.ts` (`getPublicPhotos`)
  - `server/src/routes/photo.route.ts` (`router.get('/photos', getPublicPhotos)`)
- **Daftarkan di `server/src/routes/index.ts`:** `router.use('/', photoRoutes);`
- **Aturan Query SQL:**
  ```sql
  SELECT id, photo_url
  FROM employees
  WHERE status = 'published'
    AND photo_url IS NOT NULL
    AND photo_url <> ''
  ORDER BY id ASC
  ```
- **Checklist Keamanan:**
  - Tidak memakai middleware `authenticate`.
  - Karyawan `status = 'draft'` tidak boleh muncul.
  - Karyawan `published` dengan `photo_url IS NULL` atau `''` tidak boleh muncul.
  - Tidak boleh mengembalikan `full_name`, `nickname`, `hometown`, `contact`, atau kolom selain `id` dan `photo_url`.

### 3.2 Endpoint 2: `GET /api/employees/:id` (Terlindungi `authenticate`)

**Tujuan:** Mengembalikan biodata lengkap satu karyawan berstatus `published`, daftar kenangan terkait (`published`), dan daftar pesan terkait (di mana pengirim maupun penerima sama-sama `published`).

- **Update `server/src/schemas/employee.schema.ts`:**
  ```ts
  export const employeeIdParamSchema = z.object({
    id: z.coerce
      .number()
      .int('ID karyawan harus berupa bilangan bulat')
      .positive('ID karyawan harus lebih dari 0'),
  });
  ```
- **Update `server/src/routes/employee.route.ts`:**
  ```ts
  router.get('/employees', authenticate, getEmployees);
  router.get('/employees/:id', authenticate, getEmployeeById);
  ```
- **Update `server/src/controllers/employee.controller.ts` (`getEmployeeById`):**
  1. Validasi `req.params` dengan `employeeIdParamSchema`. Jika gagal -> `400 Bad Request`.
  2. Query detail karyawan:
     ```sql
     SELECT id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url
     FROM employees
     WHERE id = ? AND status = 'published'
     LIMIT 1
     ```
     Jika baris kosong -> **`404 Not Found`** (`"Karyawan tidak ditemukan"`).
  3. Query kenangan terkait (`published`):
     ```sql
     SELECT m.id, m.title, DATE_FORMAT(m.event_date, '%Y-%m-%d') AS event_date
     FROM memory_employees me
     INNER JOIN memories m ON m.id = me.memory_id
     WHERE me.employee_id = ? AND m.status = 'published'
     ORDER BY m.event_date DESC, m.id DESC
     ```
  4. Query pesan terkait (pengirim **dan** penerima harus `published`):
     ```sql
     SELECT
       msg.id,
       msg.sender_employee_id,
       s.full_name AS sender_name,
       msg.recipient_employee_id,
       r.full_name AS recipient_name,
       msg.message,
       msg.impression,
       msg.created_at
     FROM messages msg
     INNER JOIN employees s ON s.id = msg.sender_employee_id
     INNER JOIN employees r ON r.id = msg.recipient_employee_id
     WHERE (msg.sender_employee_id = ? OR msg.recipient_employee_id = ?)
       AND s.status = 'published'
       AND r.status = 'published'
     ORDER BY msg.created_at DESC, msg.id DESC
     ```
  5. Petakan tiap pesan dengan menambahkan `sender_initials: generateInitials(msg.sender_name)` dan `recipient_initials: generateInitials(msg.recipient_name)`.
  6. Kembalikan `200 OK` dengan `initials: generateInitials(emp.full_name)`, `memories`, dan `messages`.

---

## 4. Tahap 5B — Setup Fondasi Frontend (`client/`)

### 4.1 Inisialisasi Project & Dependencies
Buat folder `client/` di root monorepo (`4-kampung-halim/client`).

- **Dependencies (`client/package.json`):**
  - `react` (`^19.0.0`), `react-dom` (`^19.0.0`)
  - `react-router-dom` (`^7.x`)
  - `@tanstack/react-query` (`^5.x`)
  - `zustand` (`^5.x`)
  - `react-hook-form` (`^7.x`), `@hookform/resolvers`, `zod`
  - `react-hot-toast`
  - `lucide-react`
- **DevDependencies:**
  - `vite`, `@vitejs/plugin-react`, `typescript` (`~5.x`), `@types/react`, `@types/react-dom`
  - `tailwindcss`, `@tailwindcss/vite` (atau konfigurasi PostCSS Tailwind yang bersih)
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- **Scripts di `client/package.json`:**
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "preview": "vite preview",
      "typecheck": "tsc --noEmit",
      "test": "vitest run"
    }
  }
  ```

### 4.2 Konfigurasi TypeScript & Environment
- `tsconfig.json` / `tsconfig.app.json` wajib mengaktifkan:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true
    }
  }
  ```
- Buat `client/.env.example`:
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```
- Pastikan `client/.env` **tidak pernah di-commit** ke Git (verifikasi dengan `git status` agar tidak ada credential yang terbawa).

### 4.3 API Client (`client/src/lib/api.ts`)
Implementasikan wrapper `fetch` bertipe generik (`apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T>`):
1. Baca base URL dari `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'` (hapus trailing slash jika ada).
2. Ambil `token` dari `useAuthStore.getState().token`. Jika ada, otomatis pasang header:
   `Authorization: Bearer ${token}`
3. Set `Content-Type: application/json` jika body bukan `FormData`.
4. Parse JSON response (`ApiResponse<T>`).
5. **Penanganan HTTP `401` Otomatis:**
   - Jika response status **`401`** dan endpoint bukan `/auth/login`:
     1. Panggil `useAuthStore.getState().logout()`.
     2. Tampilkan toast `"Sesi Anda telah berakhir, silakan masuk kembali"` (gunakan `toastId` tetap agar tidak menumpuk).
     3. Redirect ke `/login` (jika belum berada di `/login`).
   - Jika `!response.ok` atau `json.success === false`:
     - Lempar custom class `ApiError(response.status, json.message || 'Terjadi kesalahan pada server')`.
   - Jika sukses: kembalikan `json.data` bertipe `T`.

### 4.4 TanStack Query (`client/src/lib/queryClient.ts`)
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 menit
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 4.5 Zustand Auth Store (`client/src/stores/authStore.ts`)
> **WAJIB:** Gunakan Zustand (`create`). **Jangan** membuat `React Context` atau `useReducer`!

- **Key `localStorage`:** `'warga_halim_token'`. Saat startup aplikasi (`App.tsx`), **wajib** memverifikasi token lewat `GET /api/auth/me` agar perubahan `is_active = 0` atau akun dihapus langsung terdeteksi.
- **State:**
  - `user: AuthUser | null` (`{ id, name, email, role, employee_id, is_active }`)
  - `token: string | null`
  - `isAuthenticated: boolean`
  - `isHydrated: boolean` (bernilai `false` sebelum pengecekan awal token selesai, menjadi `true` setelah `hydrateAuth()` selesai)
- **Actions:**
  - `setAuth(token: string, user: AuthUser): void` -> simpan token ke `localStorage`, set `token`, `user`, `isAuthenticated: true`, `isHydrated: true`.
  - `logout(): void` -> hapus token dari `localStorage`, bersihkan `queryClient.clear()`, set `token: null`, `user: null`, `isAuthenticated: false`, `isHydrated: true`.
  - `hydrateAuth(): Promise<void>`:
    1. Baca token dari `localStorage`.
    2. Jika tidak ada token -> set `isAuthenticated: false, user: null, token: null, isHydrated: true`.
    3. Jika ada token -> pasang `token` ke state sementara, lalu panggil `GET /api/auth/me`.
    4. Jika berhasil (`200`) -> set `user: data`, `isAuthenticated: true`, `isHydrated: true`.
    5. Jika gagal (`401` / `403` / error auth) -> panggil `logout()` (yang juga mengeset `isHydrated: true`).

---

## 5. Tahap 5C — Route Guards, Layout, & Komponen UI Wajib

### 5.1 Route Guards (`client/src/routes/`)
1. **`ProtectedRoute.tsx`:**
   - Membaca `isAuthenticated`, `isHydrated` dari `useAuthStore`.
   - Jika `!isHydrated`, tampilkan `LoadingSkeleton` (jangan langsung redirect sebelum cek `/auth/me` selesai).
   - Jika `isHydrated && !isAuthenticated`, `<Navigate to="/login" state={{ from: location }} replace />`.
   - Jika terautentikasi, render `<Outlet />`.
2. **`AdminRoute.tsx`:**
   - Membaca `user`, `isAuthenticated`, `isHydrated` dari `useAuthStore`.
   - Jika `!isHydrated`, tampilkan `LoadingSkeleton`.
   - Jika `!isAuthenticated`, `<Navigate to="/login" state={{ from: location }} replace />`.
   - Jika `user?.role !== 'admin'`, tolak akses dengan tampilan **"403 — Akses Ditolak"** berbahasa Indonesia serta tombol kembali ke `/karyawan` (atau redirect + toast `"Anda tidak memiliki izin mengakses halaman Admin"`).
   - Jika `user?.role === 'admin'`, render `<Outlet />`.

### 5.2 Header & Layout (`client/src/components/layout/`)
- **`Header.tsx`:**
  - Kiri: Logo/Judul `"Warga Halim"` (font serif, link ke `/`).
  - Tengah (hanya tampil jika `isAuthenticated === true`):
    - Link `/karyawan` ("Karyawan")
    - Link `/kenangan` ("Kenangan")
    - Link `/pesan` ("Pesan")
    - Link `/admin` ("Panel Admin") -> **HANYA tampil jika `user?.role === 'admin'`**
  - Kanan:
    - Jika **belum login**: Tombol `"Masuk"` (warna aksen Scarlet `#E32636`, link ke `/login`).
    - Jika **sudah login**: Tampilkan nama user (`user.name`) dan tombol `"Keluar"` (memanggil `logout()`, bersihkan cache, toast `"Anda telah keluar"`, arahkan ke `/`).
  - **Mobile (`360px`):** Wajib memiliki menu toggle/hamburger yang mudah diklik tanpa teks terpotong atau horizontal scroll.

### 5.3 Komponen State & Avatar (`client/src/components/ui/`)
1. **`LoadingSkeleton.tsx`:** Mendukung `variant?: 'grid' | 'detail' | 'list' | 'page'` dengan animasi `animate-pulse`.
2. **`EmptyState.tsx`:** Props `title`, `description`, dan opsional `actionLabel` + `onAction`.
3. **`ErrorState.tsx`:** Props `message?: string` dan `onRetry?: () => void`. Wajib menampilkan tombol **"Coba Lagi"** yang memanggil `onRetry` (`refetch()` dari TanStack Query).
4. **`Avatar.tsx`:**
   - Props: `src?: string | null`, `name: string`, `initials?: string`, `size?: 'sm' | 'md' | 'lg' | 'xl'`.
   - Jika `src` tersedia dan termuat: tampilkan `<img>` dengan `alt={`Foto ${name}`}` dan fallback `onError` ke avatar inisial.
   - Jika `src` `null` / gagal dimuat: tampilkan lingkaran berisi `initials` (2 huruf kapital) dengan warna latar **deterministik** (dihitung dari string `name` di `lib/avatar.ts` sehingga warna untuk nama yang sama selalu konsisten).

---

## 6. Tahap 5D — Spesifikasi Detail Setiap Halaman (`client/src/pages/`)

| Route | Komponen | Akses | Query / API | Perilaku & Kriteria Wajib |
| --- | --- | --- | --- | --- |
| `/` | `HomePage` | Publik | `GET /api/photos` (`useQuery`) | **Jika belum login:** Hero perkenalan singkat, tombol `"Masuk"` (Scarlet `#E32636`), dan galeri foto karyawan (`photo_url`) tanpa teks nama/biodata apa pun. <br>**Jika sudah login:** Sapaan hangat dengan `user.name`, kartu pintasan ke `/karyawan`, `/kenangan`, `/pesan` (dan `/admin` khusus admin), serta galeri foto. <br>Wajib punya Skeleton, EmptyState, dan ErrorState + Coba Lagi. |
| `/login` | `LoginPage` | Publik (redirect ke `/karyawan` jika sudah login) | `POST /api/auth/login` | Gunakan `react-hook-form` + `zodResolver(loginSchema)`. Validasi: <br>- Email: wajib diisi, min 5 karakter, format email valid. <br>- Password: wajib diisi, min 6 karakter. <br>Pesan error tampil di bawah input (bahasa Indonesia). Saat loading, tombol `"Masuk"` `disabled` + teks `"Memproses..."`. Error `401`/`403`/`429` tampil via `toast.error(...)` tanpa menghapus isi email. Jika sukses -> `setAuth(token, user)`, `toast.success(...)`, redirect ke halaman tujuan atau `/karyawan`. |
| `/karyawan` | `EmployeesPage` | Protected | `GET /api/employees?search=...` | Live search (debounce ~250ms). Grid `1` kolom (`360px`), `2` kolom (tablet), `3` kolom (desktop). Setiap kartu menampilkan `<Avatar>`, `nickname`, `full_name`, klik membuka `/karyawan/:id`. Wajib punya Skeleton, EmptyState, dan ErrorState + Coba Lagi. |
| `/karyawan/:id` | `EmployeeDetailPage` | Protected | `GET /api/employees/:id` | Tombol kembali ke `/karyawan`. Header (`Avatar` besar, `full_name`, `nickname`). Grid biodata (`hometown`, `hobby`, `contact`, `favorite_quote`): jika `NULL`/kosong tampilkan `"Belum diisi"` atau `-` rapi. Bagian **"Kenangan Bersama"** (link ke `/kenangan/:id` + tanggal terformat). Bagian **"Pesan & Kesan"** (read-only: pesan yang dikirim atau diterima). Jika `404` -> tampilkan `"Data karyawan tidak ditemukan"` + tombol kembali. |
| `/kenangan` | `MemoriesPage` | Protected | `GET /api/memories` | Daftar kenangan terbaru di atas (`title`, tanggal Indonesia, cuplikan `story`), klik menuju `/kenangan/:id`. Wajib Skeleton, EmptyState, ErrorState + Coba Lagi. |
| `/kenangan/:id` | `MemoryDetailPage` | Protected | `GET /api/memories/:id` | `title`, tanggal, cerita lengkap (`whitespace-pre-line`), dan chip **Karyawan yang Terlibat** (`Avatar` + `full_name`) yang mengarah ke `/karyawan/:id`. |
| `/pesan` | `MessagesPage` | Protected | `GET /api/messages` | Daftar pesan & kesan **read-only**: **Pengirim -> Penerima** (dengan avatar/inisial & link `/karyawan/:id`), isi `message`, serta kotak `impression` jika ada. **Tidak ada tombol tambah/edit/hapus.** |
| `/admin/*` | `AdminPlaceholderPage` | Admin Only (`AdminRoute`) | - | Shell halaman Admin (*"Panel Admin akan diimplementasikan pada Tahap 6"*). |
| `*` | `NotFoundPage` | Publik | - | Halaman `"404 — Halaman tidak ditemukan"` dalam bahasa Indonesia + tombol kembali ke `/`. |

---

## 7. Skenario Testing Lengkap Per API & Frontend (Beserta Contoh Request–Response)

> **ATURAN WAJIB TESTING:**
> 1. **Reset Data Setiap Skenario (`beforeEach`):** Setiap skenario uji backend **WAJIB** menghapus seluruh data di semua tabel terlebih dahulu sebelum menanam data uji (*seeding*) agar hasilnya 100% konsisten dan deterministik:
>    ```sql
>    DELETE FROM messages;
>    DELETE FROM memory_employees;
>    DELETE FROM memories;
>    DELETE FROM users;
>    DELETE FROM employees;
>    ```
>    *(Pastikan `server/tests/setup.ts` menjalankan hook `beforeEach` di atas untuk setiap `it(...)`).*
> 2. **Reset State Frontend (`beforeEach`):** Setiap skenario uji frontend wajib menjalankan `localStorage.clear()`, `useAuthStore.getState().logout()`, dan `queryClient.clear()`.
> 3. **Tanpa Kredensial Produksi:** Seluruh email/password/token pada test menggunakan data dummy lokal.

### 7.1 Contoh Request & Response + Matriks Skenario Lengkap Per Endpoint API

#### A. `GET /api/photos` (Publik)
- **Contoh Request:**
  ```http
  GET /api/photos
  ```
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "photo_url": "https://example.public.blob.vercel-storage.com/employees/1-foto.jpg"
      }
    ],
    "message": "Daftar foto galeri berhasil diambil"
  }
  ```
- **Skenario Test Wajib:**
  - `API-PHOTO-01`: Ada employee A (`published`, ada `photo_url`), B (`published`, `photo_url: null`), C (`draft`, ada `photo_url`). Tanpa token -> `200 OK`, hanya mengembalikan `[ { id: A.id, photo_url } ]` tanpa field `full_name`, `nickname`, `hometown`, `contact`.
  - `API-PHOTO-02`: Tidak ada employee berfoto -> `200 OK`, `data: []`.

#### B. `POST /api/auth/login` (Publik + Rate Limit 5x/menit)
- **Contoh Request:**
  ```http
  POST /api/auth/login
  Content-Type: application/json

  {
    "email": "andi@example.com",
    "password": "password123"
  }
  ```
- **Contoh Response Sukses (`200 OK`):**
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
- **Contoh Response Error (`401 Unauthorized`):**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Email atau password salah"
  }
  ```
- **Skenario Test Wajib:** Login sukses user (`200`), login sukses admin (`200`), password/email salah (`401` dengan pesan identik), akun nonaktif `is_active = 0` (`403`), validasi format email/password pendek (`400`), percobaan ke-6 dalam 1 menit (`429`).

#### C. `GET /api/auth/me` (Protected)
- **Contoh Request:**
  ```http
  GET /api/auth/me
  Authorization: Bearer <jwt_token>
  ```
- **Contoh Response Sukses (`200 OK`):**
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
- **Skenario Test Wajib:** Tanpa token -> `401`; token valid + aktif -> `200` (tanpa `password_hash`); token valid tetapi user sudah dinonaktifkan admin (`is_active = 0`) -> `403`.

#### D. `GET /api/employees` (Protected)
- **Contoh Request:**
  ```http
  GET /api/employees?search=Andi
  Authorization: Bearer <jwt_token>
  ```
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "full_name": "Andi Budi",
        "nickname": "Andi",
        "photo_url": null,
        "initials": "AB"
      }
    ],
    "message": "Daftar karyawan berhasil diambil"
  }
  ```
- **Skenario Test Wajib:** Tanpa token -> `401`; token valid -> `200` hanya `published`; `?search=` cocok `full_name` atau `nickname` -> `200`; `?search=` milik `draft` -> `[]`; `?search=' OR '1'='1` (SQL injection check) -> `200` `[]` tanpa bocor data; `?search=` > 100 karakter -> `400`.

#### E. `GET /api/employees/:id` (Protected)
- **Contoh Request:**
  ```http
  GET /api/employees/1
  Authorization: Bearer <jwt_token>
  ```
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "full_name": "Andi Budi",
      "nickname": "Andi",
      "hometown": null,
      "hobby": "Bersepeda",
      "contact": null,
      "favorite_quote": null,
      "photo_url": null,
      "initials": "AB",
      "memories": [
        { "id": 2, "title": "Outing Puncak 2022", "event_date": "2022-08-17" }
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
          "message": "Terima kasih selalu membantu!",
          "impression": "Rekan kerja yang sabar.",
          "created_at": "2026-11-12T10:00:00.000Z"
        }
      ]
    },
    "message": "Detail biodata karyawan berhasil diambil"
  }
  ```
- **Contoh Response Error (`404 Not Found` untuk `draft` / tidak ada):**
  ```json
  {
    "success": false,
    "data": null,
    "message": "Karyawan tidak ditemukan"
  }
  ```
- **Skenario Test Wajib:**
  - `API-EMPDET-01`: Tanpa token -> `401`.
  - `API-EMPDET-02`: Employee `published` dengan beberapa field `NULL` -> `200`, `memories` hanya menampilkan kenangan `published`, `messages` hanya menampilkan pesan antar kedua employee `published`.
  - `API-EMPDET-03`: ID milik employee `draft` atau ID tidak ada (`99999`) -> `404`.
  - `API-EMPDET-04`: Param ID tidak valid (`/api/employees/abc` atau `/api/employees/0`) -> `400`.

#### F. `GET /api/memories` & `GET /api/memories/:id` (Protected)
- **Contoh Request & Response `GET /api/memories` (`200 OK`):**
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
- **Contoh Request & Response `GET /api/memories/2` (`200 OK`):**
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
          "photo_url": null,
          "initials": "AB"
        }
      ]
    },
    "message": "Detail kenangan berhasil diambil"
  }
  ```
- **Skenario Test Wajib:** Tanpa token -> `401`; list urut `event_date DESC` hanya `published`; detail `draft` / tidak ada -> `404`; detail ID non-numerik -> `400`; tag employee pada detail hanya memuat karyawan `published`.

#### G. `GET /api/messages` (Protected)
- **Contoh Request:**
  ```http
  GET /api/messages
  Authorization: Bearer <jwt_token>
  ```
- **Contoh Response Sukses (`200 OK`):**
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
        "message": "Terima kasih selalu membantu!",
        "impression": "Rekan kerja yang sabar.",
        "created_at": "2026-11-12T10:00:00.000Z",
        "updated_at": "2026-11-12T10:00:00.000Z"
      }
    ],
    "message": "Daftar pesan dan kesan berhasil diambil"
  }
  ```
- **Skenario Test Wajib:** Tanpa token -> `401`; hanya mengembalikan pesan dengan **kedua** employee (`sender` & `recipient`) berstatus `published`; tidak ada endpoint `POST`/`PUT`/`PATCH`/`DELETE /api/messages` untuk user biasa (`404`).

---

### 7.2 Skenario Test Frontend (`client/src/tests/`)

| ID | Target | Skenario | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| `FE-STORE-01` | `authStore` | `setAuth` dan `logout` | `setAuth` menyimpan token ke `localStorage`, set `isAuthenticated = true` & `user`. `logout` menghapus token dari `localStorage` dan mereset state. |
| `FE-STORE-02` | `authStore` + `api.ts` | `hydrateAuth` valid vs `401`/`403` | Token valid -> `isAuthenticated = true`. Token ditolak (`401`/`403`) -> auto-logout & `isHydrated = true`. |
| `FE-GUARD-01` | `ProtectedRoute` | Pengunjung vs User Login | Saat `isHydrated = false` tampil skeleton; belum login -> redirect `/login`; sudah login -> render outlet. |
| `FE-GUARD-02` | `AdminRoute` | User biasa (`role: 'user'`) vs Admin | User biasa ditolak (`403` / redirect); Admin berhasil melihat konten. |
| `FE-LOGIN-01` | `LoginPage` | Validasi Zod client-side | Email tidak valid / < 5 char atau password < 6 char memunculkan error bahasa Indonesia di bawah input **tanpa** memanggil `fetch`. |
| `FE-LOGIN-02` | `LoginPage` | Submit sukses & gagal `401` | Sukses -> simpan auth & pindah halaman. Gagal `401` -> toast error muncul, isi email tidak hilang. |
| `FE-HOME-01` | `HomePage` | Loading, Empty, Error (Coba Lagi), & Galeri Publik | Skeleton tampil saat loading; EmptyState tampil saat `[]`; tombol **"Coba Lagi"** muncul saat error dan memicu ulang fetch; galeri foto publik tampil tanpa nama karyawan. |
| `FE-EMP-01` | `EmployeesPage` & `EmployeeDetailPage` | Live search, Avatar inisial, & Field `NULL` | Ketik di pencarian memanggil `?search=...`; `photo_url: null` merender avatar inisial; field `NULL` pada detail tampil rapi tanpa error. |
| `FE-MEM-01` | `MemoriesPage` & `MemoryDetailPage` | Daftar & Tag Karyawan | Daftar menampilkan judul/tanggal/cuplikan; detail menampilkan cerita lengkap & chip karyawan menuju `/karyawan/:id`. |
| `FE-MSG-01` | `MessagesPage` | Tampilan Read-Only | Menampilkan pengirim -> penerima, pesan, kesan; terverifikasi **tidak ada** tombol Tambah, Edit, atau Hapus. |

---

## 8. Verifikasi Akhir & Format Laporan

Sebelum membuat commit / Pull Request, jalankan seluruh perintah berikut:

1. **Backend (`server/`):**
   - `npm run typecheck` (wajib 0 error)
   - `npm test` (wajib 100% lulus)
2. **Frontend (`client/`):**
   - `npm run typecheck` (wajib 0 error, `strict: true`)
   - `npm run build` (Vite production build wajib sukses)
   - `npm test` (wajib 100% lulus)
3. **Audit Kode & Keamanan Git:**
   - Jalankan `git status` dan pastikan **tidak ada** `.env`, password, atau token di folder mana pun.
   - Pastikan **0 kemunculan** `createContext`, `useReducer`, dan `: any` di `client/src/`.

### Format Laporan Wajib Setelah Selesai:
1. Daftar file lengkap yang dibuat dan dimodifikasi (`server/`, `client/`, `docs/`).
2. Daftar seluruh endpoint yang ditambahkan/digunakan pada Tahap 5 beserta level aksesnya.
3. Contoh Request & Response aktual di setiap endpoint dari hasil pengujian.
4. Output hasil testing (`typecheck`, `build`, `vitest`) backend dan frontend, serta hasil audit kebersihan Git & kepatuhan PRD (`no any`, `no React Context`, `no useReducer`, `no .env`).

---

## 9. Acceptance Criteria (Checklist Selesai)

- [ ] `GET /api/photos` dan `GET /api/employees/:id` terimplementasi aman (parameterized SQL, tanpa kebocoran data `draft`/biodata publik) dan lulus tes backend dengan DB reset tiap skenario.
- [ ] Folder `client/` terbentuk dengan struktur profesional (`React 19 + Vite + TypeScript strict`).
- [ ] Zustand `authStore` berfungsi penuh (login, hydrate `/auth/me`, auto-logout on `401`, logout), tanpa `React Context` maupun `useReducer`.
- [ ] TanStack Query, React Router, dan API client (`VITE_API_URL`) berfungsi baik.
- [ ] Halaman Home (`/`), Login (`/login`), Karyawan (`/karyawan`, `/karyawan/:id`), Kenangan (`/kenangan`, `/kenangan/:id`), Pesan (`/pesan`), Admin guard (`/admin/*`), dan `404` (`*`) berfungsi sesuai `PRD.md`.
- [ ] Seluruh halaman data memiliki **Loading Skeleton**, **Empty State**, dan **Error State + tombol Coba Lagi**.
- [ ] Responsif pada layar `360px` dan desktop, memakai palet Sky Blue (`#8ECDF2`), White (`#FFFFFF`), dan aksen Scarlet (`#E32636`), font serif untuk judul dan sans-serif `>= 16px` untuk isi.
- [ ] Seluruh `typecheck`, `build`, dan `test` lulus 100%, serta tidak ada `.env` atau kredensial di Git.

