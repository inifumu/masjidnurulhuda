# AGENTS.md

ATURAN NAVIGASI, KONTEKS & OPTIMASI
TECH STACK: Vue.js + Tailwind CSS + Hono.js

## 1. Mandatory Context Check

Sebelum menganalisis, mengedit, atau membuat fitur baru, baca file berikut di root proyek jika tersedia:

1. `SYSTEM_MAP.md`
2. `optimalisasi_plan.md`

Gunakan kedua file tersebut sebagai kompas utama. Jangan melakukan blind scan seluruh repository jika informasi target sudah tersedia.

Jika salah satu file tidak ditemukan, lanjutkan dengan analisis minimal dan tulis `Not found` pada catatan kerja.

## 2. Trace-by-Flow Workflow

Gunakan workflow `trace-by-function` / `trace-by-flow`.

Urutan pelacakan utama:

User Action / Vue Component
-> State / Composables / API Client
-> Hono Route
-> Hono Handler / Service
-> Repository / Query
-> Database / External API / Queue

Prioritaskan entrypoint berikut:

- Vue: `main.ts`, `main.js`, router, layout utama, composables utama
- Hono: `index.ts`, `app.ts`, route registry, handler utama

Jangan membaca file besar secara penuh kecuali benar-benar diperlukan. Untuk file lebih dari 500 baris, baca blok fungsi/class terkait saja.

## 3. Universal Exclusions

Abaikan folder dan file berikut kecuali diminta eksplisit:

- `node_modules`
- `.venv`, `venv`, `env`
- `vendor`
- `target`
- `.gradle`
- `bin`, `obj`, `pkg`
- `.git`
- `.vscode`
- `.idea`
- `__pycache__`
- `dist`
- `build`
- `tmp`
- `coverage`
- `.next`
- `.nuxt`
- `.cache`
- `.output`
- `*.log`
- `*.lock`
- `*.min.*`
- `*.map`

Gunakan search command hanya secara terarah. `rg` boleh dipakai untuk mencari simbol/path tertentu, tetapi jangan dipakai untuk scan liar tanpa tujuan.

## 4. Pre-Edit Trace Note

Sebelum menulis atau mengubah kode, tampilkan catatan singkat:

- file target yang akan disentuh
- alur fungsi yang terlibat
- alasan perubahan

Format singkat:

`Trace: [Vue Component] -> [API Client] -> [Hono Route] -> [Service/Repository]. Target edit: path/file.`

## 5. Editing Rules

- Jangan ubah struktur besar di luar request tanpa meminta izin.
- Perubahan kecil boleh dilakukan jika langsung terkait dengan bug/fitur.
- Pecah logika kompleks ke:
  - Vue: composables, reusable components, atau utils
  - Hono: handler, service/usecase, repository/query
- Jangan menulis ulang file besar jika hanya perlu patch kecil.
- Hindari perubahan kosmetik massal yang tidak diminta.

## 6. Header Documentation

Setiap file baru atau file yang diubah secara signifikan wajib memiliki header doc singkat di bagian atas file, jika gaya proyek memungkinkan.

Isi header doc:

- Tujuan file
- Caller / pemanggil utama
- Dependensi penting
- Main functions
- Side effects

Jika file existing tidak memakai header dan perubahan hanya kecil, jangan paksa refactor besar. Tambahkan header hanya jika aman dan tidak mengganggu style proyek.

## 7. Documentation Sync

Jika mengubah flow utama aplikasi, update `SYSTEM_MAP.md`.

Jika menyelesaikan item optimasi, update status di `optimalisasi_plan.md`.

Jika menemukan code smell, performa lambat, re-render tidak perlu di Vue, N+1 query di Hono, query berat, atau class Tailwind redundan, catat sebagai item baru di `optimalisasi_plan.md`.

## 8. Database & Query Standard

Untuk perubahan DB-heavy:

- Minimalkan I/O
- Perhatikan selectivity filter
- Perhatikan index
- Hindari N+1 query
- Evaluasi strategi join
- Hindari lock contention yang tidak perlu

Sebelum finalize, jelaskan singkat:

- alasan efisiensi
- trade-off
- risiko performa yang dihindari

## 9. Output Style

Gunakan Bahasa Indonesia untuk penjelasan.

Jangan menyalin kode panjang ke jawaban jika tidak perlu.

Ringkas, teknis, dan mudah dipindai.

Jika data tidak ditemukan, tulis `Not found`, jangan berasumsi.
