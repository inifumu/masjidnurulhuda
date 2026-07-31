# Handoff Historis — Audit Menyeluruh Transaksi Alt

> **SUPERSEDED:** route evaluasi Transaksi Alt telah dihapus setelah implementation terpilih menjadi Transaksi canonical. Dokumen ini bukan instruksi aktif; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` untuk task aktif saat ini dan `ROADMAP.md` untuk urutan R4 keseluruhan.

Isi berikut dipertahankan hanya sebagai histori audit dan tidak boleh dipakai sebagai prompt sesi aktif.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

Bahasa:
- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.

Tujuan sesi:
- Audit ulang route evaluasi sementara `/admin/finance/transaksi-alt` secara menyeluruh pada mobile, tablet, iPad Pro 1024, dan wide desktop.
- Jangan hanya mengaudit filter. Audit keseluruhan menu route: workflow tabs, page header, summary, search, disclosure filter, segmented controls, dropdown bulan/tahun/kategori, Reset, daftar transaksi, nominal jutaan, selection state, detail Sheet/persistent dossier, timeline, destructive action, loading/error/empty/pending/permission state, keyboard/focus/Escape, overflow, dan console errors.
- Patch setiap bug atau inconsistency yang benar-benar ditemukan pada route/menu tersebut, lalu audit ulang dari browser setelah edit terakhir.
- Beri verdict jujur PASS/BLOCKER per viewport dan keseluruhan.

Kalimat kerja pembuka yang disarankan:

`Saya akan mengaudit Transaksi Alt dari route host sampai seluruh closed/open interaction state pada 360×800, 768×1024, 1024×1366, dan 1366×900; saya akan memperbaiki bug/inconsistency yang terbukti tanpa mengubah backend/domain contract, lalu mengulang browser evidence sebelum memberi verdict.`

## Batasan keras

- Jangan commit atau push.
- Jangan mengganti default redirect `/admin/finance → /admin/finance/transaksi`.
- Jangan menetapkan Alt sebagai canonical atau menghapus route existing tanpa keputusan user.
- Jangan mengubah backend, service, DTO, Hono route, RBAC, ownership, state machine, idempotency, audit, migration, approved/void invariant, atau period-summary policy.
- Jangan mengganti server-bound month/year/flow/category filter dengan local filtering.
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan broad-stage dan jangan memakai `git add -A`.
- `.hermes/**`, screenshot, probe, `document.documentElement.clientWidth`, dan `x.name)` adalah artifact lokal; jangan di-stage/commit.
- Working tree memang sangat dirty dan berisi akumulasi R4. Sentuh hanya file yang diperlukan.
- Legacy/V2/checkpoint Transaksi hanya kontrak behavior dan invariant; bukan referensi visual/composition.

## Source of truth yang wajib dibaca

- `.hermes.md`
- `AGENTS.md`
- `SYSTEM_MAP.md`, khusus finance flow
- `DESIGN.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `ROADMAP.md`
- handoff ini

Load skill:
- `responsive-ui-redesign-governance`
- reference `financial-quick-filter-recomposition.md`
- reference `financial-list-detail-implementation.md`

## Trace aktual

`AdminSidebar / FinanceV2 workflow strip`
`→ TransactionsAltView`
`→ TransactionWorkspaceAlt`
`→ useKas state/watchers`
`→ kasService + dashboardService`
`→ Hono transaction/dashboard routes`
`→ service/query`
`→ D1`

Target audit/presentation utama:
- `src/views/admin/FinanceV2.vue`
- `src/views/admin/finance/TransactionsAltView.vue`
- `src/components/admin/finance/TransactionWorkspaceAlt.vue`
- `src/components/ui/sheet/SheetContent.vue`
- `src/components/ui/button/index.ts`
- `tests/finance-transaction-ledger.test.mjs`

Probe lokal yang sudah ada dan boleh diperbaiki/diganti, tetapi jangan di-stage:
- `.hermes/r4-filter-audit.mjs`
- `.hermes/r4-filter-mobile-audit.mjs`
- `.hermes/r4-filter-mobile-may-audit.mjs`
- `.hermes/r4-filter-tablet-audit.mjs`
- `.hermes/r4-filter-ipad-pro-audit.mjs`

## State implementasi terakhir yang harus dipertahankan kecuali browser membuktikan cacat

### Route dan navigation

- Route evaluasi: `/admin/finance/transaksi-alt`.
- Default finance redirect tetap `/admin/finance/transaksi`.
- Role visibility Alt sama dengan Transaksi existing.
- Finance workflow strip route Alt:
  - mobile `<768`: ikon + label, horizontal-scroll;
  - tablet/iPad `768–1279`: label-only agar semua enam workflow terlihat;
  - wide desktop `>=1280`: ikon + label kembali.
- Pada 1024×1366, seluruh enam tab terakhir terukur terlihat penuh dan workflow nav overflow = 0.

### Breakpoint composition final

Wide desktop tidak lagi dimulai pada 1024.

- Mobile `<768`:
  - filter empat baris;
  - controls 44 px;
  - single-column list;
  - detail full-screen Sheet.
- Tablet/iPad `768–1279`:
  - filter tiga baris;
  - controls 44 px;
  - single-column list;
  - detail side Sheet;
  - tidak ada persistent split pane.
- Wide desktop `>=1280`:
  - filter tiga baris;
  - controls compact 32 px, segmented inner button 28 px;
  - persistent split list/detail;
  - tidak membuka Sheet ketika row dipilih.

Interaction source harus sinkron dengan CSS:
- `choose()` membuka modal detail hanya ketika `window.innerWidth < 1280`.

### Filter hierarchy final

Satu `data-filter-surface` membungkus semua filter.

Urutan DOM/visual:
1. `data-filter-segments`: Arus kas.
2. `data-filter-segments`: Status transaksi.
3. `data-filter-primary`: Periode + Kategori + Reset.

- Outer surface muted membungkus semuanya.
- Arus/Status tetap memakai bordered segmented wrapper kecil canonical.
- Arus/Status masing-masing tiga kolom sama lebar.
- Label `Dibatalkan` tidak boleh clipping.
- Gap Status → primary terakhir terukur 8 px.
- Filter inline/collapsible di bawah search; bukan Sheet/modal filter.
- Bulan/tahun/kategori memakai canonical shadcn-vue DropdownMenu + RadioGroup/RadioItem.
- Select dan Popover lama dilarang kembali ke filter Alt.

### Periode dan category layout

- Bulan:tahun menggunakan grid rasio `2fr 1fr`.
- Mobile tetap empat baris:
  - Periode span satu baris penuh;
  - Kategori + Reset pada baris berikutnya.
- Tablet/iPad mulai `md` menjadi tiga baris:
  - primary grid `auto | minmax(0,1fr) | auto`;
  - Periode, Kategori, Reset satu baris.
- Tablet/desktop total wrapper Periode 224 px:
  - bulan sekitar 146,7 px;
  - tahun sekitar 73,3 px;
  - padding tahun lebih kecil agar `2026 + chevron` muat.
- Mobile wrapper Periode memenuhi lebar; hasil sekitar 181,3 / 90,7 px pada 360.
- Kategori memakai `minmax(0,1fr)` dan memenuhi sisa ruang.
- Reset intrinsic/trailing dan tidak boleh wrap.
- Kategori panjang boleh truncate dengan ellipsis, tetapi popup harus menampilkan nama lengkap.

### Dropdown month

- Canonical DropdownMenu, bukan Select/Popover.
- Grid 2 kolom × 6 baris agar semua Januari–Desember terlihat tanpa hidden scroll.
- Mobile/tablet item 44 px.
- Wide desktop item 32 px.
- Popup 288 px (`w-72`) dan radius surface `rounded-md`.
- Trigger/item `rounded-sm`.
- Harus audit while-open: placement, collision, viewport fit, Escape, focus return, selected indicator.

### List/detail

- Nominal harus selalu dipertahankan di trailing edge; judul/metadata yang truncate lebih dahulu.
- Fixture nominal jutaan terakhir:
  - `− Rp 12.750.000`;
  - `+ Rp 25.850.000`.
- Row width contract terakhir:
  - mobile `calc(100vw - 3rem)`; 312 px pada 360;
  - tablet `calc(100vw - 19rem)`; 464 px pada 768;
  - iPad Pro 1024: 720 px dalam single-column area;
  - wide desktop `w-full`.
- Detail mobile full width karena caller memakai `!w-full` untuk mengalahkan primitive `w-3/4`.
- Detail tablet/iPad berupa side Sheet; pada 1024 Sheet memiliki `sm:max-w-xl`, bukan persistent split.
- Detail wide desktop persistent dossier; row click tidak boleh membuka overlay/blur.
- Canonical Sheet close target:
  - mobile/tablet 44×44 px;
  - wide desktop 32×32 px.
- Escape harus menutup Sheet dan focus restoration perlu diperiksa.

### Reset dan bug yang telah diperbaiki

Reset harus:
- clear search;
- status → semua;
- flow → semua;
- category → semua;
- month/year → current month/current year;
- menutup disclosure filter.

Bug yang tidak boleh regresi:
- desktop blur/pointer interception akibat `detailOpen` aktif pada persistent detail;
- `Dibatalkan` clipping;
- category default `Semua` clipping;
- Reset wrap/mengambang;
- Status→primary gap 0 px;
- month dropdown hanya memperlihatkan 8 bulan tanpa affordance;
- mobile segmented hanya 36 px;
- mobile Sheet hanya 75% viewport;
- tablet row 720 px terpotong dalam pane 464 px;
- nominal jutaan hilang dari row;
- 1024 dipaksa masuk split desktop;
- kategori di 1024 tidak dapat diklik karena pointer interception;
- workflow tab `Riwayat audit` terpotong pada 1024.

## Browser matrix wajib

Audit semua viewport berikut terhadap aplikasi/adapter terbaru, jangan server stale:

1. `360×800` mobile.
2. `768×1024` tablet portrait.
3. `1024×1366` iPad Pro portrait/boundary lama.
4. `1366×900` wide desktop.

Jika port target sudah dipakai, jangan audit proses lama. Jalankan server pada port baru dan arahkan probe ke port tersebut.

Untuk setiap viewport, capture dan inspect:
- route masuk/closed filter;
- filter terbuka;
- month dropdown terbuka dengan September/Desember;
- category dropdown terbuka dengan nama panjang;
- state Mei dengan nominal jutaan;
- row selected;
- detail Sheet/persistent dossier;
- destructive button enabled dan dark mode bila relevan;
- reset behavior;
- loading, empty, recoverable error, timeline loading/error/history unavailable bila fixture memungkinkan.

## Pengukuran browser wajib

Jangan mengandalkan screenshot saja. Ukur computed DOM:
- document horizontal overflow;
- workflow nav overflow dan bounding box semua tab;
- filter surface contains segments + primary;
- source/visual order segments → primary;
- gap Status → primary;
- height controls per breakpoint;
- month/year actual ratio;
- category and Reset width/no-wrap;
- clipping via `scrollWidth > clientWidth`;
- row width vs card/ScrollArea width;
- nominal visible inside row bounds;
- popup count 12, item height, viewport collision;
- Sheet/dialog geometry;
- close target geometry;
- desktop absence of modal overlay;
- body pointer-events after row selection;
- console/page errors.

Transient UI harus diukur saat terbuka, bukan setelah ditutup.

## Audit visual menyeluruh

Jangan membatasi audit pada filter. Nilai:
- sidebar and route context;
- workflow strip;
- page title/description duplication;
- summary hierarchy dan nominal besar;
- vertical density/first useful viewport;
- search/filter relationship;
- filter surface nesting dan balance;
- list row hierarchy, selection state, long text, nominal/status;
- empty space pada short-list;
- detail title/nominal/status/timeline/action;
- Sheet width dan overlay;
- dark destructive enabled/hover/disabled contrast;
- clipping, overlap, whitespace, alignment, radius, border, and selected/open states.

Jika visual reviewer memberi BLOCKER, verifikasi dengan DOM/source sebelum patch. Jangan menerima vision estimate bila bertentangan dengan computed browser geometry.

## Patch policy

- Patch akar masalah dan sibling path yang sama, bukan screenshot-specific magic number tanpa contract.
- Pertahankan canonical shadcn-vue/Reka primitives.
- Jangan memperkenalkan V3, backend fork, service fork, DTO fork, atau local substitute.
- Jika mengubah breakpoint, sinkronkan CSS visibility, density, `choose()` modal state, tests, row width, dan detail behavior.
- Jika mengubah row width, audit nominal jutaan pada mobile/tablet/iPad/wide desktop.
- Jika mengubah workflow strip, pastikan route lain tidak ikut rusak dan semua role-visible items tetap dapat dijangkau.
- Setelah setiap visual edit, browser evidence lama menjadi stale; audit ulang viewport yang terdampak.

## Urutan kerja sesi baru

1. `git status --short --branch` dan klasifikasikan source/test/docs/probe.
2. Baca source truth dan handoff ini.
3. Baca file target aktual; jangan mengandalkan line number handoff.
4. Jalankan server terbaru pada port kosong.
5. Audit baseline seluruh matriks sebelum edit.
6. Catat:
   `Trace: caller → view/component → composable/service → route/service (tidak diubah).`
   `Target edit: ...`
   `Risiko: ...`
7. Patch blocker satu kelas pada satu waktu.
8. Ulangi computed DOM + visual review closed/open state.
9. Jalankan targeted test.
10. Jalankan production build.
11. Bila scope sudah dianggap final dan user meminta closure, lanjutkan gate yang relevan; jangan commit/push tanpa permintaan/approval visual.

## Minimum verification

Setelah edit source terakhir:
- `node --test tests/finance-transaction-ledger.test.mjs`
- `npm run build`
- browser matrix 360/768/1024/1366
- real Vite → Hono adapter startup + actual API request
- console/page errors check
- `git diff --check`

Jika behavior finance/orchestration ikut berubah—seharusnya tidak untuk audit ini—tambahkan:
- `npm run test`
- `npm run test:critical-flow:d1`
- `npm run test:e2e:browser`
- RBAC/negative paths relevan.

## Definition of Done sesi audit

- Seluruh route/menu Transaksi Alt telah diaudit, bukan hanya filter.
- Mobile, tablet, iPad Pro 1024, dan wide desktop memiliki composition yang disengaja.
- Tidak ada tab/navigation tersembunyi tanpa affordance.
- Tidak ada clipping, overlap, pointer interception, stale overlay, atau horizontal document overflow.
- Nominal jutaan terlihat pada row dan detail.
- Filter state, Reset, dropdown open-state, and detail disclosure bekerja.
- Density mengikuti breakpoint final.
- Timeline/detail ownership dan RBAC/invariant tetap utuh.
- Targeted tests dan build lulus setelah edit terakhir.
- Verdict per viewport dan verdict keseluruhan dilaporkan jujur.
- Tidak ada commit/push dan tidak ada artifact `.hermes/**` yang di-stage.

## Format laporan akhir

Ringkasan:
- ...

Trace:
- host/navigation → Alt view → workspace → shared composable/service → API (unchanged)

Temuan dan patch:
- viewport/state → root cause → file → fix

Browser evidence:
- 360×800: PASS/BLOCKER + geometry
- 768×1024: PASS/BLOCKER + geometry
- 1024×1366: PASS/BLOCKER + geometry
- 1366×900: PASS/BLOCKER + geometry

Validasi:
- command: result

Dampak keamanan/data:
- backend/RBAC/state machine/migration unchanged, atau jelaskan jika tidak

Risiko residual / belum tervalidasi:
- ...

Git:
- no commit/no push

---

Akhir handoff historis.
