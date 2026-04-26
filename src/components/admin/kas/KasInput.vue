<script setup lang="ts">
import { ref } from "vue";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Save,
  CheckCircle,
} from "lucide-vue-next";
import { useKas } from "../../../composables/admin/useKas";
import { toast } from "vue-sonner";
import ConfirmModal from "../../ui/ConfirmModal.vue"; // 🟢 Import Custom Modal

const {
  formInput,
  filteredCategoriesInput,
  sections,
  isLoading,
  openDropdown,
  toggleDropdown,
  handleDirectInput,
  formatRupiah,
} = useKas();

const validationErrors = ref({
  kategori: false,
  jumlah: false,
  tanggal: false,
  keterangan: false,
});

// 🟢 STATE UNTUK MODAL KONFIRMASI
const isConfirmModalOpen = ref(false);
const confirmMessage = ref("");

const submitForm = async () => {
  validationErrors.value = {
    kategori: false,
    jumlah: false,
    tanggal: false,
    keterangan: false,
  };

  let hasError = false;
  if (!formInput.value.kategori_id) {
    validationErrors.value.kategori = true;
    hasError = true;
  }
  if (!formInput.value.jumlah || Number(formInput.value.jumlah) <= 0) {
    validationErrors.value.jumlah = true;
    hasError = true;
  }
  if (!formInput.value.tanggal) {
    validationErrors.value.tanggal = true;
    hasError = true;
  }
  if (!formInput.value.keterangan || formInput.value.keterangan.trim() === "") {
    validationErrors.value.keterangan = true;
    hasError = true;
  }

  if (hasError) {
    return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  }

  // Siapkan pesan dinamis untuk Modal
  const namaKategori =
    filteredCategoriesInput.value.find(
      (c) => c.id === formInput.value.kategori_id,
    )?.nama_kategori || "-";
  const nominalRp = formatRupiah(Number(formInput.value.jumlah));

  confirmMessage.value = `Anda akan menyimpan transaksi ${formInput.value.tipe.toUpperCase()} sebesar ${nominalRp} untuk kategori ${namaKategori}. Apakah data sudah benar dan ingin disimpan?`;

  isConfirmModalOpen.value = true;
};

// 🟢 EKSEKUSI SETELAH KONFIRMASI MODAL
const executeSubmit = async () => {
  isConfirmModalOpen.value = false;
  try {
    await handleDirectInput();
    toast.success("Transaksi Kas Baru berhasil disimpan!");
  } catch (error: any) {
    toast.error(error.message || "Gagal menyimpan transaksi.");
  }
};
</script>

<template>
  <div class="max-w-xl mx-auto py-4">
    <ConfirmModal
      :isOpen="isConfirmModalOpen"
      @close="isConfirmModalOpen = false"
      @confirm="executeSubmit"
      title="Simpan Transaksi Kas?"
      :message="confirmMessage"
      type="success"
      confirmText="Ya, Simpan"
    />

    <div
      class="mb-6 p-4 bg-brand-green/10 border border-brand-green/20 rounded-xl flex gap-3"
    >
      <CheckCircle :size="24" class="text-brand-green flex-shrink-0" />
      <div>
        <h4 class="text-sm font-bold text-brand-green">Jalur Cepat Kas</h4>
        <p class="text-xs text-brand-green/80 mt-1">
          Transaksi langsung disetujui. Untuk rutinitas tanpa proposal.
        </p>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="space-y-5">
      <div class="flex gap-3">
        <label
          class="flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all"
          :class="
            formInput.tipe === 'pemasukan'
              ? 'bg-brand-green/10 border-brand-green/30 text-brand-green'
              : 'bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-700'
          "
        >
          <input
            type="radio"
            v-model="formInput.tipe"
            value="pemasukan"
            class="hidden"
          />
          <ArrowUpRight :size="16" />
          <span class="text-xs font-bold uppercase tracking-wider"
            >Setoran Masuk</span
          >
        </label>
        <label
          class="flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all"
          :class="
            formInput.tipe === 'pengeluaran'
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-700'
          "
        >
          <input
            type="radio"
            v-model="formInput.tipe"
            value="pengeluaran"
            class="hidden"
          />
          <ArrowDownRight :size="16" />
          <span class="text-xs font-bold uppercase tracking-wider"
            >Keluar Dana</span
          >
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative" @click.stop>
          <label
            class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
            >Kategori</label
          >
          <div
            @click="toggleDropdown('input_kategori')"
            class="flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white dark:bg-[#0e131f] cursor-pointer transition-colors"
            :class="
              validationErrors.kategori
                ? 'border-rose-500 ring-1 ring-rose-500/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-green'
            "
          >
            <span
              class="text-sm truncate"
              :class="
                formInput.kategori_id
                  ? 'text-slate-800 dark:text-white font-medium'
                  : 'text-slate-400'
              "
            >
              {{
                filteredCategoriesInput.find(
                  (c) => c.id === formInput.kategori_id,
                )?.nama_kategori || "Pilih Kategori"
              }}
            </span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openDropdown === 'input_kategori'
                  ? 'rotate-180 text-brand-green'
                  : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openDropdown === 'input_kategori'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
            >
              <div
                v-for="cat in filteredCategoriesInput"
                :key="cat.id"
                @click="
                  formInput.kategori_id = cat.id;
                  toggleDropdown('input_kategori');
                  validationErrors.kategori = false;
                "
                class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
              >
                {{ cat.nama_kategori }}
              </div>
            </div>
          </Transition>
        </div>

        <div>
          <label
            class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
            >Tanggal</label
          >
          <div
            class="relative overflow-hidden border rounded-lg bg-white dark:bg-[#0e131f] transition-colors"
            :class="
              validationErrors.tanggal
                ? 'border-rose-500 ring-1 ring-rose-500/50'
                : 'border-slate-200 dark:border-slate-700 focus-within:border-brand-green'
            "
          >
            <input
              v-model="formInput.tanggal"
              type="date"
              @input="validationErrors.tanggal = false"
              class="w-full px-3 py-2.5 bg-transparent text-sm font-medium outline-none [color-scheme:light] dark:[color-scheme:dark] text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
            >Nominal</label
          >
          <div
            class="flex items-center border rounded-lg bg-white dark:bg-[#0e131f] transition-colors overflow-hidden"
            :class="
              validationErrors.jumlah
                ? 'border-rose-500 ring-1 ring-rose-500/50'
                : 'border-slate-200 dark:border-slate-700 focus-within:border-brand-green'
            "
          >
            <div
              class="px-3 py-2.5 text-slate-400 font-bold border-r border-slate-100 dark:border-slate-800 text-sm"
            >
              Rp
            </div>
            <input
              v-model="formInput.jumlah"
              type="number"
              placeholder="0"
              @input="validationErrors.jumlah = false"
              class="flex-1 px-3 py-2.5 bg-transparent text-sm font-bold focus:outline-none text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div class="relative" @click.stop>
          <label
            class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
            >Laporan Dari Seksi (Opsional)</label
          >
          <div
            @click="toggleDropdown('input_seksi')"
            class="flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white dark:bg-[#0e131f] cursor-pointer transition-colors border-slate-200 dark:border-slate-700 hover:border-brand-green"
          >
            <span
              class="text-sm truncate"
              :class="
                formInput.seksi_id
                  ? 'text-slate-800 dark:text-white font-medium'
                  : 'text-slate-400'
              "
            >
              {{
                sections.find((s) => s.id === formInput.seksi_id)?.nama_seksi ||
                "Pilih Seksi / Biarkan Kosong"
              }}
            </span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openDropdown === 'input_seksi'
                  ? 'rotate-180 text-brand-green'
                  : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openDropdown === 'input_seksi'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
            >
              <div
                @click="
                  formInput.seksi_id = null;
                  toggleDropdown('input_seksi');
                "
                class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800"
              >
                -- Kosongkan Seksi --
              </div>
              <div
                v-for="s in sections"
                :key="String(s.id)"
                @click="
                  formInput.seksi_id = s.id;
                  toggleDropdown('input_seksi');
                "
                class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
              >
                {{ s.nama_seksi }}
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div>
        <label
          class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
          >Keterangan Ringkas</label
        >
        <textarea
          v-model="formInput.keterangan"
          rows="2"
          placeholder="Contoh: Beli konsumsi pengajian..."
          @input="validationErrors.keterangan = false"
          class="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-[#0e131f] text-sm font-medium outline-none resize-none transition-colors text-slate-800 dark:text-white"
          :class="
            validationErrors.keterangan
              ? 'border-rose-500 ring-1 ring-rose-500/50'
              : 'border-slate-200 dark:border-slate-700 focus:border-brand-green'
          "
        ></textarea>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <Save v-if="!isLoading" :size="18" />
        <div
          v-else
          class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        Simpan Transaksi
      </button>
    </form>
  </div>
</template>
