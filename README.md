# Website Masjid Nurul Huda

Website publik dan panel administrasi Masjid Nurul Huda untuk informasi masjid, jadwal salat, transparansi kas, proposal/persetujuan transaksi, media, galeri, dan pengaturan.

## Stack

- Vue 3 + TypeScript + Vite + Pinia + Vue Router
- Hono.js pada Cloudflare Pages/Workers
- Cloudflare D1 untuk database
- Cloudflare R2 untuk media

## Menjalankan secara lokal

```bash
npm install
npm run db:apply:local
npm run dev
```

### Setup superadmin pertama

Fresh database tidak memiliki credential privileged universal. Setelah migration selesai, buat superadmin pertama dari Git Bash tanpa menulis password ke source atau file tracked:

```bash
export PROVISION_ADMIN_EMAIL='superadmin@example.com'
export PROVISION_ADMIN_NAME='Superadmin'
read -s -p 'Password superadmin: ' PROVISION_ADMIN_PASSWORD
export PROVISION_ADMIN_PASSWORD
printf '\n'

npm run admin:provision:local

unset PROVISION_ADMIN_EMAIL PROVISION_ADMIN_NAME PROVISION_ADMIN_PASSWORD
```

Password minimal 16 karakter dan harus memuat huruf kecil, huruf besar, angka, serta simbol. Command bersifat idempotent dan tidak menimpa akun existing. Jika akun existing memang harus dipulihkan, ulangi dengan `npm run admin:provision:local -- --replace-existing`.

Untuk workspace live testing, gunakan input environment yang sama lalu jalankan:

```bash
npm run admin:provision:testing
```

Command testing hard-bound ke `masjidnurulhuda-testing-db`; tidak ada command provisioning remote production. Provisioning atau recovery production wajib mengikuti change window dan persetujuan eksplisit di `RUNBOOK.md`.

Validasi canonical:

```bash
npm run test
npm run build
npm run db:apply:local
git diff --check
```

Jangan membaca atau memasukkan `.env`, `.dev.vars`, token, cookie, atau credential ke source maupun dokumentasi.

## Database dan deployment

Migration berada di `migrations/` dan tidak boleh diedit setelah berpotensi diterapkan. Gunakan migration baru untuk perubahan schema.

```bash
npm run db:apply:local
```

Migration remote dan deployment hanya boleh dilakukan dengan persetujuan eksplisit serta mengikuti `RUNBOOK.md`. Backup wajib dibuat sebelum migration yang membangun ulang tabel atau menyentuh data finansial.

Branch deployment permanen:

- `testing` → Pages `masjidnurulhuda-testing`, D1 `masjidnurulhuda-testing-db`, R2 `masjidnurulhuda-testing-media` melalui `wrangler.testing.toml`;
- `main` → resource production existing melalui `wrangler.toml`.

Push/PR ke `testing` tidak memakai D1 atau R2 production. Merge ke `main` menjalankan quality gate ulang sebelum migration dan deploy production.

Detail recovery, temporary SQL cleanup, dan batas environment tersedia di `RUNBOOK.md`.

## Dokumentasi aktif

Status redesign: R1 Design Foundation, R2 Public Publication Experience, dan R3 Admin Shell dan Authentication `Done`. Foundation canonical berada di `src/components/ui`, component lab development-only di `/_design-system`, dan seluruh dialog operasional telah memakai reka tanpa dependency Headless UI. Baseline homepage R2 diterima; opsi evolusi visual yang lebih modern dicatat sebagai kandidat non-aktif di `docs/FEATURE_DEVELOPMENT_PLAN.md`.

R3 memakai shell shadcn-vue Sidebar canonical dengan grouped submenu, icon collapse desktop, mobile off-canvas, profile summary + trigger akun khusus, geometry desktop 32 px / mobile 44 px, motion collapse sinkron, dan ikon shell 20 px. Superadmin asli dapat mengaktifkan role samaran server-side maksimal 15 menit; backend, data scope, dan mutasi mengikuti role efektif, actor tetap superadmin asli, expiry direkonsiliasi fail-closed, dan banner permanen selalu terlihat. Workstream aktif berikutnya adalah R4 Financial Workflows.

- `.hermes.md` — aturan proses, safety, dan quality gate utama
- `AGENTS.md` — instruksi ringkas untuk coding agent lain
- `SYSTEM_MAP.md` — arsitektur dan flow aktual yang diverifikasi terhadap source
- `ROADMAP.md` — prioritas improvement aktif dan status milestone
- `DESIGN.md` — kontrak visual canonical full UI/UX redesign
- `RUNBOOK.md` — deployment, migration, backup, restore, dan incident response
- `docs/AI_AGENT_PLAYBOOK.md` — prosedur kerja rinci
- `docs/UI_UX_REDESIGN_AUDIT.md` — audit stack, route/primitive overlap, migration sequence, dan anti-drift rules
- `docs/FEATURE_DEVELOPMENT_PLAN.md` — kandidat pengembangan produk masa depan
- `docs/R3_SESSION_HANDOFF_PROMPT.md` — histori handoff closure R3; status aktif berikutnya tetap ditentukan dari `ROADMAP.md`
- `docs/R4_SESSION_HANDOFF_PROMPT.md` — prompt aktif untuk memulai discovery dan implementasi R4 pada sesi baru

Dokumen dalam `docs/archive/` hanya histori. `optimalisasi_plan.md` deprecated dan bukan roadmap aktif.

## Status pekerjaan

Lihat `ROADMAP.md`. Jangan menyimpulkan fitur atau jaminan keamanan sudah tersedia hanya dari README; source, migration, konfigurasi runtime, dan automated test adalah bukti operasional utama.
