# Roadmap Aktif — Website Masjid Nurul Huda

Dokumen ini menggantikan `optimalisasi_plan.md` lama sebagai backlog aktif. Isinya hanya prioritas, dependency, status, dan acceptance criteria. Riwayat implementasi lama berada di `docs/archive/`.

## Status

Gunakan status:

- `Not Started`
- `In Progress`
- `Blocked`
- `Done`
- `Deferred`

Jangan menambah progress log kronologis panjang. Update hanya status, evidence utama, dependency, dan keputusan yang masih berlaku.

## Prinsip Urutan

1. Integritas finansial dan keamanan lebih dahulu.
2. Reliability dan testing sebelum ekspansi fitur publik besar.
3. Redesign UI berjalan bersama quality gate, bukan sekadar pergantian visual.
4. Cleanup legacy dilakukan setelah behavior baru memiliki coverage dan parity yang memadai.
5. Permintaan eksplisit pengguna dapat mengubah urutan, tetapi risiko dan dependency tetap harus dijelaskan.

# P0 — Foundation Kritis

## P0.0 Stabilization Baseline Working Tree

**Status:** Done
**Dependency:** —
**Tujuan:** mengubah snapshot UI V2 Claude yang belum tervalidasi menjadi baseline improvement yang dapat diaudit dan dikembangkan dengan aman.

Hasil:

- snapshot recovery tersimpan pada branch `baseline/claude-v2-working-tree`, commit `b0137d1`;
- improvement berjalan pada branch `improve/project-foundation`;
- route aktif, link mati, placeholder, bridge, dan file shadow sudah diinventarisasi;
- `/admin/artikel` serta aksi search/profile tanpa flow disembunyikan sampai implementasi nyata tersedia;
- `PengaturanLegacyBridge` diklasifikasikan sebagai dependency aktif dan belum aman dihapus;
- `KeuanganKasV2` diklasifikasikan sebagai shadow/dead candidate tanpa route aktif; cleanup ditunda sampai critical finance coverage dan parity memadai;
- drift `thumb_storage_key` direkonsiliasi melalui migration additive `0009`, persistence query/service, dan regression test;
- residu proposal `docs/chatgpt-proposal/` dihapus setelah bahan berguna diadopsi ke dokumen canonical;
- kandidat ekspansi produk dipisahkan ke `docs/FEATURE_DEVELOPMENT_PLAN.md` agar tidak dianggap scope improvement aktif.

Evidence closure:

- migration `0009` berhasil diterapkan pada D1 lokal dan kolom `thumb_storage_key` terverifikasi;
- Media Library kembali memuat daftar setelah restart server dan refresh, diverifikasi manual oleh pengguna;
- `npm run test` lulus 22/22;
- `npm run build` lulus termasuk `vue-tsc`;
- test transaksi yang ada hanya mencakup helper validasi dan permission frontend, bukan integration flow/RBAC backend.

Keputusan gap:

- critical integration coverage transaksi/proposal tidak disamarkan sebagai implemented;
- full approval, reject, duplicate/concurrent mutation, backend role/data scoping, conflict, serta konsistensi list-summary menjadi scope wajib P0.5;
- redesign besar dan modularisasi `FinanceV2` ditahan sampai coverage kritis tersebut tersedia.

## P0.1 Audit Trail dan Void/Reversal Transaksi

**Status:** Completed (2026-07-12)
**Dependency:** —
**Tujuan:** transaksi approved tidak dapat hilang tanpa jejak.

Ruang lingkup:

- ganti hard delete approved dengan void/reversal/correction;
- tambah actor, waktu, alasan, dan reference transaksi asal;
- tambah event history untuk create, approve, reject, void, correction;
- kunci field finansial penting setelah approved;
- tampilkan timeline pada detail transaksi.

Evidence implementasi:

- hard-delete transaksi ditutup; endpoint DELETE legacy mengembalikan 405;
- approved dapat diubah menjadi void hanya oleh bendahara/superadmin dengan alasan 10-500 karakter;
- conditional update dan insert audit void dijalankan dalam satu D1 batch;
- record void tetap tampil sebagai histori tetapi tidak dihitung summary maupun total aktif;
- migration `0010` lulus upgrade lokal dengan 7/7 row terjaga dan fresh apply 0001-0010 terisolasi;
- event `created`, `submitted`, `approved_ketua`, `approved_bendahara`, `rejected`, dan `voided` ditulis atomic bersama mutasinya;
- reject dan void mewajibkan alasan 10-500 karakter;
- endpoint timeline tersedia; transaksi legacy tanpa event ditandai tanpa event rekayasa;
- Finance UI menyediakan timeline, modal reason accessible, pending state, dan conflict refetch;
- kontrak service mengunci field finansial setelah `approved` atau `void`;
- route integration membuktikan RBAC, 400, 409, DELETE 405, dan persistence row/event.

Acceptance criteria:

- endpoint tidak dapat hard-delete transaksi approved;
- semua transisi status memiliki audit event;
- laporan membedakan active, void, dan correction;
- regression test tersedia.

## P0.2 Atomic Approval dan Idempotency

**Status:** Done (2026-07-13)
**Dependency:** P0.1
**Tujuan:** mencegah race condition dan transaksi ganda.

Ruang lingkup:

- pertahankan conditional update berdasarkan status lama yang sudah ada;
- lengkapi affected-row mapping agar stale transition menghasilkan `409 Conflict`;
- idempotency key atau mutation dedup;
- tombol UI disabled selama mutasi;
- refetch setelah conflict/success.

Acceptance criteria:

- dua request approval bersamaan hanya menghasilkan satu transisi;
- duplicate submit tidak membuat data ganda;
- stale state menghasilkan 409 dan UI pulih tanpa reload manual.

Evidence implementasi:

- direct create, proposal, approval ketua, approval bendahara, reject, dan void memakai registry idempotency claim-first dalam batch yang sama dengan conditional mutation dan audit event;
- claim loser menghasilkan replay completed atau `409 Conflict` deterministik untuk processing, payload mismatch, stale status, maupun claim tanpa record;
- frontend mempertahankan key per logical intent selama retry dan menonaktifkan aksi per-row selama mutasi;
- concurrency regression membuktikan approve/approve dan approve/reject hanya menghasilkan satu final transition dan satu audit event;
- migration additive `0011` dan `0012` berhasil apply lokal; jalur idempotent tidak memakai `last_insert_rowid()` lintas registry/audit;
- canonical test dan production build lulus setelah implementasi.

Evidence closure:

- route integration membuktikan duplicate direct/proposal mereplay hasil dan hanya menyimpan satu transaksi/audit event; key sama dengan payload berbeda menghasilkan `409`;
- authenticated browser smoke lokal dengan fixture role ketua membuktikan antrean dan aksi role-aware tampil, dialog dapat dibuka/ditutup via Escape, dan layout desktop tidak terpotong horizontal; fixture disposable dibersihkan dan count sisa `0`.

## P0.3 Shared Validation dan Typed API Contract

**Status:** Done
**Dependency:** P0.2
**Rencana implementasi:** `.hermes/plans/2026-07-13_000000-p0.3-shared-validation-typed-contract.md`

Evidence working tree terbaru:

- shared dependency-neutral contracts sudah menjadi source type untuk role, category flow, transaction type/status/action, parser periode, DTO create, dan API error code/fields;
- route finance mengembalikan contract exact untuk validation, idempotency required/conflict, stale state, serta auth/RBAC `401/403`;
- dashboard/list memakai shared period parser dengan fallback query kosong tetap periode `Asia/Jakarta`;
- deliberate enum drift probe terbukti gagal typecheck dan sudah dihapus kembali;
- authenticated browser smoke FinanceV2 lulus pada viewport 360x800 dan desktop 1440x900: direct/proposal menampilkan field error inline, `aria-invalid`/`aria-describedby` terhubung, fokus berpindah ke field invalid pertama, dan document tidak overflow horizontal; tidak ada fixture transaksi P0.3 yang tersisa.

Baseline audit:

- role operasional masih didefinisikan di beberapa modul frontend/backend;
- transaction type/status dan DTO request/list masih terpisah antara service frontend, route, dan domain service;
- response error saat ini message-only dengan optional `errors`, belum memiliki stable `code` dan typed field map;
- period/filter parsing diduplikasi di route transaksi dan dashboard;
- active finance UI masih memiliki `catch(error: any)` dan boolean validation state yang belum dapat memetakan server field errors inline;
- migrasi dilakukan vertical pada auth/finance critical path, bukan big-bang seluruh response call site.

Ruang lingkup:

- schema bersama untuk role, status, transaksi, filter, pagination, dan error code;
- response error machine-readable;
- field error dapat dipetakan ke form;
- kurangi residual `any` dan unsafe assertion.

Acceptance criteria:

- frontend/backend menggunakan contract yang sama untuk endpoint utama;
- perubahan enum gagal saat typecheck jika belum disinkronkan;
- error validation tampil inline.

## P0.4 Security Hardening

**Status:** Done (2026-07-13)
**Dependency:** P0.3 Done
**Rencana implementasi:** `.hermes/plans/2026-07-13_000001-p0.4-security-hardening.md`

Evidence closure:

- seluruh method unsafe `/api/admin/*`, termasuk login, wajib exact same-origin; Origin kosong/malformed/cross-origin ditolak `403 FORBIDDEN`;
- security headers global mencakup CSP/frame protection, nosniff, referrer policy, permissions policy, dan HSTS khusus HTTPS;
- login limiter memakai atomic D1 UPSERT lintas isolate dengan key SHA-256 IP+email, kontrak `429 RATE_LIMITED`, dan `Retry-After`;
- migration additive `0013` menambah `users.is_active`, `login_rate_limits`, dan `security_audit_events` tanpa mengubah migration lama;
- account-management hanya untuk `superadmin`; disable/enable menggantikan hard delete akun; role/password/status membump `token_version`;
- self-lockout dan last-active-superadmin guard menghasilkan `409 Conflict`;
- create/update/password/disable/enable serta login success/failure/rate-limited memiliki audit event tanpa data sensitif;
- fresh apply `0001`–`0013` pada state Wrangler terisolasi dan upgrade apply D1 lokal existing lulus; foreign-key check bersih;
- negative security/account tests, canonical test, production build, dan `git diff --check` lulus pada closure.

Ruang lingkup:

- audit cookie flags production;
- CSRF token atau origin validation untuk mutasi;
- persistent login rate limit lintas isolate;
- account lifecycle: disable, password reset, role change, session revoke;
- self-lockout dan last-recovery-admin protection;
- security headers;
- audit login dan perubahan akun.

Acceptance criteria:

- cross-origin mutation ditolak;
- rate limit konsisten antar-instance;
- perubahan password/role merevoke sesi lama;
- negative security tests tersedia.

## P0.5 Integration dan E2E Critical Flow

**Status:** Done
**Dependency:** P0.1–P0.4 Done; menjadi gate sebelum redesign besar atau modularisasi `FinanceV2`
**Rencana implementasi:** `.hermes/plans/2026-07-13_000002-p0.5-critical-flow-integration-e2e.md`

Baseline audit setelah P0.4:

- route integration parsial sudah tersedia untuk create direct/proposal idempotent, void, media, auth/RBAC, account lifecycle, dan concurrency service;
- gap utama tersisa adalah satu harness critical flow berurutan dari proposal pengurus sampai approved/list/summary, reject tiap tahap, ownership scoping lintas user, period boundary, dan login route persistence;
- P0.5 mengonsolidasikan evidence tersebut menjadi gate end-to-end dengan state persistence bersama, bukan mengulang unit test yang sudah ada.

Evidence berjalan:

- auth route integration membuktikan login valid/invalid/rate-limited, disabled account, dan token-version mismatch;
- Wrangler local D1 disposable membuktikan proposal `pengurus → ketua → bendahara → approved`, negative approve pengurus, list/summary periode, tiga audit event, registry idempotency completed, dan FK bersih;
- probe fresh schema menemukan role constraint legacy; migration additive `0014` menambahkan `operational_role` dan lulus fresh/upgrade tanpa rebuild parent users;
- claim-first create diperbaiki agar FK `transaction_id` baru diisi saat finalize setelah row transaksi dibuat.
- audit lanjutan memperbaiki bypass direct-create pengurus, timeline privat lintas owner, collision upload R2, dan recovery-admin TOCTOU;
- migration `0016` + `npm run test:migrations` lulus fresh `0001`–`0016`, upgrade `0015→0016`, preservasi bendahara, backfill lifecycle media `active`, ledger 16, dan FK check;
- `npm run test:critical-flow:d1` lulus pada Wrangler D1 disposable: concurrent approval `1×200 + 1×409`, reject dua tahap, role matrix, ownership dua pengurus, boundary/list/admin-public summary consistency, cleanup seluruh fixture `0`, dan FK bersih;
- auth bootstrap membedakan 401 dari network/5xx, menyediakan retry, dan tahan response out-of-order; Finance memiliki loading/error/retry, request sequencing, payload-bound idempotency, pending modal, best-effort refresh, dan mobile cards;
- media deletion memakai lifecycle additive `active→pending_delete→deleted|delete_failed`, reference registry, conditional enqueue D1, durable outbox, retry/reconciliation, dan tombstone;
- authenticated Chromium E2E lulus pada 360×800 dan 1366×900 untuk journey pengurus→ketua→bendahara, auth/Finance recovery, conflict, focus/Escape, pending disabled, dan horizontal overflow; browser menemukan dan memverifikasi fix shell auth agar status error merender retry overlay;
- final closure gates lulus: `npm run test` 112/112, `npm run build`, `npm run test:migrations`, `npm run db:apply:local`, `npm run test:critical-flow:d1`, `npm run test:e2e:browser`, dan `git diff --check`.

Skenario wajib:

- login valid/invalid;
- token version mismatch;
- pengurus membuat proposal dan server memaksa status `pending_ketua`;
- ketua approve menjadi `pending_bendahara`;
- bendahara approve menjadi `approved`, lalu transaksi muncul pada list dan summary periode yang benar;
- reject pada tiap tahap dengan alasan wajib;
- duplicate submit dan concurrent/stale approval hanya menghasilkan satu transisi, dengan conflict contract yang benar;
- positive dan negative backend role matrix;
- ownership/data scoping pengurus lintas user;
- summary admin/publik hanya menghitung data sesuai policy dan period boundary;
- media upload failure cleanup;
- migration fresh apply dan upgrade apply untuk schema yang disentuh.

Acceptance criteria:

- pull request gagal saat critical flow rusak;
- bug finansial memiliki regression test;
- test membuktikan response status/error contract, perubahan state, dan hasil persistence;
- migration test tersedia untuk fresh dan upgrade database.

# P1 — Reliability dan Maintainability

## P1.1 Structured Logging dan Observability

**Status:** Not Started

Ruang lingkup:

- request ID;
- structured JSON log;
- route, status, duration, user/role, error code;
- health/readiness endpoint;
- post-deploy smoke check;
- monitoring D1, R2, auth, proposal pending, dan external API.

Acceptance criteria:

- satu error pengguna dapat ditelusuri melalui request ID;
- health check menjadi bagian deployment;
- log tidak mengandung secret atau payload sensitif.

## P1.2 Backend Module dan Repository Standardization

**Status:** Not Started

Target boundary:

```text
route → schema/policy → service → repository/query → storage
```

Acceptance criteria:

- tidak ada SQL di route;
- business rule tidak berada di repository;
- domain utama mengikuti struktur yang konsisten;
- repository dan service dapat diuji terpisah.

## P1.3 Legacy Cleanup

**Status:** Not Started  
**Dependency:** regression coverage dan parity behavior

Ruang lingkup:

- inventory route aktif dan file legacy;
- hapus bridge/fallback yang tidak dipakai;
- hapus dead code/style/import;
- rapikan naming V2 setelah versi baru menjadi canonical;
- hindari membuat V3 baru.

Acceptance criteria:

- route production tidak memakai legacy bridge;
- satu implementation canonical per halaman;
- build dan smoke flow tetap lulus.

## P1.4 Migration dan Release Safety

**Status:** Not Started

Pipeline target:

```text
typecheck → test → build → migration test → preview deploy
→ preview smoke → production backup → migration → deploy → health/smoke
```

Acceptance criteria:

- migration selalu punya backup dan restore note;
- fresh/upgrade migration test otomatis;
- deployment gagal bila health check gagal;
- tidak ada step manual kritis yang tidak terdokumentasi.

## P1.5 Media Lifecycle dan Safe Deletion

**Status:** Not Started

Ruang lingkup:

- server-owned key generation/collision guard;
- konsistensi `storage_key` dan `thumb_storage_key`;
- media usage tracking;
- archive/pending-delete;
- orphan reconciliation;
- RBAC mutasi media;
- optional checksum/dedup.

Acceptance criteria:

- upload gagal tidak dapat menghapus object existing;
- media referenced tidak dapat dihapus langsung;
- orphan D1/R2 dapat dideteksi dan direkonsiliasi.

## P1.6 Error, Loading, Conflict, dan Retry System

**Status:** Not Started

Acceptance criteria:

- setiap layar data memiliki skeleton, empty, error, retry, submitting, success, conflict, dan permission state yang relevan;
- tidak ada backend error mentah di UI;
- field validation tidak hanya menggunakan toast;
- retry tidak menggandakan mutasi.

# P2 — Product, UX, dan Performance

## P2.1 Pagination, Query Bound, Index, dan Cache

**Status:** Not Started

Ruang lingkup:

- server-side pagination transaksi dan pending list;
- bounded limit;
- date-range query yang index-friendly;
- debounce/cancel stale request;
- cache endpoint publik;
- lazy route dan thumbnail-first image loading;
- bundle audit.

Acceptance criteria:

- list besar tidak dimuat sekaligus;
- perubahan filter tidak menumpuk request;
- query utama memakai index yang sesuai;
- public mobile performance terukur.

## P2.2 Public Content Modules

**Status:** Not Started

Ruang lingkup:

- kabar: draft, publish, slug, cover, SEO metadata;
- galeri: album, event date, cover, media reuse;
- kritik/saran: rate limit, spam protection, workflow status, privacy retention;
- admin content management;
- publish-only output publik.

Acceptance criteria:

- konten dikelola tanpa perubahan code;
- hanya published content tampil publik;
- media menggunakan media library;
- kritik/saran memiliki anti-spam dan privacy notice.

## P2.3 Accessibility, SEO, Privacy

**Status:** Not Started

Acceptance criteria:

- critical accessibility errors tidak ada;
- keyboard dan focus path berfungsi;
- metadata unik, sitemap, OG, dan structured data tersedia;
- laporan publik tidak mengekspos data pribadi/internal;
- privacy dan retention policy terdokumentasi.

## P2.4 Documentation dan Architecture Governance

**Status:** In Progress

Dokumen target:

- `.hermes.md`;
- `AGENTS.md`;
- `SYSTEM_MAP.md`;
- `ROADMAP.md`;
- `RUNBOOK.md`;
- `README.md`;
- `docs/adr/`;
- `docs/archive/`.

Acceptance criteria:

- developer/agent baru dapat menemukan entrypoint, flow, test, deploy, dan risk rules;
- role/status memiliki satu sumber dokumentasi utama;
- histori tidak memenuhi dokumen instruksi aktif.

# Full UI/UX Redesign Workstream

## Corrective Security Closure sebelum R1

**Status:** Done (2026-07-15)

- login limiter hanya mencatat autentikasi gagal; failure 1–5 mengembalikan 401, failure keenam 429, blocked pre-check melewati password verification, dan login sukses menghapus bucket IP+email;
- migration additive `0017` menonaktifkan known default credential tanpa mengubah akun yang password-nya telah dirotasi;
- fresh install tidak bergantung pada credential privileged universal dan memakai provisioning/recovery admin lokal yang eksplisit, kuat, idempotent, serta non-overwrite secara default;
- fresh/upgrade Wrangler-local harness memverifikasi preservasi row/status kas legacy, akun terotasi, index, transaction audit table, FK aktif, dan foreign-key check bersih;
- corrective closure menjadi gate sebelum melanjutkan R1 Design Foundation.

**Priority override:** full redesign dikerjakan setelah P0.5 `Done` dan sebelum mayoritas P1–P2. P1.3 legacy cleanup terserap pada closure redesign. Item reliability atau release safety hanya didahulukan jika menjadi blocker nyata.

Source visual canonical: `DESIGN.md`. Audit dependency, route, primitive, legacy/V2 overlap, migration sequence, dan anti-drift rules: `docs/UI_UX_REDESIGN_AUDIT.md`.

Redesign mengganti menyeluruh public site dan admin panel dengan visual language baru. Ini bukan penyempurnaan V2 atau reskin legacy. Behavior, API, RBAC, audit, idempotency, state machine, migration, dan P0.5 evidence tetap menjadi regression contract.

## Design direction

**Nurul Huda Civic Editorial:** warm modern minimalism + editorial public experience + institutional admin UI.

- emerald sebagai identitas utama;
- yellow-gold sebagai accent terbatas;
- mobile-first 360 px dengan tablet dan desktop yang dirancang penuh;
- public content-first, fotografis, dan nyaman dibaca;
- admin task-oriented, presisi, dan accessible;
- shadcn-vue/reka menjadi primitive canonical;
- glassmorphism, glow, blur orb, gradient dekoratif, dan card-heavy layout bukan default.

## Information architecture admin target

```text
Ringkasan
Keuangan
  Transaksi
  Proposal
  Persetujuan
  Riwayat audit
Publikasi
  Kabar
  Kegiatan
  Galeri
  Media
Organisasi
  Seksi
  Pengurus
Sistem
  Kategori Kas
  Akun dan Akses
  Audit Aktivitas
```

Gunakan route nyata per workflow ketika contract siap end-to-end. Jangan membuat placeholder route yang terlihat operasional.

## Phase R0 — Audit dan Governance

**Status:** Done

- dependency/framework adoption matrix;
- inventory route aktif, primitive, legacy/V2 overlap;
- design direction dan token contract;
- responsive/state/accessibility contract;
- migration sequence dan anti-drift rules;
- output: `DESIGN.md` dan `docs/UI_UX_REDESIGN_AUDIT.md`.

Residual baseline visual seperti screenshot inventory dilaksanakan saat memulai R1 agar menggunakan browser state aktual.

## Phase R1 — Design Foundation dan Component Lab

**Status:** Done

- implementasikan token `DESIGN.md` ke Tailwind v4/CSS variables;
- konsolidasikan Inter Variable dan hapus font drift;
- canonical Button, FormField, CurrencyInput, Select/Combobox, DatePicker, Dialog/AlertDialog, Drawer/Sheet, Badge/Status, PageHeader, Metric, DataTable/MobileDataCard, Timeline, dan data states;
- pola Headless UI telah dimigrasikan ke reka dan dependency dihapus;
- component lab + WCAG/keyboard/responsive verification.

Evidence awal:

- token runtime Civic Editorial dan Inter Variable canonical sudah diterapkan pada `src/assets/main.css`;
- Button/Input canonical memakai touch target default 44 px dan semantic emerald/gold variants;
- seluruh foundation contract tersedia: Button/IconButton, Input/Textarea, FormField/CurrencyInput, Select/Combobox/DatePicker, Dialog/AlertDialog, Sheet, Badge/StatusIndicator, PageHeader/SectionHeader, Metric, FilterBar, DataTable/MobileDataCard, Timeline, Skeleton, dan data states;
- ConfirmModal dan TransactionAuditDialog telah dimigrasikan dari Headless UI ke reka; `@headlessui/vue` dihapus setelah caller scan bersih;
- component lab development-only tersedia di `/_design-system` tanpa auth bootstrap atau production route;
- automated browser verification lulus pada 360×800, 768×1024, dan 1366×900: tanpa horizontal overflow, button/input ≥44 px, tanpa Google Fonts, dan console bersih;
- authenticated finance E2E tetap lulus pada 360×800 dan 1366×900 termasuk pending Escape guard, conflict, recovery, role journey, dan overflow;
- R1 ditutup setelah full unit/build/browser gate serta independent review; R2 menjadi workstream aktif berikutnya.

## Phase R2 — Public Publication Experience

**Status:** Done

- public navbar/footer dan mobile navigation;
- homepage editorial;
- jadwal salat, transparansi kas, featured publication, kegiatan, galeri, contact;
- article/documentation reading pattern;
- loading/fallback/error/offline behavior.

Evidence closure:

- shell publik dan homepage memakai komposisi Civic Editorial end-to-end tanpa V3, glassmorphism, gradient dekoratif, card grid generik, atau CTA operasional palsu;
- jadwal mempertahankan proxy MyQuran dan cache harian, dengan loading, live/cache, stale cache, unavailable, dan retry eksplisit;
- ringkasan kas mempertahankan endpoint approved-only D1 dengan loading, recoverable error, retry, success, serta penjelasan nilai nol;
- kabar, galeri, dan kritik/saran memakai state jujur tanpa fake blur/locked UI atau data contoh;
- route publik melewati auth bootstrap admin; mobile navigation memiliki accessible name, focus transfer/restoration, Escape, scroll lock, dan control minimal 44 px;
- regression test, production build, dan browser gate 360×800, 768×1024, 1366×900 lulus sebelum promosi testing.

## Phase R3 — Admin Shell dan Authentication

**Status:** Done (2026-07-16)

- admin navigation berdasarkan IA dan role;
- mobile drawer, tablet rail, desktop sidebar;
- header/breadcrumb/user actions;
- login, auth loading, operational error, retry, dan permission state;
- replacement route canonical tanpa membuat V3.

Scope start:

- audit route aktif `/admin/login` dan `/admin/*`, auth bootstrap/recovery, role visibility, serta overlap shell V2/legacy;
- pertahankan seluruh contract backend auth, token-version revocation, exact same-origin, rate limiter, dan P0.5 browser regression;
- gunakan primitive R1 canonical dan selesaikan shell/login pada 360, tablet, dan desktop sebelum R4.

Evidence berjalan:

- login memakai FormField/Input/Button canonical, split institutional layout, fokus awal, autocomplete, pending state, serta pesan terpisah untuk 401, 429, dan gangguan operasional;
- auth login frontend melewati `httpClient` typed tanpa mengubah endpoint, cookie, limiter, atau token-version contract;
- shell admin memakai border-first Civic Editorial, desktop sidebar, reka Sheet mobile, account dropdown, theme action, dan auth recovery state;
- navigation hanya memuat route operasional dan menyembunyikan Pengaturan dari role di luar `superadmin|ketua`; backend tetap otoritas;
- browser gate R3 lulus pada login 360×800, 768×1024, 1366×900 serta role-aware mobile Sheet, Escape, touch target, reduced motion, dan overflow; P0.5 authenticated E2E tetap lulus.
- corrective shell dirombak ke primitive shadcn-vue Sidebar canonical: expanded 240 px, icon rail 48 px, grouped Collapsible submenu, account footer, mobile off-canvas, logo resmi, dan header/breadcrumb compact;
- geometry konsisten per display: seluruh shell control desktop 32 px, mobile 44 px, account row 48 px, header 64 px; collapse logo/avatar dan submenu memiliki motion sinkron serta reduced-motion fallback;
- browser matrix mencakup `superadmin`, `ketua`, `bendahara`, dan `pengurus` pada 360×800, 768×1024, dan 1366×900, termasuk mobile Sheet, icon-collapse reveal submenu, nested Escape, popup collision, account/theme/navigation, focus restoration, reduced motion, dan overflow;
- server-authorized role impersonation untuk superadmin telah diimplementasikan setelah closure corrective: role efektif mengendalikan RBAC/data scope/mutasi, actor tetap superadmin asli, sesi samaran 15 menit, start/stop diaudit, samaran berantai ditolak, dan banner permanen menyediakan exit satu klik;
- independent pre-commit review final lulus setelah relasi `aria-controls`, ID target, label, dan landmark navigasi mobile/desktop diverifikasi pada DOM;
- commit corrective R3 dipromosikan ke branch/resource testing terisolasi; GitHub Actions verify/deploy lulus dan HTTP + custom browser matrix live testing lulus pada `masjidnurulhuda-testing.pages.dev`.
- refinement shell pasca-impersonation mengunci banner global desktop/tablet 48 px di atas sidebar+workspace, header sticky normal/samaran, content-only scrolling, dan theme tile radius 10 px dengan motion canonical; commit `64cf1ef` lulus 153 test, build, P0.5 browser E2E, custom matrix lokal, independent review, CI testing run `29480671964`, serta HTTP/custom browser gate pada deployment immutable testing `bf01b3c5.masjidnurulhuda-testing.pages.dev`.
- final re-audit closure commit `2ae5a95` menutup race logout/bootstrap, rekonsiliasi expiry impersonation, cap expiry terhadap sesi asli, modal auth recovery focus-contained, reduced-motion struktural, dan profile menu khusus trigger titik tiga dengan density 44 px mobile/32 px desktop; 156 test, build, migration, P0.5 E2E, custom browser matrix 4 role × 5 viewport, independent review, CI run `29484603193`, deployment immutable `149e00ce.masjidnurulhuda-testing.pages.dev`, dan alias testing stabil seluruhnya lulus.

Post-closure R3 security extension:

- role impersonation dipilih sebagai server-authorized role-level impersonation, bukan UI-only preview dan bukan penyamaran sebagai akun pengguna lain;
- actor/ownership/audit tetap memakai ID superadmin asli, sedangkan backend policy memakai role efektif yang disamarkan.

## Phase R4 — Financial Workflows

**Status:** In Progress (Transaksi, Catat kas, dan Proposal canonical diterapkan; Persetujuan menjadi workflow berikutnya)

Urutan:

1. transaction list/detail;
2. Catat kas;
3. proposal create/detail;
4. approval review/timeline;
5. audit history.

Corrective gate submenu Transaksi — canonical recomposition disetujui user dan diadopsi pada `/admin/finance/transaksi`:

- filter dirombak menjadi Command Sheet search-first dengan quick filter arus, advanced Sheet periode/status/kategori, applied chips, clear behavior, dan result count/totals; bukan polish panel grid lama;
- root cause filter mati setelah remount adalah watcher singleton yang terikat effect scope child view pertama; detached effect scope mempertahankan watcher sepanjang lifetime singleton state tanpa reload/F5;
- browser regression query-aware membuktikan perubahan bulan sebelum/sesudah child-route remount tetap mengirim request dan mengubah hasil; latest-request gates tetap dipertahankan;
- timeline audit dimuat melalui service existing dan dirender inline dalam detail desktop/drawer/full-screen, dengan loading, retry, legacy `history_available=false`, dan stale-response protection;
- targeted/full test, build, migration, real-D1 critical flow, browser matrix 360/tablet/desktop, serta diff check lulus; R4 keseluruhan tetap `In Progress` untuk workflow finance berikutnya.

Penyesuaian kontrak aktif sebelum melanjutkan promosi redesign Catat kas/Proposal:

- pisahkan `keperluan` sebagai judul wajib arus uang dari `keterangan` sebagai uraian detail;
- direct transaction: `keperluan` wajib, `keterangan` opsional;
- proposal: `keperluan` dan rincian `keterangan` wajib;
- list Transaksi, Persetujuan, dan Riwayat audit memakai `keperluan` sebagai judul; dossier/detail memakai `keterangan` sebagai uraian;
- pencarian transaksi mencakup `keperluan`, `keterangan`, kategori, dan seksi;
- gunakan migration additive baru: tambah kolom nullable, backfill `keperluan = keterangan` untuk row existing, switch read/write, lalu evaluasi contract constraint setelah compatibility window;
- sinkronkan shared contract/parser, frontend form state/service, backend route/service/query, idempotency request hash/replay, fixture, dan dokumentasi tanpa mengubah invariant approved/void, ownership, atau state machine;
- lampiran proposal tidak digabungkan diam-diam ke perubahan field: kebutuhan attachment, relasi media, access policy, audit, immutability, dan cleanup D1–R2 menjalani discovery terpisah di Feature Development Plan;
- redesign Catat kas dan Proposal tidak dipromosikan ke production sebelum contract `keperluan` tersedia end-to-end agar UI tidak dibangun ulang di atas semantik field lama.

Evidence vertical slice `keperluan` + Catat kas Entry Spine:

- migration 0018 additive dan fresh/upgrade backfill exact lulus dengan row/status/audit/idempotency tetap terjaga dan FK bersih;
- shared parser, backend persistence/list, idempotency hash/replay, frontend state/payload/reset, serta title/detail/search canonical memakai dua field terpisah;
- Catat kas production memakai Entry Spine yang dipilih user: arus kas, nominal, identitas transaksi, detail opsional, lalu closure review; guide task order dan persistent live slip/dossier dihapus, sedangkan Dialog tetap owner konfirmasi dan mutation final;
- label-control field utama memakai rhythm responsif terukur: 12 px pada mobile/tablet dan 10 px pada desktop compact `xl`; default `FormField` screen lain tetap 8 px;
- browser source-live membuktikan flow selector tidak terpotong, settled Dropdown/Dialog opak dan bounded, toast validasi lama dibersihkan sebelum review, consequence copy dapat discroll, dan tidak ada document overflow;
- Chromium matrix 360×800, 768×1024, 1024×1366, 1366×900 lulus untuk role journey, focus/Escape/pending, conflict/recovery, filter remount, void, dan overflow;
- full test/build, migration, real-D1 critical flow, dan real Vite→Hono JSON request lulus; R4 tetap `In Progress` karena full Proposal redesign adalah workflow berikutnya.

Evidence vertical slice Proposal Request Brief:

- user memilih Request Brief dan urutan canonical source-live adalah `keperluan → arus → nominal → rincian → kategori → tanggal → metode → seksi → consequence → CTA` tanpa CSS reorder;
- outer Card wrapper page dihapus; metadata routing memiliki consequence copy dan satu CTA di akhir grup, serta tidak lagi sticky/melayang pada desktop;
- Dialog tetap satu-satunya owner review/mutation; pending menolak dismissal/double-submit, sedangkan 409/503 mempertahankan input dan mengembalikan fokus ke CTA;
- Chromium 360×800, 768×1024, 1024×1366, dan 1366×900 membuktikan completion berada di metadata, metadata `position: static`, CTA tunggal setelah field wajib, split desktop sejajar, focus restoration, dark mode, tanpa overflow/console error;
- workflow berikutnya adalah **Persetujuan** (`ApprovalsView.vue` + `KasApproval.vue`), yang masih memakai composition/table/custom controls legacy dan harus diaudit prototype-first tanpa mengubah approval state machine.

Gate penyesuaian fitur:

1. failing contract/migration tests untuk `keperluan` dan perbedaan kewajiban `keterangan` direct versus proposal;
2. migration fresh apply dan upgrade apply dengan preservasi seluruh row, backfill benar, dan foreign-key check bersih;
3. shared DTO/parser dan backend validation exact untuk direct/proposal, termasuk batas panjang dan field error;
4. create/replay idempotent membuktikan payload/hash baru tidak menghasilkan transaksi atau audit event ganda;
5. list/detail/search membuktikan `keperluan` menjadi judul dan `keterangan` tetap detail, termasuk row legacy hasil backfill;
6. positive/negative RBAC, ownership, approval state transition, audit timeline, dan approved-only summary tetap lulus;
7. browser Catat kas/Proposal membuktikan validation, first-error focus, confirmation slip, pending/double-submit, 409, 5xx/network retry tanpa kehilangan input;
8. browser matrix 360×800, 768×1024, 1024×1366, dan 1366×900, termasuk sidebar expanded/collapsed, keyboard, Escape/focus restoration, zoom 200%, dark mode, overflow, dan console;
9. `npm run test`, `npm run build`, `npm run test:migrations`, `npm run test:critical-flow:d1`, `npm run test:e2e:browser`, real Vite→Hono API request, dan `git diff --check` lulus setelah edit terakhir;
10. update `SYSTEM_MAP.md`, active UI audit, dan handoff R4 setelah contract aktual terverifikasi.

Acceptance criteria:

- usable pada 360, tablet, dan desktop;
- mobile memakai structured cards/list, bukan table scroll sebagai solusi utama;
- approval memiliki review experience, reason, pending, conflict, dan timeline;
- seluruh state contract tersedia;
- `keperluan` dan `keterangan` memiliki semantik, validation, persistence, dan presentation yang terpisah end-to-end;
- `FinanceV2.vue` dipecah berdasarkan workflow tanpa menduplikasi business logic;
- P0.5 browser dan real-D1 regression tetap lulus.

## Phase R5 — Publication, Media, Organization, Settings

**Status:** Not Started

- media, galeri, kabar, kegiatan, dan kritik/saran;
- kategori, seksi, pengurus;
- akun/access dan security-sensitive review flow;
- hapus `PengaturanLegacyBridge` hanya setelah parity.

## Phase R6 — Convergence dan Quality Gate

**Status:** Not Started

- accessibility, keyboard, reduced-motion, responsive, performance, dan cross-browser audit;
- visual regression dan role browser E2E;
- hapus V2/legacy/bridge/dependency/style yang tidak dipakai;
- rename canonical tanpa version suffix;
- component documentation;
- final gate dan closure P1.3 legacy cleanup.

# Recommended Execution Order

1. P0.0–P0.5 tetap `Done` sebagai safety baseline.
2. R0 Audit/Governance `Done`.
3. R1 Design Foundation dan Component Lab.
4. R2 Public Publication Experience.
5. R3 Admin Shell dan Authentication.
6. R4 Financial Workflows.
7. R5 Publication/Media/Organization/Settings.
8. R6 Convergence, quality gate, dan P1.3 closure.
9. Lanjutkan P1 reliability/maintainability residual.
10. Lanjutkan P2 product, accessibility/SEO/privacy, dan performance.
