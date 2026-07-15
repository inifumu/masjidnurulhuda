import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AdminRole } from "../../shared/contracts/index";

export type AuthRole = AdminRole;
export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);
  const user = ref<{ id: number; name: string; role: AuthRole } | null>(null);
  const isReady = ref(false);
  const authStatus = ref<AuthStatus>("idle");
  const shouldRedirectToLogin = computed(
    () => authStatus.value === "unauthenticated",
  );
  let authRequestSequence = 0;

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
        authStatus.value = "authenticated";
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
      isReady.value = true;
      authStatus.value = "unauthenticated";
    }
  };

  const checkAuth = async (force = false) => {
    if (
      !force &&
      (authStatus.value === "authenticated" ||
        authStatus.value === "unauthenticated")
    ) {
      return;
    }

    const request = ++authRequestSequence;
    authStatus.value = "loading";
    try {
      const res = await fetch("/api/admin/auth/me", {
        credentials: "include",
      });
      if (request !== authRequestSequence) return;

      if (res.status === 401) {
        isAuthenticated.value = false;
        user.value = null;
        authStatus.value = "unauthenticated";
        return;
      }

      if (!res.ok) {
        authStatus.value = "error";
        console.error("[authStore.checkAuth] Operational error:", res.status);
        return;
      }

      const result = await res.json();
      if (result.status !== "success" || !result.data) {
        authStatus.value = "error";
        return;
      }

      isAuthenticated.value = true;
      user.value = result.data;
      authStatus.value = "authenticated";
    } catch (error) {
      if (request !== authRequestSequence) return;
      authStatus.value = "error";
      console.error("[authStore.checkAuth] Network error:", error);
    } finally {
      if (request === authRequestSequence) {
        isReady.value =
          authStatus.value === "authenticated" ||
          authStatus.value === "unauthenticated";
      }
    }
  };

  const retryAuth = () => checkAuth(true);

  return {
    isAuthenticated,
    user,
    isReady,
    authStatus,
    shouldRedirectToLogin,
    login,
    logout,
    checkAuth,
    retryAuth,
  };
});
