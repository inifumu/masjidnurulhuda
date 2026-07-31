# Histori Handoff — R3 Corrective Closure Selesai

Dokumen ini dipertahankan sebagai snapshot histori evidence awal R3 dan telah superseded. Angka gate/viewport di bawah adalah bukti pada saat snapshot lama, bukan status terbaru. Jangan gunakan sebagai prompt sesi aktif; gunakan `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` untuk task aktif saat ini dan `ROADMAP.md` untuk prioritas R4 keseluruhan.

---

R3 Admin Shell dan Authentication telah ditutup. Gunakan dokumen ini sebagai histori evidence; workstream aktif berikutnya ditentukan dari `ROADMAP.md`.

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
- R3 Admin Shell dan Authentication: `Done` (2026-07-16).
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
- Server-authorized role impersonation telah diimplementasikan sebagai extension R3 dan refinement banner global/sticky telah ditutup pada commit `64cf1ef`.

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

Closure evidence final:
- commit corrective source `a6d9e2b` telah melalui independent review PASS;
- ikon shell 20 px, alignment mobile, hamburger trigger, nested Escape, focus restoration, popup collision, reduced motion, dan landmark/ARIA telah diverifikasi;
- gate lokal lulus: `npm run test` 145/145, `npm run build`, `npm run test:e2e:browser`, custom R3 browser matrix empat role × tiga viewport, dan `git diff --check`;
- GitHub Actions testing run `29453040378` lulus verify/deploy;
- HTTP smoke dan custom R3 browser matrix live lulus pada `https://masjidnurulhuda-testing.pages.dev`;
- `.hermes/**`, `x.name)`, dan file metadata-only tidak masuk commit;
- `main` dan resource production tidak berubah.

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
