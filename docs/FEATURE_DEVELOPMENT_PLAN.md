# Feature Development Plan — Masjid Nurul Huda

Dokumen ini menampung rencana pengembangan produk yang belum masuk ke milestone improvement aktif.

Sumber kebenaran prioritas dan status pengerjaan tetap `ROADMAP.md`. Item dalam dokumen ini tidak dianggap implemented, committed scope, atau siap dikerjakan sebelum discovery, dependency, dan acceptance criteria disetujui.

## Prinsip Prioritas

1. Selesaikan foundation, integritas finansial, keamanan, dan critical integration tests terlebih dahulu.
2. Jangan menampilkan navigasi fitur sebelum route dan flow minimum benar-benar tersedia.
3. Setiap fitur baru harus memiliki contract data, RBAC backend, loading/error/empty state, mobile behavior, dan automated test.
4. Hindari halaman placeholder pada navigasi aktif; gunakan feature flag atau sembunyikan menu sampai minimum viable flow siap.
5. Perubahan schema wajib menggunakan migration baru dan mempertimbangkan backup, upgrade, serta recovery.

## Kandidat Feature Development

### 0. Evaluasi Ulang Visual Homepage Publik yang Lebih Modern

**Status:** Candidate / hanya bila kebutuhan muncul setelah redesign admin selesai
**Tujuan:** mengevaluasi evolusi homepage publik dari baseline Civic Editorial R2 menuju presentasi yang terasa lebih modern tanpa mengorbankan kerapian, kejujuran data, accessibility, atau performa.

Konteks keputusan:

- implementasi R2 saat ini diterima sebagai baseline yang lebih rapi dan profesional;
- preferensi visual pengguna cenderung lebih modern daripada editorial murni;
- kandidat ini bukan pembukaan kembali R2 dan tidak mengubah status R2 `Done`;
- evaluasi hanya dilakukan jika ada kebutuhan produk nyata, sumber foto/konten terverifikasi, dan kapasitas setelah workstream admin prioritas selesai.

Discovery minimum:

- definisikan arti “modern” melalui referensi dan prototype terukur, bukan glassmorphism/gradient/card-grid generik;
- pertahankan emerald identity, restrained gold, hierarchy informasi, honest unavailable states, dan satu primary action;
- nilai kebutuhan fotografi/visual asli, motion yang menghormati reduced-motion, dan peningkatan perceived quality pada 360/tablet/desktop;
- bandingkan dampak accessibility, Core Web Vitals, maintainability, dan conversion/task clarity terhadap baseline R2;
- jangan membuat V3, bridge visual, route paralel, atau mempublikasikan aset/data yang belum terverifikasi.

### 1. Artikel dan Informasi

**Status:** Candidate / discovery belum dimulai
**Tujuan:** menyediakan pengelolaan artikel, berita, pengumuman, dan informasi masjid dari panel admin ke website publik.

Discovery minimum:

- jenis konten dan status lifecycle: draft, review, published, archived;
- role yang boleh membuat, menyunting, mereview, menerbitkan, dan mengarsipkan;
- slug, jadwal publikasi, author attribution, excerpt, dan SEO metadata;
- relasi featured image dan inline media dengan Media Library;
- preview sebelum publish dan perlindungan terhadap stale update;
- kebutuhan audit history dan revision history;
- endpoint publik dengan output whitelist, pagination, dan cache policy;
- editor yang accessible dan aman terhadap unsafe HTML.

Keputusan sementara:

- menu `/admin/artikel` tetap disembunyikan sampai route dan minimum viable flow tersedia;
- jangan menambahkan `Artikel.vue` kosong ke navigasi aktif hanya untuk mengisi route.

### 2. Konsolidasi Galeri, Dokumentasi, dan Media Library

**Status:** Candidate / discovery belum dimulai
**Tujuan:** mengurangi kebingungan antara penyimpanan aset media dan penyusunan koleksi galeri/dokumentasi.

Arah domain yang perlu dievaluasi:

- **Media Library:** sumber aset/file, metadata, alt text, usage reference, archive, dan lifecycle D1–R2;
- **Galeri/Dokumentasi:** koleksi terkurasi yang mereferensikan aset Media Library, memiliki judul, tanggal kegiatan, deskripsi, urutan, cover, dan status publikasi;
- satu menu induk seperti `Media & Galeri` dengan subflow yang jelas, bukan mencampur record aset dan koleksi tanpa boundary;
- reference tracking agar media yang dipakai artikel/galeri tidak dapat dihapus secara tidak aman;
- archive/pending-delete dan orphan reconciliation;
- migrasi data existing tanpa kehilangan object atau metadata.

Keputusan desain final belum dibuat. Konsolidasi menu tidak berarti tabel dan lifecycle harus dipaksa menjadi satu model.

### 3. Inventaris Masjid

**Status:** Candidate / discovery belum dimulai
**Tujuan:** mencatat aset fisik masjid dan histori pengelolaannya secara dapat diaudit.

Discovery minimum:

- identitas aset/kode inventaris dan kategori;
- jumlah, satuan, lokasi, kondisi, nilai perolehan, tanggal perolehan, dan sumber dana;
- penanggung jawab/custodian;
- mutasi lokasi atau penanggung jawab;
- maintenance, kerusakan, kehilangan, disposal, dan alasan perubahan;
- lampiran foto/dokumen melalui Media Library;
- role matrix untuk lihat, tambah, edit, verifikasi, dan disposal;
- audit event dan larangan hard-delete untuk aset yang sudah memiliki histori;
- laporan kondisi, lokasi, maintenance due, dan rekonsiliasi fisik;
- dukungan label/QR hanya bila kebutuhan operasional sudah terbukti.

## Urutan Discovery yang Direkomendasikan

1. Tutup P0 foundation dan critical finance integration coverage.
2. Stabilkan lifecycle Media Library termasuk usage tracking dan safe deletion.
3. Discovery konsolidasi Media & Galeri karena menjadi dependency media untuk Artikel dan Inventaris.
4. Discovery Artikel dan Informasi.
5. Discovery Inventaris Masjid.
6. Setelah scope disetujui, pindahkan feature terpilih ke `ROADMAP.md` sebagai milestone aktif dengan dependency dan acceptance criteria yang konkret.

## Definition of Ready

Sebuah kandidat hanya boleh dipindahkan ke roadmap aktif jika:

- problem dan pengguna utama jelas;
- user journey dan out-of-scope disepakati;
- ownership data dan lifecycle ditentukan;
- RBAC backend dan data scope didefinisikan;
- kebutuhan migration dan recovery diketahui;
- API contract awal tersedia;
- acceptance criteria dan test matrix tersedia;
- dependency terhadap milestone foundation sudah terpenuhi.
