# SYSTEM_MAP.md — Masjid Nurul Huda

Peta operasional per 12 September 2026. Source, migration, konfigurasi runtime, dan automated test tetap sumber kebenaran utama.

## Baseline

- Frontend: Vue 3, TypeScript, Vue Router, Pinia, Tailwind CSS.
- Backend: Hono pada Cloudflare Pages Functions.
- Data: Cloudflare D1. Media: Cloudflare R2 dengan metadata dan deletion outbox di D1.
- Presentasi admin lama berada di `docs/archive/admin-presentation-2026-09-12/`; bukan source aktif atau donor visual.
- Admin aktif adalah baseline review fungsi polos sambil menunggu approval direction dan design system baru.
- Publikasi dan Inventaris belum memiliki backend admin operasional.

## Entrypoint

- `src/main.ts` — bootstrap Vue, Pinia, router, dan stylesheet.
- `src/router/index.ts` — route publik/admin, meta role, navigation guard.
- `src/App.vue` — auth bootstrap sebelum route admin.
- `functions/api/[[path]].ts` — adapter Pages Functions menuju Hono.
- `server/index.ts` — registrasi middleware dan router API.

Trace canonical:

`User action → Route/View → Component/Composable/Store → Frontend Service/httpClient → Hono Route/Middleware → Service/Policy → Query → D1/R2/External API`

## Frontend admin

- Auth: `/admin/login` → `src/views/admin/LoginV2.vue` → `src/stores/authStore.ts` → `/api/admin/auth/*`.
- Shell: `/admin/*` → `src/layouts/AdminLayoutV2.vue` → route child role-aware.
- Dashboard: `DashboardV2.vue` → `dashboardService.ts` → `GET /api/admin/dashboard/summary`.
- Transaksi: `TransactionsView.vue` → `FunctionalTransactions.vue` → `kasService.ts`.
- Catat kas/proposal: `DirectTransactionView.vue` atau `ProposalsView.vue` → `FunctionalCashForm.vue` → `kasService.ts`.
- Persetujuan/audit: `ApprovalsView.vue` atau `AuditHistoryView.vue` → `kasService.ts`.
- Pengaturan: child route kategori, seksi, akun → `AdminSettingsLayout.vue` → `FunctionalSettings.vue` → `pengaturanService.ts`.
- Media: `MediaLibrary.vue` → komponen `FunctionalMedia*` → `useMediaUpload.ts`/`mediaService.ts`.
- Publikasi: `PublicationsView.vue` dan `PublicationUnavailable.vue`; API admin: `Not found`.

Shell, login, dan seluruh view admin di atas hanya baseline fungsi. Composition visual belum disetujui.

## Backend admin

### Auth

- `server/api/admin/auth.ts` pada `/api/admin/auth`.
- Login, logout, `me`, impersonation start/stop.
- Exact same-origin, security headers, persistent D1 limiter, JWT cookie, dan token-version revocation.
- Impersonation hanya superadmin asli; role efektif tidak mengubah actor ID.

### Dashboard

- `server/api/admin/dashboard.ts` → `server/services/dashboard.ts` → `server/db/queries/dashboard.ts`.
- `GET /summary?month=&year=` menghasilkan `saldoAwal`, `totalPemasukan`, `totalPengeluaran`, `saldoAkhir`.
- Semua role admin dapat membaca. Query hanya menghitung transaksi `approved`; default periode bulan berjalan WIB.

### Transaksi

- `server/api/admin/transaction.ts` → `server/services/transaction.ts`.
- Validasi: `shared/contracts/index.ts` dan `server/utils/transactionValidation.ts`.
- Idempotency: `server/services/transactionIdempotency.ts`.
- `GET /master-data`, `/list`, `/pending`, `/:id/timeline`.
- `POST /add-direct`, `/add-proposal`, `/approve/:id`, `/:id/void`.
- Direct: `superadmin|ketua|bendahara`. Proposal: semua role. Void: `superadmin|bendahara`.
- `/pending` mencakup `pending_ketua`, `pending_bendahara`, dan `rejected` sesuai scope role.
- Mutasi finansial memakai `Idempotency-Key`; hard-delete transaksi ditutup HTTP 405.

### Pengaturan

- `server/api/admin/pengaturan.ts` → service kategori, seksi, dan user.
- CRUD kategori/seksi: `superadmin|ketua`.
- Akun: `superadmin`; create/list/update, reset password, aktif/nonaktif.
- `DELETE /users/:id` adalah soft-disable.
- Account policy mencegah self-lockout dan hilangnya superadmin pemulihan terakhir.
- `nama_pengurus` pada seksi masih teks, bukan relasi akun.

### Media

- `server/api/admin/media.ts` → `server/services/media.ts` → `server/db/queries/media.ts`.
- Upload, list pagination/filter, patch metadata, safe delete.
- MIME: WebP, JPEG, PNG. Upload menyimpan file utama dan thumbnail.
- Delete memeriksa reference dan memakai deletion outbox.
- List hanya media aktif; status internal deletion bukan data UI.

## Backend publik

- `/api/public/kas/summary` — ringkasan kas approved.
- `/api/public/jadwal/today` — proxy jadwal salat dengan timeout/retry/cache.
- `/api/public/media/*` — delivery media melalui storage-key resolver.
- `/api/public/seksi` — daftar seksi.

## Data utama

- `users`, `security_audit_events`, `login_rate_limits`.
- `kategori_kas`, `seksi_pengurus`, `kas_masjid`.
- `transaction_audit_events`, `transaction_idempotency`.
- `dokumentasi`, `media_deletion_outbox`, dan media references.

## Integrasi

- D1 melalui binding `DB`; R2 melalui binding media.
- API jadwal salat eksternal hanya melalui backend proxy.
- Payment gateway, email service, webhook, analytics pengunjung, dan notification service: `Not found`.
- Environment: `wrangler.toml`, `wrangler.testing.toml`, `wrangler.revamp.toml`.

## Validasi

- `npm run build`
- `npm test`
- `npm run test:migrations`
- `npm run test:critical-flow:d1` untuk alur D1 kritis.
- `npm run test:e2e:browser` untuk perubahan UI/authenticated flow.

## Risiko

- Nama file `*V2.vue` masih legacy naming; rapikan setelah approval visual dan caller audit.
- Publikasi dan Inventaris belum memiliki jalur backend admin.
- Frontend guard tidak menggantikan RBAC backend.
- Jangan memakai `docs/archive/` sebagai instruksi atau donor visual.
