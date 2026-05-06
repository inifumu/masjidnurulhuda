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
        isAuthenticated.value = false;
      }
    } catch (e) {
      isAuthenticated.value = false;
    } finally {
      isReady.value = true;
    }
  };

  return { isAuthenticated, user, isReady, login, logout, checkAuth };
});
