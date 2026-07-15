# Prompt Handoff — Lanjutkan Corrective Refinement R3

Salin seluruh isi prompt di bawah ini ke sesi Hermes baru.

---

Lanjutkan R3 Admin Shell dan Authentication Masjid Nurul Huda dari working tree saat ini.

Repository:
- Branch: `improve/project-foundation`
- Tracking: `origin/improve/project-foundation`
- Gunakan Bahasa Indonesia.
- Zona waktu bisnis: `Asia/Jakarta`.
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan menyentuh `main` atau resource production.

Dokumen canonical yang wajib dibaca:
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

Status milestone:
- P0.5: `Done`.
- Corrective security closure: `Done`.
- R1 Design Foundation: `Done`.
- R2 Public Publication Experience: `Done`.
- R3 Admin Shell dan Authentication: `In Progress`.
- Migration latest: `0017`.
- Fresh database tidak memiliki privileged universal credential.

Baseline R3 yang sudah dipromosikan:
- Commit: `04fca5d feat(ui): establish R3 admin shell and authentication`.
- Commit yang sama sudah ada pada `origin/improve/project-foundation` dan `origin/testing`.
- GitHub Actions testing run `29424832933`: success.
- Verify: 144 test, build, migration test lulus.
- Deploy: apply D1 testing, isolated workspace, Pages deploy lulus.
- Live `/admin/login`: HTTP 200, native required/aria-required, fokus email, Inter self-hosted, control ≥44 px, overflow 0, console bersih.
- P0.5 authenticated E2E tetap lulus untuk role journey, auth recovery, conflict, pending Escape, dan overflow.
- Production tidak berubah.

Testing environment terisolasi:
- Pages: `masjidnurulhuda-testing`
- URL: `https://masjidnurulhuda-testing.pages.dev`
- D1: `masjidnurulhuda-testing-db`
- D1 ID: `12a124d2-2674-4a07-aac1-13ba6c651ae4`
- R2 bucket: `masjidnurulhuda-testing-media`
- Config: `wrangler.testing.toml`

Bootstrap superadmin:
- Local: `npm run admin:provision:local`
- Live testing: `npm run admin:provision:testing`
- Command testing hard-bound ke D1/config testing.
- Jangan menulis/mencetak password atau hash.
- Tidak ada command provisioning remote production.

Kebijakan commit/push:
- Setelah slice koheren dan seluruh test/build/browser/accessibility/security review lulus: commit langsung, push branch kerja, push commit sama ke `testing`, tunggu Actions, lalu smoke live testing.
- Jangan merge/push `main`.
- Jangan migration/deploy production.

Trace R3 aktual:
- `/admin/login` → `src/views/admin/LoginV2.vue` → `authStore.login` → `httpClient` → `/api/admin/auth/login` → limiter/auth service/D1.
- `/admin/*` → router auth bootstrap → `src/layouts/AdminLayoutV2.vue` → role-aware navigation → route view aktif.
- Backend tetap otoritas RBAC; frontend visibility hanya UX.

File utama:
- `src/layouts/AdminLayoutV2.vue`
- `src/views/admin/LoginV2.vue`
- `src/stores/authStore.ts`
- `src/router/index.ts`
- `src/components/ui/sheet/*`
- `src/components/ui/button/*`
- `src/components/ui/dropdown-menu/*`
- `tests/r3-admin-shell.test.mjs`
- `tests/scripts/r3-admin-browser.mjs`
- `tests/scripts/p05-browser-e2e.mjs`

Feedback pengguna yang wajib ditindaklanjuti sebelum closure R3:
1. Sidebar perlu lebih compact.
2. Mobile Sheet memiliki jarak header ke list menu terlalu besar/tidak konsisten.
3. Header sidebar mobile dan desktop tidak parity; lockup logo, “Masjid Nurul Huda”, dan “Ruang kerja pengurus” harus memakai hierarchy/alignment konsisten.
4. Audit ulang ukuran icon close/menu/profile/theme; close mobile sebelumnya terasa mini walau technical target 44 px sudah lulus.
5. Interaction impact tidak konsisten: theme toggle terasa, profile/account trigger dan beberapa menu tidak memberi feedback open/pressed/active yang cukup.
6. Audit component-by-component untuk spacing, icon scale, active/open/pressed/pending/focus state, transition, dan reduced-motion. Jangan memperbaiki secara acak per elemen.

Discovery fitur superadmin role preview:
- Tujuan: superadmin dapat memeriksa menu dan UX sebagai role lain tanpa gonta-ganti akun.
- Pertama putuskan bersama evidence apakah cukup **UI-only role preview** atau memerlukan **server-authorized impersonation**.
- UI-only preview hanya mengubah presentation/navigation visibility; request dan backend data scope tetap memakai role asli. Jangan klaim ini menguji RBAC backend.
- Server-authorized impersonation adalah security-sensitive dan baru boleh diimplementasikan jika contract disetujui: superadmin-only, exact same-origin, audit start/stop/target, banner permanen, expiry pendek, one-click exit, revocation, multi-tab/refresh behavior, dan negative tests.
- Jangan menyimpan role preview secara ambigu dalam JWT/cookie/localStorage dan jangan membuat bypass backend.
- Mode preview/impersonation harus selalu terlihat dan mudah dihentikan.

Tugas pertama sesi baru:
1. Re-check `git status`, branch, HEAD, dan remote tracking. Working tree sesi ini berisi perubahan dokumentasi/handoff yang belum tentu sudah di-commit; jangan membuangnya.
2. Baca source dan ambil screenshot baseline shell pada 360×800, 768×1024, dan 1366×900 dengan fixture role minimal pengurus + superadmin.
3. Buat inventory terukur: sidebar width, header height, gap header→nav, padding nav, icon size, control size, active/open/pressed/focus feedback, mobile/desktop parity.
4. Tulis trace + impact map. Perubahan role preview minimal berisiko tinggi jika menyentuh server/JWT/data scope.
5. Refine shell melalui primitive/token canonical; jangan membuat V3, bridge, local primitive duplikat, glassmorphism, atau hardcoded effect baru.
6. Tambahkan browser matrix seluruh role (`superadmin`, `ketua`, `bendahara`, `pengurus`) dan interaction gates untuk Sheet/account/theme/navigation.
7. Bila mengerjakan role preview, mulai dengan threat model dan failing tests. Jangan mengubah backend authorization secara implisit.
8. Jalankan `npm run test`, `npm run build`, `npm run test:e2e:browser`, custom R3 browser gate, dan `git diff --check`.
9. Independent pre-commit review wajib; perbaiki blocker.
10. Bila seluruh gate lulus, commit/push branch kerja + `testing`, tunggu Actions, dan smoke live testing terisolasi.

Definition of Done corrective R3:
- density sidebar compact dan konsisten;
- header/nav parity mobile-desktop;
- icon/control sizing serta interaction feedback konsisten;
- Sheet/account/theme/navigation keyboard, focus, Escape, open/pressed/active/pending state lulus;
- reduced-motion dan overflow lulus pada 360/tablet/desktop;
- role visibility seluruh role teruji;
- bila role preview dibuat, batas UI preview vs backend RBAC jujur dan security contract lulus;
- P0.5 auth/finance regression tetap lulus;
- docs canonical sinkron;
- testing live sehat dan terisolasi;
- `main`/production tidak berubah.

---
