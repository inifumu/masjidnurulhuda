# Dokumentasi untuk AI Agents

## File aktif

- `.hermes.md` — konteks utama Hermes Agent; prioritas tertinggi.
- `AGENTS.md` — kompatibilitas untuk AI coding agent lain.
- `SYSTEM_MAP.md` — peta arsitektur, flow, modul, RBAC, data, dan integrasi aktual.
- `ROADMAP.md` — backlog improvement aktif.
- `DESIGN.md` — kontrak visual canonical Nurul Huda Civic Editorial.
- `docs/UI_UX_REDESIGN_AUDIT.md` — audit/adoption matrix, urutan migrasi, dan anti-drift redesign.
- `docs/AI_AGENT_PLAYBOOK.md` — prosedur kerja rinci, quality gate, dan template laporan.
- `RUNBOOK.md` — deployment, migration, backup, restore, incident, dan secret operation.

## File deprecated

- `optimalisasi_plan.md` hanya berisi pemberitahuan deprecated.
- Histori lama dipindahkan ke `docs/archive/optimalisasi_plan_legacy.md`.

## Cara penggunaan

Hermes Agent akan memilih `.hermes.md` lebih dahulu. Agent lain yang mendukung standar repository instructions dapat membaca `AGENTS.md`.

Jaga file konteks utama tetap ringkas. Detail operasional dan backlog harus berada di file terpisah agar tidak menyebabkan context bloat atau konflik instruksi.
