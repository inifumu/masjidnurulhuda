# Handoff Historis — Restart Redesain Submenu Keuangan: Catat Kas

> **SUPERSEDED:** arahan Hybrid Cash Desk dalam dokumen ini bukan baseline aktif dan Entry Spine kini live. R4 kini berlanjut ke redesign Persetujuan; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif.

Isi berikut dipertahankan hanya sebagai histori keputusan dan tidak boleh dipakai sebagai prompt sesi aktif.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan memulai ulang redesign submenu keuangan Catat kas dari scratch berdasarkan prototype direct-hybrid-cash-desk yang sudah disetujui, dengan pondasi host workflow finance di FinanceV2.vue yang kini sudah diseragamkan, tanpa melanjutkan patch visual lama dan tanpa mengubah invariant backend/composable/service.`

## Konteks yang SUDAH diluruskan user

Ada salah paham penting pada sesi sebelumnya, dan ini harus dianggap final:

1. Problem utama sebelumnya bukan hanya body `KasInput.vue`, tetapi juga struktur host workflow finance.
2. User sudah meluruskan bahwa pondasi menu keuangan berada di `src/views/admin/FinanceV2.vue`.
3. Hero host berikut sudah DIHAPUS dari `FinanceV2.vue` dan jangan dihidupkan kembali:
   - `Keuangan masjid`
   - `Ruang kerja keuangan`
   - `Pilih workflow sesuai tugas...`
4. Submenu workflow finance sekarang menjadi tanggung jawab host `FinanceV2.vue` untuk semua route, termasuk `Transaksi`.
5. `Transaksi` menjadi baseline host yang benar. Child submenu lain harus mengikuti pola host ini, bukan sebaliknya.
6. Dengan pondasi host itu, masing-masing child submenu sekarang mulai langsung dari section masing-masing:
   - `Buku kas / Transaksi`
   - `Pencatatan kas / Catat kas`
   - `Pengajuan / Proposal saya`
   - `Keputusan / Persetujuan`
   - `Akuntabilitas / Riwayat audit`
7. User menegaskan bahwa sesi berikutnya fokus ke **memulai ulang redesign Catat kas**, bukan lagi membahas pondasi host workflow.

## Fokus sesi baru

Task sesi baru:

- mulai ulang redesign **submenu Catat kas** setelah pondasi workflow host finance selesai;
- gunakan acuan desain utama `.hermes/r4-experiments/direct-hybrid-cash-desk.html`;
- jangan drifting lagi ke prototype guide/workspace satunya;
- jangan melanjutkan patch incremental pada composition lama;
- tetap pertahankan invariant backend/composable/service yang sudah benar.

## Fakta penting tentang implementasi saat ini

### Pondasi host finance yang sudah benar

File:
- `src/views/admin/FinanceV2.vue`

Status sekarang:
- hero workspace finance sudah dihapus;
- nav workflow finance compact horizontal sudah menjadi pondasi semua route;
- style submenu mengikuti pola Transaksi;
- `Transaksi` juga dirender melalui `FinanceV2.vue`.

Ini sudah diverifikasi dan jangan dibuka ulang kecuali ada bug nyata.

### Jalur presentasi Catat kas aktif

File active route:
- `src/views/admin/finance/DirectTransactionView.vue`
- `src/components/admin/kas/DirectCashDesk.vue`

Pemisahan penting:
- `DirectCashDesk.vue` adalah file presentasi baru untuk Catat kas active route.
- `KasInput.vue` sengaja tidak lagi menjadi caller active route Catat kas agar arah redesign tidak drifting ke file lama.
- `KasInput.vue` masih dipakai legacy bridge dan jangan dijadikan baseline desain active route.

## Premis paling penting

Ini BUKAN task “polish sedikit lagi”.
Ini adalah task “mulai ulang redesign Catat kas dari scratch” di atas pondasi workflow finance yang sudah diluruskan.

Yang boleh dipertahankan dari implementasi Catat kas sekarang:
- contract domain `keperluan` / `keterangan`;
- migration additive + backfill;
- route/composable/service/backend orchestration;
- RBAC, ownership, idempotency, audit, approved/void invariant, summary policy;
- file presentasi active route tetap `DirectCashDesk.vue` (boleh di-rewrite total bila perlu);
- test/evidence yang benar-benar membuktikan invariant.

Yang TIDAK boleh dijadikan baseline:
- composition lama `KasInput.vue`;
- patch visual dari draft Catat kas sebelumnya;
- arah desain yang lebih dekat ke prototype guide/workspace selain direct-hybrid-cash-desk;
- pembelaan bahwa test hijau berarti desain sudah benar.

## Acuan desain yang FINAL

Acuan utama untuk arah desain Catat kas:
- `.hermes/r4-experiments/direct-hybrid-cash-desk.html`

Acuan pendukung hanya sebagai pagar sistem desain/shell host:
- `src/views/admin/FinanceV2.vue`
- `src/views/admin/finance/TransactionsView.vue`
- `src/components/admin/finance/TransactionWorkspace.vue`
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`

Interpretasi yang benar:
- `direct-hybrid-cash-desk.html` = source utama arah desain Catat kas;
- workflow/menu finance canonical = pagar shell, density, token, dan interaction language;
- jangan biarkan pagar shell menggantikan bahasa komposisi Catat kas.

## Contract visual/interaksi Catat kas yang harus dipertahankan

- arus kas adalah keputusan pertama dan paling dominan;
- semantic radio tetap ada, tetapi visualnya dua switch-button besar tanpa circle/check klasik;
- nominal jadi fokus berikutnya;
- `Keperluan` wajib dan menjadi headline slip;
- `Keterangan tambahan` opsional dan tidak merender section kosong;
- seksi pelapor tetap progressive disclosure opsional;
- `<1280`: persistent slip disembunyikan; compact recap + Dialog konfirmasi;
- `>=1280`: persistent live slip; Dialog tetap owner mutation final;
- mobile/tablet/iPad `<1280` memakai 44 px touch controls;
- wide desktop `>=1280` boleh compact;
- pending harus mengunci Escape/outside/cancel/double-submit;
- 409/5xx/network setelah pending harus:
  - menutup Dialog setelah pending selesai,
  - mempertahankan input,
  - mempertahankan idempotency key payload-bound,
  - mengembalikan ownership/focus dengan benar,
  - memungkinkan retry aman;
- success harus reset input dan refresh list/summary tanpa transaksi ganda.

## Trace aktual yang harus dipertahankan

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

Read path terkait refresh:

`TransactionsView`
`→ TransactionWorkspace`
`→ useKas transactions`
`→ kasService.getTransactions`
`→ GET /api/admin/transaction/list`
`→ getAllTransactions`
`→ D1`

Jangan fork service/composable/backend/route paralel.

## File prioritas

Fokus utama:
- `src/components/admin/kas/DirectCashDesk.vue`
- `src/views/admin/finance/DirectTransactionView.vue` bila host section perlu penyesuaian ringan
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Jangan kembali menggantung active redesign pada:
- `src/components/admin/kas/KasInput.vue`

## Aturan implementasi WAJIB

1. Mulai dengan audit file active route aktual dan test terkait.
2. Treat `DirectCashDesk.vue` sebagai file yang boleh di-rewrite total jika arah visual sekarang masih salah.
3. Jangan memindahkan active redesign kembali ke `KasInput.vue`.
4. Reuse hanya primitive canonical tingkat rendah:
   - Button
   - FormField
   - Input
   - Textarea
   - Select
   - Collapsible
   - Dialog/ConfirmModal
   - icon lucide
5. Business logic tetap di composable/service.
6. Jangan ubah invariant backend/contract yang sudah lulus.
7. Jangan redesain full Proposal pada sesi ini kecuali compatibility minimum yang memang dibutuhkan untuk type/test/browser drift.
8. Jika browser menemukan bug non-visual, debug sampai akar masalah.

## Urutan kerja wajib

1. `git status --short --branch`
2. Baca disk aktual file target.
3. Tulis trace singkat + target edit + risiko.
4. RED source/browser contract untuk Catat kas final bila perlu diperketat.
5. Rewrite `DirectCashDesk.vue` dari scratch sesuai prototype approved.
6. GREEN source/type/build target.
7. Audit browser langsung pada Catat kas.
8. Benahi browser fixture sampai benar-benar membuktikan direct form:
   - first-error focus;
   - semantic radio keyboard;
   - compact recap vs live slip breakpoint;
   - confirmation headline = `keperluan`;
   - pending one-request + Escape guard + double-submit guard;
   - 409 dan 503/network input preservation;
   - success reset + persistence/refetch.
9. Jalankan gate yang terdampak.
10. Update dokumentasi aktif hanya setelah behavior final benar.
11. Minta independent review fresh.
12. Jangan commit/push kecuali diminta.

## Browser matrix minimum Catat kas (WAJIB)

- 360×800
- 768×1024
- 1024×1366
- 1366×900

Dan cek juga:
- workflow finance nav host tetap normal;
- keyboard radio;
- open Dialog;
- pending state;
- 409/503 recovery;
- overflow;
- focus restoration;
- resize `<1280` ↔ `>=1280` bila disentuh;
- console/page errors kosong.

## Gates sebelum menyatakan selesai

Minimal affected gates:
- targeted source tests
- `npm run test`
- `npm run build`
- `npm run test:e2e:browser`
- bila menyentuh invariant contract/runtime lagi: `npm run test:migrations`, `npm run test:critical-flow:d1`
- `git diff --check`
- bila perlu, real Vite→Hono JSON request

## Definition of Done sesi baru

Task ini baru boleh dianggap selesai jika semua benar:

- Catat kas production benar-benar terasa seperti implementasi prototype direct-hybrid-cash-desk approved;
- tidak ada composition lama yang tersisa sebagai baseline visual utama;
- active route tetap memakai file presentasi baru, bukan `KasInput.vue`;
- workflow host finance tetap utuh dan tidak dipecahkan lagi;
- Hybrid Cash Desk direct form dibuktikan lewat browser nyata, bukan hanya source-string test;
- contract `keperluan`/`keterangan` tetap aman;
- invariant backend/composable/service tetap utuh;
- gates relevan lulus fresh setelah edit terakhir;
- dokumentasi aktif sinkron;
- independent review tidak menemukan blocker.

## Format laporan akhir yang diminta

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
- 1366×900: ...

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

## Catatan penutup paling penting

Pada sesi sebelumnya, user sudah berkali-kali meluruskan arah desain. Kegagalan utamanya adalah agent terlalu lama patching composition lama dan salah memakai level acuan desain.

Koreksi final yang harus diingat di sesi baru:
- pondasi workflow finance sudah ada di `FinanceV2.vue` dan jangan dibuka ulang;
- active redesign Catat kas harus berangkat dari `direct-hybrid-cash-desk.html`;
- `KasInput.vue` tidak boleh lagi menjadi jangkar arah visual active route;
- bila perlu, rewrite total `DirectCashDesk.vue` lebih baik daripada polish incremental yang salah arah.
