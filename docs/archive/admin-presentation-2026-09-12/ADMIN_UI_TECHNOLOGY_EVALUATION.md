> SUPERSEDED: histori saja, bukan donor visual atau keputusan aktif. Lihat ../../revamp/ADMIN_FUNCTIONAL_RESET.md.

# Keputusan Teknologi UI — Revamp Admin

**Status:** `PASS` — PrimeVue 5 ditetapkan pengguna pada 4 Agustus 2026 untuk visual exploration dan target implementation; migrasi production belum dimulai.

## 1. Koreksi Prinsip

Revamp admin tidak akan memakai kombinasi primitive, utility styling framework, icon library, form UI library, dan kumpulan komponen dari sumber berbeda.

Target arsitektur:

```text
Vue application runtime
→ satu UI component framework
→ satu theme/design-token system framework tersebut
→ feature screen
```

Bukan:

```text
Tailwind + shadcn-vue + Reka UI + Lucide + CVA + utility component lokal
```

Tujuannya adalah satu bahasa visual, satu anatomy komponen, satu sistem state, satu sumber icon, satu theme contract, dan satu pola responsive yang koheren.

## 2. Framework UI yang Ditetapkan: PrimeVue 5

Framework yang dipilih pengguna adalah **PrimeVue 5 Styled Mode**.

Vue 3, TypeScript, Vite, Vue Router, dan Pinia tetap berfungsi sebagai runtime aplikasi, routing, dan state management. Mereka bukan UI/component framework dan tidak menciptakan campuran visual.

PrimeVue menjadi satu-satunya framework UI untuk revamp:

- form controls;
- button dan action;
- select, autocomplete, multiselect, date picker, input number, toggle, checkbox, radio;
- menu, drawer, popover, tooltip, dialog, confirmation;
- card, panel, tabs, accordion, divider, badge, tag, message;
- data table, pagination, filtering, sorting, tree/table bila benar-benar diperlukan;
- upload/progress/media-oriented controls;
- toast dan feedback;
- loading/skeleton;
- responsive component behavior;
- icon set melalui ekosistem Prime;
- design tokens, semantic tokens, component tokens, dark-mode selector, dan theme preset.

## 3. Alasan PrimeVue Paling Sesuai

### Dibanding Vuetify

Vuetify lengkap dan koheren, tetapi berakar kuat pada Material Design. Preferensi revamp meminta identitas modern, ringan, ramah, flat, thin-border, soft-shadow, dan brand masjid yang tidak otomatis terasa Material. Menghilangkan rasa Material dari seluruh anatomy Vuetify berpotensi menjadi pekerjaan override besar.

### Dibanding Quasar

Quasar juga sangat lengkap, tetapi merupakan application framework yang lebih luas: CLI, build modes, layout ecosystem, utilities, dan platform targets. Project sudah memiliki runtime Vite/Cloudflare yang stabil. Mengadopsi Quasar secara penuh akan memperluas migrasi dari UI menjadi perubahan application framework dan build architecture, padahal kebutuhan utama adalah konsistensi component system.

### Keunggulan PrimeVue untuk project ini

- native untuk Vue dan dapat dipasang ke runtime Vite current tanpa mengganti backend/build architecture;
- cakupan komponen cukup luas untuk admin operasional;
- Styled Mode menyediakan satu arsitektur token, bukan kumpulan styling lepas;
- semantic dan component tokens memungkinkan identity emerald/gold yang konsisten;
- tidak mengunci hasil akhir ke Material Design;
- DataTable, paginator, form controls, overlay, feedback, dan upload berada dalam satu keluarga;
- cocok untuk migrasi screen-by-screen sambil tetap berakhir pada satu framework tunggal.

## 4. Aturan Single-Framework

Pada implementation revamp:

- semua komponen UI interaktif berasal dari PrimeVue;
- semua icon UI berasal dari icon system yang dipilih dalam ekosistem PrimeVue;
- semua visual state memakai theme/token PrimeVue yang disetujui;
- tidak membuat wrapper generik yang menduplikasi API PrimeVue tanpa kebutuhan domain nyata;
- custom CSS hanya untuk composition layar dan extension yang tidak tersedia sebagai token/component option;
- tidak memasukkan component library kedua untuk menutup satu kekurangan kecil;
- jika PrimeVue tidak memiliki pola tertentu, evaluasi native HTML/CSS terlebih dahulu, bukan menambah framework baru;
- feature component boleh dibuat, tetapi harus tersusun dari komponen PrimeVue dan token theme yang sama.

## 5. Dependency UI Lama yang Akan Dicabut

Target removal setelah replacement screen terkait tersedia dan lolos gate:

- `reka-ui`;
- `shadcn-vue`;
- `lucide-vue-next`;
- `class-variance-authority`;
- `clsx` bila tidak memiliki consumer non-UI;
- `tailwind-merge`;
- `tw-animate-css`;
- `tailwindcss`;
- `@tailwindcss/vite`;
- komponen shadcn/reka current di `src/components/ui/`;
- import theme shadcn/Tailwind dan animation khusus Reka di `src/assets/main.css`;
- `vue-sonner` setelah seluruh consumer feedback pindah ke PrimeVue Toast/Message;
- icon dan UI utility lama setelah seluruh consumer diganti.

`VeeValidate`, `Zod`, dan `@vueuse/core` harus diaudit berdasarkan consumer non-presentation:

- bila hanya menopang UI lama dan fungsi setara dapat ditangani dengan mekanisme PrimeVue/native application, dependency dicabut;
- bila masih digunakan untuk schema/domain validation atau orchestration nonvisual yang nyata, keputusan removal dipisahkan dari konsistensi visual;
- tidak ada dependency dipertahankan hanya karena sudah terpasang.

Audit awal menemukan sekitar 282 referensi import ke stack UI/support current serta import Tailwind, shadcn theme, dan animation Reka di `src/assets/main.css`. Karena current production masih menggunakannya, uninstall langsung sekarang akan merusak build. Removal dilakukan berdasarkan consumer graph, bukan sekadar menghapus package manifest terlebih dahulu.

## 6. Strategi Removal Tanpa Membuat Dua Sistem Permanen

Koeksistensi sementara hanya migration mechanism, bukan arsitektur final.

Urutan:

1. Bekukan penambahan komponen baru dari stack lama.
2. Buat satu theme PrimeVue untuk prototype direction yang terpilih.
3. Implementasikan halaman sesuai urutan resmi.
4. Setiap halaman yang berpindah tidak boleh lagi mengimpor primitive/library UI lama.
5. Setelah consumer terakhir suatu dependency hilang, uninstall dependency tersebut segera.
6. Setelah seluruh admin pindah, audit public site untuk consumer tersisa.
7. Hapus `src/components/ui/` lama hanya setelah tidak memiliki caller.
8. Cabut Tailwind plugin/import setelah seluruh class consumer yang masih aktif telah dimigrasikan.
9. Jalankan clean install, typecheck, test, build, browser E2E, dan dependency audit.

Tidak akan ada bridge visual baru atau component wrapper yang mempertahankan rupa lama.

## 7. Plan Desain dengan PrimeVue

### Fase A — Brief dan semantic requirements

Tetap membuat:

- `ADMIN_VISUAL_EXPLORATION_BRIEF.md`;
- `ADMIN_SEMANTIC_REQUIREMENTS.md`.

Framework tidak boleh menentukan personality sebelum brief selesai.

### Fase B — Tiga visual direction

Tiga direction tetap berbeda pada identity, hierarchy, navigation stance, composition, density feel, dan responsive transformation.

Untuk menghindari bias default framework, sketch awal dibuat sebagai standalone artifact. PrimeVue belum digunakan sebagai donor visual dan preset bawaan tidak dianggap direction.

### Fase C — Pemilihan direction

Pengguna memilih satu direction atau menolak semuanya berdasarkan render nyata.

### Fase D — Translasi direction ke satu PrimeVue theme

Setelah direction dipilih:

- pilih satu preset teknis hanya sebagai base token graph, bukan sebagai rupa final;
- buat satu custom preset project;
- definisikan primitive, semantic, dan component tokens;
- tetapkan emerald, gold, neutral, semantic feedback, typography, radius, border, elevation, density, focus, dan motion;
- uji komponen dalam satu foundation specimen PrimeVue;
- pastikan seluruh komponen terasa satu keluarga;
- minta approval design-system pengguna.

### Fase E — Component coverage specimen

Foundation harus memperlihatkan komponen PrimeVue yang benar-benar diperlukan:

- Button dan action hierarchy;
- InputText, Textarea, InputNumber;
- Select/Autocomplete/MultiSelect;
- DatePicker atau period control;
- ToggleSwitch, Checkbox, RadioButton;
- Tag/Badge/Message/Toast;
- Card/Panel/Tabs/Accordion;
- Dialog/Drawer/Popover/Tooltip/ConfirmDialog;
- Menu/navigation candidates;
- DataTable, paginator, filters, responsive row alternative;
- FileUpload/progress/media states;
- Skeleton, empty, error, permission, conflict, retry, disabled, submitting, success.

Satu specimen ini menjadi gate konsistensi sebelum screen production.

### Fase F — Implementation serial

1. Login;
2. shell admin;
3. Pengaturan;
4. Galeri;
5. Keuangan;
6. Dashboard terakhir.

Setiap halaman memiliki gate:

- visual approval;
- tidak ada import UI stack lama pada slice baru;
- responsive dan accessibility check;
- behavior/RBAC/security regression;
- test dan build.

## 8. Batas Keputusan Saat Ini

Keputusan persiapan saat ini:

- **satu UI framework:** PrimeVue;
- **mode:** Styled Mode dengan satu custom project theme;
- **tidak menggunakan:** Reka UI, shadcn-vue, Tailwind, Lucide, Sonner, atau component framework lain pada target architecture;
- **removal:** wajib, bertahap berdasarkan consumer agar build tidak sengaja dipatahkan;
- **prototype lokal:** PrimeVue `5.0.0` dan PrimeUIX theme `3.0.0` telah divalidasi pada shell laboratory di `.hermes/admin-revamp-experiments/framework-spike/primevue`;
- **kandidat pembanding:** spike Nuxt UI telah dihapus setelah keputusan pengguna;
- **belum dilakukan:** install PrimeVue atau uninstall dependency pada production source, karena shell direction dan design system belum disetujui.

Jika prototyping lanjutan menemukan blocker faktual yang membuat PrimeVue tidak dapat mencapai direction terpilih secara koheren tanpa override berlebihan, blocker tersebut harus kembali ke user gate. Framework kedua tidak boleh ditambahkan sebagai tambalan.
