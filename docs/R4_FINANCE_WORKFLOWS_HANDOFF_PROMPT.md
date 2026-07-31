# Histori Handoff — Discovery Workflow Keuangan setelah Transaksi Canonical (Superseded)

> Handoff ini telah superseded. Entry Spine Catat kas kini live dan R4 berlanjut ke audit/prototype Proposal; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif. Dokumen ini tetap sebagai histori discovery workflow.

Salin seluruh isi dokumen ini ke sesi Hermes baru hanya jika sedang menelusuri histori keputusan.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Tujuan sesi

Lanjutkan R4 Financial Workflows dengan meredesain submenu keuangan lain secara block-by-block menggunakan:

1. submenu **Transaksi** canonical saat ini sebagai acuan visual, responsive composition, interaction feedback, density, state handling, dan primitive usage;
2. header/breadcrumb aktif dari `AdminLayoutV2.vue`;
3. sidebar aktif dari `AdminSidebar.vue`;
4. `DESIGN.md` sebagai source of truth visual;
5. source/composable/service/backend/test aktual sebagai source of truth behavior.

Urutan kerja yang disarankan:

1. **Catat kas** — `/admin/finance/transaksi-langsung`;
2. **Proposal** — `/admin/finance/proposal`;
3. **Persetujuan** — `/admin/finance/persetujuan`;
4. **Riwayat audit** — `/admin/finance/riwayat-audit`.

Kerjakan satu workflow sampai browser evidence dan gate relevan lulus sebelum berpindah ke workflow berikutnya. Jangan meredesain keempatnya sekaligus dalam satu patch besar.

## Kalimat kerja pembuka yang disarankan

`Saya akan melanjutkan R4 per workflow dengan Transaksi canonical, header, dan sidebar aktif sebagai baseline visual/interaksi; saya akan mengaudit behavior aktual dari view sampai D1, meredesain satu submenu pada satu waktu memakai shadcn-vue/Reka tanpa mengubah backend/domain contract, lalu membuktikannya pada 360×800, 768×1024, 1024×1366, dan 1366×900 sebelum melanjutkan slice berikutnya.`

## Batasan keras

- Jangan commit atau push tanpa permintaan eksplisit user pada sesi baru.
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Working tree sangat dirty dan berisi akumulasi R4; sentuh hanya file yang diperlukan.
- Jangan broad-stage dan jangan memakai `git add -A`.
- `.hermes/**`, screenshot, probe, `document.documentElement.clientWidth`, dan `x.name)` adalah artifact lokal; jangan di-stage/commit.
- Jangan menghidupkan kembali `/admin/finance/transaksi-alt`, `TransactionsAltView.vue`, `TransactionWorkspaceAlt.vue`, atau submenu **Transaksi Alt**.
- Jangan mengganti default redirect `/admin/finance → /admin/finance/transaksi`.
- Jangan mengubah backend, shared DTO, Hono route, RBAC, ownership, state machine, idempotency, audit, migration, approved/void invariant, atau period-summary policy demi UI.
- Jangan mengganti server-bound month/year/flow/category filter dengan local filtering.
- Jangan memindahkan business logic ke view.
- Jangan membuat V3, bridge visual, service fork, DTO fork, backend fork, atau route paralel sementara tanpa keputusan user.
- Legacy/V2/checkpoint hanya inventory behavior, field, state, role, dan invariant; bukan referensi style/composition.
- Jangan menghapus `TransactionLedger.vue` selama `FinanceLegacyView.vue` masih menjadi caller aktual.
- Jangan mengklaim PASS dari source-shape test/build saja; browser evidence closed/open/pending/error wajib.

## Source of truth yang wajib dibaca

- `.hermes.md`
- `AGENTS.md`
- `README.md`
- `SYSTEM_MAP.md`, khusus finance flow
- `DESIGN.md`
- `ROADMAP.md`, khusus R4
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `docs/R4_FINANCE_WORKFLOWS_HANDOFF_PROMPT.md` ini

Load skill:

- `responsive-ui-redesign-governance`
- reference `workflow-route-slicing.md`
- reference `financial-list-detail-implementation.md`
- reference `financial-quick-filter-recomposition.md` bila workflow memakai filter/list
- `systematic-debugging` bila menemukan bug behavior
- `test-driven-development` sebelum memperbaiki behavior berisiko

## Status canonical saat handoff

### Route dan navigation

- `/admin/finance` tetap redirect ke `/admin/finance/transaksi`.
- Hanya satu submenu/route transaksi canonical: `/admin/finance/transaksi`.
- Route/menu evaluasi `Transaksi Alt` telah dihapus setelah dipilih user.
- `FinanceV2.vue` adalah host tipis dan workflow strip route transaksi memakai icon+label satu baris dengan horizontal-scroll pada ruang sempit.
- Header/breadcrumb aktif dimiliki `AdminLayoutV2.vue`.
- Sidebar aktif memakai shadcn-vue Sidebar canonical melalui `AdminSidebar.vue`.

### Transaksi canonical sebagai baseline desain

Canonical implementation:

- `src/views/admin/finance/TransactionsView.vue`
- `src/components/admin/finance/TransactionWorkspace.vue`

Baseline yang harus dipertahankan dan dijadikan acuan, bukan disalin mentah:

- Civic Editorial institutional workspace;
- canonical shadcn-vue/Reka primitives;
- 44 px touch controls pada mobile/tablet sampai `<1280`;
- compact desktop controls pada `>=1280`;
- icon+label workflow tabs satu baris;
- horizontal-scroll bila tab melebihi ruang;
- focus pada workflow link mengungkap item ke viewport;
- sidebar collapse/expand membuat workspace dan row mengikuti container aktual;
- filter peer berada dalam satu outer surface dan server-bound;
- mobile structured list/card, bukan horizontal table scroll;
- mobile full-screen detail Sheet;
- tablet/iPad side Sheet;
- wide desktop persistent list/detail dossier;
- breakpoint presentation dan modal state sama-sama 1280;
- resize 1279→1280 membersihkan hidden Sheet/overlay/pointer lock;
- Sheet ditutup sebelum Dialog mutation dibuka;
- Escape/Batal memulihkan fokus ke stable row/trigger;
- pending mutation menonaktifkan dismissal dan double-submit;
- loading, empty, recoverable error, permission, pending, success, conflict, timeline error/unavailable ditampilkan jujur;
- nominal dan aksi penting tidak hilang saat viewport/sidebar berubah;
- dark destructive action memiliki contrast enabled/hover/disabled/focus yang jelas.

Jangan copy komposisi Transaksi bila task model workflow berbeda. Gunakan bahasa desain, geometry contract, state treatment, dan primitive system yang sama, lalu susun hierarchy sesuai tugas workflow.

## Working tree saat handoff

Branch:

- `improve/project-foundation`
- tracking `origin/improve/project-foundation`

Working tree memang sangat dirty dan memuat source/test/docs R4 serta banyak probe `.hermes/**`.

Path canonical yang baru/berubah pada slice Transaksi antara lain:

- `src/views/admin/FinanceV2.vue`
- `src/views/admin/finance/TransactionsView.vue`
- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/router/index.ts`
- `src/components/admin/shell/AdminSidebar.vue`
- `src/layouts/AdminLayoutV2.vue`
- `tests/finance-transaction-ledger.test.mjs`
- dokumentasi aktif R4

Jangan mengandalkan line number handoff; baca file aktual.

## Trace aktual per workflow

### Catat kas

`AdminSidebar / FinanceV2`
`→ DirectTransactionView`
`→ KasInput`
`→ useKas.handleDirectInput`
`→ kasService.submitDirectTransaction`
`→ POST /api/admin/transaction/add-direct`
`→ transaction service/idempotency/audit`
`→ D1`

Behavior/invariant yang wajib dipertahankan:

- hanya `superadmin|ketua|bendahara` dapat mengakses UI; backend tetap otoritas;
- server memaksa intent direct menjadi approved;
- nominal finite, positif, bounded, dan Rupiah parser canonical;
- kategori sesuai arus; seksi opsional tetapi harus valid bila dikirim;
- idempotency key tahan retry/double-submit;
- pending/validation/success/conflict/network state jujur;
- submit sukses merefresh list/summary tanpa membuat transaksi ganda.

Target redesign:

- task-first form composition, bukan wrapper card legacy;
- satu primary action yang jelas;
- progressive disclosure untuk metadata sekunder;
- mobile keyboard/input/nominal fit;
- confirmation dialog dan pending state canonical;
- recovery setelah validation, 409, atau network failure.

### Proposal

`AdminSidebar / FinanceV2`
`→ ProposalsView`
`→ KasProposal`
`→ useKas.handleProposal`
`→ kasService.submitProposal`
`→ POST /api/admin/transaction/add-proposal`
`→ transaction service/idempotency/audit`
`→ D1`

Behavior/invariant yang wajib dipertahankan:

- semua role operasional dapat melihat workflow sesuai policy UI existing;
- server memaksa status awal `pending_ketua`;
- `seksi_id` wajib dan valid;
- kategori sesuai arus;
- alasan/keterangan dan nominal tervalidasi;
- idempotency tahan retry/double-submit;
- ownership pengurus tetap backend-authorized;
- success menjelaskan tahap berikutnya tanpa mengklaim dana approved/cair.

Target redesign:

- form proposal yang membedakan kebutuhan dana vs setoran dengan hierarchy jelas;
- status lifecycle dan ekspektasi tahap berikutnya terlihat;
- field dependency tidak membingungkan;
- mobile form tidak menjadi stack panjang tanpa grouping/progress;
- validation inline, focus ke error pertama, pending confirmation, retry-safe.

### Persetujuan

`AdminSidebar / FinanceV2`
`→ ApprovalsView`
`→ KasApproval`
`→ useKas.handleAction`
`→ kasService.approveTransaction/rejectTransaction`
`→ POST approve|reject/:id`
`→ conditional transaction state service + idempotency + audit`
`→ D1`

Behavior/invariant yang wajib dipertahankan:

- hanya `superadmin|ketua|bendahara` melihat workflow approval; backend tetap otoritas;
- ketua hanya transisi `pending_ketua → pending_bendahara`;
- bendahara hanya transisi `pending_bendahara → approved`;
- reject wajib alasan 10–500 karakter;
- conditional state transition dan stale conflict mengembalikan 409;
- mutation idempotent dan double-submit safe;
- timeline/audit event jujur;
- pengurus tidak memperoleh action approval;
- approved baru masuk laporan/summary sesuai policy.

Target redesign:

- review-first list/detail experience;
- decision context, nominal, kategori, seksi, pemohon, tahap, dan timeline terlihat sebelum action;
- Setujui/Tolak tidak bersaing ambigu;
- reject reason Dialog canonical;
- pending action mengunci dismissal dan sibling action;
- 409 memicu refetch dan pesan stale state yang jelas;
- tablet memakai detail Sheet bila ruang tidak cukup; wide desktop dapat memakai persistent review dossier bila terukur layak.

Perubahan workflow ini berisiko tinggi. Wajib positive/negative role path dan state-transition evidence.

### Riwayat audit

`AdminSidebar / FinanceV2`
`→ AuditHistoryView`
`→ useKas.filteredLaporan`
`→ kasService.getTransactions`
`→ GET /api/admin/transaction/list`
`→ transaction service/query`
`→ D1`

Detail event transaksi:

`selected transaction`
`→ kasService.getTransactionTimeline`
`→ GET /api/admin/transaction/:id/timeline`
`→ ownership policy + transaction_audit_events`
`→ D1`

Behavior/invariant yang wajib dipertahankan:

- tidak merekayasa event untuk row legacy;
- `history_available=false` ditampilkan jujur;
- alasan reject/void terlihat sesuai contract;
- data scope pengurus tetap backend-authorized;
- audit history bukan hard-delete log kosmetik;
- filter/query harus bounded dan server-bound bila dimensinya tersedia.

Target redesign:

- audit-oriented search/list/detail, bukan ringkasan status akhir sederhana;
- timeline event menjadi pusat hierarchy;
- actor, waktu, transisi status, alasan, dan transaction context dapat dipindai;
- loading/error/unavailable/empty state terpisah;
- mobile timeline tidak clipping dan tidak bergantung hover;
- wide desktop memakai ruang ekstra untuk dossier/event context, bukan card kosong.

## File target awal

Host/shell baseline—jangan diubah tanpa temuan nyata:

- `src/views/admin/FinanceV2.vue`
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`

Workflow views:

- `src/views/admin/finance/DirectTransactionView.vue`
- `src/views/admin/finance/ProposalsView.vue`
- `src/views/admin/finance/ApprovalsView.vue`
- `src/views/admin/finance/AuditHistoryView.vue`

Domain components existing yang perlu diaudit sebagai behavior inventory:

- `src/components/admin/kas/KasInput.vue`
- `src/components/admin/kas/KasProposal.vue`
- `src/components/admin/kas/KasApproval.vue`
- `src/components/admin/kas/TransactionAuditDialog.vue`

State/orchestration/service:

- `src/composables/admin/useKas.ts`
- `src/composables/admin/kas/useKasState.ts`
- `src/composables/admin/kas/useKasActions.ts`
- `src/composables/admin/kas/useKasComputed.ts`
- `src/composables/admin/kas/useKasWatchers.ts`
- `src/services/admin/kasService.ts`
- `src/services/admin/dashboardService.ts`

Backend hanya dibaca untuk verifikasi contract kecuali user meminta perubahan behavior:

- `server/api/admin/transaction.ts`
- `server/services/transaction.ts`
- shared contracts dan migration/test terkait

## Protokol kerja tiap workflow

1. Jalankan `git status --short --branch`.
2. Baca source truth dan file aktual workflow.
3. Trace user action sampai D1; jangan berhenti pada component.
4. Inventory behavior, role, state, mutation, error, dan existing tests.
5. Tulis sebelum edit:

   `Trace: caller → view/component → composable/service → route/service → D1.`

   `Target edit: ...`

   `Risiko: rendah/sedang/tinggi/kritis + alasan.`

6. Audit baseline browser terhadap aplikasi/adapter terbaru, bukan server stale.
7. Bila user meminta redesign, ubah hierarchy/grouping/disclosure/responsive interaction—bukan polish incremental.
8. Pertahankan canonical primitives dan shared state/service.
9. Patch satu kelas masalah pada satu waktu.
10. Setelah visual edit terakhir, audit ulang seluruh viewport/state yang terdampak.
11. Jalankan targeted test/build.
12. Untuk mutation/RBAC/finance behavior, jalankan integration/negative/critical-flow gate relevan.
13. Jangan berpindah workflow bila masih ada blocker atau residual penting tanpa keputusan user.

## Browser matrix wajib

Audit setiap workflow pada:

1. `360×800` mobile;
2. `768×1024` tablet portrait;
3. `1024×1366` iPad Pro portrait;
4. `1366×900` wide desktop.

Audit juga:

- sidebar expanded dan collapsed pada 768/1024/1366;
- mobile sidebar/drawer direct navigation;
- zoom 200% untuk workflow form/review utama;
- dark mode destructive/primary/disabled state;
- resize melintasi breakpoint bila workflow memakai Sheet/persistent detail;
- document overflow dan local ScrollArea clipping;
- console/page errors.

## State dan interaction matrix wajib

Untuk setiap workflow yang relevan:

- loading awal;
- empty;
- recoverable load error + retry;
- permission/no-action state;
- field validation inline;
- pending/submitting;
- disabled dan double-submit guard;
- success feedback;
- 409 conflict/stale refetch;
- network/5xx failure tanpa kehilangan input aman;
- Escape/outside dismissal;
- focus initial, containment, dan restoration;
- dropdown/popover/dialog/Sheet while-open geometry;
- reduced motion;
- selected/open/pressed/current state;
- long text dan nominal jutaan;
- keyboard-only journey.

## UI/UX acceptance baseline

- Header shell tetap 64 px dan breadcrumb tidak menduplikasi page identity secara berlebihan.
- Sidebar expanded 240 px, collapsed rail 48 px.
- Workflow strip mempertahankan icon+label satu baris dan horizontal-scroll saat perlu.
- Mobile/tablet controls sekitar 44 px; wide desktop compact 32 px kecuali exception terdokumentasi.
- Tidak ada glassmorphism, gradient/glow dekoratif, atau card wrapper untuk setiap group.
- Satu primary action per screen/task state.
- Border dan hierarchy lebih dominan daripada shadow.
- Status tidak hanya mengandalkan warna.
- Tidak ada fitur penting yang hanya tersedia melalui hover.
- Tidak ada hidden modal overlay, stale pointer lock, clipping nominal/action, atau document horizontal overflow.
- Sidebar collapse/expand harus membuat content mengikuti container, bukan viewport magic number.
- Popup/Dialog/Sheet nested harus memiliki satu modal owner aktif.

## Patch policy

- Patch akar masalah dan sibling path yang sama.
- Jangan screenshot-specific magic number tanpa geometry contract.
- Bila membuat komponen domain baru, beri nama canonical tanpa `V2`, `V3`, `Alt`, `New`, atau `Bridge`.
- Ekstrak shared component hanya bila contract stabil dan benar-benar dipakai lintas workflow.
- Jangan mengubah primitive global untuk menyelesaikan defect lokal kecuali sibling caller audit membuktikan primitive adalah akar masalah.
- Jika breakpoint berubah, sinkronkan CSS visibility, modal state, watcher/media query, tests, dan focus behavior.
- Jika flow mutation berubah—seharusnya tidak—wajib end-to-end contract/test/docs update.

## Minimum verification per slice

UI/read-only slice:

- targeted source/regression test;
- `npm run build`;
- browser matrix 360/768/1024/1366;
- keyboard/focus/Escape;
- loading/error/empty/permission;
- console/page errors;
- `git diff --check`.

Mutation finance slice:

- targeted unit/integration tests;
- positive dan negative role paths;
- validation contract;
- pending/double-submit/idempotency;
- success persistence/refetch;
- 409 stale conflict recovery;
- 5xx/network recovery;
- timeline/audit consistency;
- `npm run test`;
- `npm run build`;
- `npm run test:critical-flow:d1` bila state transition/approval path terdampak;
- `npm run test:e2e:browser` bila journey canonical mutation berubah;
- real Vite → Hono adapter startup + actual API request;
- browser matrix dan console;
- `git diff --check`.

Migration/backend behavior seharusnya tidak berubah. Jika ternyata perlu, berhenti dan jelaskan dependency/risiko sebelum melanjutkan.

## Baseline evidence Transaksi canonical saat handoff

Evidence terakhir pada working tree:

- targeted canonical test: 6/6 pass;
- full unit suite: 162/162 pass;
- production build: pass;
- canonical browser matrix 360/768/1024/1366: pass;
- nested Sheet→void Dialog: satu Dialog/satu overlay;
- sidebar collapse row/container geometry: pass;
- Escape/Batal focus restoration: pass pada touch layouts;
- resize 1279→1280 hidden-overlay cleanup: pass;
- void success/409/503/pending/double-submit fixture: pass;
- zoom 200% tanpa document overflow;
- real Vite→Hono API request: HTTP 200 JSON;
- `git diff --check`: pass, hanya warning line-ending existing.

Evidence ini baseline regression, bukan bukti workflow lain sudah redesigned.

## Definition of Done per workflow

Workflow hanya boleh dianggap selesai jika:

- task hierarchy sesuai workflow, bukan salinan layout Transaksi;
- behavior existing dan finance invariants dipertahankan;
- role visibility dan backend authority konsisten;
- loading/empty/error/retry/permission/pending/success/conflict tersedia;
- mobile/tablet/iPad/wide desktop memiliki composition disengaja;
- sidebar expanded/collapsed dan breakpoint transition tidak menghasilkan stale width/overlay;
- keyboard/focus/Escape/restoration lulus;
- mutation tidak double-submit dan retry-safe;
- targeted/full relevant gates lulus setelah edit terakhir;
- dokumentasi canonical diperbarui bila ownership/flow/status berubah;
- tidak ada commit/push tanpa instruksi user;
- artifact lokal tidak di-stage.

## Format laporan akhir per slice

```text
Ringkasan:
- ...

Trace:
- host/navigation → view → domain component/composable → service → API/service → D1

Temuan dan patch:
- viewport/state → root cause → file → fix

Browser evidence:
- 360×800: PASS/BLOCKER + geometry/state
- 768×1024: PASS/BLOCKER + geometry/state
- 1024×1366: PASS/BLOCKER + geometry/state
- 1366×900: PASS/BLOCKER + geometry/state
- sidebar collapse/expand: ...
- keyboard/focus/transient: ...

Validasi:
- command: result

Dampak keamanan/data:
- backend/RBAC/state machine/idempotency/audit/migration unchanged, atau jelaskan

Dokumentasi:
- ...

Risiko residual / belum tervalidasi:
- ...

Git:
- no commit/no push, kecuali user meminta
```

## Langkah pertama sesi baru

1. Jalankan `git status --short --branch`.
2. Baca source truth dan handoff ini.
3. Load skill/reference wajib.
4. Mulai dari **Catat kas** kecuali user menentukan submenu lain.
5. Catatan historis: trace lama `DirectTransactionView → KasInput` telah superseded. Trace live adalah `FinanceV2 → DirectTransactionView → DirectCashDesk → useKas.handleDirectInput → kasService → Hono → transaction service → D1`.
6. Audit browser baseline Catat kas pada 360/768/1024/1366 sebelum edit.
7. Catat behavior/state/role gap dan proposal redesign hierarchy.
8. Patch hanya setelah root cause dan target composition jelas.
9. Audit ulang setelah edit terakhir dan jalankan gate relevan.
10. Tunggu keputusan user sebelum commit/push atau berpindah slice bila ada keraguan visual.

---
