> **Override aktif — 12 September 2026:** pengguna menolak seluruh desain sekarang. Full admin dibangun ulang memakai Vue/HTML native tanpa custom CSS. Gate/shell/token/larangan implementasi sebelum approval visual di bawah adalah histori dan digantikan docs/revamp/ADMIN_FUNCTIONAL_RESET.md. Source boleh ditelusuri untuk fungsi; tidak menjadi donor visual. Review fungsi/workflow mendahului desain visual baru. Kontrak backend/security dan IA modul tetap berlaku.

# Admin Information Architecture

**Status:** kontrak IA target yang diputuskan pengguna pada 4 Agustus 2026. Dokumen ini menjelaskan struktur revamp yang dituju, bukan route production yang sudah tersedia.

## Authority dan batas

- Dokumen ini adalah sumber kebenaran untuk pengelompokan menu dan perbedaan antara route navigation dengan tab lokal pada revamp admin.
- `SYSTEM_MAP.md` tetap menjadi sumber kebenaran behavior dan route yang berjalan saat ini. Jangan menulis target di dokumen ini seolah-olah sudah diimplementasikan.
- Label final, slug URL final, urutan child page, dan role visibility tetap diverifikasi saat functional mapping. Backend tetap menjadi otoritas RBAC.

## Aturan route

1. Setiap tujuan navigasi admin mempunyai route, URL, view, lifecycle data, loading/error state, breadcrumb, dan active state sendiri.
2. Child page dirender melalui nested route dan `<RouterView>`, bukan melalui satu `activeTab` yang mengganti seluruh modul di URL yang sama.
3. Kontrol tab hanya untuk perspektif atau dataset lokal di dalam satu halaman. Tab tidak boleh dipakai untuk menyamarkan tujuan yang seharusnya menjadi halaman navigasi.
4. Router link boleh memiliki tampilan seperti secondary tab bar, tetapi semantiknya tetap navigasi route, mendukung deep-link, refresh, history browser, dan akses langsung.

## Struktur menu target

### Ringkasan

Menu utama langsung menuju halaman ringkasan admin.

### Keuangan

Menu utama dengan child page nyata, mengikuti pola pemisahan R4 yang sudah terbukti pada repo legacy:

- Transaksi;
- Catat kas;
- Proposal;
- Persetujuan;
- Riwayat audit.

### Media

**Media adalah menu utama mandiri dan tidak boleh digabung dengan Publikasi.** Baseline child page:

- Pustaka media;
- Galeri & dokumentasi.

### Publikasi

**Publikasi adalah menu utama mandiri dan tidak boleh digabung dengan Media.** Baseline child page yang akan dipetakan saat implementation planning:

- Kabar masjid;
- Kegiatan;
- Kritik & saran.

### Pengaturan

Menu utama dengan halaman navigasi terpisah:

- Kategori kas;
- Seksi & pengurus;
- Akun & akses;
- halaman pengaturan tambahan yang disetujui kemudian.

Kategori kas, Seksi & pengurus, dan Akun & akses bukan tiga tab dalam satu route Pengaturan. Implementasi tab legacy hanya inventory behavior sementara.

### Inventaris — keputusan terbuka

Inventaris pasti dipertimbangkan sebagai tujuan navigasi baru, tetapi placement belum diputuskan. Opsi yang masih terbuka hanya:

1. menjadi menu utama mandiri; atau
2. menjadi child page di bawah Publikasi.

Agent dilarang memilih salah satu opsi, membuat route final, atau menempatkan Inventaris secara implisit sebelum ada keputusan eksplisit pengguna.

## Batas presentasi

IA hanya menetapkan tujuan dan relasi route. Tidak menetapkan shell, rail, bottom navigation, drawer, breadcrumb, icon, atau framework. Semua keputusan presentasi lama dibatalkan; baseline review berupa navigasi native polos.

## Evidence historis

Repo legacy `C:\WORK\Projects\Web_Apps\masjidnurulhuda` membuktikan pola migrasi yang dimaksud:

- sebelum R4, `FinanceV2.vue` memakai `activeTab` untuk beberapa workflow dalam satu view;
- checkpoint `15b013e` memindahkan workflow tersebut menjadi child route dan child view nyata;
- R5 untuk Media, Publikasi, Organization, dan Settings belum dikerjakan, sehingga bentuk tab Pengaturan serta route Galeri lama bukan target IA revamp.

Evidence historis digunakan untuk memahami intent pemisahan route, bukan sebagai donor visual.
