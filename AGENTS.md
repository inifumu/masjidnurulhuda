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
6. `DESIGN.md` sebagai kontrak visual untuk perubahan UI/UX.
7. `docs/UI_UX_REDESIGN_AUDIT.md` sebagai audit/adoption/migration redesign.
8. `docs/archive/` hanya sebagai histori.

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
- Commit koheren dan push ke branch kerja + `testing` boleh dilakukan langsung setelah seluruh gate relevan lulus dan tidak ada blocker/bug. Tetap minta izin eksplisit untuk merge/push `main`, migration/deploy production, secret production, atau operasi remote destruktif.
- Jangan menyatakan selesai tanpa menjalankan validasi relevan: typecheck/build, test, integration/security negative path, migration check, atau responsive/accessibility check sesuai scope.

## Domain kritis dan baseline

Perubahan baru tidak boleh memperburuk integritas transaksi, RBAC, auth, atau lifecycle media. Baseline P0.5 yang sudah memiliki evidence dan harus dipertahankan: audit/void transaksi, atomic idempotency, shared typed contracts, exact same-origin/security headers, persistent D1 login limiter, account lifecycle/revocation/recovery guards, safe media lifecycle, real-D1 critical flow, dan authenticated browser E2E 360+desktop.

## Full UI/UX redesign

- Arah final adalah `DESIGN.md`: Nurul Huda Civic Editorial, warm modern minimalism, editorial public experience, institutional admin UI, emerald identity, dan restrained yellow-gold accent.
- Ini full product redesign, bukan cleanup/reskin V2. Legacy dan V2 hanya referensi behavior; jangan dijadikan baseline visual.
- Gunakan Tailwind v4 + CSS variables + shadcn-vue/reka sebagai primitive canonical. Lucide, vue-sonner, VeeValidate+Zod, Pinia, dan Inter Variable tetap digunakan sesuai audit.
- R1 Design Foundation dan R2 Public Publication Experience `Done`; workstream aktif R3 Admin Shell dan Authentication. Evaluasi homepage publik yang lebih modern hanya kandidat masa depan, bukan pembukaan ulang R2.
- Headless UI telah dimigrasikan ke reka dan dependency dihapus; jangan memperkenalkannya kembali.
- Jangan membuat V3, bridge visual baru, primitive duplikat, atau hardcode token berulang di view.
- Mobile 360 adalah baseline; tablet dan desktop wajib dirancang, bukan sekadar hasil stretch.
- Semua screen wajib memiliki state dan keyboard/accessibility evidence sesuai flow.
- Audit R3 lanjutan wajib mencakup density/spacing shell, parity header sidebar mobile-desktop, ukuran icon/control, dan feedback interaksi pressed/open/pending/active yang konsisten.
- Role preview/impersonation adalah security-sensitive: preview frontend tidak boleh dianggap RBAC backend; impersonation nyata memerlukan contract server, audit, expiry, indikator permanen, exit, dan negative tests.
- `docs/UI_UX_REDESIGN_AUDIT.md` memuat inventory, adoption matrix, urutan migrasi, dan anti-drift rules.
- Jangan cleanup/rename canonical sebelum caller audit, parity, test, build, dan browser flow lulus.

## Dokumentasi

- Update `SYSTEM_MAP.md` jika route, flow, state machine, schema, atau ownership modul berubah.
- Update `ROADMAP.md` jika status, dependency, scope, atau acceptance criteria berubah.
- Update `RUNBOOK.md` jika migration, deployment, backup/restore, secret, atau incident procedure berubah.
- Update `README.md` jika onboarding, command canonical, prerequisite, atau indeks dokumentasi aktif berubah.
- Jangan menulis progress log kosmetik panjang di dokumen aktif.
- Gunakan `docs/AI_AGENT_PLAYBOOK.md` untuk prosedur rinci.

Jika fakta tidak ditemukan, tulis `Not found`; jangan berasumsi.
