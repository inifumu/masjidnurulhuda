# Project Rules

## Scope
- Tech stack utama: Vue + Tailwind + Hono.
- Fokus pada perubahan yang diminta user; hindari refactor besar di luar scope.

## Mandatory Context Check
Sebelum analisis/edit/fitur baru:
1. Baca `SYSTEM_MAP.md` jika ada.
2. Baca `.hermes.md` dan `ROADMAP.md` untuk prioritas aktif.
3. Untuk UI/UX, baca `DESIGN.md` dan `docs/UI_UX_REDESIGN_AUDIT.md`.
Jika tidak ada, lanjut dengan analisis minimal dan tandai `Not found`.

## Trace-by-Flow Workflow
Gunakan alur:
User Action / Vue Component
-> State / Composables / API Client
-> Hono Route
-> Hono Handler / Service
-> Repository / Query
-> Database / External API / Queue

Prioritas entrypoint:
- Vue: `main.ts|main.js`, router, layout utama, composables utama
- Hono: `index.ts`, `app.ts`, route registry, handler utama

Untuk file besar (>500 baris), baca hanya blok terkait.

## Search & Exclusions
Abaikan kecuali diminta eksplisit:
`node_modules`, `.git`, `.vscode`, `.idea`, `dist`, `build`, `coverage`, `.cache`, `.next`, `.nuxt`, `tmp`, `*.log`, `*.lock`, `*.min.*`, `*.map`, `.venv`, `venv`, `env`, `vendor`, `target`, `.gradle`, `bin`, `obj`, `pkg`, `__pycache__`, `.output`.

Gunakan pencarian terarah berdasarkan simbol/path target, bukan scan liar.

## Pre-Edit Trace Note
Sebelum edit, tampilkan catatan singkat:
`Trace: [Vue Component] -> [API Client] -> [Hono Route] -> [Service/Repository]. Target edit: path/file.`

## Editing Rules
- Jangan ubah struktur besar tanpa izin.
- Patch kecil langsung boleh jika relevan dengan bug/fitur.
- Jangan rewrite file besar jika cukup patch lokal.
- Hindari perubahan kosmetik massal.
- Untuk perubahan kompleks, pecah logika ke composables/components/utils (Vue) atau handler/service/repository (Hono).

## Full UI/UX Redesign Direction

- Full redesign memakai `DESIGN.md`; legacy/V2 bukan visual baseline.
- Pertahankan emerald brand dan restrained yellow-gold accent.
- Gunakan Tailwind v4 + shadcn-vue/reka; jangan menambah Headless UI, V3, bridge visual, atau primitive duplikat.
- Mulai dari 360 px dan validasi tablet+desktop; pertahankan seluruh behavior/RBAC/P0.5 gates.

## Documentation Sync
Jika flow utama berubah:
- Update `SYSTEM_MAP.md`.
Jika scope/status improvement berubah, update `ROADMAP.md`. Jika kontrak visual berubah, update `DESIGN.md` sebelum implementasi menyimpang.

## DB & Query Standard
Untuk perubahan DB-heavy:
- Minimalkan I/O.
- Hindari N+1.
- Evaluasi index, selectivity, join strategy.
- Hindari lock contention tidak perlu.

Saat finalize, jelaskan singkat: alasan efisiensi, trade-off, risiko yang dihindari.

## Response Style
- Gunakan Bahasa Indonesia.
- Istilah teknis tetap English.
- Ringkas, teknis, mudah dipindai.
- Jika data tidak ditemukan: tulis `Not found` (jangan asumsi).
