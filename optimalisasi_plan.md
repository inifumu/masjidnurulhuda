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
- [x] Rate limiting endpoint login:
  - `POST /api/admin/auth/login` dilindungi rate limit baseline berbasis in-memory Map,
  - limit memakai key `cf-connecting-ip + email`, maksimal 5 kegagalan dalam 15 menit,
  - attempt hanya dicatat saat kredensial gagal, dihapus saat login berhasil, dan response blokir mengirim `429` + `Retry-After`.

### In Progress

- [~] Hardening auth/session lanjutan:
  - cookie/session sudah membaik,
  - rotasi secret + runbook lifecycle secret belum finalized,
  - temuan pre-push: `.dev.vars` dan `cookies.txt` sudah dikeluarkan dari index Git dan secret lokal sudah dirotasi.
- [~] Migration versioning D1:
  - folder `migrations/` sudah berlanjut sampai `0006` (`0001_init_schema.sql` s.d `0006_media_library.sql`),
  - DDL/index, seed, proposal workflow, audit columns, index lanjutan, dan media library sudah dipisah per migration,
  - hotfix Mei 2026: `migrations/0003_proposal_workflow.sql` dipatch agar kompatibel D1/SQLite (`PRAGMA foreign_keys=OFF` saat rebuild parent-child, seed `INSERT OR IGNORE`) setelah temuan gagal remote apply `SQLITE_CONSTRAINT_FOREIGNKEY`,
  - hotfix lanjutan Mei 2026: statement `BEGIN TRANSACTION/COMMIT` dihapus dari migration `0003` karena `wrangler d1 migrations apply --remote` menolak explicit transaction control (error `code: 7500`),
  - belum ada skrip apply/reset/seed yang konsisten,
  - perlu reconcile jika migration lama pernah apply di D1 remote non-fresh.

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

### In Progress

- [~] Konsistensi RBAC lintas modul admin:
  - transaksi sudah fail-closed,
  - modul admin lain masih perlu audit seragam.
  - temuan audit selesai: `GET /api/admin/dashboard/summary` sudah memakai `requireAuth` + allowlist role eksplisit.
- [~] Type safety menyeluruh frontend-backend (DTO request/response + minim `any`).
  - update Day-2: payload `kasService.submitDirectTransaction`, `kasService.submitProposal`, form `useKas`, payload/list `usePengaturan`, `dashboardService`, dan `pengaturanService` sudah memakai DTO eksplisit.
  - update backend: `server/utils/response.ts`, `server/middleware/auth.ts`, `server/services/transaction.ts`, `server/services/user.ts`, dan `server/services/auth.ts` sudah bebas `any`.
  - sisa audit: `any` residual masih ada di `src/services/httpClient.ts`, beberapa component props/catch admin, query dashboard, dan area publik jadwal.

### Not Yet

- [x] Validasi DTO backend lanjutan:
  - [x] `jenis_arus` sudah divalidasi eksplisit via allowlist `pemasukan|pengeluaran|general` di route `/api/admin/pengaturan/kategori`.
  - [x] `seksi_id` Kas Langsung (dan proposal) sudah hardening validasi FK: nilai hanya diterima jika parse integer positif **dan** benar-benar ada di tabel `seksi_pengurus` (`existsSeksiById`), sehingga payload di luar UI dengan ID fiktif ditolak `400`.
  - [x] `role` pada create/update akun sudah memakai allowlist `superadmin|ketua|bendahara|pengurus` sebelum masuk service DB.
  - [x] `kategori_id` dan `seksi_id` pada transaksi sudah parse integer positif; `add-proposal` sudah normalisasi `seksi_id` seperti `add-direct`.
  - [x] `jumlah` transaksi sudah memakai `Number.isFinite` + batas maksimum nominal wajar untuk mencegah nilai seperti `Infinity`.
  - [x] route param `:id` di pengaturan kategori/seksi/users/reset-password/delete sudah validasi integer positif seperti endpoint transaksi.
  - [x] test pendukung ditambahkan untuk helper validasi existence seksi (`tests/seksi-service.test.mjs`) dan total test suite kini 13 pass.
  - catatan sinkronisasi frontend: dropdown role di `Pengaturan.vue` + `UserRole` di `pengaturanService` sudah memasukkan `bendahara` agar konsisten dengan backend.
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
- [x] Tambahkan helper permission frontend terpusat (`canApprove`, `canDelete`, `canViewProposalTab`).
  - `src/utils/permissions.ts` aktif sebagai allowlist RBAC UI terpusat.
  - `KeuanganKas.vue` dan `KasLaporan.vue` sudah migrasi dari guard inline (`role !== ...`) ke helper permission.

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

## Task Aktif Baru — Media Library Admin + Reusable Media Picker

Status: **[~] In Progress**

Tujuan: membangun Media Library terpusat untuk admin agar upload, manajemen, dan pemilihan gambar dapat dipakai ulang lintas fitur (Artikel, Galeri, Profil, dll) tanpa upload berulang, tetap hemat kuota R2, dan maintainable pada arsitektur Vue + Hono + D1.

Trace-by-flow target:
`User Action (Vue Admin Media UI) -> Composable/Service FE (mediaService + httpClient) -> Hono Route (/api/admin/media) -> Hono Handler/Service -> D1 (dokumentasi) + R2`

### FASE 0.5 — Kontrak Data & API (wajib sebelum coding besar)

- [x] Kunci kontrak tabel `dokumentasi` + index + constraint.
  - status: dikunci di migration `migrations/0006_media_library.sql` (allowlist kategori, allowlist MIME, check size/dimensi, FK uploader, unique `storage_key`, dan index list admin).
- [x] Kunci kontrak response API (`status`, `message`, `data`) agar konsisten dengan helper backend existing.
  - status: disepakati tetap memakai helper response terpusat (`sendSuccess/sendError`) pada fase endpoint media.
- [x] Kunci policy otorisasi upload/list/delete sesuai role admin existing.
  - status: disepakati allowlist role admin existing (`superadmin|ketua|bendahara|pengurus`) dengan enforcement di route media.
- [x] Kunci keputusan scope:
  - hard delete (D1 + R2), bukan soft delete;
  - offset pagination (`page`, `limit`) untuk fase awal;
  - tanpa SHA256 checksum/dedup di fase awal.

### FASE 1 — Infrastruktur & Database

- [x] Setup binding R2 di `wrangler.toml` (environment yang dipakai).
  - status: binding `MEDIA_BUCKET` ditambahkan dengan bucket `masjidnurulhuda-media`.
- [~] Konfigurasi CORS R2 (allow origin domain aplikasi saja, bukan wildcard longgar).
  - status local: konfigurasi CORS dilakukan di level bucket R2 (dashboard/API Cloudflare), bukan di `wrangler.toml`; perlu verifikasi policy origin final saat pre-go-live.
- [x] Buat migration `migrations/0006_media_library.sql` berisi tabel `dokumentasi`:
  - `id` INTEGER PK AUTOINCREMENT
  - `file_url` TEXT NOT NULL
  - `storage_key` TEXT NOT NULL UNIQUE
  - `kategori_penggunaan` TEXT NOT NULL DEFAULT `general` (allowlist: `general|artikel|profil|galeri`)
  - `alt_text` TEXT
  - `mime_type` TEXT NOT NULL (allowlist: `image/webp|image/jpeg|image/png`)
  - `size_bytes` INTEGER NOT NULL (`> 0`)
  - `width` INTEGER NULL (`> 0` bila terisi)
  - `height` INTEGER NULL (`> 0` bila terisi)
  - `uploaded_by` INTEGER NOT NULL (FK ke `users(id)`)
  - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- [x] Buat index:
  - `idx_dokumentasi_kategori_created` pada `(kategori_penggunaan, created_at DESC)`
  - `idx_dokumentasi_created` pada `(created_at DESC)`
  - `idx_dokumentasi_uploaded_by_created` pada `(uploaded_by, created_at DESC)`
  - status: index didefinisikan di migration `migrations/0006_media_library.sql`.
- [x] Terapkan metadata upload object R2:
  - `Cache-Control: public, max-age=31536000, immutable`
  - status: sudah diterapkan di endpoint upload `POST /api/admin/media` pada `MEDIA_BUCKET.put(...).httpMetadata.cacheControl`.
- [x] Apply migration media ke D1 local + verifikasi struktur.
  - status: `npx wrangler d1 migrations apply masjidnurulhuda-db --local` sukses (`0006_media_library.sql` ✅).
  - verifikasi: tabel `dokumentasi` + index `idx_dokumentasi_created`, `idx_dokumentasi_kategori_created`, `idx_dokumentasi_uploaded_by_created` terdeteksi via `wrangler d1 execute --local`.

### FASE 2 — Frontend Logic (Pipeline Gambar)

- [x] Keputusan library final:
  - library utama: `browser-image-compression` (sudah terpasang di dependency project);
  - arsitektur wrapper internal: `src/utils/media/imagePipeline.ts` (single entrypoint pipeline agar komponen Vue tetap bersih).
- [x] Pre-check file: validasi MIME (`file.type`) allowlist `image/jpeg|image/png|image/webp` di pipeline FE.
- [x] Client-side resize/compression adaptive:
  - pendekatan fase awal: adaptive compression pass (target size indikatif, non hard-blocking UX), tanpa hard reject berbasis dimensi.
  - update kualitas: iterative compression sekarang selalu berbasis file original per attempt (anti generation loss).
- [x] Client-side compression + konversi WebP (dengan fallback error aman bila konversi gagal).
- [~] Catatan EXIF orientation:
  - implementasi memakai capability bawaan `browser-image-compression` (`exifOrientation`),
  - tetap wajib UAT lintas device (portrait + landscape Android/iPhone) sebelum go-live.
- [x] Auto-rename standar object key:
  - format: `media/YYYY/MM/<uuid>-<slug>.<ext>` via helper `createStorageKeyFromFile`.
- [x] Batch upload baseline:
  - composable `src/composables/admin/useMediaUpload.ts` sudah mendukung multi-file, progress per file, status sukses/gagal per item, dan retry item.
  - update UX/performa: progress sudah monotonic 50:50 (kompres 0-50, upload 50-100) agar tidak terjadi progress bar “mundur”.
  - update throughput: proses upload sudah bounded concurrency (batch upload size = 2), tidak serial satu-per-satu.
- [x] Readiness media pre-push:
  - endpoint backend `/api/admin/media` (POST/GET/DELETE/PATCH) sudah live di branch ini,
  - integrasi FE pipeline upload sudah sinkron dengan kontrak request/response backend.
  - update bugfix: isu progress kompresi macet di 1% ditangani di `useMediaUpload.addFiles` dengan memproses item reaktif dari `queue.value` (bukan draft object non-reaktif), sehingga update status/progress kembali ter-render konsisten.
  - update bugfix runtime dev: route `GET /api/public/media/*` tidak lagi memakai `object.writeHttpMetadata(headers)` (pemicu `DevalueError` Miniflare); metadata response kini diset manual dari `object.httpMetadata`.
  - update thumbnail phase (root-fix kontrak): upload tetap dual-object (`file` + `thumb_file`), tetapi metadata D1 kembali ke single source `storage_key` (tanpa kolom `thumb_storage_key`); URL thumb diturunkan deterministik di backend dan grid media fallback otomatis ke URL utama saat thumb 404/error, serta delete media menghapus dua object R2 berbasis `storage_key` + derived thumb key sebelum delete row D1.
  - update hotfix kompatibilitas thumbnail (Mei 2026): FE upload `thumb_storage_key` diseragamkan ke suffix `-thumb.webp` (mengganti pola lama `.thumb.webp`), dan route publik `GET /api/public/media/*` menambah fallback lookup ke key legacy `.thumb.webp` agar aset lama tetap terbaca tanpa migrasi rename massal di R2.

### FASE 3 — Backend API (Hono)

- [x] `POST /api/admin/media`:
  - validasi auth + role;
  - validasi MIME/size server-side;
  - upload ke R2 dengan `storage_key` standar + derived thumb key (deterministik, tanpa metadata thumb di D1);
  - upload object utama + thumbnail secara paralel;
  - insert metadata ke D1 dengan single source `storage_key`;
  - orphan handling: jika insert D1 gagal setelah upload R2 sukses, rollback delete dua object R2.
- [x] `GET /api/admin/media`:
  - filter `kategori_penggunaan`;
  - offset pagination (`page`, `limit`);
  - sorting `created_at DESC`.
- [x] `DELETE /api/admin/media/:id`:
  - ambil row D1 -> delete object R2 via `storage_key` + derived thumb key -> delete row D1 (hard delete sinkron);
  - jika delete R2 gagal, batalkan delete row D1 (hindari mismatch data).
- [x] Pastikan response API konsisten lewat helper response terpusat backend.

### FASE 4 — Frontend UI (Pengalaman Pengguna)

- [x] UI Upload Area drag-and-drop + multiple upload.
  - status: `src/components/admin/media/MediaUploadPanel.vue` sudah menyediakan file picker + drag-drop + multi-file queue.
- [x] Progress bar/loading state (kompres + upload) yang jelas.
  - status: progress per item + status label (`Kompresi`, `Upload`, `Selesai`, `Gagal`) sudah tampil di panel upload.
- [x] Optimasi memori preview di UI:
  - status: cleanup lifecycle sudah ditambahkan (`onUnmounted`) dan tracking image load/error sudah dipisah agar state preview lebih aman saat list besar.
  - catatan lanjutan: swap thumbnail ke URL produksi per-item upload success + revoke agresif object URL setelah swap masih bisa ditingkatkan pada iterasi berikutnya.
- [~] Gallery grid + infinite scroll berbasis offset pagination.
  - status: gallery grid sudah live dan pagination offset sudah berjalan via tombol **Load More** (belum auto infinite scroll berbasis intersection observer).
- [x] Input/edit `alt_text`.
  - status: input `alt_text` tersedia saat pre-upload (queue item) dan edit pasca-upload di grid Media Library via endpoint `PATCH /api/admin/media/:id`.
- [x] Tombol Copy URL.
- [x] Reusable modal `Media Picker`:
  - status: `src/components/admin/media/MediaPickerModal.vue` + `src/composables/admin/useMediaPicker.ts` sudah aktif dengan lazy fetch saat modal dibuka, multi-select, visual selected state, emit `MediaItem[]`, dan sudah terpasang pada caller placeholder `src/views/admin/GaleriDokumentasi.vue` (route: `/admin/galeri-dokumentasi`).
  - update root-fix: preview modal kini prioritas `thumb_url` dengan fallback aman ke `file_url` saat thumbnail gagal dimuat.
  - dipanggil dari fitur Artikel/Profil/Galeri tanpa upload ulang file.
- [x] Modal preview full-size di halaman Media Library.
  - status: `src/views/admin/MediaLibrary.vue` sudah mendukung klik thumbnail/card untuk membuka overlay preview gambar ukuran penuh (`file_url`) dengan close via backdrop, tombol close, dan tombol `Esc`.

### Non-Goals Fase Awal (ditunda sengaja agar tidak over-engineering)

- [ ] SHA256 checksum & dedup otomatis.
- [ ] Soft delete/recycle bin.
- [ ] Cursor pagination.

### Risiko & Mitigasi

- [x] Risiko orphan file R2 saat D1 gagal insert -> wajib kompensasi rollback delete object.
  - status: alur upload sudah punya rollback kompensasi (jika insert D1 gagal setelah `R2.put`, object R2 dihapus).
- [x] Risiko mismatch delete sinkron D1-R2 -> wajib urutan hard delete `R2` terlebih dahulu lalu `D1`.
  - status: `DELETE /api/admin/media/:id` sudah di-hardening menjadi delete object R2 utama+thumb (`storage_key` + derived thumb key) -> `DELETE row D1`, sehingga kegagalan R2 tidak meninggalkan orphan object tanpa metadata.
- [x] Risiko bypass validasi FE -> wajib validasi backend MIME/size/role.
  - status: backend media sudah enforce `requireAuth + requireRole`, allowlist MIME, dan guard ukuran upload server-side (`MAX_UPLOAD_BYTES`) agar request non-UI tetap dibatasi.
- [x] Risiko biaya read R2 meningkat -> wajib pagination + limit default + cache object panjang.
  - status: endpoint list media sudah offset pagination dengan `page/limit` + default limit, object upload sudah memakai cache panjang (`Cache-Control: public, max-age=31536000, immutable`), dan endpoint admin list menambahkan header `Cache-Control: private, max-age=15, stale-while-revalidate=30` + `Vary: Authorization` agar browser cache native bisa dipakai saat modal buka-tutup tanpa custom in-memory cache FE.
- [ ] Risiko kompleksitas maintenance -> pertahankan arsitektur sederhana pada fase awal.
- [~] Logging backend minim konteks saat insiden media.
  - status: sudah ditambah contextual log ringan khusus media endpoint (`route`, `operation`, ringkasan error) berbasis `console.error`; standardisasi full structured logging lintas modul tetap masuk roadmap observability.

### Checklist Implementasi Siap ACT Mode (sinkron plan terbaru)

- [x] Tambah flow media baru ke `SYSTEM_MAP.md` setelah flow utama terbentuk.
  - status: flow media (upload/list/patch/delete + delivery publik) sudah tersinkron di `SYSTEM_MAP.md`.
- [x] Implement backend domain media dengan pola `Route -> Service -> Query`.
- [x] Implement endpoint upload/list/delete + test skenario gagal parsial.
- [x] Implement frontend `mediaService` + DTO typed + composable pipeline upload.
  - status: `src/services/admin/mediaService.ts` typed DTO aktif; normalisasi `file_url` berbasis `storage_key` (`media/...`) dijadikan contract utama agar URL publik konsisten.
  - update root-fix: normalisasi `thumb_url` tidak lagi di-override dari `storage_key` utama agar URL thumbnail `-thumb.webp` tetap akurat.
- [x] Implement UI media library + reusable media picker.
- [x] Update status task ini di dokumen setiap milestone selesai.
  - status: milestone root-fix kecil media (contract `storage_key` + hardening route publik + normalisasi URL FE) telah dicatat.

### Sangat disarankan (optimasi near-term)

- [ ] Tambah infinite scroll berbasis `IntersectionObserver` (menggantikan tombol **Load More** saat ini).
- [x] Tambah server-side max `limit` guard yang ketat untuk list media (anti abuse query `page/limit`).
  - status: guard diterapkan di route + service list media dengan policy `DEFAULT_LIMIT=12`, `MAX_LIMIT=36`, dan fallback graceful ke default untuk nilai invalid/over-limit.
- [x] Tambah observability ringan endpoint media:
  - [x] log context request list media (`page_raw`, `limit_raw`, `kategori_penggunaan`) + effective query + ringkasan hasil.
  - [x] request-id konsisten lintas endpoint (middleware global `x-request-id` + propagation response).
  - [x] metrik hit fallback legacy thumbnail untuk menentukan waktu cleanup aset legacy.
  - [x] metrik request ringan global (`method`, `path`, `status`, `duration_ms`, `requestId`) via `console.log` di middleware Hono.
- [~] Tambah test integration minimal untuk flow media end-to-end:
  - [ ] skenario sukses,
  - [x] skenario gagal parsial rollback (upload R2 sukses tetapi insert D1 gagal).

### Hardening Pre-Production (Point 2 - Fokus Sekarang)

- [ ] Verifikasi CORS R2 final (origin whitelist production + staging, tanpa wildcard).
- [~] Apply + verifikasi migration D1 remote production (`0003` s.d `0007`).
  - update Mei 2026: percobaan apply remote mendeteksi gagal di `0003_proposal_workflow.sql` (FK constraint, lalu incompatibility explicit `BEGIN/COMMIT` code `7500`).
  - patch lanjutan `0003` sudah ditingkatkan ke mode **strict legacy-safe**: normalisasi enum (`status`, `metode_pembayaran`, `tipe`), sanitasi orphan FK (`kategori_id` fallback deterministik; `periode_id/seksi_id/created_by` invalid -> `NULL`), dan guard copy agar insert tidak memicu FK violation pada DB non-fresh.
  - hotfix tambahan Mei 2026: copy `users` kini menormalkan `role` legacy ke matrix baru (`superadmin|ketua|bendahara|pengurus`) dan validasi `created_by` saat copy `kas_masjid` diarahkan ke parent yang valid.
  - hotfix lanjutan Mei 2026 (root-cause FK mismatch) sebelumnya mencoba reorder rebuild parent-child, namun gagal konsisten di remote D1 non-fresh.
  - strategi final anti-FK-failure: `0003` tidak lagi rebuild tabel `users`; migrasi diubah menjadi normalisasi role legacy via `UPDATE users ... CASE ...` dan rebuild hanya pada `kas_masjid` dengan sanitasi FK/enum ketat. Tujuannya menghindari operasi `DROP/RENAME` parent berelasi yang memicu constraint error pada engine D1 remote.
  - update Mei 2026 (role reconcile): fokus diperketat ke **PENAMBAHAN role `bendahara`** pada DB live. Karena pendekatan rebuild parent table `users` memicu `FOREIGN KEY constraint failed` di remote D1 non-fresh, strategi `migrations/0007_reconcile_bendahara_role.sql` diganti ke patch schema tanpa drop/rebuild parent: update definisi CHECK `users.role` di `sqlite_master` dari (`superadmin|ketua|pengurus`) menjadi (`superadmin|ketua|bendahara|pengurus`) + normalisasi minimal `role IS NULL -> pengurus`, tanpa mapping role legacy spekulatif.
  - next action: trigger ulang pipeline deploy (commit + push) agar remote apply memverifikasi chain final `0003` -> `0007` tanpa rerun manual.
- [~] Jalankan smoke test media end-to-end di environment target:
  - pre-production local smoke (candidate) **sudah jalan**:
    - `npm test` = pass 21/21,
    - `npm run build` = success,
    - integration media menutup list/admin query guard + public legacy fallback + rollback parsial upload.
  - post-deploy target smoke (pages.dev/runtime auth nyata) **masih pending**:
    - `POST /api/admin/media`
    - `GET /api/admin/media?page&limit`
    - `PATCH /api/admin/media/:id`
    - `DELETE /api/admin/media/:id`
    - `GET /api/public/media/*` (termasuk fallback legacy thumbnail).
- [ ] Verifikasi binding/secret production:
  - `MEDIA_BUCKET` menunjuk bucket target yang benar,
  - `DB` menunjuk D1 production yang benar,
  - `JWT_SECRET` runtime production valid dan berbeda dari local.
- [x] Dokumentasikan hasil verifikasi pre-production (timestamp + environment + hasil pass/fail) di `RUNBOOK.md`.
  - status: section `Pre-Production Smoke Test (Local)` ditambahkan di `RUNBOOK.md` (2026-05-08 09:47 WIB).

## Mode Eksekusi (Now / Next / Pre-Go-Live)

### Now (dampak langsung)

- [x] Seragamkan error response backend.
- [x] Final audit RBAC fail-closed lintas semua route `/api/admin/*`.
- [x] Pasang index D1 prioritas tinggi.
  - index Gate 1 sudah ada: `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`.
- [x] Fallback + caching jadwal sholat publik.

### Next (setelah flow stabil)

- [~] Type safety menyeluruh + kurangi `any`.
  - backend auth/core service sudah dibersihkan bertahap; sisa fokus berikutnya di `httpClient`, props/catch component admin, query dashboard, dan jadwal publik.
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
