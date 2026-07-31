# Handoff Historis — Implementasi Contract Keperluan dan Hybrid Cash Desk

> **SUPERSEDED:** vertical slice contract `keperluan` telah diterapkan, arahan Hybrid Cash Desk bukan baseline aktif, dan Entry Spine kini live. R4 kini berlanjut ke redesign Persetujuan; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif.

Isi berikut dipertahankan hanya sebagai histori implementasi dan tidak boleh dipakai sebagai prompt sesi aktif.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Tujuan sesi

Implementasikan satu vertical slice R4 sebelum melanjutkan Proposal:

1. pisahkan `keperluan` sebagai judul wajib transaksi dari `keterangan` sebagai uraian detail;
2. migration additive + backfill transaksi existing;
3. sinkronkan shared contract, backend persistence/query, frontend state/service, dan Transaksi canonical;
4. promosikan desain **Hybrid Cash Desk** yang telah disetujui ke submenu **Catat kas** `/admin/finance/transaksi-langsung`;
5. buktikan finance invariants, migration, mutation recovery, dan browser matrix setelah edit terakhir.

Gunakan plan rinci:

`.hermes/plans/2026-07-17_000003-r4-keperluan-catat-kas-hybrid.md`

## Kalimat pembuka

`Saya akan mengimplementasikan vertical slice R4 keperluan/keterangan dengan strict TDD—migration additive dan contract lebih dahulu, lalu update Transaksi canonical dan promosi Hybrid Cash Desk ke Catat kas—tanpa mengubah RBAC, state machine, idempotency, audit, approved/void invariant, atau summary policy; setelah edit terakhir saya akan membuktikannya melalui migration, real-D1, browser matrix 360/768/1024/1366, dan real Vite→Hono request.`

## Keputusan user yang sudah final

### Contract domain

- `keperluan` adalah judul wajib arus uang pada direct dan proposal.
- `keperluan` tampil sebagai judul pada list aktivitas Transaksi, Persetujuan, Riwayat audit, slip, dan dossier.
- `keterangan` adalah uraian detail.
- Direct transaction: `keterangan` opsional.
- Proposal: `keterangan` wajib untuk rincian penggunaan/asal dana.
- List search mencakup keperluan, keterangan, kategori, dan seksi.
- Row legacy dibackfill `keperluan = keterangan`.
- Lampiran proposal bukan bagian implementasi slice ini; sudah dicatat sebagai candidate discovery di `docs/FEATURE_DEVELOPMENT_PLAN.md`.

Batas validation yang direncanakan dan harus dikunci test:

- `keperluan`: trimmed, 5–120 karakter;
- direct `keterangan`: trimmed, kosong valid, maksimum 1000;
- proposal `keterangan`: trimmed, 10–2000.

Jika source/tests aktual menunjukkan batas existing yang lebih ketat dan beralasan, berhenti dan jelaskan trade-off sebelum mengubah angka. Jangan diam-diam mengubah contract.

### Desain Hybrid Cash Desk

Arah visual sudah disetujui user. Jangan membuat ronde prototype baru kecuali implementasi browser menemukan blocker nyata.

Reference disposable:

- `.hermes/r4-experiments/direct-hybrid-cash-desk.html`
- `.hermes/r4-hybrid-audit.mjs`

Reference ini hanya geometry/task model; jangan copy HTML/CSS mentah ke production.

Contract visual/interaksi:

- Transaksi canonical, `AdminLayoutV2.vue`, `AdminSidebar.vue`, `FinanceV2.vue`, dan `DESIGN.md` menjadi baseline style/behavior/density;
- semantic radio untuk jenis arus, tetapi visual berupa dua switch-button besar tanpa circle radio/check;
- arus menjadi keputusan pertama dan dominan;
- nominal menjadi fokus berikutnya;
- `Keperluan` wajib dan menjadi headline slip;
- `Keterangan tambahan` opsional dan tidak merender section kosong;
- seksi pelapor tetap opsional melalui progressive disclosure;
- `<1280`: persistent slip disembunyikan; compact recap + Dialog slip confirmation;
- `>=1280`: persistent live slip; Dialog tetap menjadi owner konfirmasi mutation final;
- 44 px touch controls pada mobile/tablet/iPad `<1280`; compact wide desktop `>=1280`;
- pending mengunci Escape/outside/cancel/double-submit;
- 409/5xx setelah pending menutup Dialog, mempertahankan input, mengembalikan modal ownership/focus, dan memungkinkan retry dengan idempotency key payload-bound;
- success reset input dan refresh list/summary tanpa transaksi ganda.

## Batasan keras

- Jangan commit atau push tanpa permintaan eksplisit user pada sesi baru.
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Working tree sangat dirty; sentuh hanya path yang dibutuhkan.
- Jangan `git add -A` atau broad-stage.
- `.hermes/**`, screenshots, probes, `document.documentElement.clientWidth`, dan `x.name)` adalah artifact lokal; jangan stage/commit.
- Jangan menghidupkan kembali route/file/menu Transaksi Alt.
- Jangan mengubah redirect `/admin/finance → /admin/finance/transaksi`.
- Jangan membuat V3, Alt, New, Bridge, DTO fork, service fork, backend fork, atau route paralel.
- Jangan edit migration lama; buat migration additive baru setelah mengecek nomor migration aktual.
- Jangan mengubah RBAC, ownership, proposal state machine, audit semantics, idempotency guarantees, approved/void invariant, atau period-summary policy.
- Jangan mengimplementasikan attachment proposal pada slice ini.
- Jangan memindahkan business logic ke view.
- Jangan menghapus `TransactionLedger.vue` selama `FinanceLegacyView.vue` masih menjadi caller.
- Legacy/V2 hanya inventory behavior, bukan style/composition.
- Jangan menyatakan PASS dari source test/build tanpa browser evidence open/pending/error.

## Source of truth wajib

- `.hermes.md`
- `AGENTS.md`
- `README.md`
- `SYSTEM_MAP.md`, finance flow
- `DESIGN.md`
- `ROADMAP.md`, R4 dan gate keperluan
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `docs/FEATURE_DEVELOPMENT_PLAN.md`, Lampiran Proposal
- `docs/R4_DIRECT_TRANSACTION_IMPLEMENTATION_HANDOFF.md`
- `.hermes/plans/2026-07-17_000003-r4-keperluan-catat-kas-hybrid.md`

Load skill/reference:

- `test-driven-development`
- `responsive-ui-redesign-governance`
- `responsive-ui-redesign-governance/references/workflow-route-slicing.md`
- `responsive-ui-redesign-governance/references/financial-list-detail-implementation.md`
- `systematic-debugging` bila menemukan bug
- `requesting-code-review` sebelum closure/commit

## Trace aktual

Write path:

`AdminSidebar / FinanceV2`
`→ DirectTransactionView`
`→ KasInput`
`→ useKas.handleDirectInput`
`→ buildDirectTransactionPayload / kasService.submitDirectTransaction`
`→ POST /api/admin/transaction/add-direct`
`→ parseDirectTransaction`
`→ transaction service claim-first INSERT + audit + idempotency finalize`
`→ D1 kas_masjid / transaction_audit_events / transaction_idempotency_keys`

Read path:

`TransactionsView`
`→ TransactionWorkspace`
`→ useKas transactions`
`→ kasService.getTransactions`
`→ GET /api/admin/transaction/list`
`→ getAllTransactions`
`→ D1`

Proposal sibling contract yang harus ikut disinkronkan agar type/build tidak drift:

`ProposalsView → KasProposal → handleProposal → submitProposal → add-proposal → createTransaction → D1`.

Jangan meredesain Proposal dalam slice ini; hanya update contract/form compatibility minimum. Full Proposal redesign tetap workflow berikutnya.

## Fakta source saat handoff

Audit terakhir menemukan:

- shared `TransactionRequest` hanya memiliki `keterangan`;
- parser mewajibkan `keterangan` untuk direct dan proposal;
- `kas_masjid.keterangan` adalah `TEXT NOT NULL`;
- transaction service INSERT hanya menulis `keterangan`;
- `KasTransaction.keterangan` dipakai sebagai title di TransactionWorkspace, approval, report, dan legacy caller;
- field `keperluan` belum ada;
- attachment proposal contract belum ada.

Source production Catat kas saat ini adalah draft/reskin yang ditolak user dan bukan baseline desain final:

- `src/views/admin/finance/DirectTransactionView.vue`
- `src/components/admin/kas/KasInput.vue`

Rewrite scoped presentation diperbolehkan setelah RED tests, tetapi pertahankan mutation orchestration di composable/service.

## Urutan implementasi wajib

1. `git status --short --branch` dan baca disk aktual.
2. Cari migration terakhir aktual; tentukan nomor migration baru.
3. Audit seluruh caller `keterangan` agar title/detail tidak tertukar.
4. Tulis trace/target/risiko tinggi sebelum edit.
5. RED shared parser contract.
6. GREEN shared parser contract.
7. RED fresh/upgrade migration + backfill.
8. GREEN migration additive.
9. RED backend persistence/list/idempotency.
10. GREEN backend vertical slice.
11. RED frontend payload/state/reset/retry.
12. GREEN frontend contract.
13. RED dan update Transaksi canonical title/detail/search.
14. RED dan promosikan Hybrid Cash Desk ke Catat kas.
15. Browser fixture states dan matrix.
16. Full gates + real adapter request.
17. Docs sync + independent review fresh.
18. Jangan commit/push kecuali user meminta.

Jangan menggabungkan migration, backend, frontend, dan UI dalam satu patch besar sebelum targeted RED/GREEN masing-masing.

## Files kemungkinan berubah

Contract/storage/backend:

- `shared/contracts/index.ts`
- migration baru setelah nomor terakhir aktual
- `server/api/admin/transaction.ts`
- `server/services/transaction.ts`

Frontend state/service:

- `src/services/admin/kasService.ts`
- `src/composables/admin/kas/useKasState.ts`
- `src/composables/admin/kas/useKasActions.ts`
- watcher/reset helper terkait bila diperlukan

Presentation:

- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/views/admin/finance/TransactionsView.vue` hanya bila type/orchestration perlu
- `src/views/admin/finance/DirectTransactionView.vue`
- `src/components/admin/kas/KasInput.vue`
- `src/components/admin/kas/KasProposal.vue` hanya compatibility contract minimum
- approval/audit caller yang masih memakai `keterangan` sebagai title

Tests:

- parser/shared contract test aktual
- `tests/transaction-create-routes.integration.test.mjs`
- transaction service/list tests aktual
- `tests/scripts/p0-migrations.mjs`
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-wrangler-critical-flow.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Docs setelah behavior aktual tersedia:

- `SYSTEM_MAP.md`
- `ROADMAP.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- handoff aktif berikutnya

Jangan sentuh shell/host/router kecuali browser/source membuktikan dependency nyata.

## TDD scenarios minimum

Shared/parser:

- direct tanpa keperluan gagal;
- direct keterangan kosong lulus;
- proposal keterangan kosong/pendek gagal;
- trimming/max length exact;
- machine-readable field errors.

Migration:

- fresh apply;
- upgrade existing;
- backfill exact;
- row/status/audit/idempotency preserved;
- FK clean.

Backend:

- direct/proposal persist kedua field;
- replay satu row/event;
- same key + different purpose conflict;
- list returns both fields;
- role negative paths unchanged.

Frontend:

- payload builders;
- successful reset;
- failed retry preserves input/key;
- list title/detail/search semantics.

Browser Catat kas:

- loading/error/retry;
- role visibility dan direct API 403 pengurus;
- radio switch semantic/keyboard tanpa circle visual;
- category dependency saat arus berubah;
- required keperluan + optional keterangan;
- first-error focus;
- long purpose, empty/long description, large nominal;
- recap/slip/Dialog parity;
- Escape/Cancel/focus restoration;
- pending dismissal/double-submit guard;
- success persistence/refetch;
- 409 dan 503/network recovery tanpa kehilangan input;
- resize 1279↔1280 tanpa hidden overlay/pointer lock.

## Browser matrix wajib

- 360×800
- 768×1024
- 1024×1366
- 1366×900

Tambahan:

- sidebar expanded/collapsed 768/1024/1366;
- mobile sidebar direct navigation;
- zoom 200%;
- dark mode primary/destructive/disabled;
- reduced motion;
- dropdown/Dialog while open;
- console/page errors;
- document dan local overflow.

## Full gates setelah edit terakhir

- targeted tests per TDD slice
- `npm run test`
- `npm run build`
- `npm run test:migrations`
- `npm run db:apply:local`
- `npm run test:critical-flow:d1`
- `npm run test:e2e:browser`
- real Vite → Hono adapter startup + actual JSON API request
- `git diff --check`
- fresh independent review

Jika canonical E2E lama gagal karena masih menunggu heading `Ruang kerja keuangan` pada redirect `/admin/finance`, migrasikan locator ke route/link semantics canonical. Jangan melemahkan mutation/focus/conflict assertions.

## Definition of Done

- migration additive dan backfill benar;
- keperluan/keterangan terpisah end-to-end;
- direct mewajibkan keperluan dan mengizinkan keterangan kosong;
- proposal compatibility mewajibkan keduanya;
- Transaksi canonical memakai keperluan sebagai title dan keterangan sebagai detail;
- Hybrid Cash Desk production cocok dengan arah approved dan state contract;
- no regression RBAC/idempotency/audit/state machine/approved-void/summary/ownership;
- seluruh full gates PASS setelah edit terakhir;
- attachment proposal tetap candidate, tidak diimplementasikan diam-diam;
- tidak ada commit/push tanpa permintaan user;
- artifact `.hermes/**` tidak di-stage.

## Format laporan akhir

```text
Ringkasan:
- ...

Trace:
- navigation → view → component/composable → service → route/service → D1

Migration/contract:
- ...

Temuan dan patch:
- ...

Browser evidence:
- 360×800: ...
- 768×1024: ...
- 1024×1366: ...
- 1366×900: ...
- sidebar/keyboard/transient/pending/error: ...

Validasi:
- command: result

Dampak keamanan/data:
- ...

Dokumentasi:
- ...

Risiko residual:
- ...

Git:
- no commit/no push kecuali diminta
```

---
