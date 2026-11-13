-- Seed Data Awal Warga Halim
-- PENTING:
-- 1. Seluruh password disimpan dalam bentuk bcrypt hash (tidak ada password plaintext).
-- 2. Ganti hash password admin sebelum deploy ke produksi menggunakan skrip reset password admin.

SET NAMES utf8mb4;

-- 1. Data contoh karyawan (employees)
INSERT INTO employees (
  id, full_name, nickname, hometown, hobby, contact, favorite_quote, photo_url, status
) VALUES
  (
    1, 'Annisa Dhintianita Santoso', 'Annisa', 'Citayem', 'Null', 'null',
    'Belajar hal baru setiap hari.',
    NULL, 'published'
  ),
  (
    2, 'M Dimas Septaluardi', 'Dimas', 'Depok', 'Tidur', NULL,
    'Kerjas keras Seperti Gibran',
    NULL, 'published'
  ),
  (
    3, 'Feisol Ias Aviandi', 'Feisol', 'Tangerang', NULL, NULL,
    'Sederhana itu elegan.',
    NULL, 'published'
  ),
  (
    4, 'Nadya Jamalludin Malik', 'Nadya', 'tanggerang', 'Membaca buku', 'fitri@contoh.id',
    NULL,
    NULL, 'published'
  ),
  (
    5, 'Fauziyah', 'Ziyah',  NULL, NULL, NULL,
    NULL,
    NULL, 'draft'
  );

-- 2. Akun login (1 admin dibuat lewat seed + contoh akun user)
-- Catatan: Hash bcrypt di bawah merupakan format hash valid bcryptjs ($2a$10$...).
-- Jalankan skrip reset password (saat setup backend) untuk menetapkan password lokal/produksi Anda.
INSERT INTO users (id, name, email, password_hash, role, employee_id, is_active) VALUES
  (
    1,
    'Admin Warga Halim',
    'admin@wargahalim.id',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS',
    'admin',
    NULL,
    1
  ),
  (
    2,
    'Annisa Dhintianita Santoso',
    'annisa@wargahalim.id',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS',
    'user',
    1,
    1
  ),
  (
    3,
    'M Dimas Septaluardi',
    'dimas@wargahalim.id',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS',
    'user',
    2,
    1
  ),
  (
    4,
    'Feisol Ias Aviandi',
    'feisol@wargahalim.id',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS',
    'user',
    3,
    1
  ),
  (
    5,
    'User Belum Tertaut',
    'user.tamu@wargahalim.id',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5r5vA5g2v5z7qW5x5q5z5v5x5q5z5vS',
    'user',
    NULL,
    1
  );

-- 3. Data contoh kenangan (memories)
INSERT INTO memories (id, title, event_date, story, status) VALUES
  (
    1,
    'Outing Puncak 2022',
    '2022-08-17',
    'Perjalanan bersama seluruh tim ke Puncak penuh tawa, games kekompakan, dan makan malam hangat di bawah hujan rintik.',
    'published'
  ),
  (
    2,
    'Peluncuran Produk Perdana',
    '2020-11-10',
    'Malam begadang bersama tim teknologi, produk, dan desain hingga rilis berjalan mulus dan disambut antusias.',
    'published'
  ),
  (
    3,
    'Buka Puasa Bersama Terakhir',
    '2024-03-28',
    'Momen berkumpul terakhir sebelum perusahaan tutup, saling bertukar cerita dan rencana ke depan.',
    'published'
  ),
  (
    4,
    'Catatan Internal (Draft)',
    '2023-05-01',
    'Draf cerita yang masih disusun oleh admin sebelum diterbitkan.',
    'draft'
  );

-- 4. Relasi many-to-many kenangan dan karyawan (memory_employees)
INSERT INTO memory_employees (memory_id, employee_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (2, 1),
  (2, 2),
  (2, 3),
  (3, 1),
  (3, 2),
  (3, 4);

-- 5. Data contoh pesan dan kesan antar karyawan (1 karyawan mengirim banyak pesan ke karyawan lain)
INSERT INTO messages (id, sender_employee_id, recipient_employee_id, message, impression) VALUES
  (
    1,
    1,
    2,
    'Terima kasih selalu saling bantu dan solid selama bekerja bersama.',
    'Rekan kerja yang asyik dan dapat diandalkan.'
  ),
  (
    2,
    1,
    3,
    'Semangat terus, senang pernah satu tim!',
    'Kreatif dan selalu membawa suasana ceria.'
  ),
  (
    3,
    2,
    1,
    'Terima kasih sudah jadi rekan kerja yang luar biasa.',
    'Sangat sabar dan teliti.'
  ),
  (
    4,
    4,
    1,
    'Senang bisa saling kenal dan bekerja bersama di kantor.',
    NULL
  );

