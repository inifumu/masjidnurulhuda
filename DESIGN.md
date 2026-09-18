# Design Admin — Papan Amanah Operasional

## Status aktif

Papan Amanah Operasional disetujui pada 13 September 2026 untuk implementasi admin, dengan dial `ENERGY 2 / RHYTHM 2 / MOTION 1`.

- Stack: Vue 3, Tailwind CSS v4, shadcn-vue dari registry `reka-maia`, dan CSS variables.
- Identitas: emerald sebagai warna tindakan; yellow-gold hanya untuk perhatian terkendali.
- Font: Outfit untuk UI. JetBrains Mono hanya untuk nominal, tanggal, waktu, ID, dan kode state.
- Ikon: `lucide-vue-next` saat ikon mempercepat pengenalan; aksi penting tetap berlabel teks.
- `src/assets/theme.css` adalah sumber global absolut dan immutable untuk nilai theme. Jangan menduplikasi, override, atau meregenerasi nilainya.
- Personalisasi Maia bersama: Card memakai radius visual terhitung `16px` melalui utility proyek; Input memakai `bg-transparent shadow-xs`; Button outline/neutral memakai `bg-background hover:bg-accent hover:text-accent-foreground`; Button primary tetap primary Maia. Personalisasi Card hanya berlaku pada Card; geometry dan state Sidebar, SidebarInset, serta DropdownMenu tetap dimiliki grammar `reka-maia` exact. Shell tidak memaksa target `44px`, border aktif, `aria-current`, atau radius/shadow lokal pada inset.
- Theme admin dapat dipilih terang atau gelap dari tombol di sisi kanan header konteks. Preferensi hanya berlaku pada dokumen `/admin/*`, disimpan lokal di browser, dan kunjungan pertama mengikuti preferensi sistem. Website publik tidak ikut berubah. Tidak ada V3, alternate shell, capability palsu, editor/publikasi palsu, persistensi galeri, atau placement Inventaris.

## Implementasi saat ini

- Foundation dan Login Concept A selesai: desktop memakai split Panel Amanah, mobile memakai satu kolom.
- Shell sidebar memakai komposisi `sidebar-08` dengan submenu collapsible route-level dan logo berlatar putih; tombol theme admin berada di sisi kanan header konteks memakai Button neutral `reka-maia`.
- Pengaturan, Media, Publikasi, Keuangan, dan Dashboard masih pending, dikerjakan route-by-route sesuai urutan implementasi.
- Backend, session/RBAC, audit, idempotency, dan lifecycle media tetap regression contract. Perubahan presentasi tidak mengubah otoritas backend.

Detail keputusan ada di [spec Papan Amanah](docs/superpowers/specs/2026-09-13-admin-papan-amanah-design.md) dan [implementation plan](docs/superpowers/plans/2026-09-13-admin-papan-amanah-implementation.md). Dokumen ini adalah brief desain kanonik aktif; jangan menggandakan spec lengkap di sini.
