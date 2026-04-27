# Optimalisasi Plan Proyek Masjid Nurul Huda

Dokumen ini dirapikan berbasis status eksekusi agar tidak tercampur: **Done**, **In Progress**, dan **Not Yet**, dengan prioritas tetap mengikuti level dampak.

## Prioritas 1 (Wajib, dampak tinggi)

### Done
- [x] Hardening secret auth baseline:
  - `JWT_SECRET` sudah dipindahkan dari hardcoded ke environment (`c.env.JWT_SECRET`),
  - fallback dev memakai konfigurasi lokal `.dev.vars`/binding, bukan konstanta hardcoded di source,
  - `JWT_SECRET` production wajib berbeda total dari `.dev.vars` lokal.
- [x] Validasi input endpoint transaksi kritis:
  - validasi required field, nominal positif, whitelist tipe, sanitasi keterangan.
- [x] Refactor endpoint transaksi submit:
  - `POST /api/admin/transaction/add-direct` (server paksa `status=approved`, `seksi_id` opsional),
  - `POST /api/admin/transaction/add-proposal` (server paksa `status=pending`, `seksi_id` wajib).
- [x] Penutupan celah bypass role `pengurus`:
  - `POST /approve/:id` dan `DELETE /:id` sudah `403` untuk non-approver.
- [x] Error handling end-to-end area admin kritis:
  - frontend memakai `httpClient` + toast `vue-sonner`,
  - backend route admin kritis (`auth`, `dashboard`, `transaction`, `pengaturan`) sudah memakai helper `sendSuccess/sendError`.
- [x] Standarisasi response API admin kritis:
  - route `auth`, `dashboard`, `transaction`, dan `pengaturan` sudah konsisten memakai helper response terpusat,
  - kontrak utama memakai `status`, `message`, `data`/`errors`; `errorCode` machine-readable belum dipakai dan bisa dievaluasi lagi jika dibutuhkan client.

### In Progress
- [~] Hardening auth/session lanjutan:
  - cookie/session sudah membaik,
  - rotasi secret + runbook lifecycle secret belum finalized,
  - temuan pre-push: `.dev.vars` dan `cookies.txt` sudah dikeluarkan dari index Git dan secret lokal sudah dirotasi.
- [~] Migration versioning D1:
  - folder `migrations/` sudah ada (`0001_init_schema.sql`, `0002_seed_initial_data.sql`),
  - DDL/index dan seed sudah dipisah untuk fresh database,
  - belum ada skrip apply/reset/seed yang konsisten,
  - perlu reconcile jika migration lama pernah apply di D1 remote.

### Not Yet
- [ ] Pisahkan seed dari DDL migration:
  - seed production sudah dipindah ke `migrations/0002_seed_initial_data.sql`,
  - `server/db/schema.sql` masih berisi DDL + seed sebagai reference/reset lokal,
  - perlu skrip reset DB dan seeding agar proses lokal/CI konsisten.

## Prioritas 2 (Penting, stabilitas & maintainability)

### Done
- [x] Refactor API client frontend:
  - `src/services/httpClient.ts` aktif sebagai wrapper fetch,
  - service transaksi sudah migrasi ke `httpClient`,
  - service dashboard dan pengaturan admin sudah migrasi ke `httpClient`,
  - parsing error non-2xx sudah terpusat.
- [x] Migrasi `usePengaturan` ke `httpClient`:
  - `loadData`, `saveItem`, dan `deleteItem` sekarang lewat `pengaturanService`,
  - normalisasi error, `credentials`, dan kontrak response sudah setara dengan service transaksi.
- [x] Konsistensi role matrix final (`superadmin`, `ketua`, `pengurus`) sudah diterapkan pada flow keuangan inti.
- [x] Relasi Kategori Kas dengan Jenis Arus:
  - `kategori_kas.jenis_arus` tersedia di schema/migration,
  - CRUD kategori sudah membawa `jenis_arus`,
  - dropdown kategori kas/proposal terfilter berdasarkan tipe transaksi.
- [x] `seksi_id` opsional pada Kas Langsung:
  - UI Kas Langsung mengirim `seksi_id` bila dipilih,
  - endpoint `POST /api/admin/transaction/add-direct` menyimpan `seksi_id` jika ada dan `null` jika kosong.
- [x] Modularisasi composable mulai berjalan di domain Homepage publik:
  - `useJadwal`, `useKasSummary` (service -> composable -> component).

### In Progress
- [~] Konsistensi RBAC lintas modul admin:
  - transaksi sudah fail-closed,
  - modul admin lain masih perlu audit seragam.
  - temuan audit selesai: `GET /api/admin/dashboard/summary` sudah memakai `requireAuth` + allowlist role eksplisit.
- [~] Type safety menyeluruh frontend-backend (DTO request/response + minim `any`).
  - update Day-2: payload `kasService.submitDirectTransaction`, `kasService.submitProposal`, form `useKas`, payload/list `usePengaturan`, `dashboardService`, dan `pengaturanService` sudah memakai DTO eksplisit.
  - sisa audit: `any` residual masih ada di middleware/service backend, helper response, beberapa component props/catch admin, dan area publik jadwal.

### Not Yet
- [ ] Validasi DTO backend lanjutan:
  - `jenis_arus` perlu divalidasi eksplisit di route `/api/admin/pengaturan/kategori`; saat ini invalid value baru ditolak oleh CHECK constraint DB.
  - `seksi_id` Kas Langsung sudah opsional dan tersimpan bila dikirim, tetapi masih perlu hardening validasi numerik/FK jika payload di luar UI mengirim nilai tidak valid.
- [ ] Optimasi query dan indexing D1:
  - index `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`,
  - query pagination-ready,
  - query dashboard periodik agar tidak full-scan.
  - status audit terbaru: index `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, dan `users(email)` sudah ada di schema/migration.
- [ ] Modularisasi composable admin besar:
  - `useKas` -> `useKasState/useKasFilters/useKasActions`,
  - `usePengaturan` per domain tab.
- [ ] Ekstraksi komponen dropdown reusable:
  - custom dropdown role/kategori/seksi/metode/bulan/tahun masih tersebar di `Pengaturan.vue`, `KasInput.vue`, `KasProposal.vue`, dan `KasLaporan.vue`,
  - berisiko inkonsisten untuk keyboard navigation, close-on-outside, z-index, dan loading state.
- [ ] Tambahkan helper permission frontend terpusat (`canApprove`, `canDelete`, `canViewProposalTab`).

## Prioritas 3 (UX, performa, observability)

### Done
- [x] UX error feedback keuangan:
  - migrasi dari `alert/confirm` ke toast dan validasi UI field highlight.
- [x] Standardisasi Dropdown & Modal:
  - halaman Kas dan Pengaturan sudah memakai custom dropdown/`ConfirmModal.vue`,
  - penghapusan `window.confirm`/`alert` bawaan browser di flow terkait diganti toast dan modal.

### In Progress
- [~] UX loading pada beberapa area publik sudah mulai ada (placeholder/coming soon), belum seragam sebagai skeleton state formal.

### Not Yet
- [ ] UX loading state + anti double-submit lintas modul.
  - temuan audit UI: `ConfirmModal.vue` belum punya state `isConfirming`/disabled tombol confirm saat aksi async berjalan.
- [ ] Optimistic UI terbatas untuk aksi aman.
- [ ] Audit performa bundle (import icon, route chunking, asset compression policy).
- [ ] Structured logging + level log + health endpoint backend.
- [ ] Testing baseline:
  - unit test auth/transaction/validation,
  - integration test flow penting.
- [ ] Dokumentasi operasional:
  - README final, setup lokal, reset DB, checklist deploy.

## Penguatan RBAC Lanjutan (Spesifik Security)

### Done
- [x] Finalisasi rename role ke `pengurus` di backend, frontend, dan dokumentasi.

### Not Yet
- [ ] Proteksi self-lockout (user login tidak boleh menurunkan role dirinya sendiri).
- [ ] Pembatasan `ketua` untuk akun `superadmin` (listing/create/update/delete policy).
- [ ] Invalidasi sesi role lama (force re-login untuk token role di luar matrix final).
- [ ] Test matrix RBAC otomatis (`superadmin`, `ketua`, `pengurus`) untuk endpoint kritis.

## Pengembangan Web Publik (Public Facing Website)

Fokus: website jamaah yang cepat, aman (read-only), dan scalable.

### Done
- [x] Layered Architecture Homepage diterapkan:
  - Service layer: `src/services/public/home/*`
  - Composable layer: `src/composables/public/home/*`
  - UI component layer: `src/components/public/home/*`
- [x] Integrasi jadwal sholat real-time:
  - MyQuran/Kemenag via `jadwalService` + `useJadwal` dengan pencarian ID kota otomatis.
- [x] Endpoint publik read-only kas sudah live:
  - `GET /api/public/kas/summary` (approved-only aggregate, tanpa JWT).
- [x] Kas widget publik sudah konsumsi data asli D1.
- [x] Hardening jadwal publik:
  - query param `kota` diamankan via `encodeURIComponent` pada proxy backend.
  - cache harian + fallback offline sudah menggunakan safe parse untuk mencegah crash saat cache korup.
- [x] Hardening endpoint mutasi admin:
  - validasi `id` numerik pada `approve/:id` dan `delete/:id` untuk mencegah proses `NaN`.

### In Progress
- [~] UX section publik non-kritis (`Kabar`, `Galeri`, `KritikSaran`):
  - sudah ada overlay coming soon glassmorphism,
  - belum masuk fase content/data production.

### Not Yet
- [ ] Endpoint `GET /api/public/articles` + pagination sederhana.
- [ ] Kontrak response publik standar (`status`, `data`, `updatedAt`).
- [ ] Hardening endpoint publik:
  - whitelist field output,
  - validasi query param (`page`, `limit`, `month`, `year`) + max `limit`.
- [ ] Edge caching Cloudflare untuk endpoint publik:
  - `Cache-Control`, `s-maxage`, `stale-while-revalidate`,
  - cache key by route+query,
  - invalidasi cache pasca update konten.
- [ ] Pertimbangkan proxy backend `GET /api/public/jadwal` agar kontrol cache/keandalan terpusat.
- [ ] Tambah SEO baseline (meta dinamis, OG image, JSON-LD organisasi).
- [ ] Optimasi media galeri (WebP/AVIF, lazy load, thumbnail sizing).
- [ ] Lazy-hydration/intersection trigger untuk section non-kritis agar LCP lebih baik.

## Mode Eksekusi (Now / Next / Pre-Go-Live)

### Now (dampak langsung)
- [x] Seragamkan error response backend.
- [x] Final audit RBAC fail-closed lintas semua route `/api/admin/*`.
- [x] Pasang index D1 prioritas tinggi.
  - index Gate 1 sudah ada: `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`.
- [x] Fallback + caching jadwal sholat publik.

### Next (setelah flow stabil)
- [~] Type safety menyeluruh + kurangi `any`.
- [ ] Refactor backend konsisten `Route -> Service -> Query`.
- [ ] Loading UX halus + observability dasar.

### Pre-Go-Live
- [~] Migration versioned + seed terpisah.
  - DDL/index dan seed sudah dipisah di folder `migrations/`,
  - D1 remote production awal dikonfirmasi fresh (dibuat via `npx wrangler d1 create`, belum ada tabel),
  - command CI/CD valid: `npx wrangler d1 migrations apply masjidnurulhuda-db --remote` tanpa flag `--batch`,
  - belum ada test migration otomatis; reconcile hanya diperlukan jika ada remote non-fresh di masa depan.
- [~] Pipeline staging -> production dengan quality gate.
  - `.github/workflows/deploy.yml` sudah ada,
  - `npm run deploy` sudah tersedia di `package.json`,
  - YAML step name yang mengandung tanda baca wajib diberi double quotes agar tidak gagal parse,
  - GitHub Actions runner memakai Node.js 24 untuk menghindari status deprecated,
  - Cloudflare API token untuk CI/CD wajib custom token level Account dengan scope D1 Edit, Pages Edit, dan Worker Scripts Edit; token standar "Edit Workers" tidak cukup untuk D1 account-level,
  - smoke test endpoint inti belum otomatis,
  - cek lokal terbaru: `vue-tsc -b` pass dan `npm run build` pass setelah refresh cache/install dependency.
- [x] Pages Functions wrapper untuk arsitektur hybrid SPA + Hono:
  - `functions/api/[[path]].ts` wajib ada agar request `/api/*` diproses oleh Hono di Cloudflare Pages,
  - tanpa wrapper ini deploy hanya mengirim Vue static files dan API dapat gagal sebagai HTML/405.
- [~] Runbook backup/restore/rollback.
  - `RUNBOOK.md` sudah ada untuk backup/restore D1, rollback Pages, dan health check publik,
  - sudah mencakup rotasi `JWT_SECRET`, health check publik, dan verifikasi admin minimum pasca-deploy/rollback.
- [ ] Security checklist final (rate limit login, dependency audit, production-safe error).
  - status pre-push: `npm audit` = `found 0 vulnerabilities`,
  - `JWT_SECRET` production sudah dipasang via `npx wrangler pages secret put JWT_SECRET --project-name masjidnurulhuda`,
  - rate limiting login dipindahkan ke Day-2 Operations (Post-Deploy).

## Deploy Readiness (1 Halaman)

Tujuan: checklist praktis agar deploy pertama aman, cepat rollback jika gagal, dan minim kejutan di produksi.

### Gate 1 - Go / No-Go Sekarang (Now, blocking)
- [x] Audit fail-closed semua route `/api/admin/*` (pastikan role invalid selalu `403`).
  - status: transaksi + pengaturan + dashboard sudah fail-closed by role.
- [x] Verifikasi kontrak error backend sudah seragam di endpoint kritis (auth, transaksi, pengaturan).
- [x] Pastikan index D1 prioritas tinggi terpasang (`kas_masjid(status,tanggal)`, `users(email)` minimal).
  - hasil audit Gate 1: `server/db/schema.sql` dan `migrations/0001_init_schema.sql` sudah memuat index prioritas (`kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`).
- [x] Smoke test manual endpoint inti:
  - login -> me -> logout,
  - add direct/proposal -> list -> approve/reject -> delete.
  - catatan eksekusi lokal: login -> master-data -> add direct -> list -> add proposal -> approve -> add proposal -> reject -> delete semua data uji -> logout = sukses.
- [x] Cek health publik minimum:
  - `GET /api/public/kas/summary`,
  - `GET /api/public/jadwal/today`.
  - catatan eksekusi lokal: keduanya merespons `status=success`.

Estimasi cepat Gate 1: **0.5 - 1 hari**

### Gate 2 - Stabilkan Operasional (Pre-Go-Live)
- [~] Siapkan migration versioned (`001_init.sql`, dst) + seed terpisah.
  - DDL/index: `migrations/0001_init_schema.sql`,
  - seed: `migrations/0002_seed_initial_data.sql`,
  - status: D1 remote production awal fresh dan belum punya tabel, jadi aman untuk migration apply pertama.
- [~] Siapkan pipeline CI/CD minimal:
  - install -> typecheck -> test -> build -> deploy.
  - status: `.github/workflows/deploy.yml` sudah ada,
  - status: `package.json` sudah punya script `deploy`,
  - status pasca-deploy: nama step GitHub Actions sudah memakai double quotes, runner Node.js sudah Node 24, dan command migration sudah tanpa `--batch`,
  - pre-deploy wajib: `CF_API_TOKEN` adalah Custom API Token level Account dengan D1 Edit, Pages Edit, dan Worker Scripts Edit,
  - cek lokal terbaru: `vue-tsc -b` sukses dan `npm run build` sukses di Windows setelah `npm cache verify` + `npm install`.
- [x] Verifikasi Pages Functions wrapper untuk backend Hono:
  - file `functions/api/[[path]].ts` aktif sebagai adapter Cloudflare Pages Functions,
  - trace runtime: `/api/*` -> Pages Function wrapper -> `server/index.ts` -> router Hono.
- [~] Tambahkan quality gate:
  - fail jika migration gagal,
  - fail jika smoke test endpoint inti gagal.
  - status: migration apply remote sudah ada di workflow,
  - smoke test endpoint otomatis dipindahkan ke Day-2 Operations; untuk deploy awal pakai health check manual pasca-deploy.
- [~] Siapkan runbook insiden ringkas:
  - backup/restore D1,
  - rollback Worker/Pages,
  - langkah verifikasi pasca-rollback.
  - status: `RUNBOOK.md` sudah mencakup backup/restore, rollback, health check publik, secret production, dan verifikasi admin minimum.

Estimasi cepat Gate 2: **1 - 2 hari**

### Gate 3 - Security Final Check
- [ ] Rate limiting endpoint login.
  - dipindahkan ke Day-2 Operations (Post-Deploy).
- [x] Audit dependency (security patch minor/patch).
  - status pre-push: `npm audit` = `found 0 vulnerabilities`.
- [ ] Review response error production-safe (tidak bocor detail internal).
- [ ] Verifikasi konfigurasi secret production:
  - `JWT_SECRET` tidak default/dev,
  - `JWT_SECRET` production harus berbeda total dari `.dev.vars` lokal,
  - prosedur rotasi secret terdokumentasi.
  - status pre-push: `.dev.vars` dan `cookies.txt` sudah dikeluarkan dari index Git dan secret lokal sudah dirotasi.
  - status pre-push: `JWT_SECRET` runtime Cloudflare/Pages sudah diset untuk project `masjidnurulhuda`.

### Lessons Learned Deploy Pertama
- YAML GitHub Actions: quote semua `name` step yang mengandung karakter khusus seperti titik dua (`:`).
- Node.js runner: gunakan Node.js 24 untuk menghindari deprecation warning GitHub Actions 2026.
- Wrangler D1 migration: jangan gunakan `--batch` pada `d1 migrations apply`; gunakan `--remote` untuk CI/CD.
- Cloudflare permission: D1 adalah resource account-level, jadi token CI/CD perlu Custom API Token dengan scope Account, bukan hanya token zona/Workers standar.
- Hybrid Vue + Hono di Cloudflare Pages: pastikan `functions/api/[[path]].ts` ada agar API tidak jatuh menjadi response HTML/static 405.

Estimasi cepat Gate 3: **0.5 hari**

### Urutan Eksekusi Disarankan (Ringkas)
1. Selesaikan **Gate 1** sampai lulus smoke test.
2. Lanjut **Gate 2** (migrations + pipeline + runbook).
3. Tutup dengan **Gate 3** (security final).
4. Deploy ke staging -> smoke test -> promote ke production.

### Exit Criteria Siap Deploy
- [ ] Semua item Gate 1 tercentang.
- [ ] Pipeline GitHub Actions hijau: install, typecheck, migration apply, build, deploy.
- [ ] D1 remote tersinkronisasi lewat migration pertama.
- [ ] Secret production (`JWT_SECRET`) terpasang di Cloudflare Pages.
- [ ] Health check publik + flow admin minimum lolos setelah deploy.
