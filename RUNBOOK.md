# RUNBOOK INSIDEN DARURAT - MASJID NURUL HUDA

Dokumen ini dipakai untuk tindakan cepat saat deploy, insiden database, rollback aplikasi, dan rotasi secret production.

## 1. Database D1

**Nama database:** `masjidnurulhuda-db`

**Migration aktif:**

- Migration production berada di folder `migrations/` dan dijalankan berurutan oleh GitHub Actions:
  - `0001_init_schema.sql`
  - `0002_seed_initial_data.sql`
  - `0003_proposal_workflow.sql`
  - `0004_add_audit_columns.sql`
  - `0005_add_indexes.sql`
  - `0006_media_library.sql`
  - `0007_reconcile_bendahara_role.sql` (no-op; rekonsiliasi live lama menggunakan `fix.sql` sesuai bagian 7)
  - `0008_auth_token_version.sql`
  - `0009_add_media_thumb_storage_key.sql`
  - `0010_transaction_void_audit.sql` (rebuild `kas_masjid`, preservasi transaksi, metadata void, dan audit events)
  - `0011_transaction_idempotency.sql` (registry unique per actor/operation/key dan stored response)
  - `0012_idempotency_lifecycle.sql` (state processing/completed untuk claim-first)
  - `0013_security_hardening.sql` (status akun, persistent login limiter, dan security audit events)
  - `0014_reconcile_user_roles.sql` (`operational_role` additive untuk allowlist role final tanpa rebuild parent `users`)

**Backup data remote:**

```bash
npx wrangler d1 export masjidnurulhuda-db --remote --output=backup-YYYY-MM-DD.sql
```

**Restore data remote:**

```bash
npx wrangler d1 execute masjidnurulhuda-db --remote --file=backup-terakhir.sql
```

### Preflight migration finansial

Sebelum migration yang membangun ulang `kas_masjid`, termasuk `0010`:

1. Jangan menjalankan migration remote tanpa persetujuan eksplisit dan maintenance window.
2. Export backup remote bertimestamp ke lokasi aman di luar repository.
3. Catat jumlah transaksi sebelum migration:

```bash
npx wrangler d1 execute masjidnurulhuda-db --remote --command="SELECT COUNT(*) AS transaction_count FROM kas_masjid;"
```

4. Terapkan migration melalui command canonical pada bagian 5.
5. Bandingkan jumlah transaksi sesudah migration dan jalankan:

```bash
npx wrangler d1 execute masjidnurulhuda-db --remote --command="PRAGMA foreign_key_check;"
```

6. Hentikan rollout jika jumlah row berubah tanpa rencana atau foreign-key check menghasilkan row.
7. Rollback aplikasi tidak membatalkan migration D1; restore database memerlukan analisis insiden dan persetujuan eksplisit.

## 1.1 Bootstrap dan recovery superadmin

Migration `0017` menonaktifkan akun yang masih memakai known default hash dan membump `token_version`. Password yang telah dirotasi tidak berubah. Fresh migration tidak menyediakan credential privileged universal.

Untuk bootstrap pertama D1 lokal, jalankan setelah migration selesai. Masukkan secret melalui environment lokal dan jangan menyimpannya di source, `.env` tracked, dokumentasi, atau output log:

```bash
export PROVISION_ADMIN_EMAIL='operator@example.invalid'
export PROVISION_ADMIN_NAME='Recovery Admin'
read -s -p 'Password superadmin: ' PROVISION_ADMIN_PASSWORD
export PROVISION_ADMIN_PASSWORD
printf '\n'
npm run admin:provision:local
unset PROVISION_ADMIN_EMAIL PROVISION_ADMIN_NAME PROVISION_ADMIN_PASSWORD
```

Password minimal 16 karakter dan wajib memiliki huruf kecil, huruf besar, angka, dan simbol; password default/lemah ditolak. Command default idempotent (`INSERT OR IGNORE`) dan tidak mengubah akun existing. Untuk recovery akun existing secara eksplisit, tambahkan `-- --replace-existing`; operasi ini mengaktifkan akun, menetapkan role `superadmin`, merotasi hash, dan merevoke sesi lama. Gunakan `-- --persist-to <path>` bila D1 lokal memakai persistence directory khusus. SQL credential-equivalent diberikan ke Wrangler melalui file sementara acak bermode `0600` di `.wrangler/provision-admin/`, tidak melalui process arguments, dan selalu dihapus pada blok cleanup.

Untuk bootstrap/recovery live testing, gunakan input environment yang sama dan jalankan `npm run admin:provision:testing` (tambahkan `-- --replace-existing` hanya untuk recovery eksplisit). Command ini hard-bound ke `masjidnurulhuda-testing-db` + `wrangler.testing.toml`, tidak dapat digabung dengan `--persist-to`, dan tidak menyediakan mode remote production. Provisioning/recovery production tidak diotomasi oleh script ini; lakukan hanya melalui prosedur insiden/change window terpisah dengan backup dan persetujuan eksplisit.

Sebelum upgrade remote di masa depan: buat export backup bertimestamp di luar repository, catat jumlah users/kas, terapkan migration melalui change window yang disetujui, lalu validasi akun default aktif = 0, preservasi akun terotasi, jumlah/status kas, index penting, `transaction_audit_events`, `PRAGMA foreign_key_check`, dan `PRAGMA foreign_keys`. Jangan memulihkan database secara buta bila legacy row tidak kompatibel; hentikan rollout dan analisis fixture/backup terlebih dahulu.

## 2. Environment deployment dan rollback aplikasi

### Environment deployment permanen

| Git branch | GitHub Environment | Pages | D1 | R2 | Config |
|---|---|---|---|---|---|
| `testing` | `testing` | `masjidnurulhuda-testing` | `masjidnurulhuda-testing-db` | `masjidnurulhuda-testing-media` | `wrangler.testing.toml` |
| `main` | `production` | `masjidnurulhuda` | `masjidnurulhuda-db` | `masjidnurulhuda-media` | `wrangler.toml` |

Workflow `.github/workflows/deploy-testing.yml` hanya merespons branch `testing`; workflow `.github/workflows/deploy.yml` hanya merespons `main`. Keduanya menjalankan test/build/migration harness sebelum migration remote dan deploy. Jangan menukar config antar-environment atau menggunakan resource production untuk smoke testing.

Baseline corrective R3 commit `a6d9e2b` telah dipromosikan ke `testing`. Shell memakai shadcn-vue Sidebar canonical: grouped submenu, desktop icon collapse, mobile off-canvas, geometry desktop 32 px / mobile 44 px / account 48 px, ikon shell 20 px, motion collapse sinkron, nested Escape sheet/account, popup collision aman, dan landmark navigasi/`aria-controls` valid. GitHub Actions run `29453040378` lulus verify + deploy; HTTP smoke publik/admin/API dan custom browser matrix live testing empat role × tiga viewport lulus pada `masjidnurulhuda-testing.pages.dev`. Branch/resource production tetap tidak berubah.

Alur normal: feature/improvement branch → PR ke `testing` → verifikasi live testing → PR `testing` ke `main` → quality gate ulang → production. GitHub Environment `production` direkomendasikan memakai required reviewer agar migration/deploy production tidak berjalan tanpa persetujuan eksplisit.

### Rollback aplikasi

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

Waktu eksekusi terakhir: **2026-07-12 WIB**
Environment: **local workspace (Windows 10, Node test runner + Vite/Wrangler)**

Checklist hasil:

- [x] `npm run test` -> **pass termasuk route finance, claim-loser, dan concurrency P0.2**
- [x] `npm run build` -> **success** (typecheck dan bundle frontend terbangun tanpa error)
- [x] Migration `0010` upgrade lokal: backup dibuat; jumlah transaksi tetap 7/7; kolom void/tabel audit tersedia; FK check bersih.
- [x] Fresh apply migration `0001`-`0010` pada state D1 terisolasi -> success; FK check bersih.
- [x] P0.1 finance safety: seluruh transition audit atomic, DELETE 405, void RBAC/400/409/persistence, dan timeline legacy contract tervalidasi otomatis.
- [x] P0.2 retry safety: direct/proposal/approve/reject/void mewajibkan Idempotency-Key; claim-first, replay/payload conflict, approve/approve, dan approve/reject tervalidasi otomatis.
- [x] P0.2 browser smoke lokal: login fixture ketua, antrean approval, modal konfirmasi + Escape, dan layout desktop tervalidasi; fixture transaksi disposable dibersihkan (remaining `0`).
- [x] P0.3 API contract otomatis: error finance/auth memakai `error.code` stabil (`VALIDATION_ERROR`, `IDEMPOTENCY_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `TRANSACTION_STATE_CHANGED`, `UNAUTHORIZED`, `FORBIDDEN`) dan validation dapat membawa `error.fields`.
- [x] P0.3 authenticated FinanceV2 browser smoke: viewport 360x800 dan desktop 1440x900 tidak overflow; direct/proposal field errors inline terhubung semantik dan fokus ke field invalid pertama; count fixture transaksi P0.3 tersisa `0`.
- [x] P0.4 security closure: exact same-origin + security headers; atomic persistent D1 login limiter dengan `429/Retry-After`; account-management superadmin-only; disable/enable; revocation role/password/status; recovery guards; dan security/login audit tanpa data sensitif.
- [x] Migration `0013` upgrade apply pada D1 lokal existing dan fresh apply `0001`–`0013` pada state Wrangler terisolasi berhasil; backfill `is_active`, dua tabel security, dan foreign-key check terverifikasi.
- [x] P0.5 migration: `0014` menambah `operational_role`; `0015` memastikan bendahara fresh; `0016` menambah safe media lifecycle/reference/outbox. `npm run test:migrations` lulus fresh `0001`–`0016`, upgrade `0015→0016`, ledger 16, preservasi bendahara, backfill media `active`, dan FK bersih.
- [x] P0.5 Wrangler local critical journey: login tiga role, submit proposal, negative approve pengurus, approve ketua, approve bendahara, approved list/summary, audit timeline, idempotency registry, dan FK check lulus pada D1 disposable.
- [x] Audit P0: direct-create pengurus ditolak backend; duplicate response deterministik; timeline privat scoped owner; recovery-admin conditional; upload collision non-overwrite dan cleanup aman terhadap object existing.
- [x] P0.5 Wrangler D1 matrix: concurrency `1×200 + 1×409`, reject dua tahap, role/ownership, period-summary admin/publik, cleanup fixture `0`, dan FK bersih melalui `npm run test:critical-flow:d1`.
- [x] P0.5 auth/Finance/media code gates: auth recovery + out-of-order guard; Finance sequencing/idempotency/pending/error/mobile cards; media reference-aware conditional enqueue + outbox/retry/reconciliation/tombstone; independent review ditindaklanjuti.
- [x] P0.5 authenticated Chromium E2E: `npm run test:e2e:browser` lulus pada 360×800 dan 1366×900 untuk role journey, auth/Finance recovery, conflict, focus/Escape, pending disabled, serta overflow. Temuan shell auth diperbaiki agar status error merender retry overlay.
- [x] P0.5 final closure: 112/112 test, build, fresh+upgrade migration, local apply 0015–0016, Wrangler D1 critical flow/cleanup/FK, browser E2E, dan diff check lulus. Status canonical `Done`.
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
- Evidence lokal tidak membuktikan migration atau deployment remote sudah dilakukan.

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

Post-deploy verification persistent limiter tetap wajib pada Pages aktif; implementasi limiter D1 lokal sudah menjadi baseline sejak P0.4.
