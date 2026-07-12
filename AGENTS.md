# AGENTS.md — Masjid Nurul Huda

Instruksi lintas-agent untuk repository Vue 3 + TypeScript + Hono + Cloudflare D1/R2.
Gunakan Bahasa Indonesia untuk laporan teknis. Zona waktu bisnis: `Asia/Jakarta`.

Hermes Agent menggunakan `.hermes.md` sebagai project context utama. File ini adalah fallback kompatibilitas untuk agent lain dan tidak dimaksudkan dimuat bersamaan oleh Hermes.

## Sumber kebenaran

1. Permintaan dan batasan eksplisit pengguna.
2. Instruksi proses/safety dalam context agent aktif.
3. Source code, migration, konfigurasi runtime, dan automated test sebagai fakta behavior operasional.
4. `SYSTEM_MAP.md` sebagai peta yang harus diverifikasi terhadap source.
5. `ROADMAP.md` sebagai backlog improvement aktif.
6. `docs/archive/` hanya sebagai histori.

`optimalisasi_plan.md` telah deprecated. Jangan gunakan sebagai roadmap atau gate aktif.

## Workflow wajib

Gunakan trace terarah:

`User action → Route/View → Component/Composable/Store → Frontend Service/httpClient → Hono Route/Middleware → Service/Policy → Repository/Query → D1/R2/External API`

Sebelum edit:

- baca bagian relevan `SYSTEM_MAP.md`;
- temukan entrypoint dan caller aktual;
- periksa test dan migration terkait;
- bedakan current implementation, known gap, dan target roadmap;
- tampilkan trace singkat, target file, alasan, dan tingkat risiko.

Jangan melakukan blind scan. Abaikan `node_modules`, `.git`, `dist`, `build`, `coverage`, cache, log, minified asset, source map, dan lockfile kecuali task terkait dependency.

## Editing dan validasi

- Patch minimal lebih disukai daripada rewrite besar.
- Jangan membuat V3, bridge, atau fallback baru hanya untuk eksperimen visual.
- Jangan menambah business logic ke komponen legacy.
- Backend adalah otoritas RBAC dan state transition; guard UI hanya untuk UX.
- Jangan mengubah migration lama yang mungkin sudah diterapkan; gunakan migration baru.
- Jangan melakukan deployment, migration remote, penghapusan data, atau operasi produksi destruktif tanpa permintaan eksplisit.
- Jangan commit/push kecuali diminta atau telah disepakati sebagai bagian workflow.
- Jangan menyatakan selesai tanpa menjalankan validasi relevan: typecheck/build, test, integration/security negative path, migration check, atau responsive/accessibility check sesuai scope.

## Domain kritis dan known gaps

Perubahan baru tidak boleh memperburuk integritas transaksi, RBAC, auth, atau lifecycle media. Target berikut ada di `ROADMAP.md` dan belum boleh dianggap selesai tanpa evidence:

- audit trail serta void/reversal transaksi approved;
- affected-row conflict handling dan idempotency;
- shared typed validation/contracts;
- CSRF/origin protection dan persistent login rate limit;
- safe referenced-media deletion dan rekonsiliasi D1–R2;
- critical-flow integration/E2E tests.

## UI migration

- UI V2 pada working tree adalah bahan improvement, bukan desain final yang wajib dipertahankan.
- Pertahankan behavior dan contract yang terbukti benar saat redesain.
- `DashboardV2` aktif dan native; `FinanceV2` aktif tetapi monolitik; `PengaturanV2` masih memakai legacy bridge; `KeuanganKasV2` tidak memiliki route aktif.
- Jangan cleanup/rename canonical sebelum parity, test, build, dan smoke flow lulus.
- Desain harus clean, profesional, mobile-first 360 px, accessible, role-aware, dan memiliki loading/empty/error/submitting/conflict/permission state sesuai kebutuhan.

## Dokumentasi

- Update `SYSTEM_MAP.md` jika route, flow, state machine, schema, atau ownership modul berubah.
- Update `ROADMAP.md` jika status, dependency, scope, atau acceptance criteria berubah.
- Jangan menulis progress log kosmetik panjang di dokumen aktif.
- Gunakan `docs/AI_AGENT_PLAYBOOK.md` untuk prosedur rinci.

Jika fakta tidak ditemukan, tulis `Not found`; jangan berasumsi.
