# Handoff Historis — Mulai Ulang Redesign Catat Kas dari Scratch

> **SUPERSEDED:** prototype Hybrid Cash Desk dan arahan implementasi dalam dokumen ini telah ditolak; Entry Spine kini live. R4 kini berlanjut ke redesign Persetujuan; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` sebagai handoff aktif.

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Mulai dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan memulai ulang redesign Catat kas dari scratch berdasarkan prototype Hybrid Cash Desk yang sudah disetujui—bukan melanjutkan patch visual sebelumnya—dengan hanya mempertahankan invariant backend/composable/service, lalu membuktikannya lewat browser matrix dan gate penuh setelah implementasi final.`

## Premis paling penting

Ini BUKAN task “lanjutkan patch”.
Ini adalah task “mulai ulang desain ulang Catat kas dari scratch”.

User sudah menegaskan bahwa pola kegagalan ini pernah terjadi pada redesign menu transaksi, sudah diluruskan, dan tetap terulang lagi di implementasi Catat kas. Karena itu:

- jangan perlakukan `KasInput.vue` current sebagai baseline desain;
- jangan lakukan polish incremental di atas composition lama;
- jangan tempel Hybrid Cash Desk ke struktur visual lama;
- jangan jadikan test hijau sebagai argumen bahwa desain saat ini sudah benar.

Yang boleh dipertahankan dari implementasi sekarang hanyalah:
- contract domain `keperluan`/`keterangan`;
- migration additive + backfill;
- route/composable/service/backend orchestration;
- RBAC, ownership, idempotency, audit, approved/void invariant, summary policy;
- test/evidence yang sudah benar-benar membuktikan invariant.

Yang TIDAK boleh dijadikan baseline:
- hierarchy lama form `KasInput.vue`;
- grouping lama;
- recap/slip yang ditempel di atas layout lama;
- interaction model lama;
- visual surface lama mana pun yang membuat hasil terasa seperti patch atas desain lama.

## Head dan working tree

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- HEAD saat handoff dibuat: `e4fd772f1e00e4116770f326a68c2b0a85b8420a`
- Working tree sangat dirty. Jangan reset/stash/clean/checkout/buang perubahan existing.
- Jangan commit atau push tanpa permintaan eksplisit user pada sesi baru.
- Jangan `git add -A`.
- `.hermes/**`, screenshot/probe lokal, `document.documentElement.clientWidth`, dan `x.name)` jangan di-stage/commit.

## Sumber kebenaran wajib

Baca ulang dan ikuti:

- `.hermes.md`
- `AGENTS.md`
- `README.md`
- `SYSTEM_MAP.md`
- `DESIGN.md`
- `ROADMAP.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `docs/FEATURE_DEVELOPMENT_PLAN.md`
- `.hermes/plans/2026-07-17_000003-r4-keperluan-catat-kas-hybrid.md`
- `docs/R4_DIRECT_TRANSACTION_IMPLEMENTATION_HANDOFF.md`

Load skill/reference:

- `test-driven-development`
- `responsive-ui-redesign-governance`
- `responsive-ui-redesign-governance/references/financial-task-form-implementation.md`
- `responsive-ui-redesign-governance/references/workflow-route-slicing.md`
- `systematic-debugging` bila ada bug
- `requesting-code-review` sebelum closure/commit

## Fakta yang SUDAH benar dan harus dipertahankan

Vertical slice contract/backend sudah ada dan jangan dirusak:

1. `keperluan` = judul wajib transaksi/proposal.
2. `keterangan` = uraian detail.
3. Direct:
   - `keperluan` wajib 5–120;
   - `keterangan` opsional, maksimum 1000.
4. Proposal:
   - `keperluan` wajib 5–120;
   - `keterangan` wajib 10–2000.
5. Legacy row sudah dibackfill `keperluan = keterangan` melalui migration additive.
6. List/search canonical sudah memakai `keperluan` sebagai title dan `keterangan` sebagai detail/search field.
7. Backend/idempotency/invariants/gates utama sudah pernah lulus pada sesi sebelumnya.

Jangan rollback atau redesign ulang bagian itu kecuali source test membuktikan bug nyata.

## Prototype approved yang HARUS menjadi basis implementasi baru

Reference disposable:

- `.hermes/r4-experiments/direct-hybrid-cash-desk.html`
- `.hermes/r4-hybrid-audit.mjs`

Reference ini hanya geometry/task model; jangan copy HTML/CSS mentah. Tapi composition/task model-nya adalah acuan utama.

Pedoman style visual yang BOLEH dan HARUS dijadikan acuan sistem:

- shell admin aktif yang sudah approved: header, sidebar, density, spacing, tone, border, dan hierarchy di `AdminLayoutV2.vue` / `AdminSidebar.vue`;
- workflow/menu transaksi canonical yang sudah approved di `/admin/finance/transaksi` sebagai acuan kualitas redesign finance aktif;
- primitive canonical shadcn-vue/Reka yang memang dipakai surface approved tersebut.

Artinya:

- arah redesign Catat kas berasal dari prototype Hybrid Cash Desk yang sudah disetujui;
- language/style system berasal dari surface approved yang sudah aktif (wrapper admin + transaksi canonical), bukan dari komposisi lama Catat kas;
- jangan copy composition transaksi apa adanya, tetapi gunakan kualitas visual, density, token, dan interaction language-nya sebagai pagar sistem desain.

Contract visual/interaksi yang sudah final:

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

## Masalah yang terjadi pada sesi sebelumnya

Ini penting supaya tidak terulang:

- Implementasi sebelumnya terlalu lama patching `KasInput.vue` existing.
- Surface yang dihasilkan masih membawa terlalu banyak composition lama.
- User sudah menolak pendekatan itu dengan tegas.
- Jadi sesi baru harus memperlakukan current `src/components/admin/kas/KasInput.vue` sebagai draft gagal secara composition, bukan baseline desain.

Jangan ulangi pola:
- “amankan gate dulu sambil polish visual sedikit-sedikit”.

Untuk task ini, desain approved lebih tinggi daripada kenyamanan patch incremental.

## Trace aktual yang tetap dipertahankan

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

Read path terkait refresh:

`TransactionsView`
`→ TransactionWorkspace`
`→ useKas transactions`
`→ kasService.getTransactions`
`→ GET /api/admin/transaction/list`
`→ getAllTransactions`
`→ D1`

Jangan fork service/composable/backend/route paralel.

## Aturan implementasi yang WAJIB

1. Mulai dengan audit file aktual dan test terkait sebelum mengubah apapun.
2. Treat `KasInput.vue` current as disposable composition.
3. Rebuild presentational structure dari nol di file production yang sama (`src/components/admin/kas/KasInput.vue`) atau rewrite penuh file bila itu jalur paling bersih.
4. Reuse hanya primitive canonical tingkat rendah:
   - Button
   - FormField
   - Input
   - Textarea
   - Select
   - Collapsible
   - Dialog/ConfirmModal
   - icon lucide
5. Jangan reuse composition lama hanya karena “sudah ada”.
6. Business logic tetap di composable/service.
7. Jangan ubah invariant backend/contract yang sudah lulus.
8. Jangan redesain full Proposal pada sesi ini kecuali compatibility minimum yang memang dibutuhkan untuk type/test/browser drift.
9. Jika browser menemukan bug yang bukan visual (mis. focus/select/modal), debug sampai akar masalah, bukan work-around kosmetik.

## File prioritas

Fokus utama:
- `src/components/admin/kas/KasInput.vue`
- `src/views/admin/finance/DirectTransactionView.vue` bila host perlu disesuaikan
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Bila diperlukan untuk focus/primitive bug:
- `src/components/ui/select/SelectTrigger.vue`
- `src/components/ui/sheet/SheetContent.vue`
- primitive canonical lain yang benar-benar terbukti sebagai akar masalah

Jangan sentuh path lain tanpa evidence kebutuhan.

## Urutan kerja wajib

1. `git status --short --branch`
2. Baca disk aktual file target.
3. Tulis trace singkat + target edit + risiko.
4. RED source-contract untuk Hybrid Cash Desk final bila perlu diperketat.
5. Rewrite `KasInput.vue` dari scratch sesuai prototype approved.
6. GREEN source/type/build target.
7. Audit browser langsung pada Catat kas, bukan hanya proposal/transaksi.
8. Tambah/benahi browser fixture sampai benar-benar membuktikan direct form:
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

## Browser matrix minimum untuk Catat kas (WAJIB)

- 360×800
- 768×1024
- 1024×1366
- 1366×900

Dan cek juga:
- sidebar/navigation bila relevan;
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

Jangan klaim selesai bila browser direct cash desk belum benar-benar dibuktikan.

## Definition of Done sesi baru

Task ini baru boleh dianggap selesai jika semua benar:

- Catat kas production benar-benar terasa seperti implementasi prototype approved, bukan patch atas desain lama.
- Tidak ada composition lama yang tersisa sebagai baseline visual utama.
- Hybrid Cash Desk direct form dibuktikan lewat browser nyata, bukan hanya source-string test.
- Contract `keperluan`/`keterangan` tetap aman.
- Invariant backend/composable/service tetap utuh.
- Gates relevan lulus fresh setelah edit terakhir.
- Dokumentasi aktif sinkron.
- Independent review tidak menemukan blocker.

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

---

Catatan penutup paling penting:

User sudah menegaskan bahwa kegagalan pola ini pernah terjadi pada redesign menu transaksi, sudah diluruskan, dan tidak boleh terulang. Jadi sesi baru harus memulai dari asumsi bahwa patching composition lama adalah pendekatan yang dilarang untuk Catat kas.
