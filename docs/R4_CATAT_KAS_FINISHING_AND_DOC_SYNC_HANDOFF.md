# Handoff Historis — Sinkronisasi Dokumentasi dan Audit Lanjutan Catat Kas Entry Spine

> **SUPERSEDED:** corrective Catat kas telah ditutup dan workstream R4 berlanjut ke audit/prototype Proposal. Gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif. Isi berikut dipertahankan hanya sebagai histori evidence Catat kas.

Jangan salin atau jalankan isi dokumen ini sebagai prompt aktif.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan melanjutkan sinkronisasi instruksi kerja dan dokumentasi proyek terhadap Catat kas Entry Spine yang sudah dipilih dan diimplementasikan live, lalu mengaudit lanjutan route aktual pada mobile, tablet, dan desktop untuk menemukan bug, inconsistency, atau anomaly tanpa membuka ulang composition yang sudah dipilih tanpa evidence baru.`

## Status task saat handoff

- Catat kas Entry Spine sudah dipilih user dan diimplementasikan pada route live.
- Ini bukan fase prototype dan bukan permintaan desain ulang dari scratch.
- Fokus sesi berikutnya:
  1. verifikasi semua instruksi/dokumentasi aktif konsisten dengan source aktual;
  2. cari pointer handoff lama yang masih menganggap Hybrid Cash Desk/prototype sebagai baseline aktif;
  3. audit lanjutan rendered Catat kas untuk bug, inconsistency, dan anomaly;
  4. patch hanya defect yang terbukti;
  5. pertahankan seluruh invariant finansial.
- Jangan menyebut seluruh R4 selesai; workflow finance lain masih `In Progress`.
- Jangan commit/push tanpa permintaan eksplisit user.

## Source of truth aktif

Production route:

`/admin/finance/transaksi-langsung`

Ownership:

- `src/views/admin/FinanceV2.vue` — host dan workflow navigation;
- `src/views/admin/finance/DirectTransactionView.vue` — page heading/intro/loading/error;
- `src/components/admin/kas/DirectCashDesk.vue` — task surface canonical Entry Spine;
- `src/components/admin/kas/DirectCashSlip.vue` — renderer review final di Dialog;
- `src/components/admin/kas/KasInput.vue` — legacy bridge, bukan baseline active route.

Composition live:

`arus kas → nominal → identitas transaksi → detail opsional → closure review → Dialog final`

Contract visual yang sudah dipilih:

- tanpa guide task order/stepper `1/2/3`;
- tanpa persistent live slip/dossier;
- review dan mutation final hanya dimiliki Dialog;
- Keperluan adalah headline transaksi;
- Keterangan tambahan opsional;
- seksi pelapor progressive disclosure;
- kategori dan seksi memakai `DropdownMenuRadioGroup/RadioItem`;
- control 44 px pada mobile/tablet dan compact mulai `xl`;
- jarak label-control Keperluan/Tanggal/Kategori: 12 px pada `<1280`, 10 px pada `>=1280`;
- default FormField screen lain tetap 8 px.

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

Jangan fork backend, DTO, composable, RBAC, ownership, audit, idempotency, state machine, summary policy, atau migration untuk koreksi visual.

## Koreksi live yang sudah diterapkan

- Entry Spine menggantikan Hybrid Cash Desk/persistent slip.
- Header intro tetap satu kolom sampai `xl` agar tidak membungkus buruk pada tablet.
- Flow selector memakai explicit `minmax(0,1fr)` agar opsi Pengeluaran tidak terpotong diam-diam.
- Satu CTA `Tinjau & simpan` stabil pada semua breakpoint.
- CTA review memakai ikon `Eye`; mutation final memakai satu ikon `Save`.
- Toast validation lama ditutup sebelum Dialog final dibuka.
- Dialog bounded dan scroll-safe; pending mengunci Escape/outside/Cancel/double-submit.
- 409/503 mempertahankan input dan idempotency key serta mengembalikan fokus.
- Success reset + refresh tanpa transaksi ganda.
- Screenshot transient harus diambil setelah animasi settle; screenshot terlalu dini pernah menghasilkan false positive transparansi/ghosting.
- Workflow tab parsial pada usable width sempit adalah intentional horizontal-scroll cue; bedakan dari document overflow.

## Evidence terakhir

Evidence source-live setelah edit terakhir:

- browser E2E Chromium 360×800, 768×1024, 1024×1366, 1366×900: pass;
- role journey: pass;
- semantic radio keyboard: pass;
- first-error focus: pass;
- flow geometry berada dalam Entry Spine: pass;
- Dropdown/Dialog settled, bounded, opak: pass;
- Cancel/Escape/outside focus restoration: pass;
- pending lock + double-submit satu POST: pass;
- retry `409 → 503 → success` dengan idempotency key stabil: pass;
- consequence copy Dialog dapat discroll penuh: pass;
- document overflow: pass;
- `npm run test`: 173/173 pass;
- `npm run build`: pass;
- real Vite→Hono API request tanpa cookie: `401 application/json`;
- independent review sebelumnya: PASS;
- `git diff --check`: pass, warning LF→CRLF existing dapat muncul.

Fresh verification wajib diulang setelah edit sesi baru; jangan mengandalkan angka ini bila source berubah.

## File dokumentasi/instruksi yang sudah disinkronkan

- `.hermes.md`
- `AGENTS.md`
- `SYSTEM_MAP.md`
- `ROADMAP.md`
- `README.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/R4_CATAT_KAS_PROTOTYPE_EXPERIMENT_HANDOFF.md` ditandai superseded

Audit ulang pointer berikut karena bisa masih memuat histori Hybrid/prototype:

- `docs/R4_CATAT_KAS_REDESIGN_RESTART_HANDOFF.md`
- `docs/R4_CATAT_KAS_UI_UX_CORRECTION_HANDOFF.md`
- `docs/R4_CATAT_KAS_SUBMENU_RESTART_HANDOFF.md`
- `docs/R4_DIRECT_TRANSACTION_IMPLEMENTATION_HANDOFF.md`
- `docs/R4_FINANCE_WORKFLOWS_HANDOFF_PROMPT.md`
- `docs/R2_SESSION_HANDOFF_PROMPT.md`
- `docs/R3_SESSION_HANDOFF_PROMPT.md`

Dokumen historis boleh mempertahankan fakta lama, tetapi header/pointer-nya harus jelas `SUPERSEDED` dan tidak boleh menyebut dirinya handoff aktif.

## Audit lanjutan wajib

Mulai dari source live, bukan screenshot lama:

1. Jalankan `git status --short --branch`.
2. Baca `.hermes.md`, `SYSTEM_MAP.md`, bagian R4 `ROADMAP.md`, handoff ini, dan source active route.
3. Audit `git diff` hanya file scope sebelum edit; working tree sangat dirty.
4. Jalankan Vite source-live pada port tersedia dan arahkan browser fixture melalui `P05_BROWSER_BASE_URL` eksplisit.
5. Audit 360×800, 768×1024, 1024×1366, 1366×900.
6. Periksa closed form, invalid state, category menu, section disclosure, DatePicker, Dialog, pending, 409, 503, success.
7. Tunggu minimal hingga animasi transient settle sebelum screenshot/geometry.
8. Ukur, jangan hanya menilai visual:
   - label.bottom → control.top;
   - flow right ≤ Entry Spine right;
   - control density 44/32;
   - Dialog bounds dan scroll ownership;
   - document/body overflow;
   - focus restoration;
   - console/page errors.
9. Uji long Keperluan, long Keterangan, kategori/seksi panjang, nominal multi-miliar dalam batas contract, zoom/text scaling bila feasible, dark mode, sidebar expanded/collapsed, dan resize lintas 1279/1280.
10. Untuk setiap bug nyata, tulis RED regression test dulu, lalu patch root cause minimal.
11. Jangan patch primitive global berdasarkan screenshot animasi yang belum settle.
12. Setelah edit terakhir, rerun browser matrix, `npm run test`, `npm run build`, real Vite→Hono API request, dan `git diff --check`.
13. Minta independent review baru karena verdict lama stale setelah edit.

## Kandidat audit, bukan bug yang sudah dipastikan

- virtual keyboard pada perangkat fisik belum diuji;
- dark mode dan text zoom 200% perlu evidence fresh bila belum ada pada sesi baru;
- resize exact 1279→1280 perlu memastikan density/gap berpindah tanpa layout shift buruk;
- category/section label panjang perlu membuktikan truncate/wrap dan popup collision;
- error text simultan pada Keperluan/Tanggal/Kategori perlu memastikan alignment dan CTA closure tidak terdorong secara janggal;
- screen reader announcement untuk inline error dan Dialog title perlu diverifikasi bila tooling tersedia.

Jangan menyebut kandidat ini bug sebelum direproduksi.

## Working tree dan Git safety

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- Working tree sangat dirty dengan tracked/untracked changes existing.
- Jangan reset, stash, clean, checkout, atau membuang perubahan existing.
- Jangan broad-stage (`git add -A`).
- Jangan commit/push tanpa permintaan eksplisit user.
- `.hermes/**`, screenshots, probes, `document.documentElement.clientWidth`, dan `x.name)` tidak boleh di-stage.
- Jangan membaca atau mencetak `.env`, `.dev.vars`, cookies, token, atau secret.

## Format trace awal sesi baru

```text
Trace:
- FinanceV2 → DirectTransactionView → DirectCashDesk → useKas.handleDirectInput → kasService → Hono route/service → D1

Target:
- sinkronisasi dokumen aktif dan/atau file UI yang memiliki defect terverifikasi

Risiko:
- sedang untuk presentation/accessibility;
- tinggi bila menyentuh mutation lifecycle, tetapi backend contract harus tetap tidak berubah
```

## Format laporan akhir

```text
Ringkasan:
- ...

Audit dokumentasi:
- file/pointer stale → koreksi

Audit browser:
- 360×800: ...
- 768×1024: ...
- 1024×1366: ...
- 1366×900: ...
- transient/pending/error/success: ...

Bug/inconsistency/anomaly:
- reproduced → root cause → patch → regression evidence

File berubah:
- path: alasan

Validasi:
- command: hasil

Dampak keamanan/data:
- ...

Risiko residual:
- ...

Git:
- no commit / no push
```

## Prompt penutup paling penting

Entry Spine adalah composition live yang dipilih user. Jangan membuka ulang pencarian prototype atau menghidupkan persistent dossier hanya karena ada ruang desktop. Audit lanjutan harus mencari defect nyata dan drift dokumentasi, bukan mendesain ulang tanpa permintaan. Test hijau bukan pengganti visual review, tetapi visual screenshot sebelum animasi settle juga bukan bukti bug. Gunakan source-live, geometry, interaction evidence, dan root-cause patching.
