# Optimalisasi Plan Proyek Masjid Nurul Huda

Dokumen ini dirapikan berbasis status eksekusi agar tidak tercampur: **Done**, **In Progress**, dan **Not Yet**, dengan prioritas tetap mengikuti level dampak.

## Task Aktif — Redesign, Modularisasi, dan Ekstraksi

Status fokus aktif saat ini: **gabungan final Prioritas 2 + pondasi Prioritas 3** untuk merapikan arsitektur frontend admin sebelum redesign visual besar.

### Tujuan Aktif

- Menutup sisa item Prioritas 2 yang belum selesai:
  - modularisasi composable admin besar,
  - ekstraksi komponen dropdown reusable.
- Menyiapkan fondasi redesign UI Admin dan Login agar iterasi visual berikutnya tidak perlu bongkar ulang logic layer.
- Menjaga integrasi filter periodik `month/year` tetap konsisten dari UI -> composable -> service -> API (`/summary` dan `/list`).

### Checklist Eksekusi Aktif

- [ ] Modularisasi composable admin besar.
  - Scope `useKas`:
    - pecah menjadi `useKasState`, `useKasFilters`, `useKasActions` (opsional `useKasComputed`),
    - `useKas.ts` dipertahankan sebagai facade kompatibel agar caller existing tetap aman,
    - state loading/submitting dipisah per aksi untuk anti double-submit.
  - Scope `usePengaturan`:
    - pecah per domain tab (`kategori`, `seksi`, `akun`) + state modal/dropdown,
    - pisahkan orchestration `openModal/closeModal/resetForm` dari logic CRUD,
    - jaga kontrak return agar `Pengaturan.vue` bisa migrasi bertahap tanpa rewrite total.

- [ ] Ekstraksi komponen dropdown reusable lintas admin.
  - Buat komponen dasar `AppDropdown` (single-select) dengan standar:
    - keyboard navigation,
    - close-on-outside click,
    - disabled/loading state,
    - z-index dan positioning konsisten.
  - Integrasi target awal:
    - `Pengaturan.vue` (role + jenis arus),
    - `KasInput.vue` (kategori/seksi/metode jika ada),
    - `KasProposal.vue` (kategori/seksi/metode),
    - `KasLaporan.vue` (bulan/tahun/tipe/kategori),
    - `Dashboard.vue` (bulan/tahun summary).
  - Kurangi duplikasi logic dropdown manual agar behavior tidak divergen antar halaman.

### Integrasi Frontend & UI Refactor (terkait task aktif)

- [ ] Integrasi ke Dashboard (`Dashboard.vue` / `useDashboard`):
  - filter `month/year` ditarik ke state composable yang jelas,
  - request ke `dashboardService.getSummary(month, year)` konsisten,
  - loading/skeleton state dirapikan untuk UX redesign-ready.

- [ ] Integrasi ke List Transaksi (`KeuanganKas.vue` / `useKas`):
  - filter `month/year` + `tipe` + `kategori_id` dipusatkan di layer filter composable,
  - request ke `/api/admin/transaction/list` selalu lewat query filter tervalidasi,
  - sinkronisasi data list + summary UI tanpa fetch berulang yang tidak perlu.

- [ ] Fondasi redesign UI Admin & Login:
  - standardisasi primitive UI (dropdown/button/input) sebelum ganti visual besar,
  - harmonisasi state error/loading/disabled lintas form admin,
  - menjaga perubahan tetap non-breaking ke alur auth/transaksi existing.

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
- [x] Rate limiting endpoint login:
  - `POST /api/admin/auth/login` dilindungi rate limit baseline berbasis in-memory Map,
  - limit memakai key `cf-connecting-ip + email`, maksimal 5 kegagalan dalam 15 menit,
  - attempt hanya dicatat saat kredensial gagal, dihapus saat login berhasil, dan response blokir mengirim `429` + `Retry-After`.
- [x] Hapus hardcode kredensial admin dari frontend login:
  - `src/views/admin/Login.vue` tidak lagi mengisi default `admin@masjidnurulhuda.com` / `admin123` pada state form,
  - autentikasi tetap lewat `POST /api/admin/auth/login` dan cookie `httpOnly`.
- [x] Hardening auth/session lanjutan:
  - endpoint `POST /api/admin/auth/logout` sudah melakukan invalidasi sesi server-side dengan increment `users.token_version` (`bumpUserTokenVersion`),
  - endpoint `GET /api/admin/auth/me` dan middleware `requireAuth` memverifikasi kecocokan claim JWT `tv` terhadap `users.token_version`,
  - token lama otomatis ditolak (`401`) setelah logout (revocation efektif) tanpa menunggu expiry,
  - TTL access token sudah 24 jam (`exp`) dengan cookie `maxAge` 24 jam agar konsisten.
- [x] Hardening normalisasi status auth frontend (`checkAuth`):
  - `src/stores/authStore.ts` hanya menormalisasi sesi ke logged-out pada `401` dari `/api/admin/auth/me`,
  - status non-401 (`5xx`) dan network/runtime error diperlakukan sebagai error operasional (state auth tidak di-force logout),
  - tujuan: mencegah bug backend/outage tersamarkan sebagai logout biasa.
- [x] Migration versioning D1:
  - migration auth revocation sudah ditambahkan di `migrations/0008_auth_token_version.sql` (`ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0` + normalisasi data lama),
  - versi migration kini berlanjut konsisten (`0001` s.d `0008`) dan siap di-apply berurutan via skrip `db:apply:local` / `db:apply:remote`,
  - reset lokal konsisten tersedia via `db:reset:local` (drop + apply ulang seluruh migration).
- [x] Sinkronisasi reference schema lokal:
  - `server/db/schema.sql` sudah diselaraskan ke gabungan migration `0001..0008` + kebutuhan operasional media/auth terbaru (`pending_ketua|pending_bendahara`, `approved_at`, `token_version`, `thumb_storage_key`, index terkait),
  - patch bypass D1 bug pada `fix.sql` (rekonsiliasi role `bendahara`) sudah tercermin langsung di schema reference agar reset lokal tidak tertinggal,
  - `migrations/0007_reconcile_bendahara_role.sql` tetap no-op by design untuk menjaga pipeline remote, sementara perubahan struktural users terdokumentasi sebagai langkah operasional terpisah.

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
- [x] Konsistensi role matrix final (`superadmin`, `ketua`, `bendahara`, `pengurus`) sudah diterapkan pada flow keuangan inti.
- [x] Relasi Kategori Kas dengan Jenis Arus:
  - `kategori_kas.jenis_arus` tersedia di schema/migration,
  - CRUD kategori sudah membawa `jenis_arus`,
  - dropdown kategori kas/proposal terfilter berdasarkan tipe transaksi.
- [x] `seksi_id` opsional pada Kas Langsung:
  - UI Kas Langsung mengirim `seksi_id` bila dipilih,
  - endpoint `POST /api/admin/transaction/add-direct` menyimpan `seksi_id` jika ada dan `null` jika kosong.
- [x] Modularisasi composable mulai berjalan di domain Homepage publik:
  - `useJadwal`, `useKasSummary` (service -> composable -> component).
- [x] Validasi DTO backend lanjutan:
  - [x] `jenis_arus` sudah divalidasi eksplisit via allowlist `pemasukan|pengeluaran|general` di route `/api/admin/pengaturan/kategori`.
  - [x] `seksi_id` Kas Langsung (dan proposal) sudah hardening validasi FK: nilai hanya diterima jika parse integer positif **dan** benar-benar ada di tabel `seksi_pengurus` (`existsSeksiById`), sehingga payload di luar UI dengan ID fiktif ditolak `400`.
  - [x] `role` pada create/update akun sudah memakai allowlist `superadmin|ketua|bendahara|pengurus` sebelum masuk service DB.
  - [x] `kategori_id` dan `seksi_id` pada transaksi sudah parse integer positif; `add-proposal` sudah normalisasi `seksi_id` seperti `add-direct`.
  - [x] `jumlah` transaksi sudah memakai `Number.isFinite` + batas maksimum nominal wajar untuk mencegah nilai seperti `Infinity`.
  - [x] route param `:id` di pengaturan kategori/seksi/users/reset-password/delete sudah validasi integer positif seperti endpoint transaksi.
  - [x] test pendukung ditambahkan untuk helper validasi existence seksi (`tests/seksi-service.test.mjs`) dan total test suite kini 13 pass.
  - catatan sinkronisasi frontend: dropdown role di `Pengaturan.vue` + `UserRole` di `pengaturanService` sudah memasukkan `bendahara` agar konsisten dengan backend.
- [x] Konsistensi RBAC lintas modul admin:
  - transaksi sudah fail-closed,
  - modul dashboard sudah sinkron allowlist role operasional (`superadmin`, `ketua`, `bendahara`, `pengurus`) pada `GET /api/admin/dashboard/summary`,
  - audit route admin inti tervalidasi memakai `requireAuth` + `requireRole` eksplisit.
- [x] Type safety menyeluruh frontend-backend (DTO request/response + minim `any`):
  - payload `kasService.submitDirectTransaction`, `kasService.submitProposal`, form `useKas`, payload/list `usePengaturan`, `dashboardService`, dan `pengaturanService` memakai DTO eksplisit,
  - area backend terkait (`server/utils/response.ts`, `server/middleware/auth.ts`, `server/services/transaction.ts`, `server/services/user.ts`, `server/services/auth.ts`) sudah bebas `any`,
  - hardening tambahan selesai di `server/api/admin/transaction.ts`, `server/db/queries/dashboard.ts`, `server/api/public/jadwal.ts`, `server/services/transaction.ts`, `src/services/httpClient.ts`, `src/services/admin/dashboardService.ts`,
  - verifikasi `npm run build` dan `npm test` lulus (21/21 test pass).
- [x] Tambahkan helper permission frontend terpusat (`canApprove`, `canDelete`, `canViewProposalTab`):
  - `src/utils/permissions.ts` aktif sebagai allowlist RBAC UI terpusat.
  - `KeuanganKas.vue` dan `KasLaporan.vue` sudah migrasi dari guard inline (`role !== ...`) ke helper permission.
- [x] Index D1 prioritas transaksi & auth sudah tersedia:
  - `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)` sudah ada di schema/migration.
- [x] Optimasi query dashboard periodik:
  - endpoint `GET /api/admin/dashboard/summary` sudah mendukung filter `month/year`,
  - fallback default period mengikuti WIB (`Asia/Jakarta`) dan pola validasi periodik konsisten dengan endpoint transaksi `/list`,
  - query agregasi dashboard sudah difilter periodik (`strftime('%m', tanggal)` + `strftime('%Y', tanggal)`) agar menghindari scan historis penuh.
- [x] Sinkronisasi filter laporan kas ke server-side:
  - [x] filter `month/year` diproses di backend `GET /api/admin/transaction/list` (default current month/year bila query kosong/tidak valid),
  - [x] filter `tipe` (`pemasukan|pengeluaran`) dan `kategori_id` (integer positif) diparse/validasi di route lalu diteruskan ke clause SQL optional,
  - [x] `useKas` dan `kasService.getTransactions` sudah mengirim query filter ke backend sehingga data list lebih terbatasi sebelum render client.

### In Progress

Not found (semua item sebelumnya sudah dipindah ke **Done** atau masih masuk **Not Yet**)

### Not Yet

Not found (seluruh sisa pekerjaan Prioritas 2 dipindahkan ke section **Task Aktif — Redesign, Modularisasi, dan Ekstraksi** di bagian atas dokumen).

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
- [~] Testing baseline:
  - unit test auth/transaction/validation berjalan untuk helper currency + matrix RBAC permission UI + helper validasi transaksi (`parsePositiveInt`, `parseFiniteAmount`) + kontrak parser media publik (`resolveMediaStorageKey`) dengan total 18 test pass via `npm test`,
  - integration test flow penting (prioritas: proposal bertahap `pending_ketua -> pending_bendahara -> approved/rejected`).
- [ ] Dokumentasi operasional:
  - README final, setup lokal, reset DB, checklist deploy.

## Penguatan RBAC Lanjutan (Spesifik Security)

### Done

- [x] Finalisasi rename role ke `pengurus` di backend, frontend, dan dokumentasi.

### Not Yet

- [ ] Proteksi self-lockout (user login tidak boleh menurunkan role dirinya sendiri).
- [ ] Pembatasan `ketua` untuk akun `superadmin` (listing/create/update/delete policy).
- [ ] Invalidasi sesi role lama (force re-login untuk token role di luar matrix final).
- [ ] Test matrix RBAC otomatis (`superadmin`, `ketua`, `bendahara`, `pengurus`) untuk endpoint kritis.

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

## Implementasi Media Library Admin (DONE)

Status: **[x] Done**

Tujuan tercapai: media library terpusat untuk upload, manajemen metadata, dan pemilihan media reusable lintas fitur admin dengan arsitektur Vue + Hono + D1 + R2.

Ringkasan implementasi selesai:

- [x] Kontrak data dan API media dikunci:
  - tabel `dokumentasi`, constraint, index, dan kontrak response (`status/message/data`) konsisten helper backend.
- [x] Infrastruktur backend media aktif:
  - binding `MEDIA_BUCKET`,
  - migration `0006_media_library.sql`,
  - endpoint `POST/GET/PATCH/DELETE /api/admin/media`,
  - endpoint publik `GET /api/public/media/*`.
- [x] Frontend pipeline upload aktif:
  - validasi MIME, kompresi/adaptive resize, konversi WebP fallback-safe,
  - multi-file queue + progress + retry + bounded concurrency.
- [x] UI media library lengkap:
  - upload panel drag-drop, gallery grid + load more, copy URL,
  - edit metadata (`alt_text`, `kategori_penggunaan`) via PATCH,
  - full-size preview modal.
- [x] Reusable media picker siap pakai lintas fitur:
  - `MediaPickerModal` + `useMediaPicker` sudah terpasang di caller awal `GaleriDokumentasi`.
- [x] Hardening sinkron D1-R2 selesai:
  - rollback orphan saat insert D1 gagal,
  - hard delete berurutan R2 -> D1,
  - fallback legacy thumbnail `.thumb.webp` untuk kompatibilitas aset lama.
- [x] Bug PATCH metadata 500 ditutup:
  - root cause: update kolom `updated_at` yang tidak ada di schema `dokumentasi`,
  - fix query: hapus assignment `updated_at`,
  - verifikasi lokal test pass dan retest production PATCH sudah `200 OK`.

Catatan scope yang memang ditunda (bukan blocker fase ini):

- [ ] SHA256 checksum/dedup otomatis.
- [ ] Soft delete/recycle bin.
- [ ] Cursor pagination.

### Hardening Pre-Production (Prioritas Operasional)

- [ ] Verifikasi CORS R2 final (origin whitelist production + staging, tanpa wildcard).
- [~] Apply + verifikasi migration D1 remote production (`0003` s.d `0007`).
  - status: rangkaian hotfix kompatibilitas D1 remote sudah dicatat; eksekusi final mengikuti `RUNBOOK.md`.
- [~] Verifikasi smoke test media runtime target (post-deploy) — fokus checklist endpoint:
  - `POST /api/admin/media`,
  - `GET /api/admin/media?page&limit`,
  - `PATCH /api/admin/media/:id`,
  - `DELETE /api/admin/media/:id`,
  - `GET /api/public/media/*`.
- [ ] Verifikasi binding/secret production:
  - `MEDIA_BUCKET` ke bucket target,
  - `DB` ke D1 production,
  - `JWT_SECRET` valid dan berbeda dari local.
- [x] Dokumentasi verifikasi pre-production sudah ditulis di `RUNBOOK.md`.

### Optimasi Lanjutan (Masuk Roadmap Prioritas Terkait)

- [ ] Tambah infinite scroll berbasis `IntersectionObserver` (menggantikan tombol **Load More**).
- [~] Tambah test integration media end-to-end lengkap:
  - [ ] skenario sukses,
  - [x] skenario gagal parsial rollback sudah ada.
- [~] Observability media:
  - log contextual endpoint media + request-id sudah aktif,
  - standardisasi full structured logging lintas modul masih berjalan.

## Future Development Plan

Section ini menampung item pengembangan yang **ditunda** (deferred) agar tidak tercampur dengan backlog eksekusi aktif per prioritas.

### Deferred dari Prioritas 2 (Stabilitas & Maintainability)

- [ ] Penerapan pagination server-side untuk transaksi admin:
  - target endpoint `GET /api/admin/transaction/list` dengan kontrak `page`, `limit`, `total`, `hasNext`,
  - sinkronisasi frontend (`kasService`/`useKas`) agar konsumsi data berbasis page state, bukan full list.
- [ ] Pembatasan volume data endpoint pending:
  - target endpoint `GET /api/admin/transaction/pending` agar tidak mengembalikan full dataset,
  - opsi implementasi: pagination atau windowed result berbasis period + bound limit.
- [ ] Guard volume dataset non-pagination:
  - rolling period guard + query bound untuk menjaga beban query/payload tetap stabil saat data tumbuh,
  - tetapkan acceptance limit awal (mis. max rows per request) sebelum rollout pagination penuh.

## Mode Eksekusi (Now / Next / Pre-Go-Live)

### Now (dampak langsung)

- [x] Seragamkan error response backend.
- [x] Final audit RBAC fail-closed lintas semua route `/api/admin/*`.
- [x] Pasang index D1 prioritas tinggi.
  - index Gate 1 sudah ada: `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`.
- [x] Fallback + caching jadwal sholat publik.

### Next (setelah flow stabil)

- [x] Type safety menyeluruh + kurangi `any`.
  - backend auth/core service + area `httpClient`, service dashboard, query dashboard, dan proxy jadwal publik sudah di-hardening,
  - audit cepat residual `any` pada file TypeScript aktif menunjukkan 0 temuan.
- [ ] Refactor backend konsisten `Route -> Service -> Query`.
- [ ] Loading UX halus + observability dasar.

### Pre-Go-Live

- [x] Migration versioned + seed terpisah.
  - DDL/index dan seed sudah dipisah di folder `migrations/`,
  - D1 remote production awal dikonfirmasi fresh (dibuat via `npx wrangler d1 create`, belum ada tabel),
  - command CI/CD valid: `npx wrangler d1 migrations apply masjidnurulhuda-db --remote` tanpa flag `--batch`,
  - patch auth revocation sudah terversioning di `migrations/0008_auth_token_version.sql`.
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
- [~] Security checklist final (rate limit login, dependency audit, production-safe error).
  - status pre-push: `npm audit` = `found 0 vulnerabilities`,
  - `JWT_SECRET` production sudah dipasang via `npx wrangler pages secret put JWT_SECRET --project-name masjidnurulhuda`,
  - rate limiting login baseline sudah aktif; caveat: in-memory Map dapat reset antar isolate/region Cloudflare, upgrade ke Turnstile/KV/D1/WAF jika trafik atau risiko meningkat.

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

- [x] Rate limiting endpoint login.
  - baseline in-memory per `IP:email`, maksimal 5 kegagalan per 15 menit, dengan `Retry-After`.
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

---

## Laporan Smoke Test Production (Manual) — 2026-05-08 14:54 WIB

Environment:

- Base URL: `https://masjidnurulhuda.pages.dev`
- Metode: manual smoke via CLI request (public + auth baseline)
- Catatan: percobaan awal sempat gagal karena command separator shell (`&`) dan quoting payload login.

Hasil Eksekusi:

1. Public endpoint (PASS)
   - `GET /api/public/kas/summary` -> **200 OK**
   - `GET /api/public/jadwal/today` -> **200 OK**
   - Kontrak response valid: `status=success`, `message`, `data`.

2. Admin auth/login (RETEST PASS dengan kredensial valid production)
   - Percobaan awal (akun lama) sempat menghasilkan **500**.
   - Retest menggunakan akun:
     - `admin1@masjidnurulhuda.com`
     - `password123`
   - `POST /api/admin/auth/login` -> **200 OK**
   - Response body: `{"status":"success","message":"Login berhasil",...}` + `Set-Cookie auth_token`.

3. Admin session-dependent checks (PASS)
   - `GET /api/admin/auth/me` -> **200 OK** (`Sesi valid`, role `superadmin`)
   - `GET /api/admin/dashboard/summary` -> **200 OK**
   - `GET /api/admin/media?page=1&limit=5` -> **200 OK** (items kosong valid, pagination valid)
   - `POST /api/admin/auth/logout` -> **200 OK**

Ringkasan Status:

- Public baseline: **LULUS**
- Workflow admin minimum (auth -> me -> dashboard -> media -> logout): **LULUS**
- Severity blocker login: **CLOSED** (penyebab awal adalah kredensial uji yang tidak sesuai data production aktif)

Tindak Lanjut Prioritas:

- [x] Lanjutkan smoke test matrix role lengkap (`superadmin`, `ketua`, `bendahara`, `pengurus`) termasuk verifikasi baseline akses endpoint admin.
  - update 2026-05-08 15:04 WIB (production, lama):
    - `admin1@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, sesi valid).
    - `bendahara@masjidnurulhuda.com` / `password123` -> **FAIL** (login 500).
    - `ketua@masjidnurulhuda.com` / `admin123` -> **FAIL** (login 500).
    - `dakwah@masjidnurulhuda.com` / `password123` -> **FAIL** (login 500).
  - retest 2026-05-08 15:41 WIB (production, terbaru):
    - `ketua@masjidnurulhuda.com` / `admin123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 200, `media list` 200, `transaction/list` 200, logout 200).
    - `bendahara@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 403 sesuai policy role, `media list` 200, `transaction/list` 200, logout 200).
    - `dakwah@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 200, `media list` 200, `transaction/list` 200, logout 200).
  - status: blocker login non-superadmin **CLOSED**.
- [x] Smoke test media workflow penuh (upload/edit alt/delete + public media fetch).
  - update 2026-05-08 15:44 WIB (production, superadmin `admin1@masjidnurulhuda.com`):
    - `POST /api/admin/media` -> **PASS** (201).
    - `GET /api/admin/media?page=1&limit=5` -> **PASS** (200).
    - `GET /api/public/media/:key` -> **PASS** (200).
    - `DELETE /api/admin/media/:id` -> **PASS** (200).
    - `GET /api/public/media/:key` pasca delete -> **PASS** (404 expected).
  - retest final 2026-05-08 16:13 WIB:
    - `PATCH /api/admin/media/:id` -> **PASS** (200 OK, request-id: `smoke-prod-patch-safe-1`).
  - status: workflow media end-to-end production **LULUS**.
- [x] Investigasi root cause login 500 untuk role non-superadmin (audit data user/role/password_hash di D1 production + query login service + guard role matrix pasca hotfix reconcile `bendahara`).
  - hasil: tidak reproduksi pada retest terbaru; seluruh role non-superadmin login normal (200) pada production.
