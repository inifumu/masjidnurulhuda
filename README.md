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

## Dokumentasi aktif

- `.hermes.md` — aturan proses, safety, dan quality gate utama
- `AGENTS.md` — instruksi ringkas untuk coding agent lain
- `SYSTEM_MAP.md` — arsitektur dan flow aktual yang diverifikasi terhadap source
- `ROADMAP.md` — prioritas improvement aktif dan status milestone
- `DESIGN.md` — kontrak visual canonical full UI/UX redesign
- `RUNBOOK.md` — deployment, migration, backup, restore, dan incident response
- `docs/AI_AGENT_PLAYBOOK.md` — prosedur kerja rinci
- `docs/UI_UX_REDESIGN_AUDIT.md` — audit stack, route/primitive overlap, migration sequence, dan anti-drift rules
- `docs/FEATURE_DEVELOPMENT_PLAN.md` — kandidat pengembangan produk masa depan

Dokumen dalam `docs/archive/` hanya histori. `optimalisasi_plan.md` deprecated dan bukan roadmap aktif.

## Status pekerjaan

Lihat `ROADMAP.md`. Jangan menyimpulkan fitur atau jaminan keamanan sudah tersedia hanya dari README; source, migration, konfigurasi runtime, dan automated test adalah bukti operasional utama.
