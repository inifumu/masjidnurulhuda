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

Lane `revamp/full-product` telah selesai bootstrap dan dependency hardening: audit turun dari 14 menjadi 2 residual moderate development-only tanpa fix kompatibel, seluruh gate lokal/CI/deploy lulus, deployment revamp terikat commit `67fef24`, dan superadmin revamp telah diprovision terpisah. Full revamp berikutnya dimulai dari product brief, information architecture, user journey, dan minimal dua prototype struktural yang berbeda sebelum route production diubah. UI current hanya inventory behavior/RBAC/state, bukan donor visual.

R3 memakai shell shadcn-vue Sidebar canonical dengan grouped submenu, icon collapse desktop, mobile off-canvas, profile summary + trigger akun khusus, geometry desktop 32 px / mobile 44 px, motion collapse sinkron, dan ikon shell 20 px. Superadmin asli dapat mengaktifkan role samaran server-side maksimal 15 menit; backend, data scope, dan mutasi mengikuti role efektif, actor tetap superadmin asli, expiry direkonsiliasi fail-closed, dan banner permanen selalu terlihat. Workstream aktif adalah R4 Financial Workflows. Transaksi, Catat kas Entry Spine, dan Proposal Request Brief telah menjadi route/task surface canonical pada working tree; workflow berikutnya adalah redesign Persetujuan tanpa mengubah approval state machine.

- `.hermes.md` — aturan proses, safety, dan quality gate utama
- `AGENTS.md` — instruksi ringkas untuk coding agent lain
- `SYSTEM_MAP.md` — arsitektur dan flow aktual yang diverifikasi terhadap source
- `ROADMAP.md` — prioritas improvement aktif dan status milestone
- `DESIGN.md` — kontrak visual canonical full UI/UX redesign
- `RUNBOOK.md` — deployment, migration, backup, restore, dan incident response
- `docs/AI_AGENT_PLAYBOOK.md` — prosedur kerja rinci
- `docs/UI_UX_REDESIGN_AUDIT.md` — audit stack, route/primitive overlap, migration sequence, dan anti-drift rules
- `docs/FEATURE_DEVELOPMENT_PLAN.md` — kandidat pengembangan produk masa depan
- `docs/REVAMP_WORKSPACE_STRATEGY.md` — topology dua worktree, kontrak full revamp, sinkronisasi branch, dan lane Cloudflare revamp
- `docs/REVAMP_BOOTSTRAP_RECORD.md` — resource ID, migration/deployment evidence, checkpoint gate, dan production non-touch record
- `docs/DEPENDENCY_SECURITY_AUDIT.md` — upgrade dependency, reachability advisory, residual accepted risk, dan evidence gate
- `docs/R3_SESSION_HANDOFF_PROMPT.md` — histori handoff closure R3; status aktif berikutnya tetap ditentukan dari `ROADMAP.md`
- `docs/R4_APPROVAL_REDESIGN_HANDOFF.md` — handoff aktif untuk audit dan prototype-first redesign workflow Persetujuan setelah closure Proposal Request Brief
- `docs/R4_PROPOSAL_PROTOTYPE_HANDOFF.md` dan `docs/R4_PROPOSAL_HIERARCHY_CORRECTION_HANDOFF.md` — histori prototype serta koreksi hierarchy Proposal; superseded oleh handoff Persetujuan aktif
- `docs/R4_CATAT_KAS_FINISHING_AND_DOC_SYNC_HANDOFF.md` — histori corrective Catat kas Entry Spine; superseded oleh handoff Proposal aktif
- `docs/R4_DIRECT_TRANSACTION_IMPLEMENTATION_HANDOFF.md` — histori implementasi contract `keperluan`/`keterangan` dan vertical slice Catat kas; superseded oleh handoff finishing aktif
- `docs/R4_FINANCE_WORKFLOWS_HANDOFF_PROMPT.md` — histori discovery workflow finance setelah Transaksi canonical; telah superseded untuk slice Catat kas oleh handoff implementasi aktif
- `docs/R4_TRANSACTION_ALT_HANDOFF_PROMPT.md` — histori audit route evaluasi yang kini telah dipromosikan menjadi transaksi canonical; bukan instruksi aktif
- `docs/R4_TRANSACTION_REDESIGN_HANDOFF_PROMPT.md` — histori closure corrective Transaksi R4 beserta acceptance notes dan evidence reproduksi
- `docs/R4_SESSION_HANDOFF_PROMPT.md` dan `docs/R4_SESSION_HANDOFF_PROMPT_REDESIGN_RESET.md` — histori handoff R4 yang telah superseded

Dokumen dalam `docs/archive/` hanya histori. `optimalisasi_plan.md` deprecated dan bukan roadmap aktif.

## Status pekerjaan

Lihat `ROADMAP.md`. Jangan menyimpulkan fitur atau jaminan keamanan sudah tersedia hanya dari README; source, migration, konfigurasi runtime, dan automated test adalah bukti operasional utama.
