# RUNBOOK INSIDEN DARURAT - MASJID NURUL HUDA

Dokumen ini dipakai untuk tindakan cepat saat deploy, insiden database, rollback aplikasi, dan rotasi secret production.

## 1. Database D1

**Nama database:** `masjidnurulhuda-db`

**Status deploy awal:**

- D1 remote fresh, dibuat via `npx wrangler d1 create`.
- Belum ada tabel sebelum pipeline pertama berjalan.
- Migration production berada di folder `migrations/` dan dijalankan oleh GitHub Actions:
  - `0001_init_schema.sql`
  - `0002_seed_initial_data.sql`
  - `0003_proposal_workflow.sql`
  - `0004_add_audit_columns.sql`
  - `0005_add_indexes.sql`
- `0006_media_library.sql`
- `0007_reconcile_bendahara_role.sql` (sementara no-op bypass untuk bug wrapper migration D1 remote; bedah schema users dilakukan manual via `fix.sql` + `wrangler d1 execute` dan wajib dicatat)

**Backup data remote:**

```bash
npx wrangler d1 export masjidnurulhuda-db --remote --output=backup-YYYY-MM-DD.sql
```

**Restore data remote:**

```bash
npx wrangler d1 execute masjidnurulhuda-db --remote --file=backup-terakhir.sql
```

## 2. Rollback Aplikasi

Jika setelah deploy web tidak bisa dibuka atau API gagal berat:

1. Masuk ke Cloudflare Dashboard.
2. Buka **Workers & Pages** -> project `masjidnurulhuda`.
3. Buka tab **Deployments**.
4. Pilih deployment sebelumnya yang statusnya **Success**.
5. Klik **Rollback**.
6. Jalankan health check pada bagian 3.

## 3. Health Check

Pastikan API publik berikut merespons `status: success`:

- `https://masjidnurulhuda.com/api/public/kas/summary`
- `https://masjidnurulhuda.com/api/public/jadwal/today`

Pastikan flow admin minimum berjalan:

- Login gagal dengan password salah tidak membocorkan stack trace.
- Login sukses dengan akun superadmin.
- Halaman Laporan Kas tampil tanpa error.
- Logout sukses.

## 4. Secret Production

Secret yang wajib tersedia:

- GitHub Actions secrets:
  - `CF_ACCOUNT_ID`
  - `CF_API_TOKEN`
- Cloudflare Pages runtime secret:
  - `JWT_SECRET`

`CF_API_TOKEN` wajib berupa Custom API Token dengan scope Account:

- D1 Edit
- Pages Edit
- Worker Scripts Edit

Token standar "Edit Workers" tidak cukup untuk menjalankan migration D1 dari GitHub Actions, karena D1 berada di level akun Cloudflare.

Set atau rotasi `JWT_SECRET` production:

```bash
npx wrangler pages secret put JWT_SECRET --project-name masjidnurulhuda
```

Catatan:

- `JWT_SECRET` production wajib berbeda total dari nilai di `.dev.vars` lokal.
- Setelah `JWT_SECRET` dirotasi, sesi login lama tidak valid dan user perlu login ulang.

## 5. Checklist Pipeline & Routing

GitHub Actions:

- Step `name` yang mengandung tanda baca seperti titik dua (`:`) harus memakai double quotes.
- Runner memakai Node.js 24.
- Migration D1 memakai:

```bash
npx wrangler d1 migrations apply masjidnurulhuda-db --remote
```

Jangan tambahkan flag `--batch` pada `d1 migrations apply`.

Cloudflare Pages Functions:

- File `functions/api/[[path]].ts` wajib ada untuk proyek hybrid Vue SPA + Hono.
- Trace production: `/api/*` -> `functions/api/[[path]].ts` -> `server/index.ts` -> router Hono.
- Jika wrapper hilang, deploy hanya melayani file statis Vue dan API bisa gagal dengan HTML/405.

## 6. Pre-Production Smoke Test (Local)

Tujuan: verifikasi kesiapan deploy **sebelum push/deploy** (bukan hit domain production).

Waktu eksekusi terakhir: **2026-05-08 09:47 WIB**  
Environment: **local workspace (Windows 11, Node test runner + Vite build)**

Checklist hasil:

- [x] `npm test` -> **pass 21/21**
- [x] `npm run build` -> **success** (bundle frontend terbangun tanpa error)
- [x] Smoke media minimum via integration test:
  - `GET /api/admin/media` (list + query guard)
  - `GET /api/public/media/*` termasuk fallback legacy thumbnail
  - rollback parsial upload media (R2 sukses, insert D1 gagal) tervalidasi
- [~] Uji manual endpoint admin media dengan kredensial runtime nyata:
  - `POST /api/admin/media`
  - `PATCH /api/admin/media/:id`
  - `DELETE /api/admin/media/:id`
  - status: dijadwalkan pada tahap post-deploy/pages.dev karena butuh session admin aktif + binding remote.

Catatan:

- Smoke test pre-production difokuskan ke local candidate (test + build + integration) untuk mencegah false-positive dari domain yang belum aktif.
- Post-deploy verification tetap wajib dilakukan di domain Pages aktif (`*.pages.dev`) setelah rilis.

## 7. Hotfix Manual via `fix.sql` (Role `bendahara`)

Gunakan langkah ini jika migration remote gagal dengan gejala seperti:

- `SQLITE_AUTH` / code `7500` pada operasi schema tertentu, atau
- `SQLITE_CONSTRAINT_FOREIGNKEY` saat rebuild parent table `users` via wrangler migration wrapper.

### 7.1 Script SQL di root project (`fix.sql`)

```sql
PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')) DEFAULT 'pengurus',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new SELECT * FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA foreign_keys = ON;
```

### 7.2 Eksekusi Hotfix ke D1 Remote

Jalankan perintah berikut dari root project:

```bash
npx wrangler d1 execute masjidnurulhuda-db --remote --file=fix.sql
```

Setelah command berhasil, catat di changelog/issue internal minimal:

- timestamp (WIB),
- executor (siapa yang menjalankan),
- environment/DB target,
- SQL yang dijalankan (atau referensi script),
- hasil verifikasi.

### 7.3 Verifikasi Minimum

- Ubah role user menjadi `bendahara` dari UI admin -> **save sukses**.
- Login ulang akun bendahara -> **sukses**.
- Smoke auth/role minimum tidak error.

## 8. Exit Criteria Deploy Awal

Sebelum push ke `main`, pastikan:

- [ ] `npm audit` menunjukkan `found 0 vulnerabilities`.
- [ ] D1 remote masih fresh atau strategi reconcile migration sudah jelas (apply `0007_reconcile_bendahara_role.sql` bila DB non-fresh/live).
- [ ] `CF_ACCOUNT_ID` dan custom `CF_API_TOKEN` level Account tersedia di GitHub Secrets.
- [ ] `JWT_SECRET` sudah dipasang di Cloudflare Pages project `masjidnurulhuda` dan berbeda dari `.dev.vars`.
- [ ] `functions/api/[[path]].ts` tersedia sebagai Pages Functions wrapper untuk Hono.
- [ ] Pipeline GitHub Actions hijau: install, typecheck, migration apply, build, deploy.
- [ ] Health check publik dan flow admin minimum lolos setelah deploy.

Rate limiting login dan automated smoke test CI/CD dipindahkan ke fase Day-2 Operations setelah deploy awal.
