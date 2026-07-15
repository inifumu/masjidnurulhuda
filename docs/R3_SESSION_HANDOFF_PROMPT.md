# Prompt Handoff — Lanjutkan Closure Corrective R3 Shadcn Sidebar

Salin seluruh isi prompt di bawah ini ke sesi Hermes baru.

---

Lanjutkan closure R3 Admin Shell dan Authentication Masjid Nurul Huda dari working tree saat ini.

Repository:
- Branch: `improve/project-foundation`
- Tracking: `origin/improve/project-foundation`
- Gunakan Bahasa Indonesia.
- Zona waktu bisnis: `Asia/Jakarta`.
- Jangan reset, stash, checkout, clean, atau membuang perubahan existing.
- Jangan menyentuh `main` atau resource production.
- Artefak `.hermes/**` dan file `x.name)` adalah probe lokal; jangan di-stage atau di-commit.
- Jangan gunakan `git add -A`; stage hanya path source/test/docs yang dimaksud.

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
- `docs/R3_SESSION_HANDOFF_PROMPT.md`

Status milestone:
- P0.5: `Done`.
- Corrective security closure: `Done`.
- R1 Design Foundation: `Done`.
- R2 Public Publication Experience: `Done`.
- R3 Admin Shell dan Authentication: `In Progress`.
- Migration latest: `0017`.
- Fresh database tidak memiliki privileged universal credential.

Status source R3 saat handoff ini:
- Shell admin telah dirombak ke primitive shadcn-vue Sidebar canonical.
- Navigation composition ada di `src/components/admin/shell/AdminSidebar.vue`.
- `src/layouts/AdminLayoutV2.vue` sekarang hanya mengorkestrasi auth recovery, header/breadcrumb, trigger, theme, dan content inset.
- Desktop geometry contract:
  - shell controls 32 px;
  - icon rail 48 px;
  - header 64 px;
  - sidebar expanded 240 px.
- Mobile geometry contract:
  - shell controls 44 px;
  - account row 48 px;
  - header 64 px;
  - off-canvas sidebar.
- Logo resmi `/logo.png` dipakai pada header sidebar.
- Collapse motion brand/account sekarang shrink/fade sinkron dengan sidebar width.
- Group icon saat sidebar collapsed melakukan expand + reveal submenu group tersebut.
- Role preview/impersonation belum diimplementasikan.

Route/source penting:
- `/admin/login` → `src/views/admin/LoginV2.vue` → `authStore.login` → `httpClient` → `/api/admin/auth/login`.
- `/admin/*` → router auth bootstrap → `src/layouts/AdminLayoutV2.vue` → `src/components/admin/shell/AdminSidebar.vue` → route view aktif.
- Backend tetap otoritas RBAC; frontend visibility hanya UX.

Leaf navigation nyata saat ini:
- Ringkasan → `/admin/dashboard`
- Keuangan → `/admin/finance`
- Media & publikasi → `/admin/media`, `/admin/galeri-dokumentasi`
- Pengaturan → `/admin/pengaturan`

Catatan penting:
- Jangan menambah submenu palsu untuk workflow yang belum punya route nyata.
- `FinanceV2` dan `PengaturanV2` masih mengandung tab/workspace internal; pemecahan child-route belum dikerjakan di slice ini.

Gate lokal terbaru yang SUDAH lulus pada working tree source/test/docs:
- `npm run test` → 145/145 pass.
- `npm run build` → pass.
- `npm run test:e2e:browser` → pass.
- Custom R3 browser gate (`tests/scripts/r3-admin-browser.mjs`) → pass untuk 4 role × 3 viewport.
- `git diff --check` → pass.

Perbaikan penting yang sudah selesai:
- nested Escape mobile: Escape langsung menutup Sheet bila tidak ada transient layer lain; saat dropdown akun terbuka, Escape pertama hanya menutup dropdown, Escape/close berikutnya menutup Sheet.
- popup akun mobile tampil ke atas dan tetap di dalam viewport.
- popup akun menggunakan radius `rounded-md` konsisten.
- breadcrumb spacing optik terukur simetris 16 px / 16 px dari glyph ke separator dan separator ke breadcrumb.
- account collapsed centerline sudah terukur benar secara optik.
- animasi collapsible submenu sudah ada (`collapsible-up/down`) dan menghormati reduced motion.
- drift generator dibersihkan: tidak ada `@lucide/vue`, tidak ada Google Geist, dependency/lockfile sudah kembali baseline.
- `SidebarTrigger` mengekspose `aria-expanded` dan `aria-controls`.
- nested `<main>` sudah diperbaiki (hanya satu landmark `main` dari `SidebarInset`).
- browser gate sekarang mengassert focus kembali ke `data-account-trigger` setelah Escape menutup popup akun.

Independent review terakhir:
- Review lama sempat FAIL karena nested `<main>` dan staging hygiene.
- Nested `<main>` sudah diperbaiki.
- Staging hygiene belum dilakukan (working tree masih berisi banyak untracked probe lokal).
- Review independen baru perlu diminta lagi setelah re-check diff final, karena source berubah setelah verdict FAIL lama.

Yang harus dilakukan pertama kali di sesi baru:
1. Re-check `git status --short --branch`.
2. Sebelum audit final, commit, atau push, perbaiki dulu temuan visual tambahan berikut pada shell R3:
   - ikon tiga titik pada profile mobile display harus sejajar dengan ikon `X` close drawer dan ikon arrow/chevron submenu di area atas drawer;
   - ganti ikon sidebar trigger untuk mobile display ke ikon hamburger/menu yang lebih tepat;
   - audit ulang konsistensi ukuran ikon: ikon tema saat ini terasa lebih besar daripada ikon lain (sekitar 20 px vs 16 px). Samakan style tile ikon tema dengan ikon shell lain;
   - samakan ukuran SVG ikon shell lain agar mengikuti ukuran ikon tema, yaitu 20 px, bila hasil visualnya paling konsisten;
   - lakukan perbaikan ini lebih dulu, lalu baru ulang audit geometry/interaction shell secara menyeluruh.
3. Pastikan hanya file source/test/docs yang benar-benar ingin di-commit akan di-stage.
4. Konfirmasi tidak ada diff content pada file yang hanya kena line-ending metadata (`src/components/ui/button/index.ts`, `src/components/ui/input/Input.vue`, `src/components/ui/sheet/SheetContent.vue`). Jika benar tidak ada content diff, jangan stage.
5. Minta fresh independent pre-commit review karena verdict lama sudah stale setelah perbaikan.
6. Jika PASS, commit slice koheren corrective R3.
7. Push branch kerja dan push commit yang sama ke branch `testing`.
8. Tunggu GitHub Actions testing selesai.
9. Smoke live testing (`masjidnurulhuda-testing.pages.dev`) dengan HTTP + custom R3 browser gate pada deployment live.

Candidate tracked files yang kemungkinan memang perlu di-stage (verifikasi ulang sebelum commit):
- `README.md`
- `SYSTEM_MAP.md`
- `ROADMAP.md`
- `RUNBOOK.md`
- `docs/AI_AGENT_PLAYBOOK.md`
- `docs/UI_UX_REDESIGN_AUDIT.md`
- `docs/R3_SESSION_HANDOFF_PROMPT.md`
- `src/assets/main.css`
- `src/layouts/AdminLayoutV2.vue`
- `src/components/admin/shell/AdminSidebar.vue`
- `src/components/ui/collapsible/*`
- `src/components/ui/separator/*`
- `src/components/ui/sidebar/*`
- `src/components/ui/tooltip/*`
- `tests/r3-admin-shell.test.mjs`
- `tests/scripts/r3-admin-browser.mjs`

Candidate yang TIDAK boleh masuk commit:
- `.hermes/**`
- `x.name)`
- file dengan perubahan metadata-only/line ending tanpa content diff

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
- Jangan menulis/mencetak password atau hash.
- Tidak ada command provisioning remote production.

Definition of Done corrective R3:
- shell shadcn-vue Sidebar canonical stabil desktop/mobile;
- geometry konsisten per display mode;
- header/nav/account/menu/submenu/popup motion konsisten;
- mobile Sheet/account/theme/navigation keyboard, focus, Escape, popup collision, open/pressed/active state lulus;
- role visibility seluruh role teruji;
- P0.5 auth/finance regression tetap lulus;
- docs canonical sinkron;
- testing live sehat dan terisolasi;
- `main`/production tidak berubah.

---
