# Migrasi dari Instruksi Lama

Gunakan langkah berikut di root repository.

## 1. Backup file lama

Pindahkan:

```text
optimalisasi_plan.md
→ docs/archive/optimalisasi_plan_legacy.md
```

Simpan salinan `AGENTS.md` lama hanya di archive bila masih diperlukan untuk histori.

## 2. Pasang konteks Hermes

Tambahkan `.hermes.md` ke root repository. Hermes menggunakan file ini sebagai konteks project dengan prioritas lebih tinggi daripada `AGENTS.md`.

Jangan membuat `.hermes.md` lain di root dengan aturan yang berbeda.

## 3. Ganti AGENTS.md

Ganti isi `AGENTS.md` lama dengan file baru dalam bundle ini. File tersebut dipertahankan untuk kompatibilitas AI coding agents selain Hermes.

`.hermes.md` dan `AGENTS.md` harus selalu memiliki kebijakan inti yang konsisten.

## 4. Aktifkan roadmap baru

Tambahkan `ROADMAP.md` ke root. Gunakan hanya file ini untuk:

- status improvement;
- priority;
- dependency;
- acceptance criteria;
- milestone redesign.

Jangan memindahkan progress log historis panjang ke roadmap baru.

## 5. Deprecate optimalisasi_plan.md

Gunakan stub `optimalisasi_plan.md` dari bundle ini agar agent atau developer yang membuka path lama diarahkan ke dokumen aktif.

## 6. Tambahkan playbook

Tambahkan:

```text
docs/AI_AGENT_PLAYBOOK.md
docs/README.md
docs/archive/README.md
```

Playbook berisi prosedur detail dan tidak perlu dimuat penuh pada setiap task.

## 7. Pertahankan SYSTEM_MAP.md

Gunakan `SYSTEM_MAP.md` aktual dari repository. Salinan dalam bundle berasal dari system map yang dianalisis saat dokumen ini dibuat; bila source code sudah berubah, perbarui system map berdasarkan code/test aktual.

## 8. Verifikasi

Setelah copy:

```text
root/
  .hermes.md
  AGENTS.md
  SYSTEM_MAP.md
  ROADMAP.md
  RUNBOOK.md
  optimalisasi_plan.md
  docs/
    AI_AGENT_PLAYBOOK.md
    README.md
    MIGRATION_FROM_LEGACY.md
    archive/
      README.md
      optimalisasi_plan_legacy.md
```

Pastikan:

- `.hermes.md` adalah instruksi Hermes aktif;
- `AGENTS.md` tidak memiliki aturan lama yang bertentangan;
- `optimalisasi_plan.md` hanya stub deprecated;
- roadmap aktif tidak berisi histori kosmetik panjang;
- secret dan file lokal sensitif tidak ikut di-commit.
