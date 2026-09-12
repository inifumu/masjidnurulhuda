# Reset Fungsional Admin — 12 September 2026

Permintaan pengguna menggantikan seluruh approval visual sebelumnya: presentasi admin ditolak dan dibangun ulang memakai Vue + HTML semantik tanpa custom CSS. Prioritas adalah mengevaluasi informasi, aksi, komponen yang diperlukan, dan workflow sebelum mendesain visual dari nol.

## Kontrak aktif

- Seluruh route admin memakai presentasi polos: Login, navigasi, Pengaturan, Media, Galeri, Keuangan, Dashboard, dan halaman status Publikasi.
- Tidak ada stylesheet admin, style block, inline style, utility class, theme switcher, atau shell alternatif pada jalur render aktif.
- Admin Vue/HTML native polos tetap alat review fungsi. Baseline revamp berikutnya adalah Vue 3 + Tailwind CSS; framework tambahan, component library, icon set, font, theme, dan token belum dipilih.
- CSS publik hanya dimuat pada dokumen publik. Perpindahan publik ↔ admin memuat dokumen baru untuk mencegah kebocoran CSS.
- Backend, session/RBAC, audit, idempotency, lifecycle media, dan migration adalah regression contract. Jangan mengganti atau menyederhanakan otorisasi server demi presentasi.
- Presentasi lama bukan donor desain. Source boleh ditelusuri untuk fakta fungsi saja.
- Media dan Publikasi tetap menu utama terpisah. Pengaturan tetap tiga child route. Inventaris belum ditempatkan.
- Galeri hanya pilihan media sementara. Kabar masjid, Kegiatan, Kritik & saran menyatakan fungsi belum tersedia; tidak ada mock data atau mutation palsu.
- Impersonation memakai session server, indikator pelaku/peran/expiry dan exit. Pergantian sesi memuat ulang dokumen untuk membuang state UI sebelumnya.

## Review berikutnya

Evaluasi kebutuhan per role, urutan kerja, informasi yang berulang/tidak perlu, loading/error/empty/success, validasi, dan konsekuensi aksi pada halaman polos. Setelah pengguna menyetujui struktur fungsi dan workflow, desain visual baru dibuat dari nol. Menara, Sanggar, Lentera, token typography/density, ripple dan geometry lama tidak mengikat.

## Sumber

- SYSTEM_MAP.md: route dan flow aktual.
- docs/revamp/ADMIN_INFORMATION_ARCHITECTURE.md: batas modul dan route.
- docs/revamp/ADMIN_FUNCTIONAL_MAPPING.md: fungsi tersedia dan gap.
- docs/archive/admin-presentation-2026-09-12/: stylesheet serta test presentasi yang sudah digantikan; tidak diimpor aplikasi.
