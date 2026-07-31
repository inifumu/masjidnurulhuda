# Handoff Historis — Eksperimen Prototype Desain Ulang Catat Kas (Superseded)

> **SUPERSEDED:** user telah memilih Entry Spine dan implementation live berada di `DirectCashDesk.vue`. R4 kini berlanjut ke redesign Persetujuan; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif.

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan melanjutkan eksplorasi prototype desain ulang Catat kas dari working tree saat ini, dengan menganggap seluruh prototype sebelumnya ditolak, menjaga invariant behavior yang sudah benar, dan mencari hierarchy entry yang kreatif, terarah, padat, serta nyaman seperti kualitas menu Transaksi tanpa menyalin komposisi list-detail Transaksi.`

## Status task saat handoff

Task aktif adalah **eksperimen prototype**, bukan promosi production dan bukan penutupan gate.

User belum menyetujui satu pun arah prototype terbaru. Jangan menyebut prototype mana pun sebagai approved, winner, baseline, hampir final, atau tinggal dipoles.

Production route masih memakai:

- `src/views/admin/FinanceV2.vue` sebagai host workflow finance;
- `src/views/admin/finance/DirectTransactionView.vue` sebagai owner heading/intro;
- `src/components/admin/kas/DirectCashDesk.vue` sebagai active task surface;
- `src/components/admin/kas/DirectCashSlip.vue` sebagai shared renderer review/slip.

`src/components/admin/kas/KasInput.vue` adalah legacy bridge dan **bukan** baseline active route.

## Feedback user terbaru — source of truth

User menilai Catat kas aktif dan semua eksperimen terakhir masih tidak sesuai selera.

Masalah yang dirasakan saat preview desktop:

- hierarchy tidak sekuat menu Transaksi;
- typography tidak senyaman dan serapi menu Transaksi;
- ruang terasa sepi, terputus, atau berantakan;
- fokus visual tidak terarah;
- versi yang dibuat terlalu padat terasa `gepeng`;
- beberapa eksperimen terlalu literal menyalin komposisi Transaksi;
- beberapa eksperimen sebelumnya terlalu polos/custom dan tidak terasa seperti shadcn-vue;
- Card, rail, summary band, atau slip yang ditambah belum otomatis menyelesaikan hierarchy;
- user menginginkan kreativitas, bukan clone Transaksi dan bukan field-stack generik.

Interpretasi wajib:

- Ambil **kualitas sistem** Transaksi: type scale, compact density 32 px, alignment, tight but breathable spacing, border/radius, muted surfaces, state language, dan shadcn-vue primitive family.
- Jangan ambil **komposisi** Transaksi: summary kas, list-detail, fixed-height workspace, atau dossier pane secara literal.
- Catat kas harus mempunyai gesture entry yang khas dan fokus task yang jelas.
- Jangan kembali membela hasil dengan test hijau.

## Seluruh prototype berikut DITOLAK

Semua file berikut hanya histori eksperimen dan tidak boleh dijadikan baseline atau direkomendasikan ulang tanpa perubahan struktural total:

- `.hermes/r4-experiments/direct-hybrid-cash-desk.html`
- `.hermes/r4-experiments/catat-kas-editorial-ledger.html`
- `.hermes/r4-experiments/catat-kas-command-canvas.html`
- `.hermes/r4-experiments/catat-kas-shadcn-structured-desk.html`
- `.hermes/r4-experiments/catat-kas-shadcn-review-rail.html`
- `.hermes/r4-experiments/catat-kas-transaction-density.html`
- `.hermes/r4-experiments/catat-kas-shadcn-cash-journal.html`

Kegagalan yang harus dipelajari:

1. **Hybrid Cash Desk lama** — task model berguna, tetapi presentation akhir terasa sepi dan kurang terarah.
2. **Editorial Ledger / Command Canvas** — terlalu custom/polos, bukan visual grammar shadcn-vue.
3. **Shadcn Structured Desk** — menggunakan kosakata shadcn tetapi masih generic Card + field stack; hierarchy belum khas.
4. **Shadcn Review Rail** — rail memberi bobot tetapi masih terasa sebagai solusi tempelan, bukan composition yang matang.
5. **Transaction Density** — terlalu literal menyalin summary/workspace/dossier Transaksi; padat tetapi `gepeng` dan tidak kreatif.
6. **Shadcn Cash Journal** — mencoba karakter receipt/journal tetapi tetap belum sesuai selera; jangan diasumsikan dekat dengan approval.

## Goal sesi berikutnya

Buat eksperimen baru yang:

- terasa padat tetapi tidak gepeng;
- mempunyai breathing room yang fungsional, bukan ruang kosong;
- mengarahkan mata dengan jelas dari keputusan → nominal → identitas transaksi → detail → review;
- menggunakan style dan component language shadcn-vue proyek;
- tetap kreatif dan mempunyai identitas Catat kas sendiri;
- tidak menyerupai form enterprise generik;
- tidak menyerupai list-detail Transaksi;
- tidak menggunakan native/custom controls polos;
- tidak mengandalkan satu dark rail, summary band, atau Card tambahan sebagai solusi otomatis.

## Behavior/task model yang tetap dipertahankan

Walaupun visual direction dibuka ulang, jangan mengubah invariant berikut:

- arus kas adalah keputusan pertama;
- arus tetap semantic native radio/radiogroup;
- nominal menjadi fokus utama berikutnya;
- `Keperluan` wajib dan menjadi identitas/headline transaksi;
- `Keterangan tambahan` opsional;
- seksi pelapor adalah progressive disclosure opsional;
- `<1280`: tidak ada persistent live review; final review berada di Dialog;
- `>=1280`: persistent review boleh ada hanya bila composition baru membutuhkannya dan tidak terasa seperti clone dossier;
- final mutation tetap dimiliki Dialog;
- pending mengunci Escape, outside, Cancel, dan double-submit;
- 409/503/network mempertahankan input dan idempotency key, menutup Dialog setelah pending, serta mengembalikan fokus;
- success reset + refresh tanpa transaksi ganda.

## Trace behavior yang tidak boleh difork

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

Jangan fork backend, service, composable, DTO, RBAC, audit, idempotency, state machine, atau summary policy untuk eksperimen visual.

## Baseline component/style donor

Gunakan source aktual berikut sebagai donor **style system**, bukan layout template:

- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/views/admin/finance/TransactionsView.vue`
- `src/views/admin/FinanceV2.vue`
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`
- `DESIGN.md`

Hal yang boleh diadopsi dari Transaksi:

- `Card`, `CardHeader`, `CardContent` rhythm;
- `Button`, `DropdownMenu`, `Input`, `Textarea`, `Collapsible`, `Dialog`, `Badge/Status`, `Separator` visual language;
- desktop control density 32 px;
- touch/tablet density 44 px;
- typography: metadata 11–12 px, label 12–13 px, title 15–18 px, angka tabular dengan hierarchy terukur;
- gap desktop sekitar 8–16 px sesuai grouping;
- border-first dan muted surfaces;
- focus/open/checked/pending states canonical.

Hal yang dilarang disalin:

- summary posisi kas;
- activity list;
- list-detail grid;
- fixed-height `36rem` workspace;
- dossier detail Transaksi;
- filter surface;
- timeline composition.

## Aturan primitive — eksplisit

Prototype baru harus memperlihatkan style shadcn-vue, bukan Reka mentah atau HTML native polos.

Gunakan kosakata visual dari primitive canonical proyek:

- `Card`, `CardHeader`, `CardContent` bila Card memang menambah hierarchy;
- `Button` variants canonical;
- `DropdownMenu + DropdownMenuRadioGroup/RadioItem` untuk kategori dan seksi;
- `Input` untuk Keperluan;
- canonical DatePicker trigger language;
- `Textarea` untuk keterangan;
- `Collapsible` untuk seksi pelapor;
- `Dialog` untuk review final;
- `Badge/StatusIndicator` hanya bila status benar-benar perlu;
- `Separator` hemat dan berdasarkan grouping.

Jangan:

- memakai legacy `Select` pada active Catat kas;
- memakai custom native dropdown yang hanya menyerupai button;
- memakai field polos tanpa border/focus state canonical;
- memakai Reka primitive mentah sebagai visual source;
- menambah Card di setiap blok;
- menambah garis/pembungkus untuk setiap fakta;
- memakai shadow sebagai pengganti hierarchy.

## Fakta production terbaru yang sudah diperbaiki

Disk aktual telah memiliki koreksi behavior dan component consistency berikut; audit ulang sebelum menyentuhnya:

- bug `if (isLoading)` diperbaiki menjadi `isLoading.value`;
- CTA mobile dan desktop mempunyai ref terpisah + resolver visible branch;
- focus restoration ada untuk Cancel, Escape, outside, 409, 503, dan success;
- first-error mengikuti nominal → keperluan → tanggal → kategori → keterangan;
- DatePicker mempunyai `id` pada trigger DOM dan target focus;
- Dialog bounded/scroll-safe;
- Dialog dan desktop memakai `DirectCashSlip.vue` yang sama;
- active Catat kas tidak lagi mengimpor `@/components/ui/select`;
- kategori dan seksi memakai `DropdownMenuRadioGroup/RadioItem`, mengikuti component family Transaksi;
- shell density tablet dikoreksi agar compact baru pada `xl`;
- source/browser tests telah dimigrasikan untuk button/menuitemradio contract.

Jangan rollback koreksi tersebut hanya karena visual prototype dibuka ulang.

## Evidence terakhir sebelum fase prototype terbaru

Fresh evidence terakhir setelah production correction/component migration:

- `npm run test`: **172/172 pass**;
- `npm run build`: **pass**;
- `npm run test:e2e:browser`: **pass** pada 360×800, 768×1024, 1024×1366, 1366×900;
- journey direct: Cancel/Escape/outside idle, pending guard, double-submit, 409 → 503 → success, idempotency reuse, focus restoration, overflow: pass;
- `git diff --check`: pass, warning LF→CRLF existing;
- independent review kedua atas correction sebelumnya: PASS.

Evidence tersebut menjadi regression baseline behavior, bukan bukti bahwa desain visual sekarang diterima.

Prototype disposable yang dibuat setelah evidence itu hanya dibuka via browser secara individual. Full test/build tidak perlu diulang untuk file `.hermes/r4-experiments/*.html` karena tidak masuk build graph.

## Urutan kerja sesi berikutnya

1. Jalankan `git status --short --branch`.
2. Baca handoff ini dan disk aktual file active/donor.
3. Jangan membaca handoff lama sebagai instruksi aktif; gunakan hanya bila butuh histori.
4. Ambil screenshot/browser visual menu Transaksi aktif pada 1366×900 dan 1024×1366 untuk mengukur hierarchy aktual.
5. Audit bukan hanya box size, tetapi:
   - baseline typography;
   - visual weight;
   - whitespace ownership;
   - alignment columns;
   - cadence dari header ke content;
   - balance desktop.
6. Rumuskan 2–3 prinsip composition baru sebelum menulis HTML.
7. Buat **maksimal dua** prototype baru yang berbeda secara task composition, bukan warna/radius.
8. Tempatkan prototype dalam shell/workflow context yang sama.
9. Gunakan shadcn-vue visual grammar secara nyata.
10. Browser-review minimal 768×1024, 1024×1366, 1366×900; mobile 360×800 untuk memastikan degradation masuk akal.
11. Buka transient state: kategori menu, seksi disclosure, dan confirmation Dialog.
12. Berikan perbandingan jujur dan tunggu pilihan user.
13. Jangan promosikan ke production sebelum user secara eksplisit memilih/menyetujui.
14. Jangan menjalankan full application gates untuk perubahan prototype-only.
15. Setelah direction dipilih, lakukan TDD promotion, browser matrix, full gates, dan independent review.

## Quality bar prototype berikutnya

Prototype hanya layak ditunjukkan jika:

- desktop tidak terasa sepi;
- desktop tidak terasa gepeng;
- mata mempunyai satu jalur fokus utama;
- typography mempunyai minimal tiga level hierarchy yang jelas tetapi tidak gaduh;
- 32 px controls terlihat nyaman, bukan miniatur;
- grouping terbaca tanpa Card/outline berlebihan;
- review terintegrasi dengan task, bukan panel tempelan;
- tablet tidak sekadar desktop yang kehilangan aside;
- open dropdown/dialog terlihat seperti bagian dari sistem yang sama;
- tidak ada document overflow atau text clipping;
- tidak ada elemen penting yang hanya tersedia melalui hover.

## Working tree dan Git safety

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- Working tree sangat dirty dengan tracked dan untracked changes existing.
- Jangan reset, stash, clean, checkout, atau membuang perubahan existing.
- Jangan broad-stage (`git add -A`).
- Jangan commit/push tanpa permintaan eksplisit user.
- `.hermes/**`, artifacts, probes, screenshots, `document.documentElement.clientWidth`, dan `x.name)` jangan di-stage.

## File prioritas sesi berikutnya

Read-only selama prototype exploration:

- `src/components/admin/kas/DirectCashDesk.vue`
- `src/components/admin/kas/DirectCashSlip.vue`
- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/views/admin/finance/DirectTransactionView.vue`
- `src/views/admin/FinanceV2.vue`
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`
- `DESIGN.md`

Write prototype hanya di:

- `.hermes/r4-experiments/`

Setelah approval baru boleh menyentuh:

- `src/components/admin/kas/DirectCashDesk.vue`
- komponen domain Catat kas baru bila extraction benar-benar diperlukan;
- test terkait.

## Prompt penutup paling penting

Seluruh prototype terdahulu ditolak. Jangan memulai sesi dengan memilih “yang paling dekat” dari prototype lama. Mulai dari diagnosis hierarchy dan task composition baru.

Target bukan clone Transaksi, bukan Hybrid Cash Desk lama, bukan generic shadcn form, dan bukan receipt gimmick. Targetnya adalah Catat kas yang punya identitas entry sendiri, tetapi setara dengan menu Transaksi dalam kualitas typography, density, kerapian, dan arah fokus.

## Format laporan prototype

```text
Trace visual:
- donor style → prinsip yang diambil
- composition Catat kas → alasan task-specific

Prototype:
- nama/path
- stance
- desktop hierarchy
- tablet adaptation
- transient state

Browser evidence:
- 360×800: ...
- 768×1024: ...
- 1024×1366: ...
- 1366×900: ...
- open dropdown/dialog: ...
- overflow/errors: ...

Perbandingan:
- ...

Rekomendasi:
- ...

Production:
- belum diubah

Git:
- no commit / no push
```
