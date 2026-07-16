# Project Summary

- Kontrak visual aktif: `DESIGN.md` (Nurul Huda Civic Editorial) dan audit/migration workstream `docs/UI_UX_REDESIGN_AUDIT.md`. R1 foundation, R2 public experience, dan R3 Admin Shell dan Authentication `Done`; workstream berikutnya adalah R4 Financial Workflows. Screen admin domain masih campuran V2/legacy/custom dan merupakan behavior baseline sementara, bukan target visual final. Full redesign admin diprioritaskan sebelum mayoritas P1–P2 tanpa mengubah API/RBAC/domain contract P0.5.
- `[DEV only] GET /_design-system -> DesignSystemLab.vue -> complete R1 Civic Editorial foundation specimens`; mencakup form/select/combobox/date, responsive data/table/card, timeline, status/state, hierarchy, serta token/font. Route hanya diregistrasikan saat `import.meta.env.DEV`, melewati auth bootstrap, dan tidak masuk production route table.

- Tujuan aplikasi: website publik Masjid Nurul Huda (informasi profil, transparansi kas, kabar, galeri, kritik/saran) + panel administrasi untuk autentikasi admin, ringkasan kas, manajemen transaksi kas (input/proposal/approval/laporan), dan master data pengaturan (kategori, seksi, akun).
- Tech stack utama:
  - Frontend: Vue 3 + TypeScript + Vue Router + Pinia + Tailwind CSS (via `@tailwindcss/vite`) + `lucide-vue-next`.
  - Backend: Hono.js (`server/index.ts`) berjalan via Vite dev server adapter Cloudflare.
  - Database: Cloudflare D1 (SQLite) melalui binding `DB` di `wrangler.toml`.
  - Auth: JWT (`hono/jwt`) disimpan di cookie `httpOnly`.
- Deployment dipisahkan permanen: branch `testing` memakai Pages/D1/R2 testing melalui `wrangler.testing.toml`; branch `main` memakai resource production melalui `wrangler.toml`. Binding aplikasi tetap `DB` dan `MEDIA_BUCKET` sehingga source code tidak bercabang berdasarkan environment.
- Pola arsitektur singkat: UI Vue (view/component) -> composable/store/service frontend -> `httpClient` terpusat (request bridge + normalisasi error non-2xx) -> Cloudflare Pages Functions wrapper `functions/api/[[path]].ts` -> endpoint `/api/*` Hono (route + middleware auth) -> service/query SQL -> tabel D1.

# Core Logic Flow (Function-Level Flowchart)

- `[Vue] LoginV2.vue(handleLogin + VeeValidate/Zod) -> authStore.login -> httpClient -> POST /api/admin/auth/login -> exact same-origin + security headers -> pre-check persistent D1 limiter (SHA-256 IP+email) -> authService.loginAdmin (active account only) -> frontend membedakan 401 kredensial, 429 rate limit, dan operational/network error; success: hapus bucket -> security audit tanpa data sensitif -> JWT cookie httpOnly (tv+exp 24 jam)`
- `[Vue] router.beforeEach -> [Vue] authStore.checkAuth/retryAuth (latest-response wins) -> [Hono] GET /api/admin/auth/me -> verify JWT cookie + validasi claim tv vs users.token_version -> response session (redirect login hanya pada 401 definitif; 5xx/network menjadi recoverable error tanpa reset sesi; AdminLayoutV2 menampilkan retry overlay)`
- `[Vue] AdminLayoutV2(handleLogout) -> [Vue] authStore.logout() -> [Hono] POST /api/admin/auth/logout -> verify JWT cookie (best-effort) -> [Query] bumpUserTokenVersion(users) -> clear cookie -> token lama revoke server-side`
- `[Vue] GET / (public route, auth bootstrap dilewati) -> [Vue] PublicLayout.vue -> [Vue] Home.vue -> Civic Editorial section navigation (hero/jadwal/kas/kabar/galeri/saran); mobile nav mengelola focus, Escape, focus restoration, dan scroll lock`
- `[Vue] Home/JadwalSholat(useJadwal) -> [Vue] jadwalService.fetchJadwalToday -> [Hono] GET /api/public/jadwal/today (proxy + timeout/retry) -> [External API] MyQuran Kemenag -> cache harian localStorage; cache lama ditandai stale dan tanpa cache menjadi recoverable unavailable state`
- `[Vue] Home/KasWidget(useKasSummary) -> [Vue] kasSummaryService.fetchSummary -> [Hono] GET /api/public/kas/summary -> [Query] aggregate approved dengan boundary bulan eksplisit Asia/Jakarta [start,nextStart) -> DB kas_masjid`
- `[Vue] DashboardV2.vue -> [Vue] useDashboard.updatePeriod -> useDashboard.fetchSummary(period) -> [Vue] dashboardService.getSummary(month,year) -> [Vue] httpClient -> [Hono] GET /api/admin/dashboard/summary?month=&year= -> parse period filter (fallback WIB Asia/Jakarta) -> dashboardService.getDashboardSummary(period) -> dashboard query SUM periodik kas_masjid (approved) -> DB kas_masjid`
- `[Vue] FinanceV2.vue -> [Vue] useKas.loadData -> [Vue] kasService.getMasterData + getTransactions(month,year,tipe,kategori_id) + dashboardService.getSummary(month,year) -> [Vue] httpClient (credentials include + typed ApiError code/fields) -> [Hono] GET /api/admin/transaction/master-data + /list?month=&year=&tipe=&kategori_id= + /api/admin/dashboard/summary?month=&year= -> shared parseBusinessPeriod (fallback kosong tetap periode WIB Asia/Jakarta) -> [Service] getAllTransactions(user,period,filters) + getDashboardSummary(period) -> DB kas_masjid (list: filter periode by `tanggal` + optional `tipe/kategori_id`, role=pengurus: approved OR created_by=user.sub|id; summary: aggregate server-side periodik sebagai source-of-truth widget kas)`
- `[Vue] KeuanganKas/KasLaporan -> [Vue] utils/permissions(canAccessKasInput|canViewProposalTab|canDelete) -> guard visibilitas tab/aksi berdasarkan allowlist role -> sinkron dengan policy backend transaksi`
- `[Vue] KasInput/KasProposal -> [Vue] useKas.filteredCategoriesInput|filteredCategoriesProposal -> master-data categories(jenis_arus) -> UI dropdown kategori difilter by tipe transaksi + general`
- `[Vue] KeuanganKas filter watcher -> [Vue] useKas: watcher(month/year) refetch list+summary; watcher(tipe/kategori) refetch list-only -> [Vue] kasService.getTransactions + dashboardService.getSummary -> [Hono] GET /api/admin/transaction/list + /api/admin/dashboard/summary -> [Service] getAllTransactions(user,period,filters) + getDashboardSummary(period) -> DB kas_masjid (sinkron list+summary periodik, sekaligus menghindari fetch summary berulang saat filter non-periode berubah)`
- `[Vue] KasInput(useKas.handleDirectInput) -> [Vue] parseInputRupiah/formatInputRupiah (helper terpusat) -> [Vue] kasService.submitDirectTransaction -> [Vue] httpClient (ApiError on non-2xx) -> [Hono] POST /api/admin/transaction/add-direct -> validasi DTO + validasi FK seksi (`existsSeksiById`) -> txService.createTransaction -> DB kas_masjid (status dipaksa approved, seksi_id opsional: jika dikirim harus integer positif & eksis di seksi_pengurus, jika kosong disimpan null)`
- `[Vue] KasProposal(useKas.handleProposal) -> [Vue] parseInputRupiah/formatInputRupiah (helper terpusat) -> [Vue] kasService.submitProposal -> [Vue] httpClient (ApiError on non-2xx) -> [Hono] POST /api/admin/transaction/add-proposal -> validasi DTO + validasi FK seksi (`existsSeksiById`) -> txService.createTransaction -> DB kas_masjid (status awal proposal = pending_ketua, seksi_id wajib, harus eksis di seksi_pengurus)`
- `[Vue] KasApproval tahap ketua (useKas.handleAction) -> [Vue] kasService.approveTransaction -> [Hono] POST /api/admin/transaction/approve/:id -> txService.updateStatus -> DB kas_masjid (pending_ketua -> pending_bendahara)`
- `[Vue] KasApproval tahap bendahara (useKas.handleAction) -> [Vue] kasService.approveTransaction -> [Hono] POST /api/admin/transaction/approve/:id -> txService.updateStatus -> DB kas_masjid (pending_bendahara -> approved, pencairan dana masuk laporan kas)`
- `[Vue] FinanceV2 pembatalan transaksi -> [Vue] useKas.handleVoid -> kasService.voidTransaction -> [Hono] POST /api/admin/transaction/:id/void (bendahara|superadmin, alasan 10-500 karakter) -> txService.voidTransaction -> D1 batch conditional approved->void + transaction_audit_events; record tetap tersimpan dan summary approved-only tidak menghitung void`
- `[Vue] FinanceV2 riwayat audit -> kasService.getTransactionTimeline -> [Hono] GET /api/admin/transaction/:id/timeline -> txService.getTransactionAuditTimeline -> ownership policy pengurus (owner atau approved) -> transaction_audit_events + users`
- `[Hono] add-direct/add-proposal/approve/reject/void -> validasi Idempotency-Key + canonical request hash -> transaction service -> D1 claim-first batch (claim registry -> conditional mutation -> audit event -> finalize registry); duplicate payload sama replay, key sama payload berbeda/processing/stale transition 409`
- `[Vue] PengaturanV2 -> PengaturanLegacyBridge -> usePengaturan -> pengaturanService/httpClient -> /api/admin/pengaturan/users* (superadmin-only) -> conditional D1 mutation + conditional audit; atomic recovery guard + token_version revocation`
- `[Vue] Admin Media Library(useMediaUpload) -> mediaService -> POST /api/admin/media -> conditional R2 create non-overwrite -> insert D1; cleanup hanya object yang dibuat request`
- `[Vue] Admin Media Grid -> [Vue] mediaService.listMedia -> [Vue] httpClient -> [Hono] GET /api/admin/media?page&limit&kategori_penggunaan -> [Query] D1 dokumentasi (termasuk `thumb_storage_key`) -> [Vue] fallback render thumb: URL thumb gagal load (404/error) => fallback ke `file_url` utama`
- `[Vue] Admin Media Delete -> mediaService.deleteMedia -> DELETE /api/admin/media/:id -> conditional D1 active→pending_delete bila tanpa media_references + enqueue per storage key -> 202; outbox processor menghapus R2 idempotent, retry partial failure, lalu tombstone deleted; reconciliation menangani lifecycle/outbox drift`
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
  - query difilter periodik via parameter `month` + `year` (fallback default bulan/tahun berjalan jika kosong/tidak valid),
  - filter tambahan `tipe` (`pemasukan|pengeluaran`) dan `kategori_id` (integer positif) diparse/validasi di route lalu diteruskan sebagai optional SQL clause,
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
      AdminLayoutV2.vue
      PublicLayout.vue
    views/
      public/
        Home.vue
      admin/
        Login.vue
        LoginV2.vue
        Dashboard.vue
        DashboardV2.vue
        FinanceV2.vue
        KeuanganKas.vue
        KeuanganKasV2.vue
        Pengaturan.vue
        PengaturanV2.vue
    components/
      legacy/
        DashboardLegacyBridge.vue
        KeuanganKasLegacyBridge.vue
        PengaturanLegacyBridge.vue
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
        shared/
          MonthYearPicker.vue
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
- `src/layouts/PublicLayout.vue` — `closeMobileMenu`, `handleKeydown` — shell publik Civic Editorial (sticky section navigation, accessible mobile menu, verified-content footer, dan Portal Pengurus nyata).
- `src/views/public/Home.vue` — section composition — orchestrator homepage Civic Editorial tanpa animation directive/dekorasi gradient.
- `src/composables/public/home/useJadwal.ts` — `loadJadwal`, cache harian localStorage, fallback offline — logic layer jadwal sholat publik yang tahan gangguan API eksternal.
- `src/composables/public/home/useKasSummary.ts` — `loadKas`, `formatRupiah` — logic layer widget kas publik dari endpoint read-only.
- `src/services/public/home/jadwalService.ts` — `fetchJadwalToday` — service layer konsumsi endpoint proxy backend jadwal (`/api/public/jadwal/today`).
- `src/services/public/home/kasSummaryService.ts` — `fetchSummary` — service layer endpoint publik kas summary.
- `src/components/public/home/KasWidget.vue` — render ringkasan kas publik berbasis data real D1.
- `src/components/public/home/KabarMasjid.vue`, `src/components/public/home/GaleriWidget.vue`, `src/components/public/home/KritikSaran.vue` — honest unavailable/empty state; tidak menampilkan artikel, media, form, kontak, atau CTA contoh sebelum contract publikasi tersedia.
- `src/stores/authStore.ts` — `login`, `logout`, `checkAuth` — sumber state autentikasi global frontend; `checkAuth` menormalkan state logout hanya pada `401 /auth/me` dan mempertahankan state pada `5xx/network error` (operational error path).
- `src/views/admin/LoginV2.vue` — `handleLogin` — UI login admin aktif (V2/shadcn) dan trigger autentikasi.
- `src/views/admin/Login.vue` — `handleLogin` — UI login legacy (dipertahankan sementara untuk rollback window terkontrol).
- `src/layouts/AdminLayoutV2.vue` — `handleLogout`, route breadcrumb, theme, dan auth recovery — orchestrator shell admin aktif berbasis shadcn-vue Sidebar; navigation composition berada di `AdminSidebar.vue`.
- `src/components/admin/shell/AdminSidebar.vue` — grouped role-aware navigation, shadcn Collapsible submenu, desktop icon collapse, mobile off-canvas, dan account footer. Desktop shell memakai density 32 px; mobile controls 44 px; account row 48 px. Frontend visibility tetap hanya UX, bukan otoritas RBAC.
- Server-authorized role impersonation tersedia untuk superadmin asli melalui `POST /api/admin/auth/impersonation/start|stop`. JWT mempertahankan `sub/id` superadmin sebagai actor asli, memakai role target sebagai otoritas efektif backend, memiliki expiry 15 menit, mempertahankan expiry sesi asli, menolak samaran berantai, menulis security audit start/stop, dan selalu menampilkan banner permanen + exit di shell.
- `src/layouts/AdminLayout.vue` — layout admin legacy yang dipertahankan sebagai fallback rollback window.
- `src/views/admin/DashboardV2.vue` — entrypoint admin dashboard aktif (Stage 4 swap); memakai kontrak composable/service yang sama dan mempertahankan compatibility bridge untuk rollback window.
- `src/views/admin/Dashboard.vue` — entrypoint admin dashboard legacy (fallback rollback), mendelegasikan render ke `src/components/legacy/DashboardLegacyBridge.vue`.
- `src/composables/admin/useDashboard.ts` — `selectedPeriod`, `fetchSummary`, `updatePeriod` — state periode dashboard + loading ringkasan kas via service.
- `src/views/admin/FinanceV2.vue` — entrypoint admin kas aktif pada route `/admin/finance` (Stage 4 swap), memakai kontrak composable/service kas yang sama tanpa ubah backend contract.
- `src/views/admin/KeuanganKasV2.vue` — shadow view transisional berbasis bridge legacy untuk parity/rollback window redesign kas.
- `src/views/admin/KeuanganKas.vue` — entrypoint admin kas legacy (fallback rollback), mendelegasikan render ke `src/components/legacy/KeuanganKasLegacyBridge.vue`.
- `src/composables/admin/useKas.ts` — facade composable kompatibel untuk caller kas aktif/transisional (`FinanceV2`/`KeuanganKasV2`/legacy + komponen tab kas), mendelegasikan state/actions/watchers ke modul internal agar refactor bertahap aman rollback dengan kontrak service/backend tetap.
- `src/composables/admin/kas/useKasState.ts` — sumber state kas terpusat (tab aktif, filter periode, master data, form transaksi/proposal, summary).
- `src/composables/admin/kas/useKasActions.ts` — `loadData`, `loadMasterData`, `loadTransactions`, `loadSummary`, `handleDirectInput`, `handleProposal`, `handleAction`, `handleDelete` — orkestrasi aksi kas terhadap `kasService` + `dashboardService`.
- `src/composables/admin/kas/useKasComputed.ts` — computed turunan laporan/approval (summary global, filter tabel, kategori by `jenis_arus`, antrean status proposal).
- `src/composables/admin/kas/useKasWatchers.ts` — watcher sinkronisasi data periodik/filter transaksi (list+summary vs list-only).
- `src/composables/admin/kas/useKasFormWatchers.ts` — watcher sanitasi/reset state form saat tab/tipe transaksi berubah untuk mencegah stale value.
- `src/services/httpClient.ts` — `httpClient`, `ApiError` — jembatan fetch wrapper terpusat (default `credentials: include`) untuk intersepsi HTTP error non-2xx dan normalisasi error agar bisa dipakai notifikasi global (`vue-sonner`) di layer UI.
- `src/services/admin/dashboardService.ts` — `getSummary` — API client dashboard admin berbasis `httpClient`.
- `src/services/admin/kasService.ts` — `getMasterData`, `getTransactions`, `submitDirectTransaction`, `submitProposal`, `approveTransaction`, `deleteTransaction` — API client ke endpoint transaksi kas yang dipisah per intent, termasuk query periodik `month/year` + filter optional `tipe/kategori_id` untuk list.
- `src/components/legacy/DashboardLegacyBridge.vue` — adapter sementara Stage 2 untuk host UI dashboard existing, kini termasuk integrasi period picker (`MonthYearPicker`) sambil tetap memakai composable/service yang sama (target cleanup di Stage 5).
- `src/components/legacy/KeuanganKasLegacyBridge.vue` — adapter sementara Stage 2 untuk host UI kas existing (summary, tab RBAC, laporan/approval/input/proposal) tanpa fork logic bisnis.
- `src/components/legacy/PengaturanLegacyBridge.vue` — adapter sementara Stage 2 untuk host UI pengaturan existing (tab kategori/seksi/akun, modal CRUD, confirm delete) dengan kontrak composable tetap.
- `src/components/admin/shared/MonthYearPicker.vue` — period picker reusable bulan/tahun berbasis shadcn (`button + popover + calendar`) untuk kontrak filter `month/year` lintas layar admin.
- `src/components/admin/kas/KasLaporan.vue` — tabel laporan + filter + ConfirmModal delete — UI guard RBAC untuk kolom/aksi delete berbasis helper `canDelete`; label audit `approved_at` dinamis (`Cair` untuk pengeluaran, `Masuk` untuk pemasukan).
- `src/components/admin/kas/KasApproval.vue` — antrean approval/status proposal bertahap (tahap ketua & tahap bendahara) + ConfirmModal approve/reject — UI guard RBAC untuk urutan approval berjenjang.
- `src/components/admin/kas/KasInput.vue` — form kas langsung + validasi UI + ConfirmModal submit; pilihan seksi bersifat opsional dan disimpan bila dipilih; input nominal memakai format ribuan realtime + guard non-digit.
- `src/components/admin/kas/KasProposal.vue` — form proposal + validasi UI + ConfirmModal submit; `seksi_id` wajib sebelum dikirim ke backend; input nominal memakai format ribuan realtime + guard non-digit.
- `src/components/ui/ConfirmModal.vue` — modal konfirmasi reusable berbasis reka Dialog untuk aksi destructive/success/warning, termasuk pending Escape/outside guard.
- `src/views/admin/PengaturanV2.vue` — entrypoint admin pengaturan aktif (Stage 4 swap); tetap memakai kontrak composable/service yang sama via `PengaturanLegacyBridge.vue` selama observability window.
- `src/views/admin/Pengaturan.vue` — entrypoint admin pengaturan legacy (fallback rollback), mendelegasikan render ke `src/components/legacy/PengaturanLegacyBridge.vue`.
- `src/composables/admin/usePengaturan.ts` — facade composable kompatibel untuk `Pengaturan.vue`, menggabungkan state/actions/modal/watchers agar migrasi bertahap tanpa rewrite total dengan kontrak service/backend tetap.
- `src/composables/admin/pengaturan/usePengaturanState.ts` — state lintas tab (kategori/seksi/akun), state dropdown/modal, dan form data pengaturan.
- `src/composables/admin/pengaturan/usePengaturanActions.ts` — `loadData`, `saveItem`, `deleteItem`, helper input pengurus — logika CRUD per domain tab via `pengaturanService`.
- `src/composables/admin/pengaturan/usePengaturanModal.ts` — orchestration UI modal/dropdown (`openModal`, `closeModal`, `toggleDropdown`, `closeDropdowns`) terpisah dari CRUD.
- `src/composables/admin/pengaturan/usePengaturanWatchers.ts` — watcher mount + perubahan tab untuk auto-load data sesuai konteks tab aktif.
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
- `server/middleware/rateLimit.ts` — `checkLoginBlocked`, `recordLoginFailure`, `resetLoginFailures` — persistent D1 limiter failure-only dengan hashed key, blocked pre-check, atomic failure increment, deterministic window, `Retry-After`, dan reset bucket saat login sukses.
- `server/api/admin/auth.ts` — `POST /login`, `POST /logout`, `GET /me` — autentikasi cookie JWT; login memvalidasi email/password + rate limit, logout menginvalidasi sesi server-side via increment `users.token_version`, dan endpoint `me` memverifikasi kecocokan `tv` token terhadap `users.token_version`.
- `server/services/auth.ts` — `loginAdmin`, `AuthUserRow`, `AuthRole` — validasi kredensial typed, hash verify, pembuatan token JWT dengan `tv` + `exp` 24 jam.
- `server/db/queries/auth.ts` — `getUserByEmail`, `getUserTokenVersionById`, `bumpUserTokenVersion` — query auth login membaca `COALESCE(operational_role, role)` + revocation berbasis token version.
- `server/api/admin/dashboard.ts` — `GET /summary` + middleware auth — endpoint ringkasan kas admin dengan query opsional `month/year`, validasi pasangan period, dan fallback default period WIB (Asia/Jakarta) saat query kosong.
- `server/services/dashboard.ts` — `getDashboardSummary` — delegasi business logic dashboard dengan parameter period (`month/year`) ke layer query.
- `server/db/queries/dashboard.ts` — `getKasSummary` — agregasi pemasukan/pengeluaran approved berbasis period (`strftime('%m/%Y', tanggal)`) dalam satu query conditional aggregation untuk menekan I/O scan.
- `server/api/admin/transaction.ts` — `GET master-data/list/pending`, `POST add-direct/add-proposal/approve`, `DELETE :id` — endpoint transaksi kas dengan pemisahan jalur mutasi per intent (direct vs proposal), approval berjenjang ketua->bendahara, middleware auth/role reusable, validasi input manual, validasi param ID numerik, scoping data by role (`pengurus` vs approver), dan filter periodik `month/year` untuk list transaksi.
- `server/services/transaction.ts` — `createTransaction`, `getPendingTransactions(user)`, `getAllTransactions(user, period)`, `updateStatus`, `deleteTransaction` — operasi inti transaksi + state machine proposal (`pending_ketua` -> `pending_bendahara` -> `approved`) + data scoping pending/list by role + filter periodik berbasis `tanggal`.
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
- `migrations/0002_seed_initial_data.sql` — migration historis immutable yang memuat seed awal; credential default historis direkonsiliasi oleh migration 0017.
- `migrations/0017_disable_known_default_credentials.sql` — menonaktifkan akun yang masih memakai known default hash dan merevoke sesi tanpa memengaruhi password yang telah dirotasi.
- `scripts/provision-admin.mjs` — provisioning/recovery superadmin D1 lokal dari environment lokal; password kuat wajib, default tidak overwrite akun existing kecuali `--replace-existing`.
- `npm run admin:provision:testing` — mode remote testing hard-bound ke D1/config testing; bootstrap production sengaja tidak tersedia melalui command ini.
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
  - Migration media library: `migrations/0006_media_library.sql` (tabel `dokumentasi`, constraint allowlist, FK uploader, unique `storage_key`, dan index listing admin).
  - Reconcile thumbnail media: `migrations/0009_add_media_thumb_storage_key.sql` (additive column, backfill key canonical untuk row lama, dan unique partial index `thumb_storage_key`).
  - Reconcile role bendahara: `migrations/0007_reconcile_bendahara_role.sql` (diset no-op by design untuk stabilitas pipeline remote; eksekusi rekonsiliasi live dilakukan via `fix.sql` sesuai runbook).
  - Migration auth token revocation: `migrations/0008_auth_token_version.sql` (kolom `users.token_version` + backfill default `0` untuk data lama).
  - Migration void/audit transaksi: `migrations/0010_transaction_void_audit.sql` (status/metadata void, preservasi row existing, tabel `transaction_audit_events`, dan index audit).
  - Migration registry idempotency: `migrations/0011_transaction_idempotency.sql` (unique actor+operation+key, request hash, transaction/result persistence).
  - Migration lifecycle idempotency: `migrations/0012_idempotency_lifecycle.sql` (`processing|completed` untuk claim-first dan replay deterministik).
- Migration role operasional: `migrations/0014_reconcile_user_roles.sql` (kolom additive `operational_role`, backfill role legacy, allowlist termasuk bendahara tanpa rebuild parent users).
- Seed bendahara operasional: `migrations/0015_seed_operational_bendahara.sql`; executable fresh/upgrade harness: `npm run test:migrations`.
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
- Rate limiting login persisten di D1 dan hanya mencatat autentikasi gagal. Keputusan pre-check dan increment failure adalah operasi terpisah; increment failure sendiri atomic, sedangkan koordinasi strict seluruh verifikasi password lintas request tetap terbatas oleh model D1 tanpa coordinator khusus.
- Dokumentasi resmi arsitektur/operasional minim (README masih template), sehingga beberapa keputusan non-fungsional (monitoring, backup, recovery) tidak bisa dipetakan pasti.
