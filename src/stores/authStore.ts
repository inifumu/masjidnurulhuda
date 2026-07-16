import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AdminRole } from "../../shared/contracts/index";
import { httpClient } from "../services/httpClient.ts";

export type AuthImpersonation = {
  active: true; role: AuthRole; original_role: "superadmin"; actor_id: number;
  actor_name: string; expires_at: number;
};
type AuthUser = { id: number; name: string; role: AuthRole; impersonation?: AuthImpersonation };
type AuthSuccess = { status: "success"; data: AuthUser };

export type AuthRole = AdminRole;
export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);
  const user = ref<AuthUser | null>(null);
  const isReady = ref(false);
  const authStatus = ref<AuthStatus>("idle");
  const shouldRedirectToLogin = computed(
    () => authStatus.value === "unauthenticated",
  );
  let authRequestSequence = 0;
  let impersonationExpiryTimer: ReturnType<typeof setTimeout> | undefined;

  const clearImpersonationExpiryTimer = () => {
    if (impersonationExpiryTimer) clearTimeout(impersonationExpiryTimer);
    impersonationExpiryTimer = undefined;
  };

  const scheduleImpersonationExpiry = (session: AuthUser) => {
    clearImpersonationExpiryTimer();
    if (!session.impersonation) return;
    const delay = Math.max(0, session.impersonation.expires_at * 1000 - Date.now() - 1000);
    impersonationExpiryTimer = setTimeout(async () => {
      try {
        await httpClient("/api/admin/auth/impersonation/stop", { method: "POST" });
      } catch {
        // /me below reconciles expired or revoked sessions fail-closed.
      }
      await checkAuth(true);
    }, delay);
  };

  const login = async (email: string, password: string) => {
    const result = await httpClient<AuthSuccess>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.status !== "success" || !result.data) throw new Error("Kontrak login tidak valid.");
    isAuthenticated.value = true;
    user.value = result.data;
    scheduleImpersonationExpiry(result.data);
    isReady.value = true;
    authStatus.value = "authenticated";
    return true;
  };

  const logout = async () => {
    authRequestSequence += 1;
    clearImpersonationExpiryTimer();
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
        clearImpersonationExpiryTimer();
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
      scheduleImpersonationExpiry(result.data);
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
  const startImpersonation = async (role: Exclude<AuthRole, "superadmin">) => {
    await httpClient("/api/admin/auth/impersonation/start", { method: "POST", body: JSON.stringify({ role }) });
    await checkAuth(true);
  };
  const stopImpersonation = async () => {
    await httpClient("/api/admin/auth/impersonation/stop", { method: "POST" });
    await checkAuth(true);
  };

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
    startImpersonation,
    stopImpersonation,
  };
});
