# Handoff Aktif — Admin Fungsional Polos

Status: implementasi presentasi polos untuk review fungsi pengguna. Kontrak aktif: [Reset fungsional](revamp/ADMIN_FUNCTIONAL_RESET.md) dan [DESIGN.md](../DESIGN.md).

Keputusan framework/shell/visual lama serta eksperimen Material Design/Varlet dibatalkan pada 12 September 2026. Baseline persiapan berikutnya: Vue 3 + Tailwind CSS; framework tambahan belum dipilih. Admin polos tetap alat review fungsi.

Entrypoint: src/router/index.ts → layout/view admin → komponen Functional* → service existing. Publikasi hanya halaman status belum tersedia. Galeri tetap pilihan sementara. Tidak ada migration atau deployment dalam reset ini.

Validasi canonical: npm run build; npm test; npm run test:e2e:browser. Test browser memakai fixture API dan bukan bukti transaksi pada D1 nyata. Critical backend/D1 tetap gate terpisah.
## Validasi implementasi

- npm run build: PASS.
- npm test: 165/165 PASS; test geometri/style lama diarsipkan, kontrak backend tetap diuji.
- npm run test:e2e:browser: PASS pada 14 halaman × lebar 360/768/1366; 4 role, login 401/429/503, recovery/revocation/impersonation, transaksi retry/proposal/approve/reject/void/audit, CRUD/status Pengaturan, upload/retry/metadata/delete media. Fixture API, bukan produksi.
- CSS isolation: 0 stylesheet dan 0 inline style pada admin, termasuk perpindahan publik → admin. Login server dev asli juga 0/0.
- npm run test:critical-flow:d1: PASS pada D1 lokal disposable; concurrency 1×200 + 1×409, ownership dan summary konsisten, fixture count 0, FK bersih. XDG_CONFIG_HOME dan WRANGLER_LOG_PATH diarahkan ke .wrangler workspace untuk izin lokal.
- Evidence: .hermes/artifacts/admin-functional-reset/report.json dan screenshot; preview dev dengan API lokal: http://127.0.0.1:5174/admin/login.
- Review fungsi/workflow pengguna masih pending; desain visual belum dimulai.
