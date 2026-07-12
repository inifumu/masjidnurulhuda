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

## P0.1 Audit Trail dan Void/Reversal Transaksi

**Status:** Not Started  
**Dependency:** —  
**Tujuan:** transaksi approved tidak dapat hilang tanpa jejak.

Ruang lingkup:

- ganti hard delete approved dengan void/reversal/correction;
- tambah actor, waktu, alasan, dan reference transaksi asal;
- tambah event history untuk create, approve, reject, void, correction;
- kunci field finansial penting setelah approved;
- tampilkan timeline pada detail transaksi.

Acceptance criteria:

- endpoint tidak dapat hard-delete transaksi approved;
- semua transisi status memiliki audit event;
- laporan membedakan active, void, dan correction;
- regression test tersedia.

## P0.2 Atomic Approval dan Idempotency

**Status:** Not Started  
**Dependency:** P0.1 dapat dikerjakan paralel dengan koordinasi schema  
**Tujuan:** mencegah race condition dan transaksi ganda.

Ruang lingkup:

- conditional update berdasarkan status lama;
- affected-row check dan `409 Conflict`;
- idempotency key atau mutation dedup;
- tombol UI disabled selama mutasi;
- refetch setelah conflict/success.

Acceptance criteria:

- dua request approval bersamaan hanya menghasilkan satu transisi;
- duplicate submit tidak membuat data ganda;
- stale state menghasilkan 409 dan UI pulih tanpa reload manual.

## P0.3 Shared Validation dan Typed API Contract

**Status:** Not Started  
**Dependency:** —

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

**Status:** Not Started  
**Dependency:** P0.3 direkomendasikan

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

**Status:** Not Started  
**Dependency:** P0.1–P0.4 bertahap

Skenario wajib:

- login valid/invalid;
- token version mismatch;
- pengurus membuat proposal;
- ketua approve;
- bendahara approve;
- reject pada tiap tahap;
- duplicate/concurrent approval;
- role/data scoping;
- summary hanya menghitung data sesuai policy;
- media upload failure cleanup.

Acceptance criteria:

- pull request gagal saat critical flow rusak;
- bug finansial memiliki regression test;
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

# UI/UX Redesign Workstream

Workstream ini berjalan setelah atau bersamaan dengan P0/P1 selama tidak menghambat security dan correctness.

## Design principles

- clean dan profesional;
- mobile-first 360 px;
- satu primary action per screen;
- progressive disclosure;
- role-aware navigation;
- consistent design token;
- accessible by default;
- glassmorphism/bento hanya kontekstual.

## Information architecture admin target

```text
Ringkasan
Keuangan
  Transaksi
  Proposal
  Persetujuan
Konten
  Kabar
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

Gunakan route nyata per workflow, bukan satu halaman tab yang terlalu besar, bila perubahan route dapat dilakukan aman.

## Phase UI-0 — Audit

**Status:** Not Started

- inventory halaman, role, task, dan komponen;
- screenshot baseline;
- terminology audit;
- critical user journey;
- mobile issue inventory.

## Phase UI-1 — Design Foundation

**Status:** Not Started

- token warna, typography, spacing, radius, shadow;
- component states;
- Button, FormField, CurrencyInput, Select, Dialog, Drawer, Badge, Skeleton, EmptyState, ErrorState, Timeline, DataList/Table;
- accessibility contract.

## Phase UI-2 — App Shell

**Status:** Not Started

- responsive admin navigation;
- role-aware menu;
- header/breadcrumb;
- mobile drawer or bottom navigation;
- public navbar/footer.

## Phase UI-3 — Financial Critical Screens

**Status:** Not Started

Urutan:

1. Transaction list/detail;
2. Proposal create/detail;
3. Approval review/timeline;
4. Dashboard;
5. Audit history.

Acceptance criteria:

- usable pada 360 px;
- table menjadi mobile cards;
- approval memiliki review page, reason, dan conflict handling;
- semua state UI tersedia;
- tidak bergantung pada legacy bridge.

## Phase UI-4 — Content and Settings

**Status:** Not Started

- media library;
- galeri;
- kabar;
- kritik/saran;
- settings/account/access.

## Phase UI-5 — Quality Gate and Cleanup

**Status:** Not Started

- accessibility audit;
- performance audit;
- cross-browser;
- E2E;
- visual regression;
- legacy cleanup;
- component documentation.

# Recommended Execution Order

1. P0.1 Audit trail/void.
2. P0.2 Atomic approval/idempotency.
3. P0.3 Shared contracts.
4. P0.4 Security hardening.
5. P0.5 Critical tests.
6. P1.1 Observability.
7. P1.4 Release safety.
8. UI-0 dan UI-1.
9. UI-2 dan UI-3.
10. P1.3 Legacy cleanup.
11. P1.5 Media lifecycle.
12. P2 public modules, accessibility, SEO, dan optimization.
