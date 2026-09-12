# Audit Reset UI/UX Aktif

Permintaan 12 September 2026 menggantikan gate desain sebelumnya. Seluruh presentasi admin dibangun ulang polos untuk mengevaluasi fungsi dan workflow.

Boundary: tidak memakai desain lama sebagai input visual; source/service/test boleh dibaca untuk kontrak operasional. Tidak ada CSS custom/utility/inline pada jalur admin. CSS publik dipisahkan dengan document boundary.

Exit gate sekarang: review fungsi oleh pengguna, bukan persetujuan shell atau token. Setelah fungsi disetujui barulah visual didesain ulang. Arsip CSS/test lama tidak menjadi spesifikasi.

Evidence browser: .hermes/artifacts/admin-functional-reset/report.json. Evidence lokal menggunakan fixture API; validasi D1 nyata tetap terpisah. [Mapping fungsi](revamp/ADMIN_FUNCTIONAL_MAPPING.md).
