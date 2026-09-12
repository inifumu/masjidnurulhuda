# PRD Admin — Review Fungsi Sebelum Desain

Tujuan: menyediakan seluruh alur admin yang benar-benar dapat digunakan sebagai dasar evaluasi kebutuhan informasi, komponen, dan workflow. Implementasi memakai Vue dan HTML native tanpa CSS, sesuai instruksi 12 September 2026.

Scope tersedia: login/logout/recovery, navigasi per role, impersonation server, kategori, seksi/pengurus, akun/status, upload/list/metadata/delete media, pilihan galeri sementara, pencatatan kas/proposal/persetujuan/penolakan/void/audit, filter periode dan Dashboard.

Scope belum tersedia: penyimpanan dan publikasi Kabar masjid/Kegiatan/Kritik & saran; persistensi komposisi galeri. Halaman terkait wajib jujur tanpa dummy mutation. Inventaris menunggu keputusan placement.

Acceptance: setiap aksi berlabel dan dapat diakses keyboard; error/loading/empty/success terlihat; duplicate/pending mutation dikendalikan; backend tetap otoritas role/transisi; tidak ada CSS custom pada route admin, termasuk sesudah navigasi dari publik; halaman diuji di mobile dan desktop.

Tahap berikutnya: review fungsi pengguna → revisi struktur/workflow → approval fungsi → desain visual dari nol. [Kontrak lengkap](revamp/ADMIN_FUNCTIONAL_RESET.md).
