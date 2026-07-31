# Handoff Historis — Koreksi UI/UX dan Penutupan Evidence Catat Kas

> **SUPERSEDED:** arah Hybrid Cash Desk dalam dokumen ini tidak lagi aktif dan Entry Spine kini live. R4 kini berlanjut ke redesign Persetujuan; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif.

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan melanjutkan koreksi UI/UX Catat kas dari implementasi Hybrid Cash Desk yang arah komposisinya sudah disetujui, dengan memperbaiki bug dialog/fokus/datepicker, menyatukan renderer slip, menegakkan geometry 44 px touch dan 32 px compact secara terukur, serta menutup evidence gap browser tanpa membuka ulang host finance atau invariant backend/composable/service.`

## Premis utama

Arah komposisi Catat kas sekarang **sudah sesuai prototype** `.hermes/r4-experiments/direct-hybrid-cash-desk.html`. Jangan memulai ulang arah desain, jangan kembali ke `KasInput.vue`, dan jangan membuat hero/card intro baru.

Namun implementasi sekarang **belum UI/UX verified**. Unit test, build, dan mutation journey pernah hijau, tetapi audit fresh menemukan bug P0/P1, inconsistency density/style, duplikasi slip, dan browser evidence yang overclaim.

Task sesi baru adalah:

1. memperbaiki bug dan inconsistency yang sudah diaudit;
2. mempertahankan komposisi Hybrid Cash Desk yang sudah disetujui;
3. menyelaraskan style/density dengan menu Transaksi, header, dan sidebar approved;
4. memperketat browser evidence sampai membuktikan geometry dan interaksi nyata;
5. tidak mengubah invariant backend/composable/service.

## Status host dan ownership yang FINAL

### Host finance sudah benar

- `src/views/admin/FinanceV2.vue` adalah owner nav workflow finance.
- `src/views/admin/finance/DirectTransactionView.vue` adalah owner heading dan intro:
  - `Pencatatan kas`
  - `Catat kas`
  - `Untuk pemasukan atau pengeluaran rutin yang langsung menjadi transaksi disetujui, tanpa alur proposal.`
- Jangan menambahkan hero, intro card, explainer, atau context panel baru di `DirectCashDesk.vue`.
- Jangan membuka ulang host kecuali browser membuktikan bug nyata.

### Active presentation

- Active route memakai `src/components/admin/kas/DirectCashDesk.vue`.
- `KasInput.vue` hanya legacy bridge dan bukan baseline visual active route.
- Jangan memindahkan active redesign kembali ke `KasInput.vue`.

### Ownership desain

- `.hermes/r4-experiments/direct-hybrid-cash-desk.html` = source of truth composition/task surface Catat kas.
- `FinanceV2.vue`, `TransactionsView.vue`, `TransactionWorkspace.vue`, `AdminLayoutV2.vue`, dan `AdminSidebar.vue` = pagar style system: token, density, radius, border, spacing, typography, dan interaction language.
- Jangan copy composition Transaksi ke Catat kas.
- Jangan biarkan improvisasi baru mengganti composition prototype.

## Trace yang wajib dipertahankan

Write path:

`FinanceV2`
`→ DirectTransactionView`
`→ DirectCashDesk`
`→ useKas.handleDirectInput`
`→ buildDirectTransactionPayload / kasService.submitDirectTransaction`
`→ POST /api/admin/transaction/add-direct`
`→ parseDirectTransaction`
`→ transaction service claim-first INSERT + audit + idempotency finalize`
`→ D1 kas_masjid / transaction_audit_events / transaction_idempotency_keys`

Read/refresh path:

`TransactionsView`
`→ TransactionWorkspace`
`→ useKas transactions`
`→ kasService.getTransactions`
`→ GET /api/admin/transaction/list`
`→ getAllTransactions`
`→ D1`

Jangan fork service, composable, backend, route, DTO, idempotency, RBAC, audit, atau summary policy.

## Contract visual/interaksi yang harus dipertahankan

- Arus kas adalah keputusan pertama dan paling dominan.
- Semantic radio tetap ada, visualnya dua switch-card besar tanpa circle/check klasik.
- Nominal menjadi fokus berikutnya.
- `Keperluan` wajib dan menjadi headline slip.
- `Keterangan tambahan` opsional dan tidak merender section kosong.
- Seksi pelapor tetap progressive disclosure opsional.
- Mobile/tablet `<1280`: tidak ada live slip inline; slip lengkap muncul di Dialog konfirmasi.
- Wide desktop `>=1280`: persistent live slip; Dialog dengan slip identik tetap owner mutation final.
- Bila tablet kelak menampilkan live slip karena benar-benar muat, keputusan harus berdasarkan measured usable width, bukan nama device. Jangan mengubah breakpoint tanpa evidence dan persetujuan user.
- Mobile/tablet/iPad `<1280`: touch controls sekitar 44 px.
- Wide desktop `>=1280`: compact controls sekitar 32 px.
- Flow card dan nominal boleh menjadi documented content-rich exceptions; jangan memaksa keseluruhan card menjadi 32 px bila kontennya dua baris/bernominal besar.
- Pending mengunci Escape, outside, Cancel, dan double-submit.
- 409/5xx/network setelah pending:
  - Dialog menutup setelah pending selesai;
  - input tetap utuh;
  - idempotency key payload-bound tetap sama;
  - fokus kembali ke trigger stabil;
  - retry aman.
- Success mereset input dan refresh list/summary tanpa transaksi ganda.

## Temuan audit fresh — wajib diperbaiki

### P0 — Dialog tidak dapat dibatalkan

File: `src/components/admin/kas/DirectCashDesk.vue`

`isLoading` berasal dari composable sebagai Ref, tetapi dalam script `closeConfirmDialog()` memeriksa `if (isLoading)`. Objek Ref selalu truthy.

Dampak:
- tombol Batal no-op;
- Escape/outside idle berujung jalur close yang no-op;
- focus restoration cancel tidak berjalan.

Perbaikan harus memakai nilai Ref yang benar (`isLoading.value`) atau normalisasi state typed yang setara. Tambahkan browser RED untuk Cancel, Escape idle, dan outside idle sebelum patch.

### P1 — Shared CTA ref rapuh saat resize

CTA mobile/tablet dan desktop memakai `ref="submitButton"` yang sama pada branch berbeda. Resize melewati 1280 dapat mengosongkan ref atau mengarahkannya ke node tersembunyi/unmounted.

Perbaiki dengan stable trigger ownership:
- ref terpisah per branch + resolver berdasarkan branch visible; atau
- satu stable focus anchor yang selalu mounted;
- watcher/cleanup bila Dialog terbuka saat resize.

Browser-test resize `<1280 ↔ >=1280` dengan Dialog open, setelah Cancel, dan setelah 409/503.

### P1 — Slip Dialog dan live desktop diduplikasi

Slip ditulis manual dua kali di `DirectCashDesk.vue`.

Ekstrak satu komponen presentasi domain, misalnya `DirectCashSlip.vue`, dengan props typed untuk:
- title/keperluan;
- amount;
- flow dan tone;
- category;
- date;
- section;
- optional description;
- readiness/status copy bila tetap dipakai.

Render komponen yang sama di Dialog dan desktop aside. Jangan pindahkan business logic ke komponen slip.

### P1 — Urutan first-error salah

Validation/focus saat ini memprioritaskan Kategori, sedangkan reading order visual adalah:

1. nominal;
2. keperluan;
3. tanggal;
4. kategori;
5. keterangan.

Ubah urutan validasi/focus agar first invalid control mengikuti reading order aktual. Browser test lama yang mengunci Kategori sebagai error pertama harus diperbaiki menjadi RED/GREEN yang benar.

### P1 — DatePicker kehilangan native label association

Caller memberi `:id="field.id"`, tetapi `DatePicker.vue` tidak mendeklarasikan/memasang `id` pada trigger button.

Perbaiki contract DatePicker:
- prop `id?: string`;
- pasang `:id="id"` pada trigger DOM nyata;
- pertahankan `aria-labelledby`, `aria-describedby`, invalid state;
- klik label harus memfokuskan/membuka trigger sesuai perilaku yang dipilih;
- jangan bind identity ke root Popover non-DOM.

Audit juga API `size`/`class`; jangan menambah API yang tidak dipakai atau tetap mengandalkan override yang tidak dapat dibuktikan.

### P1 — Dialog mobile berisiko overflow

Dialog slip saat ini tidak memiliki max-height/scroll contract. Pada 360×800 + description panjang, footer dapat keluar viewport.

Perbaiki dengan canonical Dialog composition:
- bounded viewport height;
- content scroll yang jelas;
- footer tetap reachable;
- 44 px controls pada mobile/tablet;
- 32 px controls pada wide desktop bila konsisten dengan Dialog baseline;
- focus trap, Escape, outside, Cancel, pending lock, dan focus restoration tetap benar.

Jangan hanya menambah `overflow-y-auto` tanpa mengukur header/body/footer geometry.

### P1 — Density 44/32 belum koheren

Jangan mengklaim density dari utility source. Ukur computed browser boxes.

Target:
- `<1280`: interactive controls sekitar 44 px;
- `>=1280`: compact single-line controls sekitar 32 px;
- documented exceptions: flow cards, nominal amount surface, textarea, dan information-rich controls.

Audit minimal:
- flow radio tap surface;
- nominal input surface;
- Keperluan input;
- DatePicker trigger;
- Kategori Select trigger;
- disclosure trigger;
- Seksi Select trigger;
- CTA review;
- Dialog Cancel/Confirm;
- DatePicker popup prev/next/day controls.

Catatan source saat ini:
- flow card tidak mungkin 32 px karena ikon + dua baris;
- nominal besar juga bukan control 32 px;
- Keperluan Input dan Textarea belum compact pada desktop;
- Dialog buttons masih default 44 px pada desktop;
- Select/DatePicker memakai campuran `min-h-11`, `size="sm"`, `xl:h-8`, `xl:min-h-8` yang perlu disederhanakan.

### P1/P2 — Shell mengompakkan tablet terlalu dini

Audit independen menemukan `AdminLayoutV2.vue` dan `AdminSidebar.vue` memakai `md` untuk beberapa 32 px controls, sehingga tablet 768–1279 tidak mengikuti kontrak 44 px.

Jangan langsung membuka ulang shell secara luas. Lakukan:
1. browser measure exact 768 dan 1024;
2. konfirmasi apakah ini bug existing nyata terhadap contract aktif;
3. jika iya, patch sekecil mungkin pada breakpoint density shell yang relevan;
4. regression-test sidebar/header mobile, tablet, iPad, wide desktop;
5. jangan mengubah composition shell yang sudah approved.

### P2 — Visible focus radio belum terbukti

Radio `sr-only` harus menghasilkan visible focus pada card melalui `focus-within`/peer treatment canonical. Browser-test Tab/Arrow dan computed/visible ring, bukan hanya checked state.

### P2 — Kontras Pengeluaran belum terbukti

Source memakai token destructive, tetapi belum ada evidence computed contrast pada mode terang dan gelap.

Wajib:
- switch theme light/dark;
- ukur computed foreground/background active Pengeluaran;
- verifikasi enabled, hover, focus, disabled;
- gunakan token/system variant, bukan hardcoded warna lokal kecuali DESIGN.md memang mendefinisikan token khusus;
- jangan menganggap `dark:!bg-destructive` otomatis memperbaiki contrast.

### P2 — Status hijau bersaing dengan semantic flow

`Siap dicatat` selalu hijau, termasuk slip Pengeluaran. Evaluasi apakah readiness sebaiknya netral/primary agar tidak bersaing dengan merah flow. Pertahankan status non-color label.

### P2 — Radius, shadow, dan nested border drift

Harmonisasi dengan Transaksi approved:
- evaluasi `rounded-xl` outer desk vs baseline `rounded-lg/rounded-md`;
- kurangi shadow pada flow/nominal/slip bila border/muted surface cukup;
- kurangi nested border yang tidak menambah hierarchy;
- jangan mengubah silhouette Hybrid Cash Desk.

### P2 — Heading nominal redundan

Saat ini terdapat:
- `Nominal transaksi`;
- FormField `Nominal`;
- description tambahan.

Sederhanakan hierarchy tanpa mengurangi label semantik. Nominal harus tetap dominan tetapi tidak verbose.

## Evidence gap — browser tests wajib diperketat

`tests/scripts/p05-browser-e2e.mjs` saat ini membuktikan mutation journey, tetapi belum membuktikan seluruh UI/UX.

Tambahkan browser evidence untuk:

1. computed geometry 44/32 di 360, 768, 1024, 1366;
2. documented exceptions dengan alasan dan measured boxes;
3. Cancel Dialog idle;
4. Escape Dialog idle;
5. outside dismissal idle;
6. pending lock untuk Escape/outside/Cancel/double-submit;
7. focus trap Tab/Shift+Tab;
8. focus return pada Cancel, 409, 503, dan resize;
9. Dialog seluruhnya muat/scroll-safe pada 360×800;
10. DatePicker open state, label association, initial focus, keyboard navigation, selection, Escape, focus return, mobile collision;
11. radio visible focus;
12. light/dark active Pengeluaran contrast;
13. long keperluan/category/description overflow di live slip dan Dialog;
14. resize `<1280 ↔ >=1280` dengan dan tanpa Dialog open;
15. console/page errors kosong setelah navigation dan significant interactions;
16. workflow nav/header/sidebar tetap normal pada seluruh matrix;
17. no document overflow.

Jangan hanya mengubah fixture agar hijau. Setiap perubahan locator harus didasarkan pada contract produk yang memang benar.

## Browser matrix wajib

- 360×800
- 768×1024
- 1024×1366
- 1366×900

Tambahan boundary yang relevan untuk resize:
- 1279×900
- 1280×900

Audit mode:
- light;
- dark;
- open DatePicker;
- open confirmation Dialog;
- pending Dialog;
- 409 recovery;
- 503/network recovery;
- long-content stress.

## File prioritas

Utama:
- `src/components/admin/kas/DirectCashDesk.vue`
- komponen slip baru di `src/components/admin/kas/` bila diekstrak
- `src/components/ui/datepicker/DatePicker.vue`
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Bila measured shell density membuktikan bug:
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`
- primitive sidebar/header terkait secukupnya

Acuan style:
- `src/views/admin/finance/TransactionsView.vue`
- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/views/admin/FinanceV2.vue`
- `DESIGN.md`

Jangan edit:
- `src/components/admin/kas/KasInput.vue` sebagai basis active redesign;
- backend/service/composable kecuali test membuktikan bug invariant nyata;
- Proposal full redesign di sesi ini.

## Urutan kerja wajib

1. `git status --short --branch`.
2. Baca disk aktual seluruh file target; working tree sangat dirty.
3. Tulis trace, target edit, risiko.
4. Tambah RED browser/source tests untuk bug P0/P1 sebelum patch.
5. Perbaiki dialog Cancel/idle dismiss.
6. Perbaiki stable focus ownership dan resize.
7. Ekstrak shared slip renderer.
8. Perbaiki first-error reading order.
9. Perbaiki DatePicker id/label dan open-state behavior.
10. Tegakkan geometry contract terukur; dokumentasikan exception.
11. Perbaiki Dialog mobile scroll/geometry.
12. Audit contrast light/dark dan visible focus.
13. Harmonisasi radius/shadow/border tanpa mengubah silhouette prototype.
14. Jalankan targeted tests setelah setiap kelas perbaikan.
15. Jalankan browser matrix + boundary 1279/1280.
16. Jalankan final gates fresh setelah edit terakhir.
17. Minta independent review fresh; fix blocker lalu review ulang.
18. Update dokumentasi aktif hanya setelah behavior final terbukti.
19. Jangan commit/push kecuali diminta.

## Gates minimum sebelum closure

- targeted source tests;
- `npm run test`;
- `npm run build`;
- `npm run test:e2e:browser`;
- `git diff --check`;
- bila backend/contract/runtime disentuh: `npm run test:migrations`, `npm run test:critical-flow:d1`, dan real Vite→Hono request.

Jangan klaim UI/UX verified hanya karena mutation journey hijau.

## Definition of Done

Task selesai hanya jika:

- arah Hybrid Cash Desk tetap utuh dan user tidak melihat drift composition;
- host finance/header/sidebar tidak dibuka ulang secara visual;
- Dialog dapat Cancel/Escape/outside saat idle dan terkunci saat pending;
- focus ownership stabil pada mobile, desktop, dan resize;
- Dialog dan desktop memakai satu renderer slip identik;
- first-error mengikuti reading order;
- DatePicker mempunyai label association dan open-state behavior yang benar;
- 44/32 geometry dibuktikan browser, dengan exception terdokumentasi;
- Dialog mobile scroll-safe;
- contrast Pengeluaran lulus terang/gelap;
- radio mempunyai visible keyboard focus;
- long content tidak overflow;
- console/page errors kosong;
- 409/503/idempotency/success behavior tetap aman;
- full test/build/browser/diff gates lulus fresh;
- independent review tidak menemukan blocker;
- dokumentasi aktif sinkron;
- no commit/no push kecuali user meminta.

## Status validasi terakhir sebelum handoff

Sebelum audit koreksi ini, command berikut pernah lulus pada working tree:

- `npm run test`: 170/170 pass;
- `npm run build`: pass;
- `npm run test:e2e:browser`: pass untuk mutation journey pada 360×800, 768×1024, 1024×1366, 1366×900;
- `git diff --check`: pass dengan warning LF→CRLF existing.

Tetapi evidence tersebut **tidak menutup temuan audit di atas**. Sesi baru wajib menambah RED/measurement baru, bukan mengandalkan gate lama.

## Working tree dan Git safety

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- Working tree sangat dirty dengan banyak perubahan existing dan file untracked.
- Jangan reset, stash, clean, checkout, atau membuang perubahan existing.
- Jangan broad-stage (`git add -A`).
- Jangan commit/push tanpa permintaan eksplisit user.
- Exclude `.hermes/**`, artifacts/probes/screenshots lokal, `document.documentElement.clientWidth`, dan `x.name)` dari staging.

## Format laporan akhir

```text
Ringkasan:
- ...

Trace:
- ...

Perubahan utama:
- ...

Browser evidence:
- 360×800: ...
- 768×1024: ...
- 1024×1366: ...
- 1279×900 ↔ 1280×900 resize: ...
- 1366×900: ...
- light/dark: ...
- DatePicker open: ...
- Dialog idle/pending/recovery: ...

Validasi:
- command: result

Dampak keamanan/data:
- ...

Dokumentasi:
- ...

Risiko residual:
- ...

Git:
- no commit / no push
```

---

Catatan penutup paling penting:

Arah prototype sekarang sudah benar. Jangan mereset desain atau menambah framing baru. Sesi berikut harus bersifat **correction + verification**, bukan restart visual dan bukan pembelaan berbasis test hijau lama.
