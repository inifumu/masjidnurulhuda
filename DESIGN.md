---
version: alpha
name: Nurul Huda Civic Editorial
description: Mobile-first warm minimalist editorial design with institutional data UI, emerald identity, and restrained gold accent.
colors:
  emerald-950: "#063D2D"
  emerald-800: "#0B5D43"
  emerald-700: "#0B6B4B"
  emerald-100: "#DDF3E8"
  emerald-50: "#EFF9F4"
  gold-700: "#8A6412"
  gold-500: "#D6A62E"
  gold-100: "#FBECC0"
  gold-50: "#FFF8E5"
  ink-950: "#17211C"
  ink-700: "#3F5047"
  ink-500: "#66766E"
  warm-50: "#F7F7F2"
  surface: "#FFFFFF"
  border: "#DCE4DE"
  danger: "#B42318"
  danger-soft: "#FEE4E2"
  success: "#067647"
  success-soft: "#D1FADF"
  warning: "#9A6700"
  warning-soft: "#FEF0C7"
  info: "#175CD3"
  info-soft: "#D1E9FF"
typography:
  display:
    fontFamily: Inter Variable
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  h1:
    fontFamily: Inter Variable
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  h2:
    fontFamily: Inter Variable
    fontSize: 1.75rem
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h3:
    fontFamily: Inter Variable
    fontSize: 1.25rem
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: Inter Variable
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.005em"
  body-md:
    fontFamily: Inter Variable
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  body-sm:
    fontFamily: Inter Variable
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: Inter Variable
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
  overline:
    fontFamily: Inter Variable
    fontSize: 0.75rem
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.emerald-700}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.emerald-800}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.emerald-800}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  button-gold:
    backgroundColor: "{colors.gold-500}"
    textColor: "{colors.ink-950}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-950}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.md}"
    padding: 16px
---

## Overview

Nurul Huda Civic Editorial adalah arah desain final untuk seluruh situs publik dan panel admin. Gaya utamanya adalah warm modern minimalism dan editorial web design; admin menambahkan institutional data UI yang jelas dan presisi. Desain V2 dan legacy hanya menjadi referensi behavior, bukan referensi visual.

Situs publik harus terasa seperti pusat informasi, dokumentasi, dan pelayanan komunitas masjid. Admin harus terasa sebagai workspace operasional dari produk yang sama—lebih padat, tetapi memakai token, primitive, dan bahasa interaksi yang sama.

Referensi prinsip, bukan template untuk disalin:

- Apple Newsroom: featured publication dan dokumentasi foto;
- GOV.UK: hierarchy informasi dan accessibility;
- Notion: kenyamanan baca;
- Wise: penggunaan green identity dan financial clarity;
- Shopify Polaris: struktur admin untuk pengguna non-teknis;
- IBM Carbon: konsistensi form, data, status, dan accessibility.

## Colors

Emerald adalah identitas, navigasi aktif, focus ring, dan primary action. Gold adalah accent terbatas untuk satu CTA pilihan, highlight editorial, tanggal, atau detail brand. Gold bukan warna default semua tombol dan bukan pengganti warna warning.

Warna status selalu semantik:

- success untuk approved/completed;
- warning untuk pending;
- danger untuk rejected/void/destructive;
- info untuk informasi netral;
- status tidak boleh bergantung pada warna saja.

Background utama memakai warm-50 dan surface putih. Border lebih dominan daripada shadow. Gradient, glow, blur orb, dan translucent glass bukan elemen default.

## Typography

Gunakan satu keluarga font: Inter Variable yang sudah terpasang melalui `@fontsource-variable/inter`. Hapus import Google Fonts Geist saat implementasi foundation agar tidak ada network font dan font drift.

Public content menggunakan hierarchy editorial dan line length 65–75 karakter untuk artikel. Admin menggunakan skala yang sama dengan density lebih rapat. Angka finansial memakai tabular numerals. Hindari uppercase tracking lebar untuk label biasa; overline hanya untuk metadata singkat.

## Layout

Mobile 360 px adalah baseline keputusan, bukan versi kecil desktop.

- Mobile: satu kolom; touch target minimal 44×44 px; filter kompleks melalui drawer/sheet; tabel menjadi mobile data cards; primary mutation action boleh sticky jika tidak menutupi konten.
- Tablet 768–1023 px: layout dua kolom selektif; navigation menjadi rail/drawer; list-detail dapat memakai split view; jangan memaksa tabel lebar.
- Desktop 1024 px+: admin sidebar + workspace; public reading width dibatasi; ruang tambahan digunakan untuk konteks, timeline, dan detail, bukan card kosong.
- Container publik maksimal sekitar 1200–1280 px; article reading measure maksimal 75ch.
- Satu primary action per screen/section. Secondary actions tidak boleh bersaing secara visual.

Bento hanya dipakai ketika hierarchy data benar-benar terbantu. Card bukan default wrapper untuk setiap section. Public layout mengutamakan komposisi editorial foto, headline, list, dan whitespace.

### Makna corrective redesign

Ketika user menolak suatu bagian dan meminta **desain ulang**, jangan mempertahankan komposisi yang sama lalu hanya mengganti primitive, radius, border, spacing, label, atau warna. Desain ulang wajib mengevaluasi ulang task utama, hierarchy, grouping, urutan baca, progressive disclosure, responsive interaction, dan hubungan control terhadap hasil. Untuk filter kompleks finance, buat komposisi baru yang task-oriented dan buktikan saat tertutup maupun dropdown/sheet terbuka pada mobile, tablet, dan desktop. Green test mekanis tidak boleh mengalahkan penolakan visual user.

## Elevation & Depth

Gunakan border halus sebagai pemisah utama. Shadow hanya untuk overlay, popover, sticky surface, atau elemen yang benar-benar berada di atas surface lain. Tidak ada full glassmorphism, neumorphism, glow dekoratif, atau shadow warna brand berulang.

Glass/blur hanya boleh muncul secara kontekstual pada overlay media dengan contrast yang terverifikasi; tidak untuk form, table, finance, navigation utama, atau page header.

## Shapes

Radius moderat dan konsisten. Jangan membuat semua elemen pill. Pill hanya untuk badge, compact filter chip, atau status. Foto editorial dapat memakai radius lg; input/button memakai sm; panel memakai md atau lg.

Motif geometris Islami boleh digunakan sangat halus sebagai texture atau separator dengan opacity rendah. Motif tidak boleh mengurangi keterbacaan atau muncul pada setiap card.

## Components

Fondasi canonical:

- Vue 3 + TypeScript;
- Tailwind CSS v4 dan CSS variables;
- shadcn-vue dengan primitive reka-ui;
- lucide-vue-next untuk icon;
- vue-sonner untuk toast;
- vee-validate + Zod untuk form;
- Pinia hanya untuk state global; composable untuk feature state;
- VueUse bila mengurangi utility custom yang sudah terbukti.

Kebijakan komponen:

1. Primitive reusable berada di `src/components/ui` dan menggunakan reka/shadcn sebagai dasar.
2. Komponen domain berada di folder fitur (`public`, `admin/finance`, `admin/content`, `admin/settings`).
3. Headless UI tidak boleh dipakai. `ConfirmModal.vue` dan `TransactionAuditDialog.vue` telah dimigrasikan ke primitive reka, dan dependency `@headlessui/vue` telah dihapus pada closure R1.
4. Jangan membuat primitive kedua untuk fungsi yang sudah dimiliki canonical primitive.
5. View menyusun screen; business logic tetap di composable/service.
6. Desktop table dan mobile card berbagi DTO/content formatter, bukan dua business implementations.
7. Loading, empty, error+retry, permission, pending, success, conflict, dan stale state adalah bagian contract screen.
8. Focus-visible, Escape, focus restoration, reduced motion, semantic label/error, dan keyboard navigation wajib.

Komponen canonical yang harus tersedia sebelum migrasi screen besar: Button, IconButton, FormField, Input, Textarea, CurrencyInput, Select/Combobox, DatePicker, Dialog, AlertDialog, Drawer/Sheet, Badge, StatusIndicator, PageHeader, SectionHeader, Metric, DataTable, MobileDataCard, FilterBar, Timeline, Skeleton, EmptyState, ErrorState, PermissionState, dan ConflictState.

## Do's and Don'ts

Do:

- gunakan emerald sebagai identitas dan gold secara hemat;
- mulai tiap screen pada 360 px lalu validasi tablet dan desktop;
- pakai satu primitive dan state contract untuk pola yang sama;
- utamakan hierarchy informasi dan kenyamanan baca;
- pertahankan P0.5 browser E2E sebagai regression gate;
- ganti route aktif secara terkontrol setelah parity, tanpa membuat V3;
- hapus bridge/legacy hanya setelah caller, parity, test, build, dan browser gate lulus.

Don't:

- meniru legacy atau V2 sebagai baseline visual;
- menambah V3, bridge baru, compatibility wrapper visual baru, atau business logic duplikat;
- memakai glassmorphism, blur orb, gradient, atau card grid sebagai dekorasi default;
- memperkenalkan kembali Headless UI atau mencampurnya dengan reka;
- hardcode warna/radius/shadow berulang di view;
- memakai gold untuk warning, destructive, atau setiap CTA;
- menyembunyikan aksi penting hanya pada hover;
- memaksa tabel desktop menjadi horizontal-scroll sebagai solusi utama mobile;
- mengubah backend policy, RBAC, audit, idempotency, atau state machine demi menyesuaikan UI.
