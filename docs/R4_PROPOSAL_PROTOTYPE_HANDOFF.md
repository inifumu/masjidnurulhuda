# Histori Handoff — Audit dan Prototype Redesign Proposal R4 (Superseded)

> Prompt ini telah superseded. Request Brief sudah dipilih dan dipromosikan ke production, tetapi hierarchy awalnya ditolak setelah audit source-live. Gunakan `docs/R4_PROPOSAL_HIERARCHY_CORRECTION_HANDOFF.md` untuk sesi baru; jangan kembali ke fase prototype-first dari dokumen ini.

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

## Bahasa dan waktu

- Gunakan Bahasa Indonesia untuk trace, laporan, dokumentasi, dan komunikasi.
- Zona waktu bisnis: `Asia/Jakarta`.

## Kalimat pembuka wajib

`Saya akan melanjutkan R4 ke submenu Proposal create/detail dengan mengaudit behavior dan render source-live terlebih dahulu, lalu membuat 2–3 prototype responsive yang benar-benar berbeda secara struktural di dalam shell produk aktual; production Proposal tidak akan diubah sebelum user memilih arah visual, dan seluruh RBAC, ownership, approval state machine, audit, idempotency, serta invariant finansial tetap dipertahankan.`

## Status saat handoff

- Transaksi canonical dan Catat kas Entry Spine sudah menjadi baseline regression.
- Catat kas telah melalui corrective consistency tambahan untuk Card radius/ring, Dropdown radius, DatePicker canonical, dan menu Seksi Pelapor.
- Jangan membuka ulang Catat kas tanpa defect baru yang direproduksi dari render live.
- R4 tetap `In Progress`; submenu berikutnya adalah Proposal create/detail.
- Proposal production masih memakai presentasi legacy dan belum dipilih user sebagai desain final.
- Fase sesi baru adalah **audit + prototype**, bukan langsung implementasi production.
- Jangan commit/push tanpa permintaan eksplisit user.

## Source of truth Proposal saat ini

Route aktif:

`/admin/finance/proposal`

Ownership:

- `src/views/admin/FinanceV2.vue` — host dan workflow navigation;
- `src/views/admin/finance/ProposalsView.vue` — page heading/loading/error dan wrapper legacy;
- `src/components/admin/kas/KasProposal.vue` — presentasi/form Proposal legacy aktif;
- `src/composables/admin/useKas.ts` + `src/composables/admin/kas/useKasActions.ts` — state dan submit orchestration;
- `src/services/admin/kasService.ts` — payload builder dan API client;
- `server/api/admin/transaction.ts` + `server/services/transaction.ts` — parser, policy, idempotency, audit, persistence.

Trace write yang tidak boleh difork:

`FinanceV2`
`→ ProposalsView`
`→ KasProposal`
`→ useKas.handleProposal`
`→ buildProposalTransactionPayload / kasService.submitProposal`
`→ POST /api/admin/transaction/add-proposal`
`→ parseProposalTransaction`
`→ transaction service claim-first INSERT + submitted audit + idempotency finalize`
`→ D1 kas_masjid / transaction_audit_events / transaction_idempotency_keys`

Read/status path:

`ProposalsView / ApprovalsView / TransactionsView`
`→ useKas transactions`
`→ kasService.getTransactions / pending`
`→ Hono transaction routes`
`→ getAllTransactions / pending policy`
`→ D1`

## Behavior dan invariant yang wajib dipertahankan

- Proposal dapat diakses seluruh role operasional sesuai policy existing; backend tetap otoritas.
- Server memaksa status awal `pending_ketua`.
- `seksi_id` wajib dan harus merujuk seksi valid.
- `keperluan` adalah headline wajib 5–120 karakter.
- `keterangan` adalah rincian wajib 10–2000 karakter.
- Nominal finite, positif, dan dalam batas shared contract.
- Alur approval tetap `pending_ketua → pending_bendahara → approved`, atau `rejected` dengan alasan.
- Idempotency key stabil untuk retry payload identik dan berubah saat payload berubah.
- Duplicate request tidak boleh membuat transaksi/audit event ganda.
- Audit submitted/approval/rejection tetap atomic dengan mutation.
- Jangan menambah attachment dalam redesign ini; attachment adalah discovery terpisah.
- Jangan mengubah backend/DTO/migration hanya untuk menyesuaikan composition visual.

## Baseline visual yang boleh dan tidak boleh dipakai

Adopt dari Transaksi canonical dan Catat kas:

- token Civic Editorial, Inter, emerald identity, muted surface, semantic status;
- primitive canonical shadcn-vue/Reka;
- outer Card `rounded-xl` + canonical ring, low-shadow grammar;
- trigger/input radius canonical dan density 44 px `<xl`, 32 px `xl`;
- Dropdown/Popover/Dialog canonical termasuk open/focus/Escape/focus restoration;
- typography, spacing discipline, settled transient evidence, dan bounded viewport behavior.

Jangan transplant composition:

- jangan copy list/detail/dossier Transaksi;
- jangan copy Entry Spine Catat kas secara literal;
- jangan mempertahankan generic legacy form stack hanya dengan reskin;
- jangan membuat guide stepper `1/2/3`, hero tambahan, atau persistent review dossier tanpa alasan task-specific dan pilihan user;
- jangan memakai legacy `KasProposal.vue` sebagai referensi visual; audit hanya field, behavior, role, dan state-nya.

## Audit source-live wajib sebelum prototype

1. Jalankan `git status --short --branch`; working tree sangat dirty.
2. Baca `.hermes.md`, `DESIGN.md`, `SYSTEM_MAP.md`, R4 `ROADMAP.md`, `docs/UI_UX_REDESIGN_AUDIT.md`, dan handoff ini.
3. Audit diff hanya file scope; jangan reset/stash/clean/checkout.
4. Jalankan Vite source-live pada port tersedia.
5. Audit route Proposal aktual pada 360×800, 768×1024, 1024×1366, dan 1366×900.
6. Periksa closed form, invalid state, seluruh Dropdown, tanggal, nominal, long keperluan/keterangan/seksi/kategori, confirmation, pending, 409, 503/network, success/reset/refresh, role visibility, focus, Escape, overflow, dark mode, dan console errors.
7. Catat field/behavior yang harus dipreservasi dan defect legacy; jangan patch production pada fase audit.
8. Bedakan behavior parity dari visual direction.

## Prototype-first gate

Buat 2–3 prototype disposable dan interactive yang berbeda secara struktural, bukan sekadar warna/radius/spacing.

Syarat setiap prototype:

- berada dalam shell produk aktual: sidebar/header/workflow nav/content boundary;
- memakai language shadcn-vue proyek dan token aktual;
- responsive pada 360/768/1024/1366;
- core action jelas: mengajukan kebutuhan dana atau setoran melalui jalur persetujuan;
- mencakup selection arus, kategori, tanggal kegiatan, estimasi nominal, metode, seksi pengaju, keperluan, rincian wajib, dan review/confirmation;
- menunjukkan minimal closed form, satu Dropdown open, confirmation, invalid, dan pending/error state;
- document overflow nol, popup bounded, control density benar, dan console/page errors kosong;
- prototype disimpan di lokasi disposable/untracked seperti `.hermes/r4-proposal-experiments/`; jangan stage artifact.

Contoh stance struktural yang boleh dieksplorasi:

1. **Request Brief** — keperluan/rincian sebagai brief utama, angka dan routing approval sebagai metadata terstruktur.
2. **Funding Docket** — nominal + tujuan menjadi decision core, detail pengajuan disclosed bertahap, final review sebagai docket Dialog.
3. **Section Petition** — seksi dan kebutuhan menjadi origin story, anggaran/method/date sebagai compact operational strip.

Nama di atas bukan keputusan. Hasil audit boleh menghasilkan stance lain yang lebih kuat.

## Gate pilihan user

Setelah prototype diverifikasi:

- tampilkan perbandingan opinionated, trade-off, dan rekomendasi;
- berikan path/file yang dapat dibuka user;
- label status `prototype-verified; application-unmodified`;
- tunggu pilihan visual eksplisit user;
- jangan mengubah `ProposalsView.vue`, `KasProposal.vue`, composable, service, backend, atau dokumentasi adoption sebagai production sebelum pilihan user.

Setelah user memilih, sesi berikutnya/lanjutan harus:

1. tulis RED regression test untuk contract prototype terpilih;
2. implementasikan patch/rewrite presentasi minimal tanpa fork behavior;
3. browser-audit mobile/tablet/desktop dan transient states;
4. jalankan targeted/full test, build, canonical E2E, real Vite→Hono request, diff-check;
5. minta independent review baru;
6. sinkronkan docs hanya setelah implementation final terverifikasi.

## Baseline Catat kas yang tidak boleh diregresikan

Catat kas route `/admin/finance/transaksi-langsung` tetap memakai Entry Spine:

- outer surface mengikuti Card canonical `rounded-xl` + ring;
- DatePicker memakai Button outline + Popover canonical;
- kategori/seksi memakai DropdownMenuRadioGroup/RadioItem;
- isi menu Seksi Pelapor dua kolom pada semua viewport, bounded `min(32rem, 100vw - 2rem)`, align kanan trigger, label satu baris;
- review final hanya Dialog;
- pending/409/503/success/focus/idempotency behavior tetap utuh.

Fresh baseline terakhir setelah edit:

- `npm run test`: 173/173 pass;
- `npm run build`: pass;
- `git diff --check`: pass;
- canonical browser E2E sebelumnya pass, tetapi wajib diulang jika source production berubah.

## Working tree dan Git safety

- Repo: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`
- Branch: `improve/project-foundation`
- Working tree sangat dirty dengan tracked/untracked changes existing.
- Jangan reset, stash, clean, checkout, atau membuang perubahan existing.
- Jangan broad-stage (`git add -A`).
- Jangan commit/push tanpa permintaan eksplisit user.
- `.hermes/**`, screenshots, probes, `document.documentElement.clientWidth`, dan `x.name)` tidak boleh di-stage.
- Jangan membaca atau mencetak `.env`, `.dev.vars`, cookies, token, atau secret.

## Format trace awal

```text
Trace:
- FinanceV2 → ProposalsView → KasProposal → useKas.handleProposal → kasService → Hono route/service → D1

Target:
- audit behavior/render Proposal live dan 2–3 prototype disposable; application Proposal belum diubah

Risiko:
- sedang untuk audit/prototype;
- tinggi setelah promosi karena menyentuh mutation + approval workflow, tetapi backend contract tetap tidak berubah
```

## Format laporan prototype

```text
Ringkasan audit live:
- behavior/state yang harus dipreservasi
- defect legacy yang ditemukan

Prototype:
- nama/path → stance → interaction model

Browser prototype:
- 360×800: ...
- 768×1024: ...
- 1024×1366: ...
- 1366×900: ...
- open/invalid/pending/error: ...

Perbandingan:
- hierarchy
- density
- discoverability
- mobile/tablet/desktop behavior
- trade-off

Rekomendasi:
- ...

Status:
- prototype-verified; application-unmodified
- menunggu pilihan user

Git:
- no commit / no push
```

## Prompt penutup paling penting

Jangan langsung meredesain production Proposal. Audit source-live, buat 2–3 prototype task-specific yang genuinely berbeda, verifikasi di shell aktual, lalu tunggu pilihan user. Test hijau tidak memilih desain. Transaksi dan Catat kas adalah donor quality system, bukan layout template. R4 tetap `In Progress`.
