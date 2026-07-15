# Prompt Handoff — R2 Public Publication Experience (Superseded)

> Arsip handoff historis. R2 sudah `Done`; jangan gunakan prompt ini untuk sesi baru. Gunakan `docs/R3_SESSION_HANDOFF_PROMPT.md` untuk melanjutkan workstream aktif.

Isi di bawah dipertahankan hanya sebagai histori konteks R2.

---

Lanjutkan R2 Public Publication Experience Masjid Nurul Huda dari working tree saat ini.

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

Status milestone:
- P0.5: `Done`.
- Corrective security closure: `Done`.
- R1 Design Foundation: `Done`.
- R2 Public Publication Experience: `In Progress`.
- Migration latest: `0017`.
- Known default credential sudah dinonaktifkan.
- Fresh database tidak memiliki privileged universal credential.

R1 closure evidence:
- Commit: `8c0d282 feat(ui): complete R1 design foundation`.
- Commit yang sama sudah ada pada:
  - `origin/improve/project-foundation`;
  - `origin/testing`.
- GitHub Actions testing run: `29419702186`, status success.
- Verify job, 139 test, build, migration test, apply D1 testing, isolated workspace, dan Pages deploy lulus.
- Authenticated finance Chromium E2E lulus pada 360×800 dan 1366×900: role journey, recovery, conflict, pending Escape guard, dan overflow.
- Component lab R1 lulus pada 360×800, 768×1024, 1366×900: overflow, touch target ≥44 px, keyboard, focus-visible, reduced motion, self-hosted Inter, dan console bersih.
- `@headlessui/vue` telah dihapus; jangan memperkenalkannya kembali.
- Primitive canonical R1 tersedia di `src/components/ui`, termasuk form, Select/Combobox/DatePicker, reka Dialog/AlertDialog, responsive data display, timeline, hierarchy, status, skeleton, dan data states.

Testing environment terisolasi:
- Pages: `masjidnurulhuda-testing`
- URL: `https://masjidnurulhuda-testing.pages.dev`
- D1: `masjidnurulhuda-testing-db`
- D1 ID: `12a124d2-2674-4a07-aac1-13ba6c651ae4`
- R2 bucket: `masjidnurulhuda-testing-media`
- Config: `wrangler.testing.toml`
- Live smoke R1: homepage HTTP 200; `/api/public/kas/summary` HTTP 200 dan nilainya sesuai query D1 testing; `/_design-system` hanya SPA shell dan tidak mendaftarkan route lab production.
- Production tidak berubah.

Bootstrap superadmin:
- Local: `npm run admin:provision:local`
- Live testing: `npm run admin:provision:testing`
- Command testing hard-bound ke D1/config testing.
- Tidak ada command provisioning remote production.
- Jangan menulis atau mencetak password/hash credential.
- Command default tidak overwrite akun existing.
- `--replace-existing` hanya untuk recovery eksplisit.
- Ikuti `README.md` dan `RUNBOOK.md`.

Kebijakan commit/push:
- Jika slice koheren, seluruh test/build/browser/accessibility gate relevan lulus, diff tidak mengandung secret/artifact, dan tidak ada blocker/bug:
  1. commit langsung tanpa meminta konfirmasi;
  2. push `improve/project-foundation`;
  3. push commit yang sama ke `testing`;
  4. tunggu GitHub Actions;
  5. smoke-check live testing dan resource isolation.
- Jangan merge/push `main`.
- Jangan migration/deploy production.

Visual source of truth:
- `DESIGN.md`: Nurul Huda Civic Editorial.
- Warm modern minimalism, editorial public experience, institutional admin UI.
- Emerald untuk identitas; gold sangat hemat.
- Mobile-first mulai 360 px, lalu tablet dan desktop.
- Jangan membuat V3, visual bridge, primitive duplikat, reskin legacy, glassmorphism, blur placeholder, gradient dekoratif, atau card grid generik.
- R1 primitive canonical harus dipakai; jangan membuat pengganti lokal di view.

Trace R2 aktual:
`/` → `src/layouts/PublicLayout.vue` → `src/views/public/Home.vue` → `src/components/public/home/*` → composable/service publik → `/api/public/*` → Hono/service/D1 atau external API.

Route publik aktif:
- Hanya homepage `/` di bawah `PublicLayout.vue`.
- Jangan membuat route publik placeholder yang tampak operasional.

File R2 utama:
- `src/layouts/PublicLayout.vue`
- `src/views/public/Home.vue`
- `src/components/public/home/HeroSection.vue`
- `src/components/public/home/JadwalSholat.vue`
- `src/components/public/home/KasWidget.vue`
- `src/components/public/home/KabarMasjid.vue`
- `src/components/public/home/GaleriWidget.vue`
- `src/components/public/home/KritikSaran.vue`
- `src/composables/public/home/*`
- `src/services/public/home/jadwalService.ts`
- `src/services/public/home/kasSummaryService.ts`

Audit awal R2 yang sudah ditemukan:
- `PublicLayout.vue` masih penuh Slate/dark hex, blur, shadow, pill, dan manual smooth-scroll timer.
- Hero masih memakai radial gradient dan pulse dekoratif.
- Jadwal salat masih berupa elevated card besar.
- Transparansi kas memakai tiga kartu dekoratif dan hover motion.
- Kabar, galeri, dan kritik/saran memakai fake placeholder blur/locked UI.
- Footer memuat alamat, telepon, email, dan CTA donasi contoh yang belum terverifikasi.
- Service aktual hanya ditemukan untuk jadwal salat dan ringkasan kas; pertahankan flow service/API existing.
- Jangan mempublikasikan alamat, kontak, donasi, jadwal, artikel, atau galeri contoh yang belum terverifikasi. Gunakan state unavailable/empty yang jujur.

Target R2:
1. Redesign public shell/navbar/footer Civic Editorial.
2. Redesign homepage editorial end-to-end, bukan reskin V2.
3. Pertahankan behavior dan service jadwal salat serta ringkasan kas.
4. Tambahkan loading, recoverable error + retry, empty/unavailable, success, dan stale/fallback state sesuai data source aktual.
5. Ganti fake blur/locked placeholder kabar, galeri, dan kritik/saran dengan honest unavailable/empty state.
6. Satu primary action yang jelas; jangan membuat CTA palsu atau dead link `href="#"` yang terlihat operasional.
7. Navigasi mobile harus memiliki accessible name, Escape/close yang benar, focus-visible, touch target ≥44 px, dan tidak bergantung pada hover.
8. Jangan menaruh business logic baru di view; gunakan composable/service existing atau utility domain yang tepat.
9. Update `SYSTEM_MAP.md`, `ROADMAP.md`, dan audit redesign jika flow/status/adoption berubah.

Tugas pertama sesi baru:
1. Re-check `git status`, branch, dan commit HEAD; jangan mengasumsikan snapshot handoff masih identik.
2. Audit source lengkap `PublicLayout.vue`, `Home.vue`, seluruh section, composable, service, endpoint, test, dan asset yang benar-benar dipakai.
3. Tulis trace note dan impact map ringkas.
4. Implementasikan R2 secara kontinu tanpa berhenti melaporkan tiap micro-slice; hanya berhenti jika ada blocker keputusan nyata.
5. Mulai dari public shell/navbar/footer lalu homepage composition dan section states.
6. Jalankan browser gate 360×800, 768×1024, 1366×900:
   - tidak ada horizontal overflow;
   - hierarchy editorial jelas;
   - control ≥44 px;
   - keyboard/focus-visible/Escape mobile nav;
   - loading/error/retry/empty states;
   - self-hosted Inter, tanpa Google Fonts;
   - console bersih;
   - prefers-reduced-motion;
   - tidak kembali ke pastel/card-heavy/glass UI slop.
7. Jalankan `npm run test`, `npm run build`, browser public E2E, dan `git diff --check`.
8. Independent pre-commit review wajib; perbaiki blocker sebelum commit.
9. Bila semua gate lulus, commit/push branch kerja + `testing`, tunggu Actions, dan smoke live testing.

Definition of Done R2:
- public shell dan homepage Civic Editorial tersedia end-to-end;
- seluruh section memakai data/state yang jujur;
- flow API/service publik tidak diregresikan;
- tidak ada fake operational UI atau data contoh unverifikasi;
- responsive/accessibility/browser gates lulus;
- test/build lulus;
- docs canonical sinkron;
- live testing sehat dan tetap terisolasi;
- `main`/production tidak berubah.

---
