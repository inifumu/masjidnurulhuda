# Histori Handoff — R4 Reset Desain Struktur (Superseded)

> Prompt ini telah superseded. Jangan gunakan untuk sesi baru; route evaluasi Transaksi Alt telah dihapus dan implementation terpilih sudah canonical. Gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` untuk task aktif saat ini dan `ROADMAP.md` untuk prioritas R4 keseluruhan.

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

Bahasa:
- Gunakan Bahasa Indonesia.

Aturan keras:
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan sentuh `main` atau resource production.
- `.hermes/**`, `document.documentElement.clientWidth`, dan `x.name)` adalah probe/artifact lokal; jangan di-stage atau di-commit.
- Jangan gunakan `git add -A`; stage hanya path source/test/docs yang dimaksud.
- File metadata-only/line-ending berikut harus tetap unstaged bila tanpa content diff:
  - `src/components/ui/button/index.ts`
  - `src/components/ui/input/Input.vue`

Dokumen canonical yang wajib dibaca ulang:
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
- `docs/R4_SESSION_HANDOFF_PROMPT.md`
- `docs/R4_SESSION_HANDOFF_PROMPT_REDESIGN_RESET.md`

Status repository saat handoff:
- Branch: `improve/project-foundation`
- Tracking: `origin/improve/project-foundation`
- HEAD historis closure R3: `2ae5a95` (`fix(auth): close R3 session and profile gaps`)
- `main` dan resource production tidak berubah.

Status redesign/milestone:
- P0.5: `Done`
- R1 Design Foundation: `Done`
- R2 Public Publication Experience: `Done`
- R3 Admin Shell dan Authentication: `Done`
- R4 Financial Workflows: `In Progress`

Kondisi penting saat ini:
- Route `/admin/finance` masih memakai `FinanceV2.vue` sebagai entrypoint utama.
- Sudah ada eksperimen/implementasi awal `TransactionLedger.vue` untuk workflow laporan transaksi.
- Namun hasil visual/komposisi saat ini **belum layak dilaporkan sebagai hasil redesign final**.
- Masalah utamanya: komposisi baru masih bertabrakan/bertumpuk dengan residual layout Finance lama (summary/tab/wrapper/hierarchy lama), sehingga layar terasa menumpuk dan tidak bersih.
- Artinya, implementasi saat ini **bukan baseline visual yang harus dipertahankan apa adanya**.
- Yang boleh dipertahankan: kontrak behavior, atribut domain, policy backend, audit/idempotency/void invariants, dan evidence test.
- Yang tidak boleh dipertahankan: wrapper visual/komposisi lama yang membuat layar bertabrakan.

Catatan penting baru dari user (WAJIB diikuti):
1. Lakukan slicing menu menjadi beberapa submenu/workflow nyata.
2. Buat file Vue baru untuk masing-masing submenu/slicing.
3. Menu/layar lama masih boleh disimpan dan ditampilkan sebagai `Legacy` hanya untuk acuan behavior/atribut komponen yang perlu ditampilkan.
4. `Legacy` **bukan** acuan desain.
5. Redesign harus full-clean: jangan menumpuk layar/submenu baru di atas layout Finance lama seperti sekarang.
6. Hasil yang masih saling bertabrakan seperti implementasi sekarang dianggap belum layak.

Makna praktis instruksi di atas:
- Jangan melanjutkan pendekatan “menempelkan workflow baru ke dalam komposisi `FinanceV2` lama” sebagai solusi akhir.
- Struktur target harus bergerak ke submenu/workflow terpisah dengan file layar/komponen yang jelas per concern.
- Bila perlu, `FinanceV2.vue` hanya menjadi shell/router host tipis sementara, bukan mega-screen yang memuat semua hierarchy lama dan baru sekaligus.
- Jika menu legacy tetap terlihat untuk QA/parity, labelkan jelas sebagai `Legacy` atau konteks sepadan agar tidak dianggap desain final.

Urutan kerja yang diharapkan pada sesi baru:
1. Jalankan `git status --short --branch`.
2. Audit ulang working tree dan pisahkan:
   - source production yang relevan,
   - test yang relevan,
   - dokumentasi yang relevan,
   - residual probe lokal yang harus diabaikan.
3. Trace ulang flow finance aktif:
   - router `/admin/finance`
   - `FinanceV2.vue`
   - `useKas` facade/internal modules
   - `kasService` / `dashboardService`
   - route backend transaksi/dashboard
4. Audit state visual saat ini dan tulis eksplisit mengapa komposisi lama+baru bertabrakan.
5. Rancang struktur submenu/workflow target sebelum edit besar.

Struktur submenu yang disarankan untuk R4:
- Transaksi
- Proposal
- Persetujuan
- Dashboard
- Riwayat audit
- opsional `Legacy` (hanya jika benar-benar perlu untuk parity/QA, bukan default utama)

Arah teknis yang disarankan:
- Satu file Vue baru per submenu/workflow utama.
- Contoh target file (nama bisa disesuaikan bila ada konvensi repo yang lebih baik):
  - `src/views/admin/finance/TransactionsView.vue`
  - `src/views/admin/finance/ProposalsView.vue`
  - `src/views/admin/finance/ApprovalsView.vue`
  - `src/views/admin/finance/FinanceDashboardView.vue`
  - `src/views/admin/finance/AuditHistoryView.vue`
  - `src/views/admin/finance/FinanceLegacyView.vue` atau label sepadan bila legacy perlu ditampilkan
- Komponen presentasional boleh dipecah lagi per layar.
- Business logic tetap di composable/service; jangan dipindah ke view.

Invariant yang wajib dipertahankan:
- Jangan ubah backend policy, state machine, audit, idempotency, ownership, period-summary, atau approved/void invariants demi UI.
- Jangan hard-delete transaksi approved.
- Void tetap memerlukan alasan dan tetap menyimpan histori.
- Summary tetap approved-only.
- Backend tetap otoritas RBAC; frontend hanya UX.
- Mobile tetap structured card/list, bukan horizontal-scroll table sebagai solusi utama.

Acceptance criteria tambahan untuk sesi berikutnya:
- Hierarchy menu/submenu jelas dan tidak bertabrakan dengan layout lama.
- Setiap workflow utama punya layar/file sendiri.
- Legacy, bila ditampilkan, jelas dilabeli sebagai referensi behavior/parity saja.
- Tidak ada residual segmented-control/tab/wrapper lama yang menumpuk dengan hierarchy baru tanpa alasan kuat.
- Submenu baru bersih secara visual pada 360, tablet, dan desktop.
- Loading, empty, error+retry, permission, pending, success, conflict, dan stale state tetap ada per workflow.

Evidence yang saat ini SUDAH ada dan boleh dipakai sebagai baseline behavior, bukan baseline desain:
- `npm run test` lulus.
- `npm run build` lulus.
- `npm run test:migrations` lulus.
- `npm run test:e2e:browser` lulus untuk flow browser yang ada.
- `TransactionLedger` + void reason + focus/Escape/overlay behavior sudah punya coverage test.
- Wrangler di-upgrade ke `4.111.0` karena `4.83.0` crash pada Windows/Node 24 untuk local Workers runtime.
- Dev runtime lokal sudah diverifikasi kembali berjalan setelah upgrade Wrangler.

Perubahan source yang kemungkinan sedang ada di working tree dan perlu diaudit sebelum meneruskan:
- `package.json`
- `package-lock.json`
- `SYSTEM_MAP.md`
- `src/views/admin/FinanceV2.vue`
- `src/components/admin/finance/*`
- `tests/finance-transaction-ledger.test.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Catatan verifikasi penting:
- Jangan menyatakan redesign R4 selesai hanya karena test hijau.
- Test/build/browser hijau hanya membuktikan behavior/regression tertentu, bukan kualitas komposisi visual.
- Untuk sesi berikutnya, sebelum commit UI besar, lakukan browser review nyata terhadap hierarchy submenu/workflow yang baru.

Definisi done sesi berikutnya:
- Struktur submenu/workflow baru sudah jelas dan bersih.
- Setiap submenu punya file Vue sendiri.
- Legacy (jika dipertahankan) jelas hanya sebagai parity reference.
- Tidak ada tabrakan layout lama vs baru.
- Gate relevan lulus ulang setelah perubahan source.
- Dokumentasi canonical diperbarui bila ownership/flow layar berubah.

Hal yang jangan dilakukan pada sesi berikutnya:
- Jangan meneruskan patch kosmetik kecil pada komposisi sekarang bila akar masalahnya adalah struktur layar yang salah.
- Jangan menjadikan `FinanceV2.vue` mega-screen permanen.
- Jangan menyebut hasil sekarang “selesai” atau “siap lapor” tanpa membersihkan struktur submenu/workflow.

Mulai sesi berikutnya dengan kalimat kerja seperti ini:

`Saya akan audit ulang struktur /admin/finance saat ini, identifikasi residual layout lama yang bertabrakan dengan redesign, lalu susun submenu/workflow per-file sebelum mengubah source lebih lanjut.`

---

Catatan tambahan untuk agent baru:
- Bila perlu, buat rencana migrasi bertahap dari `/admin/finance` menjadi host submenu yang tipis.
- Prioritaskan kebersihan hierarchy dan separation of concerns dibanding mempertahankan bentuk layar transisional sekarang.
- Jika ada keputusan struktur route vs tab internal yang berdampak besar, dokumentasikan trade-off sebelum edit besar.
- User sudah memberi sinyal jelas bahwa hasil saat ini belum layak dan ingin reset pendekatan desain struktur, bukan polish incremental.

---

Akhir prompt handoff.
