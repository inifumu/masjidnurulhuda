# Handoff Aktif — Koreksi Hierarchy Request Brief Proposal R4

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan melanjutkan koreksi hierarchy Proposal Request Brief berdasarkan audit source-live terbaru: keperluan harus menjadi fokus utama, nominal dan metadata wajib harus hadir sebelum closure, CTA tidak boleh muncul sebelum seluruh input wajib, serta urutan DOM, visual, validasi, dan keyboard focus harus identik pada mobile, tablet, dan desktop; mutation path, RBAC, ownership, approval state machine, audit, idempotency, dan invariant finansial tetap tidak berubah.`

## Status saat handoff

- R4 tetap `In Progress`.
- Transaksi canonical dan Catat kas Entry Spine adalah baseline regression; jangan dibuka ulang tanpa defect baru yang direproduksi dari render live.
- User memilih prototype **Request Brief** untuk Proposal.
- Production `KasProposal.vue` sudah memakai komposisi Request Brief awal, tetapi user menolak hierarchy/urutan/fokus utamanya setelah melihat hasil render.
- Audit ulang source-live mengonfirmasi penolakan tersebut objektif, terutama pada mobile dan tablet.
- Request Brief production saat ini adalah **draft terkoreksi sebagian, belum final, dan tidak boleh dibela dengan test hijau**.
- Fase sesi baru adalah **RED regression → koreksi hierarchy production → browser review**, bukan prototype search baru dan bukan perubahan backend.
- Jangan commit/push tanpa permintaan eksplisit user.

## Source of truth dan ownership

Route aktif:

`/admin/finance/proposal`

Ownership:

- `src/views/admin/FinanceV2.vue` — shell workflow navigation; jangan diubah kecuali defect baru terukur.
- `src/views/admin/finance/ProposalsView.vue` — page heading/loading/error dan wrapper yang saat ini menambah Card luar.
- `src/components/admin/kas/KasProposal.vue` — task surface Request Brief production yang harus dikoreksi.
- `src/composables/admin/useKas.ts` + `src/composables/admin/kas/useKasActions.ts` — state dan submit orchestration; jangan difork.
- `src/services/admin/kasService.ts` — payload builder/API/idempotency intent; jangan difork.
- `server/api/admin/transaction.ts` + `server/services/transaction.ts` — parser, policy, audit, idempotency, persistence; tidak masuk scope visual.

Trace mutation yang wajib tetap:

`FinanceV2`
`→ ProposalsView`
`→ KasProposal`
`→ useKas.handleProposal`
`→ buildProposalTransactionPayload / kasService.submitProposal`
`→ POST /api/admin/transaction/add-proposal`
`→ parseProposalTransaction`
`→ transaction service claim-first INSERT + submitted audit + idempotency finalize`
`→ D1 kas_masjid / transaction_audit_events / transaction_idempotency_keys`

## Pilihan visual yang tetap berlaku

Pilihan user tetap **Request Brief**, bukan Entry Spine, Funding Docket, atau Section Petition.

Prinsip Request Brief:

- `keperluan` adalah headline/pusat perhatian;
- `keterangan` adalah brief/rincian utama;
- nominal dan routing adalah metadata terstruktur;
- review final hanya Dialog;
- tidak ada stepper `1/2/3`, hero baru, persistent dossier, atau copy teknis backend;
- kualitas primitive/density/focus mengikuti Catat kas, tetapi composition tidak disalin.

Prototype referensi:

`http://127.0.0.1:4173/.hermes/r4-proposal-experiments/index.html?p=brief`

File disposable:

`.hermes/r4-proposal-experiments/index.html`

Jangan menyalin shell/prototype tooling ke production. Shell dan page framing tetap dimiliki production.

## Temuan audit hierarchy source-live terbaru

Probe:

`.hermes/r4-proposal-hierarchy-audit.mjs`

Command yang sudah dijalankan:

`node .hermes/r4-proposal-hierarchy-audit.mjs`

Viewport audit:

- 360×800;
- 768×1024;
- 1024×1366;
- 1366×900.

### Defect 1 — CTA muncul sebelum metadata wajib

Pada 360×800:

- brief utama `top 292 → bottom 1019`;
- CTA `Review pengajuan` `top 959 → bottom 1003`;
- metadata baru mulai `top 1035`.

Pengguna melihat CTA sebelum nominal, kategori, tanggal, metode, dan seksi. Ini defect completion ownership.

Pada 768 dan 1024, pola sama: CTA berada dalam Card brief pertama, metadata berada seluruhnya setelah Card tersebut.

### Defect 2 — urutan mobile salah

Urutan render saat ini:

1. arus;
2. keperluan;
3. rincian panjang;
4. CTA;
5. nominal;
6. kategori;
7. tanggal;
8. metode;
9. seksi.

CTA di nomor 4 memberi sinyal task selesai padahal lima field wajib belum diisi.

### Defect 3 — pusat perhatian pertama salah

`Arus pengajuan` memakai dua control semantik berwarna kuat dan muncul sebelum `Keperluan`. Untuk Request Brief, `Keperluan` harus menjadi headline/fokus utama; arus adalah classification/routing, bukan content core.

### Defect 4 — rincian terlalu dominan sebelum keputusan finansial

Pada mobile, main brief card setinggi sekitar 727 px. Textarea panjang mendorong nominal dan metadata ke bawah CTA dan keluar viewport awal.

### Defect 5 — metadata tampak sebagai lampiran sekunder

Brief dan metadata menjadi dua Card terpisah. Pada mobile/tablet metadata tampil setelah closure Card pertama, padahal semua field metadata wajib untuk mutation.

### Defect 6 — focus order teknis mengikuti DOM yang salah

Invalid fokus ke `Keperluan`, tetapi setelah brief diisi fokus melompat ke metadata jauh di bawah. Accessibility plumbing bekerja, tetapi task sequence/DOM ownership salah.

### Defect 7 — nested surface dari page wrapper

`ProposalsView.vue` masih membungkus `KasProposal` dengan:

`rounded-md border bg-card p-4 sm:p-6`

Di dalamnya Request Brief membuat dua `rounded-xl + ring` Card. Card-inside-card dan inset ganda melemahkan task surface. Evaluasi menghapus wrapper visual ini sambil mempertahankan loading/error ownership.

### Kondisi desktop

Pada 1366×900:

- main brief dan metadata rail mulai sejajar di `top 264`;
- split composition mendekati prototype;
- tetapi CTA masih dimiliki footer kiri, bukan completion boundary seluruh form.

Desktop split boleh dipertahankan, tetapi CTA harus mengetahui metadata rail sudah lengkap.

## Target hierarchy yang direkomendasikan

### Mobile 360

Urutan DOM dan visual yang disarankan:

1. Keperluan — headline utama/fokus pertama.
2. Arus pengajuan — compact semantic classification.
3. Estimasi nominal.
4. Rincian pengajuan.
5. Routing metadata compact:
   - kategori;
   - tanggal;
   - metode;
   - seksi.
6. Consequence copy Ketua → Bendahara.
7. CTA `Review pengajuan`.

CTA hanya muncul setelah seluruh field wajib dalam DOM.

### Tablet 768/1024

- Tetap satu alur vertikal; jangan taruh CTA sebelum metadata.
- Keperluan + arus + nominal menjadi opening decision group.
- Rincian setelah opening group.
- Metadata routing menjadi grid dua kolom.
- CTA setelah seluruh metadata.
- Jangan memaksa split rail hanya karena viewport bernama tablet; usable width setelah sidebar terbatas.

### Desktop 1366+

- Split Request Brief tetap boleh:
  - main brief kiri;
  - metadata rail kanan.
- Keperluan tetap elemen pertama dan paling kuat.
- Arus compact di bawah headline.
- CTA tidak boleh dimiliki footer kiri saja.
- Pilihan ownership yang layak:
  - footer form yang span dua kolom; atau
  - CTA di akhir metadata rail setelah field terakhir.
- Hanya satu CTA per breakpoint; review final tetap Dialog.

## Urutan fokus dan validation

Setelah hierarchy dipilih, `validationOrder` harus identik dengan urutan DOM final. Jangan memakai CSS `order` untuk membuat urutan visual berbeda dari keyboard/DOM.

Minimum:

- invalid submit memfokuskan field invalid pertama yang benar-benar pertama secara visual;
- Dropdown/DatePicker menerima `aria-invalid`, `aria-describedby`, dan focus restoration;
- Dialog idle menutup via Escape dan kembali ke CTA;
- pending Dialog menolak Escape/outside/cancel/double-submit;
- 409/503 menutup Dialog, mempertahankan seluruh input, menampilkan recoverable error, dan mengembalikan fokus ke CTA;
- success mereset field canonical dan refetch tetap best-effort.

## Invariant behavior yang tidak boleh berubah

- seluruh role operasional dapat mengakses Proposal sesuai policy existing; backend tetap otoritas;
- server memaksa status awal `pending_ketua`;
- `seksi_id` wajib dan merujuk seksi valid;
- `keperluan` wajib 5–120 karakter;
- `keterangan` wajib 10–2000 karakter;
- nominal finite, positif, dan dalam shared contract limit;
- approval tetap `pending_ketua → pending_bendahara → approved`, atau `rejected` dengan alasan;
- idempotency key stabil untuk retry payload identik dan berubah ketika payload berubah;
- duplicate request tidak membuat transaksi/audit event ganda;
- audit submitted/approval/rejection atomic;
- guard sinkron `if (isLoading.value) return` tetap ada;
- jangan menambah attachment;
- jangan mengubah backend/DTO/migration untuk composition visual.

## Protokol sesi baru

1. Jalankan `git status --short --branch`; working tree sangat dirty.
2. Baca `.hermes.md`, `DESIGN.md`, `SYSTEM_MAP.md`, R4 di `ROADMAP.md`, `docs/UI_UX_REDESIGN_AUDIT.md`, dan handoff ini.
3. Baca source aktual dari disk; jangan mengandalkan ringkasan sesi.
4. Jalankan Vite source-live dan ulang singkat hierarchy probe untuk memastikan baseline belum berubah.
5. Tulis RED regression yang mengunci:
   - CTA setelah metadata pada DOM mobile/tablet;
   - `Keperluan` sebagai content focus pertama;
   - tidak ada outer wrapper Card ganda jika diputuskan dihapus;
   - validation order sama dengan DOM final;
   - hanya satu CTA;
   - split desktop tetap Request Brief.
6. Patch minimal `ProposalsView.vue` dan/atau `KasProposal.vue`; jangan sentuh behavior owner.
7. Browser-audit source-live pada 360/768/1024/1366:
   - closed hierarchy;
   - invalid + first focus;
   - long keperluan/rincian/kategori/seksi;
   - setiap Dropdown open + Escape/focus return;
   - DatePicker;
   - confirmation Dialog;
   - pending/double-submit;
   - 409/503 preservation;
   - success/reset/refetch;
   - dark mode;
   - overflow dan console/page errors.
8. Bandingkan fresh render, bukan hanya computed geometry atau test hijau.
9. Jalankan targeted test/typecheck, lalu `npm run test`, `npm run build`, `npm run test:e2e:browser`, real Vite→Hono request bila diizinkan, dan `git diff --check` setelah edit final.
10. Minta independent review baru; hasil review lama stale setelah composition berubah.
11. Jangan commit/push tanpa permintaan eksplisit user.

## Evidence terakhir sebelum handoff

Sebelum audit-only probe terakhir:

- `npm run test`: 173/173 pass;
- `npm run build`: pass;
- `npm run test:e2e:browser`: pass pada 360/768/1024/1366;
- `git diff --check`: pass.

Setelah itu hanya `.hermes/r4-proposal-hierarchy-audit.mjs` yang ditambahkan. Full application gate tidak diulang karena audit creative read-only terhadap production; status application evidence adalah stale terhadap probe disposable, bukan karena source production berubah setelah gate tersebut.

Real Vite→Hono API request pada sesi sebelumnya pernah diblokir oleh host; jangan mengulang command yang sama tanpa izin baru.

## Working tree dan Git safety

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- Working tree sangat dirty dengan perubahan tracked/untracked existing.
- Jangan reset, stash, clean, checkout, atau membuang perubahan existing.
- Jangan broad-stage (`git add -A`).
- Jangan commit/push tanpa permintaan eksplisit user.
- `.hermes/**`, screenshots, probes, `document.documentElement.clientWidth`, dan `x.name)` tidak boleh di-stage.
- Jangan membaca/mencetak `.env`, `.dev.vars`, cookies, token, atau secret.

## Format trace awal

```text
Trace:
- FinanceV2 → ProposalsView → KasProposal → useKas.handleProposal → kasService → Hono route/service → D1

Target:
- koreksi hierarchy Request Brief production: keperluan-first, metadata-before-CTA, DOM/focus parity, responsive completion ownership

Risiko:
- tinggi karena presentation memicu mutation proposal;
- backend contract, RBAC, state machine, audit, ownership, dan idempotency tidak berubah
```

## Definition of Done sesi koreksi

- hierarchy mobile/tablet tidak menaruh CTA sebelum field wajib;
- keperluan menjadi fokus content utama tanpa membuat arus/nominal sulit ditemukan;
- desktop tetap Request Brief yang seimbang;
- urutan DOM, visual, keyboard, dan validation identik;
- outer Card nesting dihilangkan atau dibuktikan perlu dari fresh render;
- satu CTA dan satu Dialog mutation owner;
- pending/409/503/success/idempotency behavior terverifikasi;
- 360/768/1024/1366 + dark/long/open transient bebas document overflow dan console error;
- targeted/full test, build, canonical E2E, diff check lulus setelah edit final;
- independent review baru tidak memiliki blocker;
- user diberi fresh rendered result untuk evaluasi visual;
- no commit / no push kecuali diminta eksplisit.

## Prompt penutup paling penting

Jangan mempertahankan CTA di footer brief kiri pada mobile/tablet. Jangan menyelesaikan defect dengan CSS reorder yang memisahkan visual dari DOM/focus. Test hijau tidak membuktikan hierarchy benar. Request Brief tetap arah terpilih, tetapi production saat ini belum final dan harus dikoreksi berdasarkan rendered task order.
