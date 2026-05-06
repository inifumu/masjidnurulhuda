<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  Settings,
  Tags,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  AlertCircle,
  UserPlus,
  ChevronDown,
} from "lucide-vue-next";

// 1. Panggil "Mesin" State & Logic
import { usePengaturan } from "../../composables/admin/usePengaturan";

// 2. Panggil Komponen UI (Atomic Design)
import TabKategori from "../../components/admin/pengaturan/TabKategori.vue";
import TabSeksi from "../../components/admin/pengaturan/TabSeksi.vue";
import TabAkun from "../../components/admin/pengaturan/TabAkun.vue";
import ConfirmModal from "../../components/ui/ConfirmModal.vue";

const {
  activeTab,
  isLoading,
  errorMessage,
  kategoriList,
  seksiList,
  akunList,
  isModalOpen,
  modalMode,
  formData,
  openDropdown,
  toggleDropdown,
  closeDropdowns,
  openModal,
  closeModal,
  saveItem,
  deleteItem,
  addPengurusInput,
  removePengurusInput,
} = usePengaturan();

// Event listener tutup dropdown kalau klik di luar
onMounted(() => document.addEventListener("click", closeDropdowns));
onUnmounted(() => document.removeEventListener("click", closeDropdowns));

// STATE & LOGIC UNTUK MODAL HAPUS
const isDeleteModalOpen = ref(false);
const itemToDelete = ref<number | null>(null);

const confirmDelete = (id: number) => {
  itemToDelete.value = id;
  isDeleteModalOpen.value = true;
};

const executeDelete = async () => {
  if (itemToDelete.value) {
    await deleteItem(itemToDelete.value);
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
  }
};
</script>

<template>
  <div class="space-y-6 pb-20 max-w-7xl mx-auto">
    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      @close="isDeleteModalOpen = false"
      @confirm="executeDelete"
      title="Hapus Data?"
      message="Data yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?"
      type="danger"
      confirmText="Ya, Hapus Data"
    />

    <div>
      <h2
        class="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2"
      >
        <Settings class="text-brand-green" :size="24" /> Pengaturan Sistem
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Kelola data master dan konfigurasi aplikasi Masjid Nurul Huda.
      </p>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <div class="w-full md:w-64 flex-shrink-0">
        <div
          class="bg-white dark:bg-[#121826] rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex flex-col gap-1"
        >
          <button
            @click="activeTab = 'kategori'"
            :class="
              activeTab === 'kategori'
                ? 'bg-brand-green/10 text-brand-green font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            "
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left"
          >
            <Tags :size="18" /> Kategori Kas
          </button>
          <button
            @click="activeTab = 'seksi'"
            :class="
              activeTab === 'seksi'
                ? 'bg-brand-green/10 text-brand-green font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            "
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left"
          >
            <Users :size="18" /> Seksi Pengurus
          </button>
          <div
            class="my-1 border-t border-slate-100 dark:border-slate-800"
          ></div>
          <button
            @click="activeTab = 'akun'"
            :class="
              activeTab === 'akun'
                ? 'bg-brand-green/10 text-brand-green font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            "
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left"
          >
            <ShieldCheck :size="18" /> Akun & Hak Akses
          </button>
        </div>
      </div>

      <div
        class="flex-1 bg-white dark:bg-[#121826] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]"
      >
        <div
          v-if="errorMessage"
          class="m-6 p-4 bg-rose-50 border rounded-lg flex items-start gap-3 text-rose-600"
        >
          <AlertCircle :size="18" />
          <p class="text-xs">{{ errorMessage }}</p>
        </div>

        <div v-if="!errorMessage" class="p-6 flex flex-col h-full">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="font-bold text-slate-800 dark:text-white">
                {{
                  activeTab === "akun"
                    ? "Manajemen Akun & Hak Akses"
                    : activeTab === "kategori"
                      ? "Master Kategori Kas"
                      : "Master Seksi Pengurus"
                }}
              </h3>
              <p class="text-xs text-slate-500">
                Kelola data {{ activeTab }} sistem.
              </p>
            </div>

            <button
              @click="openModal('add')"
              class="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <component
                :is="activeTab === 'akun' ? UserPlus : Plus"
                :size="16"
              />
              {{
                activeTab === "akun"
                  ? "Buat Akun"
                  : "Tambah " +
                    (activeTab === "kategori" ? "Kategori" : "Seksi")
              }}
            </button>
          </div>

          <TabKategori
            v-if="activeTab === 'kategori'"
            :data="kategoriList"
            :isLoading="isLoading"
            @edit="openModal('edit', $event)"
            @delete="confirmDelete"
          />
          <TabSeksi
            v-else-if="activeTab === 'seksi'"
            :data="seksiList"
            :isLoading="isLoading"
            @edit="openModal('edit', $event)"
            @delete="confirmDelete"
          />
          <TabAkun
            v-else-if="activeTab === 'akun'"
            :data="akunList"
            :isLoading="isLoading"
            @edit="openModal('edit', $event)"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <Transition name="fade-slide">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div
          @click="closeModal"
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        ></div>

        <div
          class="relative w-full max-w-md bg-white dark:bg-[#121826] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0"
          >
            <h3
              class="font-bold text-slate-800 dark:text-white flex items-center gap-2"
            >
              {{ modalMode === "add" ? "Tambah Data Baru" : "Edit Data" }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <X :size="20" />
            </button>
          </div>

          <div
            class="p-5"
            :class="
              activeTab === 'seksi' ? 'overflow-y-auto' : 'overflow-visible'
            "
          >
            <div v-if="activeTab !== 'akun'">
              <label
                class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                >Nama
                {{ activeTab === "kategori" ? "Kategori" : "Seksi" }}</label
              >
              <input
                v-model="formData.nama"
                type="text"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-green focus:ring-0 focus:ring-brand-green/15 transition-all"
                :class="activeTab === 'seksi' ? 'mb-4' : ''"
              />

              <div
                v-if="activeTab === 'kategori'"
                class="mt-4 mb-2 relative"
                @click.stop
              >
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Jenis Arus Kas</label
                >
                <div
                  @click="toggleDropdown('jenis_arus')"
                  class="flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none cursor-pointer hover:border-brand-green transition-colors"
                >
                  <span class="font-medium text-slate-800 dark:text-slate-200">
                    {{
                      formData.jenis_arus === "pemasukan"
                        ? "Pemasukan (Uang Masuk)"
                        : formData.jenis_arus === "pengeluaran"
                          ? "Pengeluaran (Uang Keluar)"
                          : "General (Umum / Koreksi)"
                    }}
                  </span>
                  <ChevronDown
                    :size="14"
                    class="text-slate-400"
                    :class="
                      openDropdown === 'jenis_arus'
                        ? 'rotate-180 text-brand-green'
                        : ''
                    "
                  />
                </div>
                <Transition name="fade-slide">
                  <div
                    v-if="openDropdown === 'jenis_arus'"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden"
                  >
                    <div
                      @click="
                        formData.jenis_arus = 'pemasukan';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Pemasukan (Uang Masuk)
                    </div>
                    <div
                      @click="
                        formData.jenis_arus = 'pengeluaran';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Pengeluaran (Uang Keluar)
                    </div>
                    <div
                      @click="
                        formData.jenis_arus = 'general';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      General (Umum / Koreksi)
                    </div>
                  </div>
                </Transition>
              </div>

              <div v-if="activeTab === 'seksi'">
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Susunan Pengurus</label
                >
                <div class="space-y-2 mb-3">
                  <div
                    v-for="(_, index) in formData.nama_pengurus_list"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="formData.nama_pengurus_list[index]"
                      type="text"
                      placeholder="Nama..."
                      class="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-green focus:ring-0 focus:ring-brand-green/15 transition-all"
                    />
                    <button
                      v-if="formData.nama_pengurus_list.length > 1"
                      @click="removePengurusInput(index)"
                      class="p-2.5 text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </div>
                <button
                  @click="addPengurusInput"
                  class="w-full py-2.5 text-xs font-medium text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-lg flex justify-center items-center gap-1 transition-colors"
                >
                  <Plus :size="14" /> Tambah Kolom
                </button>
              </div>
            </div>

            <div v-if="activeTab === 'akun'" class="space-y-4">
              <div>
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Nama Lengkap</label
                >
                <input
                  v-model="formData.nama"
                  type="text"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-green focus:ring-0 focus:ring-brand-green/15 transition-all"
                />
              </div>
              <div v-if="modalMode === 'add'">
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Email</label
                >
                <input
                  v-model="formData.email"
                  type="email"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-green focus:ring-0 focus:ring-brand-green/15 transition-all"
                />
              </div>
              <div v-if="modalMode === 'add'">
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Password</label
                >
                <input
                  v-model="formData.password"
                  type="password"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-green focus:ring-0 focus:ring-brand-green/15 transition-all"
                />
              </div>

              <div class="relative" @click.stop>
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                  >Role Akses</label
                >
                <div
                  @click="toggleDropdown('role')"
                  class="flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none cursor-pointer hover:border-brand-green transition-colors"
                >
                  <span
                    class="font-medium capitalize text-slate-800 dark:text-slate-200"
                    >{{ formData.role }}</span
                  >
                  <ChevronDown
                    :size="14"
                    class="text-slate-400"
                    :class="
                      openDropdown === 'role'
                        ? 'rotate-180 text-brand-green'
                        : ''
                    "
                  />
                </div>
                <Transition name="fade-slide">
                  <div
                    v-if="openDropdown === 'role'"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden"
                  >
                    <div
                      @click="
                        formData.role = 'pengurus';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Pengurus
                    </div>
                    <div
                      @click="
                        formData.role = 'ketua';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Ketua
                    </div>
                    <div
                      @click="
                        formData.role = 'bendahara';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Bendahara
                    </div>
                    <div
                      @click="
                        formData.role = 'superadmin';
                        closeDropdowns();
                      "
                      class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
                    >
                      Superadmin
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <div
            class="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 rounded-b-xl"
          >
            <button
              @click="closeModal"
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              @click="saveItem"
              :disabled="isLoading"
              class="px-4 py-2 text-sm bg-brand-green text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <span
                v-if="isLoading"
                class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
              ></span>
              Simpan Data
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
