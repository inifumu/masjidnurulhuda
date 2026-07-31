# Handoff Aktif — Redesign Persetujuan R4

Salin seluruh dokumen ini ke sesi Hermes berikutnya.

## Kalimat pembuka wajib

`Saya akan melanjutkan R4 ke workflow Persetujuan dengan audit source-live dan prototype-first: Transaksi canonical, Catat kas Entry Spine, dan Proposal Request Brief tetap baseline regression; approval role matrix, ownership, pending_ketua → pending_bendahara → approved/rejected, alasan reject, audit atomic, idempotency, conflict handling, dan invariant finansial tidak berubah.`

## Bahasa, waktu, dan Git safety

- Gunakan Bahasa Indonesia dan zona bisnis `Asia/Jakarta`.
- Branch: `improve/project-foundation`; working tree sangat dirty dan memuat banyak perubahan existing.
- Jangan reset, stash, clean, checkout, broad-stage, commit, atau push tanpa permintaan eksplisit user.
- Jangan membaca `.env`, `.dev.vars`, cookie, token, atau secret.
- `.hermes/**`, screenshot, probe, `document.documentElement.clientWidth`, dan `x.name)` tidak boleh di-stage.

## Status aktif

- R4 tetap `In Progress`.
- Baseline regression yang tidak boleh dibuka ulang tanpa defect render-live baru:
  - `/admin/finance/transaksi` — Transaksi canonical;
  - `/admin/finance/transaksi-langsung` — Catat kas Entry Spine;
  - `/admin/finance/proposal` — Proposal Request Brief.
- Workflow aktif berikutnya: `/admin/finance/persetujuan`.
- `KasApproval.vue` adalah inventory behavior/data/invariant legacy, bukan donor visual.
- Fase awal wajib audit + prototype-first; jangan langsung polish table legacy di production.

## Source ownership dan trace

- `src/views/admin/FinanceV2.vue` — workflow shell/navigation; freeze tanpa defect terukur.
- `src/views/admin/finance/ApprovalsView.vue` — heading/loading/error dan outer wrapper legacy.
- `src/components/admin/kas/KasApproval.vue` — task surface legacy yang akan diaudit/redesign.
- `src/composables/admin/useKas.ts` + `src/composables/admin/kas/useKasActions.ts` — state dan mutation orchestration; jangan difork.
- `src/services/admin/kasService.ts` — satu `approveTransaction(id, action, reason, key)` untuk action `approve|reject` beserta idempotency; jangan membuat service reject terpisah.
- `server/api/admin/transaction.ts` + `server/services/transaction.ts` — backend policy/state machine/audit; tidak berubah untuk visual redesign.

Trace:

`FinanceV2 → ApprovalsView → KasApproval → useKas.handleAction → kasService.approveTransaction(id, action, reason, key) → POST /api/admin/transaction/approve/:id (body action=approve|reject) → transaction service conditional transition + audit + idempotency → D1`

## Behavior/invariant wajib

- Backend tetap otoritas RBAC dan transition.
- Ketua: `pending_ketua → pending_bendahara` atau rejected dengan alasan.
- Bendahara: `pending_bendahara → approved` atau rejected dengan alasan.
- Superadmin mengikuti policy existing; pengurus hanya status/data scoped sesuai backend.
- Reject wajib memiliki alasan valid; jangan mempertahankan jalur visual yang tidak mengumpulkan alasan.
- Mutation conditional, atomic dengan audit, idempotent, dan tahan double-submit.
- Conflict/stale transition harus 409 dan pesan recoverable. Refetch-on-409 belum dijamin orchestration existing; reproduksi sebagai candidate defect dan tambahkan bila terbukti perlu tanpa mem-fork mutation path.
- Approved tidak boleh di-hard-delete/edit finansial langsung.
- UI tidak boleh memaksa status final atau memperluas authority role.

## Defect/inventory awal source aktual

`ApprovalsView.vue`:

- masih menambah outer Card wrapper di sekitar task surface;
- loading/error ownership tetap berguna dan harus dipertahankan.

`KasApproval.vue`:

- table horizontal-scroll menjadi solusi mobile;
- custom native buttons dan warna hardcoded slate/rose/indigo;
- `catch (error: any)`;
- komentar/debug copy stale, termasuk `Hack Tanggal`;
- reject Dialog tidak menyediakan reason input meskipun invariant reject mewajibkan alasan;
- dua tahap dirender sekaligus dengan CSS `order` dan opacity, berpotensi memisahkan hierarchy visual dari DOM/focus;
- CTA icon bergantung `title`, touch target/density belum canonical;
- empty/loading/error/conflict/timeline/detail ownership belum membentuk review experience utuh;
- table hanya menampilkan ringkasan, belum memberi review rincian proposal yang cukup sebelum mutation.

Temuan di atas adalah candidate defect yang harus direproduksi dan ditelusuri terhadap composable/service/backend sebelum patch.

## Arah desain

- Gunakan Civic Editorial institutional review workspace, bukan reskin table.
- Mulai 360 px; mobile memakai cards/list + detail disclosure, bukan table scroll.
- Role dan tahap aktif harus jelas tanpa CSS reorder yang memisahkan DOM/visual/focus.
- Review harus menunjukkan keperluan, rincian, nominal, arus, kategori, tanggal, metode, seksi, current stage, dan audit/timeline yang tersedia.
- Progressive disclosure boleh berupa Sheet pada touch/tablet dan persistent review pada wide desktop bila bukti usable-width mendukung.
- Mutasi Setujui/Tolak hanya muncul untuk role/tahap yang diizinkan; final confirmation memakai Dialog canonical.
- Reject reason harus menjadi bagian lifecycle Dialog dan dipertahankan pada failure.
- Satu modal owner pada satu waktu; hindari Sheet + Dialog bertumpuk.
- Gunakan shadcn-vue/Reka canonical, density 44 px touch/tablet dan 32 px mulai `xl` bila konsisten dengan workflow lain.
- Buat minimal dua prototype struktural berbeda di `.hermes/r4-approval-experiments/`, dalam shell production aktual, lalu minta user memilih sebelum promosi production.

## Protokol sesi

1. `git status --short --branch`.
2. Baca `.hermes.md`, `DESIGN.md`, `SYSTEM_MAP.md`, R4 di `ROADMAP.md`, `docs/UI_UX_REDESIGN_AUDIT.md`, dan handoff ini.
3. Trace route/view/component/composable/service/backend aktual dan test approval/RBAC/idempotency.
4. Jalankan source-live dan audit 360×800, 768×1024, 1024×1366, 1366×900 untuk seluruh role relevan.
5. Reproduksi candidate defects: mobile table, role/stage hierarchy, reason reject, pending/double-submit, conflict/refetch, Sheet/Dialog focus, long content, dark mode, overflow, console.
6. Buat RED behavior contract/probe untuk defect objektif; jangan ubah backend untuk menyesuaikan composition.
7. Buat dan browser-audit minimal dua prototype yang berbeda secara hierarchy/interaction, bukan hanya warna/spacing.
8. Presentasikan comparison opinionated dan tunggu pilihan visual user.
9. Setelah dipilih: promote minimal presentation slice, pertahankan mutation owner, lalu verifikasi positive/negative role matrix dan state transitions.
10. Jalankan targeted test, `npm run test`, `npm run build`, `npm run test:e2e:browser`, migration/critical-flow bila behavior contract tersentuh, real Vite→Hono request hanya bila diizinkan, dan `git diff --check`.
11. Minta independent review baru setelah edit final.
12. Sinkronkan docs hanya setelah source-live dan gates final.

## Evidence Proposal sebelum handoff

- Request Brief order: keperluan → arus → nominal → rincian → kategori → tanggal → metode → seksi → consequence → CTA.
- Completion/CTA berada di dalam metadata; metadata desktop `position: static`, bukan sticky.
- Source-live probe lulus pada 360/768/1024/1366: CTA tunggal, focus-first, Escape/focus return, pending, 409/503 preservation, dark mode, no overflow/console error.
- Full application gate sebelum finishing terakhir: 173/173 test, build, canonical E2E, diff check, independent review PASS.
- Setelah finishing metadata/non-sticky: targeted regression dan source-live correction probe pernah lulus. Patch audit tambahan untuk stale metadata, pesan 409 konsisten, dan fokus sukses kemudian lulus pada 173/173 test serta build; browser source-live final patch tambahan masih harus dijalankan ulang bila host mengizinkan.

## Definition of Done Persetujuan

- user memilih prototype dan fresh render production diterima;
- mobile/tablet/desktop memiliki review hierarchy yang konsisten;
- role/stage/action visibility sesuai backend dan negative paths lulus;
- reject reason lengkap end-to-end;
- pending/double-submit/Escape/outside/conflict/refetch/focus restoration lulus;
- detail/timeline/loading/empty/error/permission state jujur;
- tidak ada nested modal, document overflow, console/page error, atau custom legacy control residual pada task surface canonical;
- full gates, real-runtime gate yang diwajibkan, diff check, dan independent review lulus;
- docs aktif disinkronkan;
- tidak ada commit/push tanpa permintaan eksplisit user.
