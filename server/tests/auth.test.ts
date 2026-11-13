import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { env } from '../src/config/env';
import { pool } from '../src/db/pool';
import { createLoginRateLimiter } from '../src/middleware/rateLimiter';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Auth APIs', () => {
  it('AUTH-01: Login berhasil untuk admin & user -> 200, tanpa password_hash', async () => {
    await seedAdmin('Admin Warga', 'admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('User Halim Emp');
    await seedUser('User Halim', 'user@wargahalim.id', 'UserPass123!', empId);

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@wargahalim.id', password: 'AdminPass123!' });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.token).toBeDefined();
    expect(adminRes.body.data.user.role).toBe('admin');
    expect(adminRes.body.data.user.password_hash).toBeUndefined();

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@wargahalim.id', password: 'UserPass123!' });
    expect(userRes.status).toBe(200);
    expect(userRes.body.data.token).toBeDefined();
    expect(userRes.body.data.user.role).toBe('user');
    expect(userRes.body.data.user.employeeId).toBe(empId);
    expect(userRes.body.data.user.password_hash).toBeUndefined();
    expect(userRes.body.data.password_hash).toBeUndefined();
  });

  it('AUTH-02: Password salah & email tidak terdaftar -> 401 dengan pesan identik', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');

    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@wargahalim.id', password: 'WrongPass123!' });
    expect(resWrongPass.status).toBe(401);

    const resNotFound = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@wargahalim.id', password: 'WrongPass123!' });
    expect(resNotFound.status).toBe(401);

    expect(resWrongPass.body.message).toBe(resNotFound.body.message);
  });

  it('AUTH-03: Login akun nonaktif -> 403', async () => {
    await seedUser('User Nonaktif', 'inactive@wargahalim.id', 'UserPass123!', null, 0);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@wargahalim.id', password: 'UserPass123!' });
    expect(res.status).toBe(403);
  });

  it('AUTH-04: Validasi format email & panjang password -> 400', async () => {
    const resBadEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'abc', password: 'Password123' });
    expect(resBadEmail.status).toBe(400);

    const resShortPass = await request(app)
      .post('/api/auth/login')
      .send({ email: 'valid@wargahalim.id', password: '123' });
    expect(resShortPass.status).toBe(400);

    const resEmpty = await request(app).post('/api/auth/login').send({});
    expect(resEmpty.status).toBe(400);
  });

  it('AUTH-05: Rate limiter login membatasi percobaan ke-6 dalam 1 menit -> 429', async () => {
    const testApp = express();
    testApp.use(express.json());
    const limiter = createLoginRateLimiter({ max: 5, windowMs: 60000, skipInTest: false });
    testApp.post('/login-test', limiter, (_req, res) => {
      res.json({ ok: true });
    });

    for (let i = 0; i < 5; i++) {
      const res = await request(testApp).post('/login-test');
      expect(res.status).toBe(200);
    }

    const resBlocked = await request(testApp).post('/login-test');
    expect(resBlocked.status).toBe(429);
  });

  it('AUTH-06: GET /api/auth/me token valid -> 200, tanpa token / expired / invalid -> 401', async () => {
    const empId = await seedEmployee('User Me Emp');
    await seedUser('User Me', 'me@wargahalim.id', 'UserPass123!', empId);
    const token = await loginAs('me@wargahalim.id', 'UserPass123!');

    const resValid = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(resValid.status).toBe(200);
    expect(resValid.body.data.email).toBe('me@wargahalim.id');
    expect(resValid.body.data.employeeId).toBe(empId);
    expect(resValid.body.data.isActive).toBe(true);
    expect(resValid.body.data.password_hash).toBeUndefined();

    // No token -> 401
    const resNoToken = await request(app).get('/api/auth/me');
    expect(resNoToken.status).toBe(401);

    // Random token -> 401
    const resBadToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');
    expect(resBadToken.status).toBe(401);

    // Expired token -> 401
    const expiredToken = jwt.sign(
      { id: 1, email: 'me@wargahalim.id', role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );
    const resExpired = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(resExpired.status).toBe(401);
  });

  it('AUTH-07: User dinonaktifkan setelah dapat token -> request berikutnya ditolak 403', async () => {
    const userId = await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    // Deactivate user in DB
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('AUTH-08: Role diubah di DB setelah token terbit -> middleware memakai role terbaru', async () => {
    const userId = await seedUser('User Promoted', 'promoted@wargahalim.id', 'UserPass123!');
    const token = await loginAs('promoted@wargahalim.id', 'UserPass123!');

    // Promote to admin
    await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  it('AUTH-09: POST /api/auth/register -> 404 (sesuai PRD tidak ada registrasi publik)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Andi Budi', email: 'andi@gmail.com', password: 'password123' });
    expect(res.status).toBe(404);
  });

  it('AUTH-10: Token dengan alg: none / secret salah ditolak -> 401', async () => {
    // Wrong secret
    const wrongSecretToken = jwt.sign(
      { id: 1, email: 'admin@wargahalim.id', role: 'admin' },
      'wrong-secret-key-that-is-different-12345',
      { algorithm: 'HS256' }
    );
    const resWrongSecret = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${wrongSecretToken}`);
    expect(resWrongSecret.status).toBe(401);

    // Alg none simulation (unsigned or forged)
    const forgedToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB3YXJnYWhhbGltLmlkIiwicm9sZSI6ImFkbWluIn0.';
    const resNone = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`);
    expect(resNone.status).toBe(401);
  });
});
