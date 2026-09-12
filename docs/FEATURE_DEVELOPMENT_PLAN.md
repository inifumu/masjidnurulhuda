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
**Tujuan:** mengevaluasi homepage publik hanya setelah fase admin-first selesai, tanpa mengorbankan kejujuran data, accessibility, atau performa.

Konteks keputusan:

- implementasi publik current adalah behavior/content inventory, bukan donor visual admin dan bukan keputusan visual masa depan;
- evaluasi publik wajib memiliki brief/PRD dan prototype sendiri bila kelak dibuka;
- evaluasi hanya dilakukan jika ada kebutuhan produk nyata, sumber foto/konten terverifikasi, dan kapasitas setelah workstream admin prioritas selesai.

Jika kandidat ini kelak dibuka, buat product brief dan blank-canvas visual brief terpisah. Jangan membawa keputusan visual kandidat publik ini ke revamp admin, dan jangan menetapkan font, palette, hierarchy, CTA, viewport, atau composition sebelum brief tersebut disetujui.

### 0.1 Superadmin Role Impersonation untuk QA

**Status:** Implemented behavior/security capability; maintenance melalui source/test dan `ROADMAP.md`
**Tujuan:** memungkinkan superadmin memeriksa dan menjalankan pengalaman end-to-end sebagai role operasional lain tanpa menyamar sebagai akun pengguna tertentu.

Batas keamanan wajib:

- bedakan tegas **UI role preview** dari **server-authorized impersonation**;
- UI preview hanya boleh memengaruhi visibility/presentation dan tidak membuktikan RBAC backend;
- request mutasi dan data scope tetap memakai identitas serta role sesi asli kecuali contract impersonation backend yang terpisah telah disetujui dan diuji;
- jika server-authorized impersonation dibutuhkan, wajib superadmin-only, memiliki audit start/stop/target role, banner permanen, expiry pendek, exit satu klik, revocation, exact same-origin, dan negative role tests;
- jangan menyimpan role preview di JWT/cookie/localStorage secara ambigu atau membuka jalur privilege escalation;
- mode aktif harus selalu terlihat dan tidak boleh menyerupai sesi role asli tanpa indikator.

Kontrak implemented:

- server-authorized role-level impersonation dipilih; bukan UI-only preview dan bukan penyamaran ke akun user tertentu;
- JWT role efektif mengendalikan backend, sementara `sub/id` tetap superadmin asli;
- expiry 15 menit, original session expiry tidak diperpanjang, refresh/multi-tab mengikuti cookie sesi, logout/revocation tetap berlaku;
- start/stop diaudit, nested impersonation dan target superadmin ditolak, banner permanen + exit satu klik tersedia;
- backend negative tests dan browser start/stop mobile-desktop tersedia.

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

### 2.1 Lampiran Proposal Keuangan

**Status:** Candidate / hanya dievaluasi saat slice Keuangan aktif dan lifecycle media tervalidasi
**Tujuan:** memungkinkan proposal menyertakan dokumen pendukung tanpa merusak lifecycle media, audit finansial, atau recovery D1–R2.

Discovery minimum:

- tentukan apakah lampiran opsional, alternatif terhadap uraian, atau wajib untuk tipe/nominal tertentu;
- allowlist MIME, ukuran, jumlah file, dan akses download berdasarkan role/ownership;
- tentukan upload sebelum atau setelah proposal dibuat serta cleanup orphan jika submit gagal;
- relasi proposal/transaksi ke Media Library dan reference tracking agar file terpakai tidak dapat dihapus tidak aman;
- immutability atau aturan replace/remove setelah proposal diajukan, ditolak, atau approved;
- audit attach/remove/download bila diperlukan dan preservasi actor asli;
- private delivery policy; lampiran proposal tidak otomatis menjadi media publik;
- retry, partial failure, reconciliation, retention, dan recovery plan D1–R2;
- browser behavior mobile untuk upload progress, retry, validation, pending submit, dan file preview.

Keputusan sementara:

- pemisahan `keperluan` dan `keterangan` adalah contract transaksi current yang harus dipertahankan atau diubah end-to-end dengan migration/test;
- attachment proposal tidak ditampilkan sebagai control operasional sampai contract storage, RBAC, lifecycle, dan cleanup memiliki implementation serta test end-to-end;
- jangan menampilkan upload palsu atau menyimpan file tanpa reference lifecycle; presentation baru ditentukan saat slice Keuangan aktif di bawah design system yang sudah disetujui.

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

### 4. Kegiatan dan Kalender Masjid

**Status:** Candidate / backend admin `Not found`
**Tujuan:** mengelola agenda, kegiatan rutin, acara khusus, dan publikasi jadwal kegiatan dari panel admin.

Discovery minimum:

- lifecycle draft, published, cancelled, completed, dan archived;
- waktu, lokasi, penanggung jawab, kapasitas, serta informasi pendaftaran bila diperlukan;
- recurring schedule tanpa menduplikasi record secara tidak terkendali;
- role create/review/publish/cancel;
- relasi cover atau dokumentasi ke Media Library;
- endpoint publik, timezone WIB, cache, dan stale-update protection.

### 5. Kritik dan Saran

**Status:** Candidate / backend admin `Not found`
**Tujuan:** menerima, menyeleksi, menindaklanjuti, dan mengarsipkan masukan publik secara aman.

Discovery minimum:

- kebijakan identitas pengirim, anonimitas, consent, retention, dan penghapusan data pribadi;
- spam/rate-limit, abuse handling, serta sanitasi input;
- state baru, ditinjau, ditindaklanjuti, selesai, dan archived;
- assignment internal, catatan privat, dan audit perubahan;
- response whitelist agar data internal atau identitas tidak bocor ke publik.

### 6. Profil Organisasi dan Struktur Pengurus

**Status:** Candidate / relasi akun dan struktur anggota `Not found`
**Tujuan:** memisahkan teks `nama_pengurus` pada seksi dari model profil, jabatan, periode kepengurusan, dan akun akses.

Discovery minimum:

- profil orang, jabatan, seksi, masa tugas, urutan tampil, dan status aktif;
- relasi opsional ke akun admin tanpa menyamakan profil publik dengan credential;
- histori pergantian pengurus dan kebijakan data pribadi;
- ownership perubahan, audit, serta output publik berbasis whitelist;
- migration aman dari `seksi_pengurus.nama_pengurus` yang masih berupa teks.

### 7. Reporting, Audit Global, dan Tren Keuangan

**Status:** Candidate / endpoint agregasi dan audit global `Not found`
**Tujuan:** menyediakan analisis lintas periode dan aktivitas sistem tanpa menghitung ulang data resmi di browser.

Discovery minimum:

- endpoint tren kas multi-bulan/tahunan dengan definisi saldo yang konsisten;
- filter server, pagination, export, dan batas periode;
- audit lintas modul dengan actor, target, event, timestamp, dan data scope;
- role matrix untuk laporan sensitif dan audit keamanan;
- index/query plan D1, retention, redaction, serta batas volume;
- hindari membangun tren dari banyak request dashboard atau audit hasil perkiraan UI.

### 8. Observability Lifecycle Media

**Status:** Candidate / status deletion untuk UI `Not found`
**Tujuan:** membuat kegagalan dan progres safe-delete media dapat ditangani operator tanpa membuka detail storage sensitif.

Discovery minimum:

- status publik-operasional yang aman: pending, completed, failed, retrying;
- endpoint status atau antrean terbatas untuk role berwenang;
- pesan error teredaksi, retry manual terkontrol, dan audit tindakan;
- reconciliation orphan D1–R2 serta indikator media yang masih direferensikan;
- jangan mengekspos raw storage key, stack trace, atau credential storage.

### 9. Statistik Pengunjung dan Notifikasi

**Status:** Candidate / analytics dan notification service `Not found`
**Tujuan:** mengevaluasi kebutuhan metrik penggunaan dan pemberitahuan operasional tanpa menambah tracking atau alarm yang tidak diperlukan.

Discovery minimum:

- keputusan apakah statistik pengunjung benar-benar dibutuhkan dan lawful;
- definisi metrik, consent, retention, anonymization, serta larangan fingerprinting;
- sumber data dan pemisahan analytics publik dari audit keamanan;
- event notifikasi yang actionable, recipient, channel, deduplication, read state, dan expiry;
- email/push/in-app provider hanya dipilih setelah kebutuhan dan biaya disetujui;
- tidak membuat badge, counter, atau notifikasi dummy tanpa backend nyata.

## Urutan Discovery yang Direkomendasikan

1. Selesaikan blank-canvas direction, design-system approval, lalu implementation revamp admin sesuai urutan aktif.
2. Pertahankan P0.5 dan lifecycle Media Library sebagai regression baseline.
3. Discovery konsolidasi Media & Galeri bila dipilih sebagai vertical slice admin.
4. Discovery Artikel dan Informasi.
5. Discovery Kegiatan serta Kritik dan Saran bila Publikasi menjadi slice aktif.
6. Discovery Inventaris dan Struktur Pengurus setelah ownership domain diputuskan.
7. Discovery reporting/audit, observability media, analytics, dan notifikasi berdasarkan kebutuhan operasional terukur.
8. Setelah scope disetujui, pindahkan feature terpilih ke `ROADMAP.md` sebagai milestone aktif dengan dependency dan acceptance criteria yang konkret.

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
