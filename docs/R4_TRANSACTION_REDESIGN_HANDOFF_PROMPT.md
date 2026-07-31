# Handoff Closure — Corrective Redesign Transaksi R4

> Corrective slice Transaksi telah diimplementasikan dan implementation terpilih kini menjadi Transaksi canonical. Dokumen ini telah superseded; pertahankan hanya sebagai histori behavior/reliability, bukan prompt aktif atau acuan visual. Gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` untuk task aktif saat ini dan `ROADMAP.md` untuk prioritas R4 keseluruhan.

Jangan salin atau jalankan isi dokumen ini sebagai prompt. Baca hanya untuk audit histori keputusan; instruksi operasional di bawah tidak lagi berlaku.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

Bahasa:
- Gunakan Bahasa Indonesia.

Kalimat kerja pembuka:

`Saya akan mereproduksi bug filter sesi panjang dan mengaudit prototype transaksi, lalu mendesain ulang komposisi filter secara struktural serta memindahkan timeline audit ke detail transaksi inline sebelum menyentuh source.`

## Aturan keras

- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan sentuh `main` atau resource production.
- Jangan commit/push sebelum visual review dan seluruh gate relevan lulus.
- `.hermes/**`, `document.documentElement.clientWidth`, dan `x.name)` adalah probe/artifact lokal; jangan di-stage atau di-commit.
- Jangan gunakan `git add -A`; stage hanya path source/test/docs yang dimaksud.
- File berikut metadata-only/line-ending dan harus tetap unstaged bila tanpa content diff:
  - `src/components/ui/button/index.ts`
  - `src/components/ui/input/Input.vue`
- Legacy/V2 hanya referensi behavior, bukan referensi desain.
- Jangan ubah backend policy, state machine, audit, idempotency, ownership, period-summary approved-only, atau approved/void invariants demi UI.

## Dokumen canonical yang wajib dibaca ulang

- `.hermes.md`
- `AGENTS.md`
- `README.md`
- `SYSTEM_MAP.md`
- `ROADMAP.md`
- `RUNBOOK.md`
- `DESIGN.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `docs/FEATURE_DEVELOPMENT_PLAN.md`
- `docs/R4_TRANSACTION_REDESIGN_HANDOFF_PROMPT.md`

`docs/R4_SESSION_HANDOFF_PROMPT.md` dan `docs/R4_SESSION_HANDOFF_PROMPT_REDESIGN_RESET.md` telah superseded dan hanya histori.

## Status repository saat handoff

- Branch: `improve/project-foundation`
- Tracking: `origin/improve/project-foundation`
- HEAD saat dokumen dibuat: `e4fd772` (`docs: close R3 and hand off R4`)
- Working tree sengaja dirty dan memuat akumulasi source/test/docs R4.
- `main` dan resource production tidak berubah.
- Tidak ada commit/push pada corrective R4 saat ini.

## Status milestone

- P0.5: `Done`
- R1 Design Foundation: `Done`
- R2 Public Publication Experience: `Done`
- R3 Admin Shell dan Authentication: `Done`
- R4 Financial Workflows: `In Progress`
- Fokus historis saat snapshot ini dibuat: submenu **Transaksi**. Ini bukan fokus aktif; task Catat kas saat ini mengikuti handoff Entry Spine canonical, sedangkan prioritas R4 keseluruhan mengikuti `ROADMAP.md`.

## Struktur finance yang sudah aktif di working tree

`/admin/finance` adalah host tipis dan redirect ke `/admin/finance/transaksi`.

Child workflow:

- Transaksi → `/admin/finance/transaksi`
- Catat kas → `/admin/finance/transaksi-langsung`
- Proposal → `/admin/finance/proposal`
- Persetujuan → `/admin/finance/persetujuan`
- Riwayat audit → `/admin/finance/riwayat-audit`

Child dashboard finance telah dihapus karena metric periode berada di Transaksi. Sidebar sudah memiliki child finance dan exact active-state untuk Transaksi/Catat kas.

File utama:

- `src/views/admin/FinanceV2.vue`
- `src/views/admin/finance/TransactionsView.vue`
- `src/views/admin/finance/DirectTransactionView.vue`
- `src/views/admin/finance/ProposalsView.vue`
- `src/views/admin/finance/ApprovalsView.vue`
- `src/views/admin/finance/AuditHistoryView.vue`
- `src/components/admin/finance/TransactionLedger.vue`
- `src/composables/admin/useKas.ts`
- `src/composables/admin/kas/useKasState.ts`
- `src/composables/admin/kas/useKasActions.ts`
- `src/composables/admin/kas/useKasComputed.ts`
- `src/composables/admin/kas/useKasWatchers.ts`
- `src/services/admin/kasService.ts`
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

## Feedback user yang wajib diperlakukan sebagai blocker

1. **Pindahkan riwayat transaksi ke layout detail transaksi langsung tanpa perlu membuka modal seperti desain prototype.**
   - Klik/pilih transaksi harus memuat timeline melalui service existing dan merendernya inline di detail.
   - Desktop: timeline berada di persistent detail pane.
   - Tablet/mobile: timeline berada di detail drawer/full-screen yang sama, bukan modal kedua.
   - Void reason dialog tetap boleh menjadi dialog mutation karena memerlukan input/konfirmasi; modal baca timeline harus dihapus dari journey utama.
   - Legacy row tanpa event harus menampilkan `history_available=false` secara jujur, bukan event fabrikasi.

2. **Filter ketika berada di menu Keuangan terlalu lama menjadi tidak berfungsi dan baru pulih setelah hard reload/F5.**
   - Ini bug lifecycle/reliability yang belum direproduksi dan belum selesai.
   - Jangan menyimpulkan filter aman dari smoke singkat atau source-string test.
   - Audit singleton watcher `isWatcherRegistered`, child-route mount/unmount, shared module state, latest-request gate, loading disablement, stale response, dan perubahan route/role.
   - Buat browser soak/repeated-interaction repro yang bisa merah: biarkan halaman aktif, ulangi filter berkali-kali, navigasi child route pergi-kembali, lalu pastikan semua filter tetap mengubah hasil tanpa reload.

3. User berkata sekali lagi: **“DESAIN ULANG BAGIAN FILTER!”**
   - Ini adalah penolakan terhadap composition/system filter saat ini.
   - **Jangan** merespons dengan mengganti radius, spacing, border, label, atau primitive sambil mempertahankan layout yang sama.
   - Desain ulang berarti mengevaluasi dan mengubah:
     - task utama dan prioritas control;
     - information hierarchy;
     - grouping periode vs atribut transaksi;
     - hubungan search/filter/result count;
     - progressive disclosure;
     - mobile drawer/sheet vs desktop toolbar/panel;
     - applied-filter summary/chips dan clear behavior;
     - open-state dropdown geometry dan visual relationship dengan trigger;
     - loading/stale/error feedback.
   - Gunakan shadcn-vue/Reka canonical, tetapi penggunaan primitive canonical saja tidak otomatis berarti desain diterima.

## Urutan kerja wajib sesi baru

1. Jalankan `git status --short --branch`; klasifikasikan source/test/docs/probe lokal.
2. Baca dokumen canonical dan audit `docs/R4_SESSION_HANDOFF_PROMPT*` hanya sebagai histori.
3. Trace aktual:
   `AdminSidebar/FinanceV2 → TransactionsView → TransactionLedger → useKas modules → kasService/dashboardService → Hono transaction/dashboard → service/query → D1`.
4. Reproduksi bug filter sesi panjang **sebelum fix** dengan test browser merah yang deterministik.
5. Audit prototype di `.hermes/r4-experiments/` secara read-only untuk intent list/detail/timeline; jangan stage artifact tersebut.
6. Buat minimal dua alternatif komposisi filter yang benar-benar berbeda jika arah prototype filter belum eksplisit. Jangan membuat dua variasi spacing dari layout sama.
7. Lakukan visual review nyata terhadap alternatif pada 360×800, 768×1024, dan 1366×900 sebelum mengubah production filter besar.
8. Setelah arah jelas, implementasikan TDD per vertical slice:
   - lifecycle filter tahan sesi panjang;
   - filter redesign composition;
   - timeline inline detail;
   - loading/error/empty/stale/focus/responsive state.
9. Perbarui browser fixture agar query-aware dan assertion hasil nyata untuk bulan, tahun, status, arus, kategori, search, reset, repeated changes, dan route remount.
10. Jalankan full gate dan sinkronkan docs dari evidence final.

## Acceptance criteria filter redesign

- Komposisi baru tidak menyerupai panel filter saat ini yang hanya dipoles.
- Search dan filter memiliki hierarchy serta grouping task-oriented.
- Mobile 360 menggunakan disclosure yang tepat; filter kompleks tidak dipaksa menjadi grid panjang yang menumpuk.
- Tablet dan desktop menggunakan ruang secara sengaja, bukan stretch mobile.
- Trigger Input/Button/Select dan popup terbuka membentuk satu sistem shadcn-vue/Reka yang koheren.
- Dropdown/sheet terbuka diverifikasi visual, keyboard, Escape, focus return, collision, dan overflow.
- Applied state terlihat jelas tanpa bergantung pada isi dropdown.
- Semua filter menghasilkan perubahan data nyata dan reset mengembalikan state canonical.
- Filter tetap berfungsi setelah soak, repeated changes, child-route navigation, dan role/session refresh tanpa F5.
- Latest request menang; response lama tidak menimpa filter terbaru.
- Loading tidak membuat UI terkunci permanen.

## Acceptance criteria detail/timeline

- Memilih transaksi membuka detail sesuai responsive contract yang ada.
- Timeline dimuat dan ditampilkan inline di detail yang sama.
- Tidak ada tombol yang mengharuskan modal baca timeline sebagai journey utama.
- Loading, retryable error, empty legacy history, dan timeline populated tersedia.
- Perubahan selected transaction membatalkan/mengabaikan response timeline lama.
- Tablet/mobile Escape menutup detail dan mengembalikan fokus ke row.
- Void tetap role-aware, hanya dari status approved, membutuhkan alasan 10–500 karakter, dan menyimpan histori.

## Evidence terakhir yang sudah ada, tetapi tidak menutup blocker baru

- `npm run test` → 160/160 pass.
- `npm run build` → pass.
- `npm run test:migrations` → 17 migration, FK aktif-bersih.
- `npm run test:e2e:browser` → pass pada 360×800, 768×1024, 1366×900.
- Browser fixture sudah query-aware untuk period/arus/kategori.
- Exact active-state sidebar Transaksi vs Catat kas sudah diperbaiki.

Evidence tersebut hanya baseline regression. Ia **tidak** membuktikan:

- filter tahan halaman yang terbuka lama;
- desain filter sudah diterima user;
- setiap open-state dropdown/sheet koheren secara visual;
- timeline sudah inline di detail.

## Gate minimum sebelum menyatakan corrective slice selesai

- failing regression test direproduksi sebelum fix;
- targeted tests lulus;
- `npm run test`;
- `npm run build`;
- `npm run test:migrations`;
- `npm run test:critical-flow:d1` bila flow finance orchestration berubah;
- `npm run test:e2e:browser`;
- browser soak/repeated-filter test baru pada 360, tablet, desktop;
- screenshot/visual inspection viewport dan dropdown/sheet terbuka;
- keyboard/focus/Escape/reduced-motion/overflow/console checks;
- real Vite→Hono adapter→Miniflare/workerd startup + request API aktual;
- `git diff --check`;
- independent review sebelum commit;
- docs canonical sinkron.

## Larangan

- Jangan menyebut filter selesai hanya karena request URL berubah.
- Jangan menambahkan local filtering sebagai pengganti menemukan bug lifecycle server-bound filter.
- Jangan menutup bug dengan reload otomatis halaman.
- Jangan mempertahankan modal timeline hanya karena test lama mengharapkannya.
- Jangan melakukan polish incremental lalu menyebutnya redesign.
- Jangan membuat V3/bridge/route paralel.
- Jangan mengubah backend authorization atau invariant finance demi memudahkan UI.
- Jangan broad-stage probe/artifact/metadata-only files.

## Definition of Done sesi berikutnya

- Bug filter sesi panjang memiliki root cause dan regression evidence.
- Filter benar-benar didesain ulang secara struktural dan diterima melalui visual review.
- Semua filter bekerja nyata dan tahan repeated/soak/remount tanpa F5.
- Timeline audit berada inline di detail transaksi seperti prototype.
- Responsive, accessibility, mutation safety, dan regression gates lulus.
- Dokumentasi canonical dan handoff berikutnya sinkron.

---

Akhir prompt handoff.
