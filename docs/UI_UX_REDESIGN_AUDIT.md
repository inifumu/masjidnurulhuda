# Audit Awal Full UI/UX Redesign

Tanggal audit: 2026-07-15
Branch: `improve/project-foundation`
Status working tree saat audit: besar/mixed; jangan broad stage/cleanup.

## Keputusan

Full product redesign disetujui sebelum melanjutkan mayoritas P1–P2. Redesign bukan cleanup visual V2 dan bukan reskin legacy. Behavior, API contract, RBAC, audit, idempotency, state transition, migration, dan recovery baseline P0.5 wajib dipertahankan.

Source of truth visual: `DESIGN.md`.

Arah final: **Nurul Huda Civic Editorial** — mobile-first warm minimalist editorial design dengan institutional data UI, emerald brand identity, dan restrained yellow-gold accent.

## Audit stack yang sudah tersedia

| Library/framework | Keputusan | Pemakaian canonical |
|---|---|---|
| Vue 3 + TypeScript | Pertahankan | Screen composition, typed props/emits, route views |
| Vue Router | Pertahankan | Route nyata per workflow; hindari satu mega-screen bertab |
| Tailwind CSS v4 | Pertahankan | Utility + token CSS variables dari `DESIGN.md` |
| shadcn-vue | Pertahankan dan standardisasi | Source primitive reusable, disesuaikan token brand |
| reka-ui | Pertahankan | Accessibility/behavior primitive Dialog, Sheet, Select, Popover, Menu |
| lucide-vue-next | Pertahankan | Satu icon family; icon tidak dekoratif berlebihan |
| vue-sonner | Pertahankan | Toast feedback, bukan pengganti inline error/conflict state |
| vee-validate + Zod | Pertahankan | Form schema, inline field error, submit lifecycle |
| Pinia | Pertahankan | Global session/cross-feature state saja |
| VueUse | Pertahankan selektif | Utility browser/reactivity bila mengurangi custom code |
| class-variance-authority + clsx + tailwind-merge | Pertahankan | Typed component variants dan class composition |
| @fontsource-variable/inter | Pertahankan | Satu font self-hosted canonical |
| @headlessui/vue | Removed | Dua dialog existing telah dimigrasikan ke reka pada R1; dependency dan seluruh caller sudah tidak ada |
| browser-image-compression | Pertahankan | Media upload client preprocessing; bukan concern visual |

Tidak ada kebutuhan library UI baru pada tahap foundation. Penambahan dependency hanya boleh dilakukan jika primitive existing terbukti tidak memenuhi accessibility/behavior yang dibutuhkan dan keputusan dicatat di dokumen ini.

## Temuan inkonsistensi saat ini

### 1. Token dan typography drift

`src/assets/main.css` saat ini memuat:

- brand hardcode `#116b39` dan `#e08926`;
- neutral token default shadcn;
- override slate khusus dark mode;
- warna brand dark mode berbeda;
- import Google Fonts Geist;
- token font menetapkan Inter Variable;
- hardcoded background `#fafafa`, `#0e131f`, dan beberapa variasi lain di view/layout.

Dampak: warna, typography, focus ring, surface, dan dark mode tidak memiliki satu source of truth.

Target: implementasikan token `DESIGN.md` ke `src/assets/main.css`, gunakan Inter Variable yang sudah terpasang, dan hentikan hardcode visual berulang.

### 2. Primitive overlap

- 85 file primitive/component UI tersedia di `src/components/ui`.
- Reka dipakai luas melalui primitive shadcn.
- Baseline awal memakai Headless UI pada `ConfirmModal.vue` dan `TransactionAuditDialog.vue`; closure R1 telah memigrasikan keduanya ke reka dan menghapus dependency.
- Native/custom button, form field, modal, status, card, dan table markup masih dibuat langsung di banyak view.

Dampak: ukuran control, pending state, focus, Escape, radius, warna, dan spacing berbeda per screen.

Target: satu primitive family berbasis shadcn/reka dan component contract dalam `DESIGN.md`.

### 3. Route-active UI bercampur

Route aktif saat audit:

| Route | Entry aktif | Klasifikasi |
|---|---|---|
| `/` | `PublicLayout.vue` + `Home.vue` | custom current UI |
| `/admin/login` | `LoginV2.vue` | native V2 |
| `/admin/*` | `AdminLayoutV2.vue` | native V2 |
| `/admin/dashboard` | `DashboardV2.vue` | native V2 |
| `/admin/finance` | `FinanceV2.vue` | native V2 monolith |
| `/admin/pengaturan` | `PengaturanV2.vue` | V2 shell + `PengaturanLegacyBridge` |
| `/admin/media` | `MediaLibrary.vue` | custom current UI |
| `/admin/galeri-dokumentasi` | `GaleriDokumentasi.vue` | custom current UI |

Enam file `*V2.vue` dan tiga `*LegacyBridge.vue` masih ada. `KeuanganKasV2.vue` tidak memiliki route aktif. Suffix bukan indikator canonical jangka panjang.

Target: route aktif dimigrasikan ke implementation final tanpa membuat `V3`; setelah parity, nama canonical dibersihkan dan bridge/fallback dihapus secara terkontrol.

### 4. Visual language V2 bukan target

Pola V2 yang tidak dibawa sebagai default:

- translucent surface dan `backdrop-blur` luas;
- blur orb/gradient decoration;
- card untuk hampir setiap section;
- radius/shadow yang berubah antar-screen;
- uppercase overline berulang;
- dark-SaaS styling;
- hardcoded slate/emerald/rose/indigo di view.

Behavior yang tetap diadopsi: role visibility, form validation, recovery states, loading/error/retry, conflict refresh, pending mutation guard, responsive card fallback, focus/Escape, dan service/composable boundaries.

## Target information architecture

### Publik

- Beranda
- Tentang Masjid
- Jadwal Salat
- Kabar dan Pengumuman
- Kegiatan
- Galeri dan Dokumentasi
- Transparansi Kas
- Layanan dan Kontak
- Kritik/Saran

### Admin

- Ringkasan
- Keuangan
  - Transaksi
  - Proposal
  - Persetujuan
  - Riwayat audit
- Publikasi
  - Kabar
  - Kegiatan
  - Galeri
  - Media
- Organisasi
  - Seksi
  - Pengurus
- Sistem
  - Kategori kas
  - Akun dan akses
  - Audit aktivitas

Route baru hanya dibuat ketika workflow dan contract siap end-to-end. Jangan membuat placeholder route yang terlihat operasional.

## Migration sequence

### R0 — Governance dan baseline

- `DESIGN.md` canonical;
- audit/adoption matrix;
- screenshot dan browser inventory current state;
- freeze penambahan visual pattern baru di UI lama kecuali bug/accessibility fix;
- P0.5 gates tetap regression baseline.

### R1 — Design foundation dan component lab

- sinkronkan CSS variables dari `DESIGN.md`;
- konsolidasikan font;
- tetapkan Button/Form/Dialog/Sheet/Status/Data state canonical;
- buat component lab internal/dev-only atau route test yang tidak masuk navigation production;
- uji WCAG, keyboard, mobile 360, tablet, dan desktop.

Progress awal terverifikasi:

- runtime token dan font drift dikonsolidasikan di `src/assets/main.css`;
- Button/Input default memiliki 44 px touch target;
- seluruh primitive foundation R1 tersedia, termasuk hierarchy, form controls, Select/Combobox/DatePicker, dialog reka, responsive data display, timeline, loading, status, dan data states;
- semua caller `@headlessui/vue` telah dimigrasikan ke reka dan dependency dihapus;
- component lab development-only tersedia di `/_design-system`;
- browser gate 360×800, 768×1024, dan 1366×900 lulus untuk overflow, touch target, local font, dan console;
- visual audit menilai component lab menjaga Civic Editorial tanpa glass/default card grid; R1 browser, keyboard, reduced-motion, dan authenticated finance regression gates lulus. R1 `Done`; R2 public publication experience aktif berikutnya.

### R2 — Public publication experience

**Status:** Done

- public shell/navbar/footer;
- homepage editorial;
- jadwal, transparansi, featured publication, galeri, dan contact hierarchy;
- article/documentation patterns;
- loading/fallback/error/offline states.

Shell dan homepage aktif telah diadopsi ke Civic Editorial. Data source nyata tetap hanya jadwal salat dan ringkasan kas; section kabar, galeri, dan kritik/saran sengaja merender unavailable/empty state sampai contract publish-only, privacy, dan anti-spam tersedia. Route publik tidak lagi menunggu bootstrap sesi admin. Browser gate mencakup 360×800, 768×1024, dan 1366×900, keyboard/focus/Escape mobile nav, reduced motion, local Inter, error/retry, touch target, overflow, dan console.

### R3 — Admin shell dan authentication

**Status:** In Progress

- shell/navigation/header/user actions;
- role-aware IA;
- login dan session recovery;
- mobile drawer, tablet rail, desktop sidebar.

Adoption berjalan: `LoginV2.vue` dan `AdminLayoutV2.vue` kini menjadi implementation R3 aktif tanpa route V3. Login membedakan credential/rate-limit/operational error dan memakai form primitive canonical. Shell memakai desktop sidebar + reka Sheet mobile, role-aware navigation terhadap route nyata, auth recovery, account/logout pending state, dan control 44 px. Dashboard/finance/content views tetap dimigrasikan pada phase masing-masing; shell tidak melakukan reskin business screen tersebut.

### R4 — Financial workflows

- route/screen transaksi;
- proposal create/detail;
- approval review/timeline;
- dashboard dan audit history;
- pecah `FinanceV2.vue` berdasarkan workflow tanpa memindahkan business logic ke view.

### R5 — Publication, media, organization, settings

- media/galeri/kabar/kegiatan;
- kategori/seksi/pengurus;
- akun/access;
- hapus `PengaturanLegacyBridge` setelah parity.

### R6 — Convergence dan cleanup

- hapus V2/legacy/bridge/dependency/style yang tidak dipakai;
- rename canonical tanpa version suffix;
- audit import dan duplicate primitive;
- full responsive/accessibility/role/browser regression;
- final docs dan P1.3 closure.

## Definition of done per screen

Screen belum selesai hanya karena happy path terlihat bagus. Wajib ada evidence untuk:

- mobile 360, tablet 768/1024, desktop 1366+;
- loading/skeleton;
- empty state;
- recoverable error + retry;
- permission/role state;
- disabled/submitting/pending;
- success feedback;
- conflict/stale-data state untuk mutation relevan;
- keyboard navigation, focus-visible, Escape/focus restoration;
- reduced motion;
- touch target sekitar 44×44 px;
- tidak ada horizontal document overflow;
- test/build dan browser flow terkait.

## Anti-drift rules

1. Jangan menulis warna, radius, shadow, atau transition baru di view jika token/variant canonical tersedia.
2. Jangan membuat primitive kedua untuk pattern yang sama.
3. Jangan memperkenalkan kembali Headless UI; gunakan primitive reka canonical.
4. Jangan membuat `V3` atau bridge visual baru.
5. Jangan mengadopsi legacy/V2 sebagai visual baseline.
6. Jangan menambah glassmorphism, glow, blur orb, gradient dekoratif, atau card wrapper tanpa alasan hierarchy tertulis.
7. Gold digunakan terbatas; status semantik memakai palette status.
8. Semua proposal UI harus menyebut behavior yang dipertahankan dan source composable/service-nya.
9. Review screen terhadap `DESIGN.md` sebelum dianggap siap.
10. Jika implementasi memerlukan penyimpangan, update `DESIGN.md` terlebih dahulu atau catat keputusan eksplisit pada dokumen ini; jangan membuat pengecualian diam-diam.
