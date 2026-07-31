# R4 Keperluan Contract dan Hybrid Cash Desk Implementation Plan

> **Untuk Hermes:** Implementasikan task satu per satu dengan strict TDD. Jangan commit/push tanpa permintaan eksplisit user pada sesi baru.

**Goal:** Memisahkan `keperluan` sebagai judul wajib transaksi dari `keterangan` sebagai uraian detail, lalu mempromosikan desain Hybrid Cash Desk yang telah disetujui ke submenu Catat kas tanpa merusak RBAC, idempotency, audit, approved/void invariant, atau summary.

**Architecture:** Gunakan vertical slice `migration → shared contract → backend persistence/query → frontend state/service → canonical presentation → browser evidence`. Migration bersifat additive dan membackfill transaksi lama. UI tetap `View → composable → service → API`; backend tetap `route → validation → service/query → D1`. Attachment proposal tetap di luar implementasi ini dan sudah dicatat sebagai candidate terpisah.

**Tech Stack:** Vue 3, TypeScript, shadcn-vue/Reka, Hono, Cloudflare D1, node:test, Playwright, Wrangler/Miniflare.

---

## Kontrak yang disetujui

- `keperluan`: wajib pada direct dan proposal; judul singkat untuk list, approval, audit context, slip, dan dossier.
- `keterangan`: opsional pada direct; wajib pada proposal; uraian yang tampil di detail/dossier.
- Batas awal yang harus dikunci test dan shared parser:
  - `keperluan`: trimmed, 5–120 karakter;
  - direct `keterangan`: trimmed, kosong diperbolehkan, maksimum 1000 karakter;
  - proposal `keterangan`: trimmed, 10–2000 karakter.
- Row existing: `keperluan = keterangan` melalui backfill.
- List title dan pencarian memakai `keperluan`; pencarian juga mencakup `keterangan`, kategori, dan seksi.
- Status/state machine, role policy, ownership, audit event semantics, approved/void behavior, summary policy, dan method endpoint tidak berubah.
- Lampiran proposal tidak diimplementasikan dalam slice ini.

## Desain Catat kas yang disetujui

Referensi disposable, bukan source production:

- `.hermes/r4-experiments/direct-hybrid-cash-desk.html`
- `.hermes/r4-hybrid-audit.mjs`

Kontrak presentasi:

- semantic radio untuk arus, tetapi visual berupa dua switch-button tanpa circle radio/check;
- keputusan arus berada paling atas dan dominan;
- nominal menjadi data focus berikutnya;
- `Keperluan` wajib dan menjadi headline slip;
- `Keterangan tambahan` opsional dan hanya muncul di slip/detail jika berisi;
- seksi pelapor tetap progressive disclosure opsional;
- `<1280`: persistent slip disembunyikan, compact recap + Dialog slip confirmation;
- `>=1280`: persistent live slip; Dialog tetap menjadi konfirmasi mutation final;
- pending mengunci Escape/outside dismissal dan double-submit;
- 409/5xx menutup modal setelah pending selesai, mempertahankan input, dan menyediakan retry aman.

---

### Task 1: Audit working tree dan kunci baseline

**Objective:** Memastikan implementasi dimulai dari disk aktual dan tidak menimpa akumulasi R4.

**Files:** read-only audit terhadap source/test/docs terkait.

**Steps:**

1. Jalankan `git status --short --branch`.
2. Baca `.hermes.md`, `ROADMAP.md` bagian R4, `DESIGN.md`, `SYSTEM_MAP.md` finance, handoff aktif, dan prototype hybrid.
3. Baca migration terakhir aktual; jangan menebak nomor migration berikutnya.
4. Trace `DirectTransactionView → KasInput → useKas.handleDirectInput → kasService → add-direct → transaction service → D1`.
5. Trace semua read caller `KasTransaction.keterangan` sebelum mengubah DTO.
6. Catat target edit dan risiko tinggi sebelum patch.

Expected: inventory caller lengkap; tidak ada edit/reset/stash/clean.

---

### Task 2: RED shared contract untuk keperluan/keterangan

**Objective:** Mengunci validation semantics sebelum production code.

**Files:**
- Modify test: `tests/finance-contracts.test.mjs` atau test parser finance aktual yang paling dekat.
- Later modify: `shared/contracts/index.ts`.

**Steps:**

1. Tambah failing tests:
   - direct tanpa `keperluan` gagal field `keperluan`;
   - direct dengan `keperluan` valid dan `keterangan=""` lulus;
   - proposal tanpa/pendek `keterangan` gagal;
   - trim dan max length masing-masing field;
   - parser mengembalikan DTO dengan kedua field terpisah.
2. Jalankan targeted test dan pastikan RED karena contract belum tersedia.
3. Implementasikan tipe/request/parser minimal di `shared/contracts/index.ts`.
4. Jalankan targeted test hingga GREEN.

Jangan menambah fallback permanen yang diam-diam mengisi `keperluan` dari `keterangan` pada parser canonical baru.

---

### Task 3: RED migration additive dan backfill

**Objective:** Menambah storage `keperluan` tanpa kehilangan data lama.

**Files:**
- Create: migration baru setelah nomor migration terakhir aktual, nama `*_add_transaction_purpose.sql`.
- Modify test/harness: `tests/scripts/p0-migrations.mjs` dan/atau test migration source aktual.

**Steps:**

1. Tambah failing fresh/upgrade assertions:
   - kolom `keperluan` tersedia;
   - semua row existing memiliki `keperluan = keterangan` setelah upgrade;
   - `keterangan` existing tetap utuh;
   - jumlah/status/audit/registry row tidak berubah;
   - FK check bersih.
2. Jalankan migration test dan pastikan RED.
3. Buat migration additive `ALTER TABLE kas_masjid ADD COLUMN keperluan TEXT` lalu backfill trimmed/fallback aman.
4. Jangan rebuild tabel atau mengubah migration lama.
5. Jalankan `npm run test:migrations` hingga GREEN pada fresh dan upgrade.
6. Periksa schema hasil aktual dengan Wrangler D1 lokal.

Catatan: nullability storage boleh transitional; kewajiban field ditegakkan parser/service. Contract constraint dapat dievaluasi setelah compatibility window.

---

### Task 4: RED backend persistence, list, dan idempotency

**Objective:** Menyimpan dan membaca `keperluan` secara end-to-end dengan mutation safety tetap utuh.

**Files:**
- Modify: `server/api/admin/transaction.ts`
- Modify: `server/services/transaction.ts`
- Modify: typed payload/query terkait bila terpisah.
- Test: `tests/transaction-create-routes.integration.test.mjs`
- Test: transaction service/list tests aktual.

**Steps:**

1. Tambah failing integration tests:
   - direct menyimpan `keperluan`, menerima `keterangan` kosong;
   - proposal menyimpan keduanya dan menolak `keterangan` kosong;
   - replay payload sama menghasilkan satu row/event;
   - key sama dengan `keperluan` berbeda menghasilkan 409 payload mismatch;
   - list mengembalikan kedua field;
   - row backfill tetap dapat dibaca.
2. Jalankan targeted tests, verifikasi RED.
3. Tambahkan `keperluan` ke `TransactionPayload`, INSERT, SELECT/list DTO.
4. Route tetap memaksa direct `approved` dan proposal `pending_ketua`.
5. Pastikan canonical request hash mencakup field baru melalui normalized payload.
6. Jangan mengubah event type/state transition/RBAC.
7. Jalankan targeted tests hingga GREEN.

---

### Task 5: RED frontend state/service contract

**Objective:** Mengalirkan field baru tanpa business logic di view.

**Files:**
- Modify: `src/services/admin/kasService.ts`
- Modify: `src/composables/admin/kas/useKasState.ts`
- Modify: `src/composables/admin/kas/useKasActions.ts`
- Modify: form reset/watchers aktual jika diperlukan.
- Test: service/payload/form tests aktual.

**Steps:**

1. Tambah failing tests untuk payload direct/proposal dan reset:
   - `keperluan` dipertahankan/trimmed;
   - direct `keterangan` kosong valid;
   - proposal `keterangan` wajib;
   - successful reset membersihkan `keperluan` dan `keterangan`;
   - failed retry mempertahankan keduanya dan idempotency key payload-bound.
2. Jalankan targeted tests, verifikasi RED.
3. Update DTO `KasTransaction`, form state, payload builders, reset, dan orchestration minimal.
4. Jangan ubah loading/request gates atau service endpoint.
5. Jalankan targeted tests hingga GREEN.

---

### Task 6: Update Transaksi canonical ke semantics baru

**Objective:** Menampilkan judul dan detail dengan benar sebelum Catat kas dipromosikan.

**Files:**
- Modify: `src/components/admin/finance/TransactionWorkspace.vue`
- Modify: `src/views/admin/finance/TransactionsView.vue` hanya jika orchestration membutuhkan type update.
- Modify test: `tests/finance-transaction-ledger.test.mjs`.

**Steps:**

1. Tambah failing assertions:
   - row/aria label menggunakan `keperluan`;
   - dossier/Sheet title menggunakan `keperluan`;
   - `keterangan` tampil pada detail bila ada;
   - empty keterangan tidak membuat section kosong;
   - search mencakup kedua field;
   - fallback legacy hanya untuk data transitional yang benar-benar tidak memiliki `keperluan`, bukan default permanen setelah migration.
2. Jalankan targeted test, verifikasi RED.
3. Implementasikan presentation minimal.
4. Jalankan targeted test dan build.
5. Browser smoke Transaksi long purpose + long description pada 360/768/1024/1366 untuk mencegah clipping.

---

### Task 7: Promosikan Hybrid Cash Desk ke Catat kas

**Objective:** Mengganti draft/reskin production saat ini dengan komposisi yang disetujui.

**Files:**
- Modify: `src/views/admin/finance/DirectTransactionView.vue`
- Rewrite scoped domain presentation: `src/components/admin/kas/KasInput.vue`
- Reuse canonical primitives dari `src/components/ui/*`.
- Modify test: `tests/finance-transaction-ledger.test.mjs` dan browser fixture terkait.

**Steps:**

1. Tulis failing source/browser contract untuk:
   - semantic radio/radiogroup tanpa circle visual;
   - large switch-button arus;
   - `Keperluan` wajib dan `Keterangan tambahan` opsional;
   - persistent slip hanya `>=1280`;
   - compact recap + Dialog pada `<1280`;
   - confirmation slip title = `keperluan`;
   - optional description section;
   - pending `ConfirmModal` guard;
   - no hardcoded dark colors/custom dropdown legacy.
2. Jalankan targeted test, verifikasi RED.
3. Implementasikan dengan shadcn-vue/Reka canonical:
   - Button, FormField, Input, Textarea, Select, Dialog/ConfirmModal, Collapsible, data states;
   - Lucide icons, bukan glyph font pada production;
   - 44 px `<1280`, compact 32 px `>=1280` kecuali nominal textarea yang membutuhkan ruang.
4. Pertahankan `handleDirectInput` sebagai mutation owner.
5. Map server `ApiError.fields.keperluan|keterangan|...` ke inline error dan fokus error pertama.
6. Success menutup dialog dan reset; 409/5xx menutup dialog setelah pending, mempertahankan input, serta memberi pesan/retry.
7. Jalankan targeted test + build hingga GREEN.

Jangan menyalin HTML/CSS prototype mentah ke production; terjemahkan geometry/interaction ke primitive/token canonical.

---

### Task 8: Browser fixture Catat kas yang nyata

**Objective:** Membuktikan closed/open/pending/error state, bukan hanya source shape.

**Files:**
- Modify existing browser fixture yang canonical, kemungkinan `tests/scripts/p05-browser-e2e.mjs` atau probe R4 yang dipromosikan menjadi test.

**Scenarios:**

1. Role matrix: superadmin/ketua/bendahara terlihat; pengurus route/nav/direct API ditolak.
2. Initial loading, load error + retry.
3. Empty master category state bila relevan.
4. Validation field-by-field dan first-error focus.
5. Switch arus memperbarui category set, recap, slip, dan modal.
6. Long `keperluan`, nominal jutaan, optional description empty/filled.
7. Confirmation Dialog initial focus, Tab containment, Escape, Cancel restoration.
8. Pending one POST, disabled buttons, Escape/outside blocked.
9. Success persistence + list/summary refresh.
10. 409 dan 503/network: no duplicate, modal ownership pulih, input tetap.
11. Breakpoint 1279→1280 dan reverse: persistent slip/touch recap parity, tanpa overlay/pointer lock.
12. Sidebar expanded/collapsed dan mobile direct navigation.

Run against 360×800, 768×1024, 1024×1366, 1366×900; zoom 200%; dark mode; reduced motion; console/page errors.

---

### Task 9: Full finance regression gates

**Objective:** Membuktikan perubahan contract tidak merusak invariants.

Run in foreground after final edit:

1. Targeted contract/migration/route/UI tests.
2. `npm run test`
3. `npm run build`
4. `npm run test:migrations`
5. `npm run db:apply:local`
6. `npm run test:critical-flow:d1`
7. `npm run test:e2e:browser`
8. Start real `npm run dev -- --host 127.0.0.1` and make actual JSON API request through Vite→Hono adapter.
9. `git diff --check`

Expected: all PASS; fixture cleanup count 0; FK clean; no browser console errors.

Jika E2E lama masih mencari heading host yang tidak lagi muncul pada redirect Transaksi canonical, migrasikan locator ke route/link semantics tanpa melemahkan mutation assertions.

---

### Task 10: Documentation, review, dan closure

**Objective:** Menyamakan source of truth dan mendapatkan review fresh.

**Files:**
- Modify: `SYSTEM_MAP.md`
- Modify: `ROADMAP.md`
- Modify: `docs/UI_UX_REDESIGN_AUDIT.md`
- Modify: `docs/AI_AGENT_PLAYBOOK.md` hanya bila prosedur durable berubah.
- Modify active handoff untuk workflow berikutnya setelah Catat kas benar-benar closed.

**Steps:**

1. Dokumentasikan schema/DTO/flow aktual, bukan rencana.
2. Catat attachment proposal tetap candidate, bukan implemented.
3. Jalankan targeted docs drift search.
4. Minta independent review terhadap current diff; perbaiki blocker; rerun affected/full gates.
5. Jangan commit/push tanpa instruksi eksplisit user pada sesi baru.
6. Jika user meminta commit, stage hanya path intended; exclude `.hermes/**`, screenshot, probe, dan artifact lokal.

---

## Risiko utama

- Backfill dapat kehilangan distinction historis; accepted karena satu field lama memang ambigu, sehingga copy existing menjadi judul adalah preservasi paling aman.
- Idempotency hash berubah saat field baru ditambahkan; deployment harus menjaga request normalization konsisten.
- Fixture/list caller yang masih mengasumsikan `keterangan` sebagai title dapat lolos typecheck bila memakai shape longgar; caller audit dan browser assertions wajib.
- Nullable transitional column memerlukan backend validation fail-closed untuk write baru.
- Jangan menyelipkan attachment proposal ke slice ini; lifecycle medianya belum siap.

## Definition of Done

- `keperluan`/`keterangan` terpisah end-to-end dan legacy row terbackfill.
- Direct mewajibkan keperluan, mengizinkan keterangan kosong; proposal mewajibkan keduanya.
- Transaksi canonical memakai keperluan sebagai title dan keterangan sebagai detail.
- Hybrid Cash Desk production sesuai desain approved pada seluruh viewport/state.
- RBAC, idempotency, audit, state machine, approved/void, summary, ownership tetap lulus.
- Semua gate Task 9 PASS setelah edit terakhir.
- Tidak ada commit/push tanpa instruksi user.
