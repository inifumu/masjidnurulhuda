# Mapping Fungsi Admin

| Area | Aksi dan state tersedia | Jalur service | Batas |
|---|---|---|---|
| Login/sesi | login, logout, retry 5xx, 401/429, impersonation/exit/expiry | authStore → /api/admin/auth/* | RBAC server |
| Pengaturan | cari, tambah, ubah, hapus kategori/seksi; akun tambah/ubah/status | pengaturanService → /api/admin/pengaturan/* | akun superadmin; kategori/seksi ketua atau superadmin |
| Media | upload batch/status/retry, pagination, URL, alt text, hapus dengan konfirmasi | useMediaUpload + mediaService → /api/admin/media | lifecycle R2/D1 tetap server |
| Galeri | pilih/hapus pilihan media, pagination | mediaService.listMedia | pilihan sementara, belum persist |
| Publikasi | route Kabar masjid/Kegiatan/Kritik & saran dan status unavailable | Not found | tidak ada mutation publikasi |
| Catat kas | validator field, submit/retry dengan key yang sama | useKas → kasService.add-direct | approved langsung sesuai role |
| Proposal | submit, status periode, retry | useKas → kasService.add-proposal | ketua lalu bendahara |
| Persetujuan | pending lintas periode, approve/reject, alasan, conflict reload | kasService.getPendingTransactions + useKas.handleAction | tahap dan role backend |
| Transaksi/audit | filter, pencarian, detail, timeline, void/alasan | kasService + useKas | history_available jujur; void tidak hard delete |
| Dashboard | ringkasan periode WIB, loading/error/retry | dashboardService | saldo otoritatif server |

Halaman dengan URL sendiri tetap route navigation. Tidak ada placement Inventaris. Presentasi ini adalah alat review kebutuhan; bukan visual foundation.
## Validasi implementasi

- npm run build: PASS.
- npm test: 165/165 PASS; test geometri/style lama diarsipkan, kontrak backend tetap diuji.
- npm run test:e2e:browser: PASS pada 14 halaman × lebar 360/768/1366; 4 role, login 401/429/503, recovery/revocation/impersonation, transaksi retry/proposal/approve/reject/void/audit, CRUD/status Pengaturan, upload/retry/metadata/delete media. Fixture API, bukan produksi.
- CSS isolation: 0 stylesheet dan 0 inline style pada admin, termasuk perpindahan publik → admin. Login server dev asli juga 0/0.
- npm run test:critical-flow:d1: PASS pada D1 lokal disposable; concurrency 1×200 + 1×409, ownership dan summary konsisten, fixture count 0, FK bersih. XDG_CONFIG_HOME dan WRANGLER_LOG_PATH diarahkan ke .wrangler workspace untuk izin lokal.
- Evidence: .hermes/artifacts/admin-functional-reset/report.json dan screenshot; preview dev dengan API lokal: http://127.0.0.1:5174/admin/login.
- Review fungsi/workflow pengguna masih pending; desain visual belum dimulai.
