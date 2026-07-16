# Prompt Handoff — Mulai R4 Financial Workflows

Salin seluruh isi dokumen ini ke sesi Hermes baru.

---

Lanjutkan dari working tree saat ini di repository Masjid Nurul Huda.

Bahasa:
- Gunakan Bahasa Indonesia.

Aturan keras:
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan sentuh `main` atau resource production.
- `.hermes/**` dan `x.name)` adalah probe lokal; jangan di-stage atau di-commit.
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

Status repository saat handoff:
- Branch: `improve/project-foundation`
- Tracking: `origin/improve/project-foundation`
- HEAD closure R3: `2ae5a95` (`fix(auth): close R3 session and profile gaps`)
- Commit yang sama sudah dipromosikan ke branch `testing`.
- `main` dan resource production tidak berubah.
- Residual working tree yang disengaja:
  - metadata-only `src/components/ui/button/index.ts`;
  - metadata-only `src/components/ui/input/Input.vue`;
  - probe lokal `.hermes/**` dan `x.name)`.

Status milestone:
- P0.5: `Done`.
- Corrective security closure: `Done`.
- R1 Design Foundation: `Done`.
- R2 Public Publication Experience: `Done`.
- R3 Admin Shell dan Authentication: `Done` dan final re-audit closure selesai.
- R4 Financial Workflows: `In Progress` pada tahap discovery/audit.
- Migration latest: `0017`.

Testing environment terisolasi:
- Pages project: `masjidnurulhuda-testing`
- Alias: `https://masjidnurulhuda-testing.pages.dev`
- Deployment immutable closure R3: `https://149e00ce.masjidnurulhuda-testing.pages.dev`
- D1: `masjidnurulhuda-testing-db`
- D1 ID: `12a124d2-2674-4a07-aac1-13ba6c651ae4`
- R2: `masjidnurulhuda-testing-media`
- Config: `wrangler.testing.toml`
- CI closure R3: GitHub Actions run `29484603193` lulus verify + deploy.

Baseline R3 yang wajib dipertahankan:
- Shell admin memakai shadcn-vue Sidebar canonical.
- Desktop/tablet controls 32 px; mobile controls 44 px; header 64 px; expanded sidebar 240 px; icon rail 48 px.
- Profile summary bukan tombol; hanya ikon titik tiga menjadi account-menu trigger.
- Account menu align ke trigger, item 44 px mobile dan 32 px desktop, Escape/focus restoration lulus.
- Mobile Sheet, grouped submenu, collapsed reveal, popup collision, focus, reduced motion, sticky header/banner, dan content-only scroll sudah menjadi regression contract.
- Auth recovery memakai modal focus-contained dan recoverable retry.
- Logout membatalkan response bootstrap lama.
- Server-authorized role impersonation mempertahankan actor ID superadmin asli, memakai role efektif untuk backend policy, diaudit, exact same-origin, maksimal 15 menit, dibatasi expiry sesi asli, direkonsiliasi fail-closed, dan memiliki banner/exit permanen.
- Backend tetap otoritas RBAC; frontend visibility hanya UX.

Evidence closure R3 yang sudah lulus:
- `npm run test` → 156/156 pass.
- `npm run build` → pass.
- `npm run test:migrations` → 17 migration, FK aktif-bersih, preservasi data/akun lulus.
- `npm run test:e2e:browser` → pass.
- custom `tests/scripts/r3-admin-browser.mjs` → pass untuk 4 role × 5 viewport + impersonation mobile/tablet/desktop.
- `git diff --check` → pass.
- fresh independent pre-commit review → PASS.
- CI testing + HTTP + full custom browser live pada immutable dan alias stabil → pass.

Tujuan sesi baru: mulai R4 Financial Workflows secara trace-by-flow dan block-by-block.

Urutan R4 dari `ROADMAP.md`:
1. transaction list/detail;
2. proposal create/detail;
3. approval review/timeline;
4. dashboard;
5. audit history.

Yang harus dilakukan pertama:
1. Jalankan `git status --short --branch` dan pastikan hanya residual metadata/probe yang sudah diketahui.
2. Baca ulang dokumen canonical di atas.
3. Audit R4 sebelum edit:
   - route aktif `/admin/finance` dan dashboard;
   - `FinanceV2.vue`, komponen kas, composable facade/internal, service frontend;
   - route/service/query backend transaksi dan dashboard;
   - shared contracts, migration, dan test P0.5;
   - legacy/V2 bridge hanya sebagai behavior evidence, bukan visual baseline.
4. Tulis trace singkat:
   `FinanceV2 → useKas modules → kasService/dashboardService → admin transaction/dashboard routes → services/queries → D1`.
5. Buat inventory current behavior, duplicated workflow/tab, role matrix, state coverage, mobile/desktop composition, dan gap terhadap acceptance criteria R4.
6. Tentukan slice pertama yang paling aman. Default roadmap adalah transaction list/detail, tetapi jangan edit sebelum dependency dan contract aktual terverifikasi.
7. Bila perubahan visual besar diperlukan, buat prototype/discovery terukur dahulu dan minta approval visual sebelum commit UI.

Batas R4:
- Jangan mengubah backend policy, state machine, audit, idempotency, ownership, period-summary, atau approved/void invariants demi UI.
- Jangan hard-delete transaksi approved.
- Jangan memindahkan business logic ke view.
- Jangan membuat `V3`, bridge baru, route placeholder, atau implementation paralel.
- Mobile harus memakai structured card/list, bukan horizontal table scroll sebagai solusi utama.
- Setiap mutation harus memiliki pending, success, validation, conflict/refetch, permission, dan retry-safe behavior.
- Pertahankan P0.5 real-D1/authenticated browser regression sebagai hard gate.

Acceptance criteria R4:
- usable pada 360, tablet, dan desktop;
- transaction/proposal/approval/audit flow memiliki hierarchy task-oriented;
- approval memiliki alasan, pending, stale conflict, refetch, dan timeline;
- role/data scope tetap backend-authorized;
- `FinanceV2.vue` dipecah berdasarkan workflow tanpa menduplikasi business logic;
- loading, empty, error+retry, permission, pending, success, conflict, dan stale states tersedia;
- full unit/integration/build/migration/P0.5/browser gates lulus;
- independent review PASS;
- testing CI dan live smoke lulus;
- dokumentasi canonical sinkron;
- `main`/production tidak berubah.

Definition of Done sesi discovery pertama:
- trace dan inventory aktual tersedia dengan path/function evidence;
- gap dipisahkan menjadi bug, refactor prerequisite, dan redesign scope;
- slice implementasi pertama memiliki acceptance criteria/test plan yang konkret;
- tidak ada edit spekulatif atau placeholder;
- bila source diubah, test dibuat terlebih dahulu dan seluruh gate relevan dijalankan.

---
