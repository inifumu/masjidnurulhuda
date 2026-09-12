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
**Rencana implementasi historis:** `docs/archive/completed-plans/2026-07-13_000000-p0.3-shared-validation-typed-contract.md`

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
**Rencana implementasi historis:** `docs/archive/completed-plans/2026-07-13_000001-p0.4-security-hardening.md`

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
**Rencana implementasi historis:** `docs/archive/completed-plans/2026-07-13_000002-p0.5-critical-flow-integration-e2e.md`

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

# Admin Revamp — Reset Fungsional 2026-09-12

**Status:** In Progress — seluruh presentasi admin memakai Vue/HTML polos untuk review fungsi. Custom stylesheet admin diarsipkan. Tidak ada visual foundation yang disetujui.

- Keputusan aktif: docs/revamp/ADMIN_FUNCTIONAL_RESET.md dan DESIGN.md.
- Backend/API/RBAC/audit/idempotency/media lifecycle tetap regression contract P0.5.
- Full route operasional sudah tersedia; Publikasi tetap unavailable dan Galeri masih pilihan sementara.
- Berikutnya: review kebutuhan informasi/aksi/workflow pengguna, revisi fungsi, baru desain visual dari nol setelah approval fungsi.
- Acceptance: nol CSS pada dokumen admin, navigasi role-aware, state/error/validasi/retry jelas, flow finansial dan media tidak mundur, desktop/mobile diuji.

# Recommended Execution Order

1. Pertahankan P0.0–P0.5 sebagai safety baseline.
2. Buat dan review blank-canvas visual directions.
3. Minta pilihan visual pengguna.
4. Bentuk dan approve design system baru.
5. Audit behavior lalu susun roadmap implementasi berdasarkan arah terpilih.
6. Implementasikan dan verifikasi halaman berurutan: Login → shell admin → child pages Pengaturan → child pages Media → child pages Publikasi → child pages Keuangan → Dashboard.
7. Kerjakan Dashboard terakhir sebagai rangkuman modul yang telah selesai.
8. Tempatkan Inventaris dalam urutan hanya setelah pengguna memilih menu utama mandiri atau child Publikasi.
9. Bersihkan presentation legacy setelah convergence terbukti.
10. Lanjutkan backlog reliability/product lain setelah tidak mengganggu revamp admin aktif.
