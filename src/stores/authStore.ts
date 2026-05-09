import { defineStore } from "pinia";
import { ref } from "vue";

// 🟢 PERBAIKAN: Definisikan tipe secara strict!
export type AuthRole = "superadmin" | "ketua" | "bendahara" | "pengurus";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);
  // 🟢 PERBAIKAN: Gunakan AuthRole, bukan sekadar string biasa
  const user = ref<{ id: number; name: string; role: AuthRole } | null>(null);
  const isReady = ref(false);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok && result.status === "success") {
        isAuthenticated.value = true;
        user.value = result.data;
        isReady.value = true;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      isAuthenticated.value = false;
      user.value = null;
    }
  };

  const checkAuth = async () => {
    if (isReady.value) return;

    try {
      const res = await fetch("/api/admin/auth/me", {
        credentials: "include",
      });

      if (res.status === 401) {
        isAuthenticated.value = false;
        user.value = null;
        return;
      }

      if (res.ok) {
        const result = await res.json();

        if (result.status === "success") {
          isAuthenticated.value = true;
          user.value = result.data;
        } else {
          isAuthenticated.value = false;
          user.value = null;
        }
      } else {
        // Non-401 (mis. 5xx) diperlakukan sebagai error operasional.
        // Auth state tidak diubah agar bug backend tidak tersamarkan sebagai logout.
        console.error("[authStore.checkAuth] Operational error:", res.status);
      }
    } catch (e) {
      // Network/runtime error diperlakukan sebagai error operasional.
      // Auth state tidak diubah agar sesi terakhir tidak ter-reset ambigu.
      console.error("[authStore.checkAuth] Network error:", e);
    } finally {
      isReady.value = true;
    }
  };

  return { isAuthenticated, user, isReady, login, logout, checkAuth };
});
