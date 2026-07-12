import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 🟢 ROUTE PUBLIK (Menggunakan PublicLayout)
    {
      path: "/",
      component: () => import("../layouts/PublicLayout.vue"),
      children: [
        {
          path: "",
          name: "home",
          component: () => import("../views/public/Home.vue"),
        },
      ],
    },
    // 🟢 ROUTE LOGIN
    {
      path: "/admin/login",
      name: "admin-login",
      component: () => import("../views/admin/LoginV2.vue"),
    },
    // 🟢 ROUTE ADMIN
    {
      path: "/admin",
      component: () => import("../layouts/AdminLayoutV2.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: "/admin/dashboard" },
        {
          path: "dashboard",
          name: "admin-dashboard",
          component: () => import("../views/admin/DashboardV2.vue"),
        },
        {
          path: "finance",
          name: "admin-finance",
          component: () => import("../views/admin/FinanceV2.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "pengaturan",
          name: "AdminPengaturan",
          component: () => import("../views/admin/PengaturanV2.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "media",
          name: "admin-media-library",
          component: () => import("../views/admin/MediaLibrary.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "galeri-dokumentasi",
          name: "admin-galeri-dokumentasi",
          component: () => import("../views/admin/GaleriDokumentasi.vue"),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
});

// 🟢 ASYNC GUARD: Satpam yang sabar menunggu Hono menjawab
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Tunggu pengecekan sesi ke backend selesai
  await authStore.checkAuth();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return "/admin/login";
  }

  if (to.path === "/admin/login" && authStore.isAuthenticated) {
    return "/admin/dashboard";
  }
});

export default router;
