<script setup lang="ts">
import { ref } from "vue";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ClipboardList,
} from "lucide-vue-next";
import { useKas } from "../../../composables/admin/useKas";
import { toast } from "vue-sonner";
import ConfirmModal from "../../ui/ConfirmModal.vue"; // 🟢 Import Custom Modal

const {
  formProposal,
  filteredCategoriesProposal,
  sections,
  methods,
  isLoading,
  openDropdown,
  toggleDropdown,
  handleProposal,
  formatRupiah,
} = useKas();

const validationErrors = ref({
  kategori: false,
  seksi: false,
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
    seksi: false,
    jumlah: false,
    tanggal: false,
    keterangan: false,
  };

  let hasError = false;
  if (!formProposal.value.kategori_id) {
    validationErrors.value.kategori = true;
    hasError = true;
  }
  if (!formProposal.value.seksi_id) {
    validationErrors.value.seksi = true;
    hasError = true;
  }
  if (!formProposal.value.jumlah || Number(formProposal.value.jumlah) <= 0) {
    validationErrors.value.jumlah = true;
    hasError = true;
  }
  if (!formProposal.value.tanggal) {
    validationErrors.value.tanggal = true;
    hasError = true;
  }
  if (
    !formProposal.value.keterangan ||
    formProposal.value.keterangan.trim() === ""
  ) {
    validationErrors.value.keterangan = true;
    hasError = true;
  }

  if (hasError) {
    return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  }

  const namaKategori =
    filteredCategoriesProposal.value.find(
      (c) => c.id === formProposal.value.kategori_id,
    )?.nama_kategori || "-";
  const namaSeksi =
    sections.value.find((s) => s.id === formProposal.value.seksi_id)
      ?.nama_seksi || "-";
  const nominalRp = formatRupiah(Number(formProposal.value.jumlah));

  confirmMessage.value = `Anda akan mengajukan proposal dana sebesar ${nominalRp} untuk keperluan ${namaKategori} (Seksi: ${namaSeksi}). Lanjutkan pengajuan?`;

  isConfirmModalOpen.value = true;
};

// 🟢 EKSEKUSI SETELAH KONFIRMASI MODAL
const executeSubmit = async () => {
  isConfirmModalOpen.value = false;
  try {
    await handleProposal();
    toast.success(
      "Proposal berhasil diajukan dan masuk ke antrean persetujuan!",
    );
  } catch (error: any) {
    toast.error(error.message || "Gagal mengajukan proposal.");
  }
};
</script>

<template>
  <div class="max-w-xl mx-auto py-4">
    <ConfirmModal
      :isOpen="isConfirmModalOpen"
      @close="isConfirmModalOpen = false"
      @confirm="executeSubmit"
      title="Ajukan Proposal?"
      :message="confirmMessage"
      type="success"
      confirmText="Ya, Ajukan"
    />

    <div
      class="mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex gap-3"
    >
      <ClipboardList :size="24" class="text-slate-500 flex-shrink-0" />
      <div>
        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">
          Pengajuan Proposal
        </h4>
        <p class="text-xs text-slate-500 mt-1">
          Anggaran masuk antrean verifikasi Ketua/Bendahara.
        </p>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="space-y-5">
      <div class="flex gap-3">
        <label
          class="flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all"
          :class="
            formProposal.tipe === 'pemasukan'
              ? 'bg-brand-green/10 border-brand-green/30 text-brand-green'
              : 'bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-700'
          "
        >
          <input
            type="radio"
            v-model="formProposal.tipe"
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
            formProposal.tipe === 'pengeluaran'
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-700'
          "
        >
          <input
            type="radio"
            v-model="formProposal.tipe"
            value="pengeluaran"
            class="hidden"
          />
          <ArrowDownRight :size="16" />
          <span class="text-xs font-bold uppercase tracking-wider"
            >Minta Dana</span
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
            @click="toggleDropdown('prop_kategori')"
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
                formProposal.kategori_id
                  ? 'text-slate-800 dark:text-white font-medium'
                  : 'text-slate-400'
              "
            >
              {{
                filteredCategoriesProposal.find(
                  (c) => c.id === formProposal.kategori_id,
                )?.nama_kategori || "Pilih Kategori"
              }}
            </span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openDropdown === 'prop_kategori'
                  ? 'rotate-180 text-brand-green'
                  : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openDropdown === 'prop_kategori'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
            >
              <div
                v-for="cat in filteredCategoriesProposal"
                :key="cat.id"
                @click="
                  formProposal.kategori_id = cat.id;
                  toggleDropdown('prop_kategori');
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
            >Tanggal Kegiatan</label
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
              v-model="formProposal.tanggal"
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
            >Estimasi Nominal</label
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
              v-model="formProposal.jumlah"
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
            >Metode Penerimaan</label
          >
          <div
            @click="toggleDropdown('prop_metode')"
            class="flex items-center justify-between px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0e131f] cursor-pointer hover:border-brand-green transition-colors"
          >
            <span class="text-sm font-medium">{{
              methods.find((m) => m.id === formProposal.metode)?.name
            }}</span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openDropdown === 'prop_metode'
                  ? 'rotate-180 text-brand-green'
                  : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openDropdown === 'prop_metode'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1"
            >
              <div
                v-for="m in methods"
                :key="m.id"
                @click="
                  formProposal.metode = m.id;
                  toggleDropdown('prop_metode');
                "
                class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium"
              >
                {{ m.name }}
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div class="relative" @click.stop>
        <label
          class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
          >Seksi Pengaju</label
        >
        <div
          @click="toggleDropdown('prop_seksi')"
          class="flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white dark:bg-[#0e131f] cursor-pointer transition-colors"
          :class="
            validationErrors.seksi
              ? 'border-rose-500 ring-1 ring-rose-500/50'
              : 'border-slate-200 dark:border-slate-700 hover:border-brand-green'
          "
        >
          <span
            class="text-sm truncate"
            :class="
              formProposal.seksi_id
                ? 'text-slate-800 dark:text-white font-medium'
                : 'text-slate-400'
            "
          >
            {{
              sections.find((s) => s.id === formProposal.seksi_id)
                ?.nama_seksi || "Wajib Pilih Seksi"
            }}
          </span>
          <ChevronDown
            :size="14"
            class="text-slate-400"
            :class="
              openDropdown === 'prop_seksi' ? 'rotate-180 text-brand-green' : ''
            "
          />
        </div>
        <Transition name="fade-slide">
          <div
            v-if="openDropdown === 'prop_seksi'"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
          >
            <div
              v-for="s in sections"
              :key="String(s.id)"
              @click="
                formProposal.seksi_id = s.id;
                toggleDropdown('prop_seksi');
                validationErrors.seksi = false;
              "
              class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
            >
              {{ s.nama_seksi }}
            </div>
          </div>
        </Transition>
      </div>

      <div>
        <label
          class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
          >Rincian Keperluan</label
        >
        <textarea
          v-model="formProposal.keterangan"
          rows="3"
          placeholder="Jelaskan secara detail untuk apa dana ini..."
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
        class="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <ClipboardList v-if="!isLoading" :size="18" />
        <div
          v-else
          class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        Ajukan Proposal
      </button>
    </form>
  </div>
</template>
