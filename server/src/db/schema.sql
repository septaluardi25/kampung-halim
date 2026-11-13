-- Schema Database Warga Halim
-- Target DBMS: MySQL 8.0+ (InnoDB, utf8mb4)
-- Catatan: Jalankan di dalam database target Anda, misalnya:
--   CREATE DATABASE IF NOT EXISTS warga_halim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE warga_halim;

SET NAMES utf8mb4;

-- 1. Tabel employees (dibuat sebelum users & tabel relasi lainnya)
CREATE TABLE IF NOT EXISTS employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  hometown VARCHAR(150) NULL,
  hobby VARCHAR(255) NULL,
  contact VARCHAR(255) NULL,
  favorite_quote TEXT NULL,
  photo_url VARCHAR(500) NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_employees_full_name (full_name),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel users
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  employee_id INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_employee_id (employee_id),
  CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel memories
CREATE TABLE IF NOT EXISTS memories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  story TEXT NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_memories_event_date (event_date),
  INDEX idx_memories_status_event_date (status, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel memory_employees (pivot many-to-many memories <-> employees, tanpa updated_at)
CREATE TABLE IF NOT EXISTS memory_employees (
  memory_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (memory_id, employee_id),
  CONSTRAINT fk_memory_employees_memory
    FOREIGN KEY (memory_id) REFERENCES memories(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_memory_employees_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel messages (relasi one-to-many pengirim & penerima ke employees)
-- Catatan: Validasi sender_employee_id <> recipient_employee_id diterapkan di lapisan aplikasi (Zod)
-- karena MySQL 8.0 tidak mengizinkan CHECK constraint pada kolom dengan aksi referensial CASCADE.
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_employee_id INT UNSIGNED NOT NULL,
  recipient_employee_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  impression VARCHAR(300) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_sender (sender_employee_id),
  INDEX idx_messages_recipient (recipient_employee_id),
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_employee_id) REFERENCES employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_messages_recipient
    FOREIGN KEY (recipient_employee_id) REFERENCES employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

