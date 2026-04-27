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

## 6. Exit Criteria Deploy Awal

Sebelum push ke `main`, pastikan:

- [ ] `npm audit` menunjukkan `found 0 vulnerabilities`.
- [ ] D1 remote masih fresh atau strategi reconcile migration sudah jelas.
- [ ] `CF_ACCOUNT_ID` dan custom `CF_API_TOKEN` level Account tersedia di GitHub Secrets.
- [ ] `JWT_SECRET` sudah dipasang di Cloudflare Pages project `masjidnurulhuda` dan berbeda dari `.dev.vars`.
- [ ] `functions/api/[[path]].ts` tersedia sebagai Pages Functions wrapper untuk Hono.
- [ ] Pipeline GitHub Actions hijau: install, typecheck, migration apply, build, deploy.
- [ ] Health check publik dan flow admin minimum lolos setelah deploy.

Rate limiting login dan automated smoke test CI/CD dipindahkan ke fase Day-2 Operations setelah deploy awal.
