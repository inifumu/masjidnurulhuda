# AGENTS.md — Masjid Nurul Huda

Satu-satunya instruksi agent untuk repository ini. Gunakan Bahasa Indonesia untuk laporan teknis. Zona waktu bisnis: `Asia/Jakarta`.

## Baseline aktif — 12 September 2026

- Stack: Vue 3 + TypeScript + Tailwind CSS, Hono, Cloudflare D1/R2.
- Eksperimen Material Design, PrimeVue, Varlet, Reka, shadcn-vue, dan sistem visual lama dibatalkan.
- Panel admin sedang menjalani blank-canvas revamp. Source, arsip, screenshot, prototype, component lab, dan test visual lama bukan donor desain.
- Admin Vue/HTML polos hanya alat review fungsi, bukan baseline visual.
- Kontrak backend, security, data, dan IA route-level tetap berlaku.
- Identitas merek yang tetap berlaku: emerald dengan aksen yellow-gold terkendali.

## Sumber kebenaran

1. Permintaan eksplisit pengguna.
2. Source code, migration, konfigurasi runtime, dan automated test.
3. `SYSTEM_MAP.md` untuk arsitektur dan flow aktual; wajib diverifikasi terhadap source.
4. `ROADMAP.md` untuk backlog aktif.
5. `DESIGN.md` untuk brief dan keputusan visual yang telah disetujui.
6. `docs/ADMIN_REVAMP_PRD.md` untuk scope produk dan gate approval.
7. `docs/revamp/ADMIN_INFORMATION_ARCHITECTURE.md` untuk IA admin.
8. `RUNBOOK.md` untuk operasi, migration, deployment, backup, dan recovery.
9. `docs/archive/` hanya histori dan tidak boleh menjadi instruksi aktif.

Jika fakta tidak ditemukan, tulis `Not found`; jangan berasumsi.

## Workflow

Sebelum edit:

- baca bagian relevan `SYSTEM_MAP.md`;
- temukan entrypoint dan caller aktual;
- periksa test dan migration terkait;
- bedakan current implementation, known gap, dan target roadmap;
- tampilkan trace singkat, target file, alasan, dan risiko.

Trace implementation:

`User action → Route/View → Component/Composable/Store → Frontend Service/httpClient → Hono Route/Middleware → Service/Policy → Repository/Query → D1/R2/External API`

Jangan blind scan. Abaikan `node_modules`, `.git`, `dist`, `build`, `coverage`, cache, log, minified asset, source map, dan lockfile kecuali task terkait dependency.

Selama eksplorasi visual blank-canvas:

- gunakan `SYSTEM_MAP.md` hanya untuk semantik dan domain;
- jangan membaca presentation source lama sebagai inspirasi visual;
- baca API/DTO/test secara terarah hanya untuk memastikan fungsi dan data;
- mulai implementation trace setelah direction dan design system disetujui tertulis.

## Editing dan validasi

- Buat patch minimal dan fokus akar masalah.
- Jangan membuat V3, bridge, fallback, atau primitive duplikat untuk eksperimen.
- Backend tetap otoritas RBAC dan state transition; guard UI hanya UX.
- Jangan ubah migration lama yang mungkin sudah diterapkan; buat migration additive baru.
- Jangan deploy, menjalankan migration remote, mengubah secret production, menghapus data, atau melakukan operasi production destruktif tanpa izin eksplisit.
- Jangan menyatakan selesai tanpa validasi relevan: typecheck/build, test, integration/security negative path, migration check, atau responsive/accessibility check sesuai scope.
- Jangan memperbaiki bug di luar scope; laporkan terpisah.

## Kontrak kritis

Perubahan tidak boleh memperburuk:

- audit dan void transaksi;
- atomic idempotency dan concurrency guard;
- shared typed contracts;
- exact same-origin dan security headers;
- persistent D1 login limiter;
- account lifecycle, session revocation, dan recovery guard;
- safe media lifecycle D1–R2;
- real-D1 critical flow dan authenticated browser E2E.

UI visibility bukan security boundary. Role impersonation nyata harus memakai contract server, audit, expiry, indikator permanen, exit, dan negative test.

## IA admin

- Menu utama: Dashboard, Keuangan, Media, Publikasi, Pengaturan.
- Kategori kas, Seksi & pengurus, dan Akun & akses adalah child route Pengaturan, bukan tab lokal.
- Media dan Publikasi adalah menu utama terpisah.
- Inventaris belum memiliki placement yang disetujui; jangan menempatkannya tanpa keputusan pengguna.
- Tujuan dengan URL/page sendiri wajib memakai route navigation. Tab hanya untuk perspektif lokal dalam satu halaman.
- Urutan implementation setelah approval visual: Login → shell admin → Pengaturan → Media → Publikasi → Keuangan → Dashboard.

## Dokumentasi

- Update `SYSTEM_MAP.md` bila route, flow, state machine, schema, role policy, atau ownership berubah.
- Update `ROADMAP.md` bila status, dependency, scope, atau acceptance criteria berubah.
- Update `RUNBOOK.md` bila prosedur migration, deployment, backup/restore, secret, atau incident berubah.
- Update `README.md` bila onboarding, command canonical, prerequisite, atau indeks dokumentasi berubah.
- Jangan menulis progress log kosmetik di dokumen aktif.
