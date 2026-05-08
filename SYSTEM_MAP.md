# Project Summary

- Tujuan aplikasi: website publik Masjid Nurul Huda (informasi profil, transparansi kas, kabar, galeri, kritik/saran) + panel administrasi untuk autentikasi admin, ringkasan kas, manajemen transaksi kas (input/proposal/approval/laporan), dan master data pengaturan (kategori, seksi, akun).
- Tech stack utama:
  - Frontend: Vue 3 + TypeScript + Vue Router + Pinia + Tailwind CSS (via `@tailwindcss/vite`) + `lucide-vue-next`.
  - Backend: Hono.js (`server/index.ts`) berjalan via Vite dev server adapter Cloudflare.
  - Database: Cloudflare D1 (SQLite) melalui binding `DB` di `wrangler.toml`.
  - Auth: JWT (`hono/jwt`) disimpan di cookie `httpOnly`.
- Pola arsitektur singkat: UI Vue (view/component) -> composable/store/service frontend -> `httpClient` terpusat (request bridge + normalisasi error non-2xx) -> Cloudflare Pages Functions wrapper `functions/api/[[path]].ts` -> endpoint `/api/*` Hono (route + middleware auth) -> service/query SQL -> tabel D1.

# Core Logic Flow (Function-Level Flowchart)

- `[Vue] Login.vue(handleLogin) -> [Vue] authStore.login() -> [Hono] POST /api/admin/auth/login -> [Middleware] login rate limit baseline (IP+email, in-memory, 5 gagal/15 menit) -> [Hono] authService.loginAdmin -> [Query] getUserByEmail(users) + hash verify -> payload JWT (`tv`+`exp` 24 jam) -> set cookie httpOnly (maxAge 24 jam)`
- `[Vue] router.beforeEach -> [Vue] authStore.checkAuth() -> [Hono] GET /api/admin/auth/me -> verify JWT cookie + validasi claim `tv`vs`users.token_version` -> response user session`
- `[Vue] AdminLayout(handleLogout) -> [Vue] authStore.logout() -> [Hono] POST /api/admin/auth/logout -> verify JWT cookie (best-effort) -> [Query] bumpUserTokenVersion(users) -> clear cookie -> token lama revoke server-side`
- `[Vue] GET / (public route) -> [Vue] PublicLayout.vue -> [Vue] Home.vue -> section-based smooth-scroll landing (hero/jadwal/kas/kabar/galeri/saran)`
- `[Vue] Home/JadwalSholat(useJadwal) -> [Vue] jadwalService.fetchJadwalToday -> [Hono] GET /api/public/jadwal/today (proxy + timeout/retry) -> [External API] MyQuran Kemenag -> cache harian localStorage + fallback offline`
- `[Vue] Home/KasWidget(useKasSummary) -> [Vue] kasSummaryService.fetchSummary -> [Hono] GET /api/public/kas/summary -> [Query] aggregate kas approved bulanan -> DB kas_masjid`
- `[Vue] Dashboard.vue -> [Vue] useDashboard.fetchSummary -> [Vue] dashboardService.getSummary -> [Vue] httpClient -> [Hono] GET /api/admin/dashboard/summary -> dashboardService.getDashboardSummary -> dashboard query SUM kas_masjid -> DB kas_masjid`
- `[Vue] KeuanganKas/useKas.loadData -> [Vue] kasService.getMasterData + getTransactions -> [Vue] httpClient (credentials include + error normalization) -> [Hono] GET /api/admin/transaction/master-data + /list -> [Service] getAllTransactions(user) -> DB kas_masjid (role=pengurus: approved OR created_by=user.sub|id)`
- `[Vue] KeuanganKas/KasLaporan -> [Vue] utils/permissions(canAccessKasInput|canViewProposalTab|canDelete) -> guard visibilitas tab/aksi berdasarkan allowlist role -> sinkron dengan policy backend transaksi`
- `[Vue] KasInput/KasProposal -> [Vue] useKas.filteredCategoriesInput|filteredCategoriesProposal -> master-data categories(jenis_arus) -> UI dropdown kategori difilter by tipe transaksi + general`
- `[Vue] KeuanganKas/KasApproval (Status Proposal) -> [Vue] kasService.getTransactions (/list) -> [Hono] GET /api/admin/transaction/list -> [Service] getAllTransactions(user) -> DB kas_masjid (role=pengurus scoped: approved OR created_by=user.sub|id)`
- `[Vue] KasInput(useKas.handleDirectInput) -> [Vue] parseInputRupiah/formatInputRupiah (helper terpusat) -> [Vue] kasService.submitDirectTransaction -> [Vue] httpClient (ApiError on non-2xx) -> [Hono] POST /api/admin/transaction/add-direct -> validasi DTO + validasi FK seksi (`existsSeksiById`) -> txService.createTransaction -> DB kas_masjid (status dipaksa approved, seksi_id opsional: jika dikirim harus integer positif & eksis di seksi_pengurus, jika kosong disimpan null)`
- `[Vue] KasProposal(useKas.handleProposal) -> [Vue] parseInputRupiah/formatInputRupiah (helper terpusat) -> [Vue] kasService.submitProposal -> [Vue] httpClient (ApiError on non-2xx) -> [Hono] POST /api/admin/transaction/add-proposal -> validasi DTO + validasi FK seksi (`existsSeksiById`) -> txService.createTransaction -> DB kas_masjid (status awal proposal = pending_ketua, seksi_id wajib, harus eksis di seksi_pengurus)`
- `[Vue] KasApproval tahap ketua (useKas.handleAction) -> [Vue] kasService.approveTransaction -> [Hono] POST /api/admin/transaction/approve/:id -> txService.updateStatus -> DB kas_masjid (pending_ketua -> pending_bendahara)`
- `[Vue] KasApproval tahap bendahara (useKas.handleAction) -> [Vue] kasService.approveTransaction -> [Hono] POST /api/admin/transaction/approve/:id -> txService.updateStatus -> DB kas_masjid (pending_bendahara -> approved, pencairan dana masuk laporan kas)`
- `[Vue] Pengaturan/usePengaturan.loadData|saveItem|deleteItem -> [Vue] pengaturanService/httpClient -> [Hono] /api/admin/pengaturan/(kategori|seksi|users) -> service kategori|seksi|user -> DB kategori_kas(jenis_arus)|seksi_pengurus|users`
- `[Vue] Admin Media Library(useMediaUpload) -> [Vue] imagePipeline + mediaService.uploadMedia (file + thumb_file) -> [Vue] httpClient (multipart/form-data) -> [Hono] POST /api/admin/media -> validasi auth/role + MIME/size + storage_key/thumb_storage_key -> upload paralel 2 object R2 (`storage_key`+`thumb_storage_key`) + insert D1 `dokumentasi` + rollback dua object R2 saat insert gagal`
- `[Vue] Admin Media Grid -> [Vue] mediaService.listMedia -> [Vue] httpClient -> [Hono] GET /api/admin/media?page&limit&kategori_penggunaan -> [Query] D1 dokumentasi (termasuk `thumb_storage_key`) -> [Vue] fallback render thumb: URL thumb gagal load (404/error) => fallback ke `file_url` utama`
- `[Vue] Admin Media Delete -> [Vue] mediaService.deleteMedia -> [Vue] httpClient -> [Hono] DELETE /api/admin/media/:id -> lookup D1 row -> delete object R2 (`storage_key`+`thumb_storage_key`) via Promise.all -> delete row D1 (hard delete sinkron multi-object)`
- `[Vue] Admin Media Alt Text Edit -> [Vue] mediaService.updateMediaMetadata -> [Vue] httpClient -> [Hono] PATCH /api/admin/media/:id -> validasi auth/role + validasi payload -> update metadata D1 dokumentasi`
- `[Vue] Admin Galeri & Dokumentasi Placeholder -> [Vue] MediaPickerModal + useMediaPicker (lazy fetch on open, multi-select) -> [Vue] mediaService.listMedia -> [Vue] httpClient -> [Hono] GET /api/admin/media?page&limit&kategori_penggunaan -> [Query] D1 dokumentasi`
- `[Browser Request] GET /api/public/media/* -> [Hono] server/api/public/index.ts -> [Utils] resolveMediaStorageKey(pathname canonical + fallback wildcard + sanitasi anti traversal) -> [R2] MEDIA_BUCKET.get(storage_key)`
- `[Vue] Kas/Pengaturan delete/submit/approval -> ConfirmModal.vue + vue-sonner toast -> composable action -> API mutation`

## Authorization Matrix (RBAC)

Implementasi terbaru terdeteksi di level UI + API dengan matrix role operasional: `superadmin`, `ketua`, `bendahara`, `pengurus`.

- Superadmin (akses penuh):
  - Tab: `Rincian Transaksi`, `Approval`, `Kas Baru`, `Proposal`.
  - Aksi tabel laporan: tombol `Delete` tampil.
  - Aksi approval: tombol `Approve/Reject` tampil.
- Ketua (approver tahap 1):
  - Fokus approval proposal dari seksi lain pada status `pending_ketua`.
  - Aksi approval ketua mendorong status ke `pending_bendahara` (belum masuk kas final).
  - Tetap bisa akses laporan sesuai guard saat ini.
- Bendahara (approver tahap 2 + pencairan):
  - Fokus approval proposal tahap akhir pada status `pending_bendahara`.
  - Aksi approval bendahara mencairkan dana dan mengubah status ke `approved` agar tercatat di laporan kas.
  - Rejection tetap mengakhiri proposal ke `rejected`.
- Pengurus (akses proposal dan status pribadi):
  - Tab: `Rincian Transaksi`, `Proposal`, dan tab approval berubah label menjadi `Status Proposal`.
  - Tab `Kas Baru`: tidak tampil (via helper `canAccessKasInput`).
  - Aksi tabel laporan: kolom/tombol `Delete` tidak tampil.
  - Aksi approval: tombol `Approve/Reject` tidak tampil.

Catatan enforcement:

- RBAC sekarang aktif di 2 layer: UI (`KeuanganKas`, `KasLaporan`, `KasApproval` + helper `src/utils/permissions.ts`) dan backend `server/api/admin/transaction.ts`.
- Endpoint `POST /api/admin/transaction/approve/:id` mengikuti approver bertahap proposal (`ketua` lalu `bendahara`) sesuai status proposal aktif.
- Endpoint `DELETE /api/admin/transaction/:id` menolak role di luar approver (`superadmin`, `ketua`, `bendahara`) dengan `403 Forbidden`.
- Endpoint `GET /api/admin/transaction/pending` menerapkan data scoping (least privilege):
  - role `pengurus` hanya melihat data `pending` miliknya (`created_by = user.sub|user.id`),
  - role approver (`superadmin/ketua/bendahara`) melihat antrean global.
- Endpoint `GET /api/admin/transaction/list` juga menerapkan data scoping untuk role `pengurus`:
  - hanya data `approved` atau data yang dibuat user sendiri (`created_by = user.sub|user.id`),
  - role approver tetap melihat data global sesuai kebutuhan laporan.
- Endpoint `POST /api/admin/transaction/add-direct` dan `POST /api/admin/transaction/add-proposal` sudah punya validasi manual input (required fields, nominal positif, whitelist tipe, sanitasi panjang minimal keterangan), termasuk hardening FK `seksi_id` dan pemaksaan status by intent.

# Clean Tree

```text
masjidnurulhuda/
  package.json
  vite.config.ts
  wrangler.toml
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  tsconfig.server.json
  RUNBOOK.md
  .github/
    workflows/
      deploy.yml
  migrations/
    0001_init_schema.sql
    0002_seed_initial_data.sql
    0003_proposal_workflow.sql
    0004_add_audit_columns.sql
    0005_add_indexes.sql
    0006_media_library.sql
    0007_reconcile_bendahara_role.sql
    0008_auth_token_version.sql
  functions/
    api/
      [[path]].ts
  src/
    main.ts
    env.d.ts
    App.vue
    assets/
      main.css
    router/
      index.ts
    stores/
      authStore.ts
    services/
      public/
        home/
          jadwalService.ts
          kasSummaryService.ts
      admin/
        dashboardService.ts
        kasService.ts
        pengaturanService.ts
    composables/
      public/
        home/
          useJadwal.ts
          useKasSummary.ts
      admin/
        useDashboard.ts
        useKas.ts
        usePengaturan.ts
        useTheme.ts
    layouts/
      AdminLayout.vue
      PublicLayout.vue
    views/
      public/
        Home.vue
      admin/
        Login.vue
        Dashboard.vue
        KeuanganKas.vue
        Pengaturan.vue
    components/
      ui/
        ConfirmModal.vue
      public/
        home/
          HeroSection.vue
          JadwalSholat.vue
          KasWidget.vue
          KabarMasjid.vue
          GaleriWidget.vue
          KritikSaran.vue
      admin/
        kas/
          KasLaporan.vue
          KasApproval.vue
          KasInput.vue
          KasProposal.vue
        pengaturan/
          TabKategori.vue
          TabSeksi.vue
          TabAkun.vue
  server/
    index.ts
    middleware/
      auth.ts
      rateLimit.ts
    api/
      public/
        index.ts
        kas.ts
        jadwal.ts
        seksi.ts
      admin/
        auth.ts
        dashboard.ts
        transaction.ts
        pengaturan.ts
    services/
      auth.ts
      dashboard.ts
      transaction.ts
      kategori.ts
      seksi.ts
      user.ts
    db/
      schema.sql
      queries/
        auth.ts
        dashboard.ts
        kategori.ts
        seksi.ts
    utils/
      crypto.ts
      response.ts
```

# Module Map (The Chapters)

- `src/main.ts` — `createApp`, `createPinia` — bootstrap Vue app + registrasi router/store.
- `src/env.d.ts` — deklarasi tipe Vite + side-effect import font.
- `src/router/index.ts` — `createRouter`, `beforeEach` — definisi route publik/admin dan guard berbasis sesi backend (termasuk route admin media: `/admin/media` dan `/admin/galeri-dokumentasi`).
- `src/layouts/PublicLayout.vue` — `scrollTo`, `toggleMobileMenu`, `toggleTheme` — layout publik (sticky navbar, navigasi smooth-scroll, menu mobile, footer) + switch dark/light mode pada web utama.
- `src/views/public/Home.vue` — `v-fade` + section composition — orchestrator halaman publik berbasis component layering (UI modular per section).
- `src/composables/public/home/useJadwal.ts` — `loadJadwal`, cache harian localStorage, fallback offline — logic layer jadwal sholat publik yang tahan gangguan API eksternal.
- `src/composables/public/home/useKasSummary.ts` — `loadKas`, `formatRupiah` — logic layer widget kas publik dari endpoint read-only.
- `src/services/public/home/jadwalService.ts` — `fetchJadwalToday` — service layer konsumsi endpoint proxy backend jadwal (`/api/public/jadwal/today`).
- `src/services/public/home/kasSummaryService.ts` — `fetchSummary` — service layer endpoint publik kas summary.
- `src/components/public/home/KasWidget.vue` — render ringkasan kas publik berbasis data real D1.
- `src/components/public/home/KabarMasjid.vue`, `src/components/public/home/GaleriWidget.vue`, `src/components/public/home/KritikSaran.vue` — section publik dengan overlay glassmorphism "Coming Soon" tanpa menutupi header section.
- `src/stores/authStore.ts` — `login`, `logout`, `checkAuth` — sumber state autentikasi global frontend.
- `src/views/admin/Login.vue` — `handleLogin` — UI login dan trigger autentikasi.
- `src/layouts/AdminLayout.vue` — `handleLogout`, state sidebar/theme, `toggleTheme` — kerangka UI panel admin dengan dark mode konsisten lintas halaman admin, plus navigasi `Galeri & Dokumentasi`.
- `src/views/admin/Dashboard.vue` — integrasi `useDashboard` — render kartu statistik dari composable dashboard.
- `src/composables/admin/useDashboard.ts` — `fetchSummary` — state dan loading ringkasan dashboard via service.
- `src/views/admin/KeuanganKas.vue` — integrasi `useKas` + `useAuthStore` + helper `permissions` — host tab kas dengan UI guard RBAC berbasis allowlist (`canAccessKasInput`, `canViewProposalTab`).
- `src/composables/admin/useKas.ts` — `loadData`, `filteredCategoriesInput`, `filteredCategoriesProposal`, `handleDirectInput`, `handleProposal`, `handleAction`, `handleDelete` — orkestrasi state + aksi transaksi kas, filter kategori berbasis `jenis_arus`, serta filter antrean proposal bertahap (`pending_ketua`/`pending_bendahara`).
- `src/services/httpClient.ts` — `httpClient`, `ApiError` — jembatan fetch wrapper terpusat (default `credentials: include`) untuk intersepsi HTTP error non-2xx dan normalisasi error agar bisa dipakai notifikasi global (`vue-sonner`) di layer UI.
- `src/services/admin/dashboardService.ts` — `getSummary` — API client dashboard admin berbasis `httpClient`.
- `src/services/admin/kasService.ts` — `getMasterData`, `getTransactions`, `submitDirectTransaction`, `submitProposal`, `approveTransaction`, `deleteTransaction` — API client ke endpoint transaksi kas yang dipisah per intent.
- `src/components/admin/kas/KasLaporan.vue` — tabel laporan + filter + ConfirmModal delete — UI guard RBAC untuk kolom/aksi delete berbasis helper `canDelete`; label audit `approved_at` dinamis (`Cair` untuk pengeluaran, `Masuk` untuk pemasukan).
- `src/components/admin/kas/KasApproval.vue` — antrean approval/status proposal bertahap (tahap ketua & tahap bendahara) + ConfirmModal approve/reject — UI guard RBAC untuk urutan approval berjenjang.
- `src/components/admin/kas/KasInput.vue` — form kas langsung + validasi UI + ConfirmModal submit; pilihan seksi bersifat opsional dan disimpan bila dipilih; input nominal memakai format ribuan realtime + guard non-digit.
- `src/components/admin/kas/KasProposal.vue` — form proposal + validasi UI + ConfirmModal submit; `seksi_id` wajib sebelum dikirim ke backend; input nominal memakai format ribuan realtime + guard non-digit.
- `src/components/ui/ConfirmModal.vue` — modal konfirmasi reusable berbasis Headless UI untuk aksi destructive/success/warning.
- `src/views/admin/Pengaturan.vue` — integrasi `usePengaturan`, custom dropdown role/jenis_arus, ConfirmModal delete — UI manajemen kategori/seksi/akun.
- `src/composables/admin/usePengaturan.ts` — `loadData`, `saveItem`, `deleteItem` — state dan CRUD pengaturan lintas tab via `pengaturanService`.
- `src/services/admin/pengaturanService.ts` — `get/add/update/delete` kategori, seksi, users — API client pengaturan admin berbasis `httpClient` dengan DTO frontend.
- `src/services/admin/mediaService.ts` — `uploadMedia`, `listMedia`, `deleteMedia`, `updateMediaMetadata` — API client media library admin (multipart upload, list pagination/filter, hard delete, patch metadata).
- `src/composables/admin/useMediaUpload.ts` — orchestrator batch upload media: progress per item, retry item gagal, dan state upload multi-file.
- `src/composables/admin/useMediaPicker.ts` — composable reusable media picker (lazy fetch saat modal dibuka, state selected map, single/multi select).
- `src/components/admin/media/MediaPickerModal.vue` — modal picker media reusable dengan grid preview, visual state selected, refresh list, emit `MediaItem[]`.
- `src/views/admin/GaleriDokumentasi.vue` — placeholder caller fase awal untuk memilih/menampilkan multi media terpilih via `MediaPickerModal`.
- `src/utils/media/imagePipeline.ts` — pipeline gambar FE: validasi MIME, resize/compress adaptive, fallback konversi WebP, dan generator storage key standar.
- `src/composables/admin/useTheme.ts` — `initTheme`, `toggleTheme` — dark/light mode berbasis `localStorage` yang dipakai layout publik dan admin.
- `functions/api/[[path]].ts` — `handle(app)` dari `hono/cloudflare-pages` — adapter wajib Cloudflare Pages Functions agar request `/api/*` masuk ke Hono, bukan dilayani sebagai static SPA/HTML.
- `server/index.ts` — `app.route(...)` — entrypoint backend dan registrasi semua sub-router API.
- `server/api/public/index.ts` — aggregator router domain publik (`/api/public/*`) untuk modularisasi endpoint public-facing, termasuk delivery media publik via parser key terpusat.
- `server/api/public/kas.ts` — `GET /summary` — endpoint read-only kas publik (approved-only aggregate).
- `server/api/public/jadwal.ts` — `GET /today` — proxy API jadwal sholat (timeout + retry + cache headers) agar integrasi eksternal lebih stabil.
- `server/utils/response.ts` — `sendSuccess`, `sendError` — factory response helper backend untuk standarisasi output JSON lintas endpoint.
- `server/middleware/auth.ts` — `requireAuth`, `requireRole` — middleware reusable untuk autentikasi JWT + validasi token version (`tv` vs `users.token_version`) dan otorisasi role lintas route admin.
- `server/middleware/rateLimit.ts` — `checkLoginRateLimit`, `recordFailedLogin`, `clearLoginAttempts` — rate limit baseline login admin berbasis in-memory Map dengan key `IP:email`, `Retry-After`, dan reset saat login sukses.
- `server/api/admin/auth.ts` — `POST /login`, `POST /logout`, `GET /me` — autentikasi cookie JWT; login memvalidasi email/password + rate limit, logout menginvalidasi sesi server-side via increment `users.token_version`, dan endpoint `me` memverifikasi kecocokan `tv` token terhadap `users.token_version`.
- `server/services/auth.ts` — `loginAdmin`, `AuthUserRow`, `AuthRole` — validasi kredensial typed, hash verify, pembuatan token JWT dengan `tv` + `exp` 24 jam.
- `server/db/queries/auth.ts` — `getUserByEmail`, `getUserTokenVersionById`, `bumpUserTokenVersion` — query auth login + revocation berbasis token version.
- `server/api/admin/dashboard.ts` — `GET /summary` + middleware auth — endpoint ringkasan kas.
- `server/services/dashboard.ts` — `getDashboardSummary` — delegasi business logic dashboard ke query.
- `server/db/queries/dashboard.ts` — `getKasSummary` — agregasi pemasukan/pengeluaran approved.
- `server/api/admin/transaction.ts` — `GET master-data/list/pending`, `POST add-direct/add-proposal/approve`, `DELETE :id` — endpoint transaksi kas dengan pemisahan jalur mutasi per intent (direct vs proposal), approval berjenjang ketua->bendahara, middleware auth/role reusable, validasi input manual, validasi param ID numerik, dan scoping data by role (`pengurus` vs approver).
- `server/services/transaction.ts` — `createTransaction`, `getPendingTransactions(user)`, `getAllTransactions(user)`, `updateStatus`, `deleteTransaction` — operasi inti transaksi + state machine proposal (`pending_ketua` -> `pending_bendahara` -> `approved`) + data scoping pending/list by role.
- `server/api/admin/pengaturan.ts` — CRUD kategori/seksi/users + middleware role — endpoint area pengaturan; kategori menerima `jenis_arus` dengan fallback `general`.
- `server/api/admin/media.ts` — `POST /`, `GET /`, `PATCH /:id`, `DELETE /:id` — endpoint media admin (auth/role, validasi MIME-size + guard ukuran upload server-side, dual-upload `file` + `thumb_file` dengan `thumb_storage_key`, sinkronisasi D1+R2, rollback orphan object multi-key, update metadata `alt_text`/kategori, dan contextual error log ringan per operasi).
- `server/utils/mediaPath.ts` — `resolveMediaStorageKey` — parser canonical URL media publik (`/api/public/media/*`) dengan fallback wildcard, backward-compat path legacy, dan sanitasi key.
- `server/services/kategori.ts` — CRUD `kategori_kas` termasuk kolom `jenis_arus` — layanan master kategori.
- `server/services/seksi.ts` — CRUD `seksi_pengurus` + `existsSeksiById` untuk hardening validasi FK payload transaksi.
- `server/services/user.ts` — `getUsers`, `createUser`, `updateUserRole`, `resetPassword`, `deleteUser` — layanan akun pengurus.
- `server/api/public/seksi.ts` — `GET /` — endpoint publik daftar seksi.
- `server/api/public/kas.ts` — `GET /summary` (published as `/api/public/kas/summary`) — endpoint publik ringkasan kas dari D1 tanpa JWT.
- `server/db/schema.sql` — DDL + seed lokal/reference — definisi tabel utama sistem, `jenis_arus`, index minimum, dan data awal.
- `migrations/0001_init_schema.sql` — migration awal DDL + index utama untuk D1 production fresh database.
- `migrations/0002_seed_initial_data.sql` — seed data master awal terpisah dari DDL.
- `.github/workflows/deploy.yml` — pipeline GitHub Actions awal untuk typecheck, apply migration D1 remote, dan deploy Cloudflare.
- `RUNBOOK.md` — runbook insiden awal untuk backup/restore D1, rollback Pages, dan health check publik.
- `vite.config.ts` — plugin Vue/Tailwind/Hono dev server — pengikat frontend-backend saat development.
- `wrangler.toml` — binding D1 + output Cloudflare Pages — konfigurasi deployment/runtime Cloudflare.

# Data & Config

- Lokasi `.env*`: `.env`, `.dev.vars` terdeteksi (isi tidak dibaca).
- Konfigurasi utama:
  - `vite.config.ts`
  - `wrangler.toml`
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.server.json`
  - `.github/workflows/deploy.yml`
  - `src/assets/main.css` (styling global, termasuk utilitas Tailwind/custom class)
- Skema data inti (dari `server/db/schema.sql`):
  - `users` (akun admin/pengurus, role, password hash, `token_version` untuk revocation session).
  - `seksi_pengurus` (master seksi + nama pengurus).
  - `kategori_kas` (master kategori kas/pos anggaran dengan `jenis_arus`: `pemasukan|pengeluaran|general`).
  - `periode` (periode/event lintas bulan).
  - `kas_masjid` (transaksi kas; FK ke `kategori_kas`, `periode`, `seksi_pengurus`, `users`, dengan status bertahap `pending_ketua|pending_bendahara|approved|rejected` + `approved_at`).
  - `dokumentasi` (metadata media admin: `storage_key`, `thumb_storage_key`, kategori penggunaan, metadata dimensi/ukuran, FK uploader).
  - Relasi ringkas: `kas_masjid` many-to-one ke `users`, `kategori_kas`, `seksi_pengurus`, opsional ke `periode`; `dokumentasi` many-to-one ke `users` (uploader).
- Lokasi migration/seed:
  - Migration awal DDL + index: `migrations/0001_init_schema.sql`.
  - Seed awal: `migrations/0002_seed_initial_data.sql`.
  - Workflow proposal & status bertahap: `migrations/0003_proposal_workflow.sql`.
  - Audit columns transaksi: `migrations/0004_add_audit_columns.sql`.
  - Index lanjutan transaksi: `migrations/0005_add_indexes.sql`.
  - Migration media library: `migrations/0006_media_library.sql` (tabel `dokumentasi`, constraint allowlist, FK uploader, unique `storage_key` + `thumb_storage_key`, dan index listing admin).
  - Reconcile role bendahara: `migrations/0007_reconcile_bendahara_role.sql` (diset no-op by design untuk stabilitas pipeline remote; eksekusi rekonsiliasi live dilakukan via `fix.sql` sesuai runbook).
  - Migration auth token revocation: `migrations/0008_auth_token_version.sql` (kolom `users.token_version` + backfill default `0` untuk data lama).
  - Catatan kompatibilitas: struktur migration ini aman untuk D1 remote yang fresh; jika migration lama pernah apply di remote, perlu strategi reconcile sebelum publish.
- Konfigurasi deploy:
  - Workflow CI/CD awal: `.github/workflows/deploy.yml` dengan step name di-quote, Node.js 24, dan migration command `npx wrangler d1 migrations apply masjidnurulhuda-db --remote`.
  - Script deploy tersedia di `package.json`: `npm run deploy` menjalankan build lalu `wrangler pages deploy dist`.
  - Cek lokal terbaru: `vue-tsc -b` pass dan `npm run build` pass setelah refresh cache/install dependency.
  - Cloudflare secret yang perlu tersedia di luar repo: `CF_ACCOUNT_ID`, `CF_API_TOKEN`, dan runtime `JWT_SECRET`.
  - `CF_API_TOKEN` wajib Custom API Token level Account dengan scope D1 Edit, Pages Edit, dan Worker Scripts Edit; token standar "Edit Workers" tidak cukup untuk migration D1.
  - Status production: runtime `JWT_SECRET` sudah dipasang di Cloudflare Pages project `masjidnurulhuda` dan harus berbeda total dari `.dev.vars` lokal.
- Folder output/runtime artifacts:
  - Output build frontend: `dist` (dideklarasikan di `wrangler.toml`, tidak dianalisis sesuai exclusion).
  - Runtime cookie client: `cookies.txt` (artefak lokal, harus tidak tracked).

# External Integrations

- Cloudflare D1 (SQLite managed) — dipakai oleh seluruh route backend via binding `c.env.DB`.
- Cloudflare Workers/Pages runtime via Wrangler — konfigurasi di `wrangler.toml`, adapter dev di `vite.config.ts`, dan adapter production di `functions/api/[[path]].ts`.
- Tidak ditemukan integrasi API pihak ketiga lain (payment gateway, email service, queue, webhook): Not found.

# Risks / Blind Spots

- Tidak ada layer repository konsisten untuk semua domain: sebagian query berada di `server/services/*` (transaction/kategori/seksi/user), sehingga boundary service-query tidak seragam.
- `.dev.vars` dan `cookies.txt` sudah dikeluarkan dari index Git dan di-ignore; secret lokal sudah dirotasi, tetapi riwayat commit lokal lama pernah memuat file tersebut sehingga tetap perlu kehati-hatian sebelum publish history.
- Rotasi secret JWT dan pengelolaan secret production baseline sudah dicatat di `RUNBOOK.md`; revoke/rotation drill tetap dapat diperdalam pada Day-2 Operations.
- Struktur role berpotensi tidak sinkron jika akun lama masih menyimpan nilai role historis yang tidak masuk matrix final (`superadmin|ketua|bendahara|pengurus`).
- Migration DDL dan seed sudah dipisah untuk fresh database, dan reset lokal sudah distandarkan; namun test migration otomatis lintas skenario (fresh + non-fresh) masih belum tersedia.
- Pipeline CI/CD sudah berhasil deploy; lesson learned: readiness harus mengecek YAML quoting, Node runner aktif, Wrangler command valid, scope API token Cloudflare account-level, dan Pages Functions wrapper untuk API Hono.
- Type safety belum tuntas menyeluruh: area admin utama dan backend auth/core service sudah memakai DTO/typed payload, tetapi masih ada `any` residual di `httpClient`, beberapa component props/catch non-kritis, query dashboard, dan area publik jadwal.
- Sinkronisasi role lintas dokumen perlu dijaga ketat agar seluruh artefak tetap konsisten pada matrix final (`superadmin|ketua|bendahara|pengurus`).
- Testing baseline domain kas baru mencakup helper nominal (`formatInputRupiah`, `parseInputRupiah`, `formatRupiah`); integration test lintas approval ketua-bendahara belum otomatis.
- Rate limiting login masih baseline in-memory; cukup untuk proteksi awal, tetapi tidak persisten lintas isolate/region Cloudflare. Jika trafik/risiko naik, pertimbangkan Cloudflare Turnstile, WAF rules, KV, D1, atau Redis-compatible storage.
- Dokumentasi resmi arsitektur/operasional minim (README masih template), sehingga beberapa keputusan non-fungsional (monitoring, backup, recovery) tidak bisa dipetakan pasti.
