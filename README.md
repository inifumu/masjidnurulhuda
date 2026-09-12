> Admin aktif memakai presentasi Vue/HTML polos tanpa CSS untuk review fungsi. Lihat [kontrak reset](docs/revamp/ADMIN_FUNCTIONAL_RESET.md). Jalankan npm run dev untuk preview dengan API lokal; npm run test:e2e:browser memakai fixture API dan preview pada port 4173.

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

Untuk lane full revamp yang terisolasi, gunakan input environment yang sama lalu jalankan `npm run admin:provision:revamp`. Command ini hard-bound ke `masjidnurulhuda-revamp-db` + `wrangler.revamp.toml` dan tidak dapat diarahkan ke testing atau production. Akun bootstrap revamp saat ini adalah `superadmin@masjidnurulhuda.com`; password tidak disimpan dalam Git atau dokumentasi dan dikelola operator secara lokal.

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

- `revamp/full-product` → Pages `masjidnurulhuda-revamp`, D1 `masjidnurulhuda-revamp-db`, R2 `masjidnurulhuda-revamp-media` melalui `wrangler.revamp.toml`;
- `testing` → Pages `masjidnurulhuda-testing`, D1 `masjidnurulhuda-testing-db`, R2 `masjidnurulhuda-testing-media` melalui `wrangler.testing.toml`;
- `main` → resource production existing melalui `wrangler.toml`.

Push/PR ke `testing` tidak memakai D1 atau R2 production. Merge ke `main` menjalankan quality gate ulang sebelum migration dan deploy production.

Detail recovery, temporary SQL cleanup, dan batas environment tersedia di `RUNBOOK.md`.

## Dokumentasi aktif

Lane `revamp/full-product` telah selesai bootstrap dan dependency hardening: resource revamp terisolasi tersedia dan tidak menyentuh testing/production. Seluruh keputusan framework/shell/style terdahulu dibatalkan; review fungsi polos berjalan berdasarkan `DESIGN.md`, `docs/ADMIN_REVAMP_PRD.md`, dan `docs/revamp/ADMIN_INFORMATION_ARCHITECTURE.md`.

Seluruh presentasi admin current tidak boleh dibaca sebagai input visual. Fase aktif adalah review fungsi/workflow pada Vue/HTML native polos; source boleh ditelusuri untuk behavior/RBAC/state/data, bukan donor visual. Kontrak security/data tetap dipertahankan pada fase integrasi.

- `AGENTS.md` — satu-satunya instruksi proses, safety, dan quality gate agent
- `SYSTEM_MAP.md` — arsitektur dan flow aktual yang diverifikasi terhadap source
- `ROADMAP.md` — prioritas improvement aktif dan status milestone
- `DESIGN.md` — brief blank-canvas revamp; belum memuat token/design system final
- `docs/ADMIN_REVAMP_PRD.md` — product brief dan proses visual approval baru
- `docs/revamp/ADMIN_INFORMATION_ARCHITECTURE.md` — kontrak target menu dan child route revamp admin
- `RUNBOOK.md` — deployment, migration, backup, restore, dan incident response
- `docs/UI_UX_REDESIGN_AUDIT.md` — boundary blank-canvas, larangan inheritance, dan exit gate eksplorasi
- `docs/FEATURE_DEVELOPMENT_PLAN.md` — kandidat pengembangan produk masa depan
- `docs/REVAMP_WORKSPACE_STRATEGY.md` — topology dua worktree, kontrak full revamp, sinkronisasi branch, dan lane Cloudflare revamp
- `docs/REVAMP_BOOTSTRAP_RECORD.md` — resource ID, migration/deployment evidence, checkpoint gate, dan production non-touch record
- `docs/ADMIN_REVAMP_ACTIVE_HANDOFF.md` — handoff aktif untuk memulai sesi baru tanpa drifting
- `docs/archive/revamp-legacy-handoffs/` — seluruh handoff visual R2–R4 lama; histori saja dan bukan instruksi aktif

Dokumen dalam `docs/archive/` hanya histori dan bukan instruksi aktif.

## Status pekerjaan

Lihat `ROADMAP.md`. Jangan menyimpulkan fitur atau jaminan keamanan sudah tersedia hanya dari README; source, migration, konfigurasi runtime, dan automated test adalah bukti operasional utama.
