import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

// Cross the public/admin boundary with a new document so public CSS cannot leak.
const documentScope = (path: string) => /^\/admin(?:\/|$)/.test(path) ? "admin" : "public";
const currentDocumentScope = documentScope(window.location.pathname);

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 🟢 ROUTE PUBLIK (Menggunakan PublicLayout)
    {
      path: "/",
      component: () => import("../layouts/PublicLayout.vue"),
      meta: { skipAuthBootstrap: true },
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
          meta: { navTitle: "Ringkasan" },
        },
        {
          path: "finance",
          name: "admin-finance",
          component: () => import("../views/admin/FinanceV2.vue"),
          meta: { requiresAuth: true, navGroup: "Keuangan", navTitle: "Keuangan" },
          redirect: { name: "admin-finance-transactions" },
          children: [
            { path: "transaksi", name: "admin-finance-transactions", component: () => import("../views/admin/finance/TransactionsView.vue"), meta: { navGroup: "Keuangan", navTitle: "Transaksi" } },
            { path: "transaksi-langsung", name: "admin-finance-direct-transaction", component: () => import("../views/admin/finance/DirectTransactionView.vue"), meta: { navGroup: "Keuangan", navTitle: "Catat kas", roles: ["superadmin", "ketua", "bendahara"] } },
            { path: "proposal", name: "admin-finance-proposals", component: () => import("../views/admin/finance/ProposalsView.vue"), meta: { navGroup: "Keuangan", navTitle: "Proposal" } },
            { path: "persetujuan", name: "admin-finance-approvals", component: () => import("../views/admin/finance/ApprovalsView.vue"), meta: { navGroup: "Keuangan", navTitle: "Persetujuan", roles: ["superadmin", "ketua", "bendahara"] } },
            { path: "riwayat-audit", name: "admin-finance-audit", component: () => import("../views/admin/finance/AuditHistoryView.vue"), meta: { navGroup: "Keuangan", navTitle: "Riwayat audit", roles: ["superadmin", "ketua"] } },
          ],
        },
        {
          path: "pengaturan",
          component: () => import("../layouts/AdminSettingsLayout.vue"),
          meta: { requiresAuth: true, roles: ["superadmin", "ketua"], navGroup: "Pengaturan" },
          redirect: { name: "admin-settings-cash-categories" },
          children: [
            {
              path: "kategori-kas",
              name: "admin-settings-cash-categories",
              component: () => import("../views/admin/settings/KategoriKasView.vue"),
              meta: { navGroup: "Pengaturan", navTitle: "Kategori kas", roles: ["superadmin", "ketua"] },
            },
            {
              path: "seksi-pengurus",
              name: "admin-settings-sections",
              component: () => import("../views/admin/settings/SeksiPengurusView.vue"),
              meta: { navGroup: "Pengaturan", navTitle: "Seksi & pengurus", roles: ["superadmin", "ketua"] },
            },
            {
              path: "akun-akses",
              name: "admin-settings-accounts",
              component: () => import("../views/admin/settings/AkunAksesView.vue"),
              meta: { navGroup: "Pengaturan", navTitle: "Akun & akses", roles: ["superadmin"] },
            },
          ],
        },
        {
          path: "publikasi",
          component: () => import("../views/admin/PublicationsView.vue"),
          meta: { navGroup: "Publikasi", navTitle: "Publikasi" },
          children: [
            { path: "", redirect: "/admin/publikasi/kabar-masjid" },
            { path: "kabar-masjid", component: () => import("../views/admin/PublicationUnavailable.vue"), props: { title: "Kabar masjid" }, meta: { navGroup: "Publikasi", navTitle: "Kabar masjid" } },
            { path: "kegiatan", component: () => import("../views/admin/PublicationUnavailable.vue"), props: { title: "Kegiatan" }, meta: { navGroup: "Publikasi", navTitle: "Kegiatan" } },
            { path: "kritik-saran", component: () => import("../views/admin/PublicationUnavailable.vue"), props: { title: "Kritik & saran" }, meta: { navGroup: "Publikasi", navTitle: "Kritik & saran" } },
          ],
        },
        {
          path: "media",
          name: "admin-media-library",
          component: () => import("../views/admin/MediaLibrary.vue"),
          meta: { requiresAuth: true, navGroup: "Media", navTitle: "Pustaka media" },
        },
        {
          path: "galeri-dokumentasi",
          name: "admin-galeri-dokumentasi",
          component: () => import("../views/admin/GaleriDokumentasi.vue"),
          meta: { requiresAuth: true, navGroup: "Media", navTitle: "Galeri & dokumentasi" },
        },
      ],
    },
  ],
});

// 🟢 ASYNC GUARD: Satpam yang sabar menunggu Hono menjawab
router.beforeEach(async (to) => {
  if (documentScope(to.path) !== currentDocumentScope) {
    window.location.assign(to.fullPath);
    return false;
  }
  if (to.meta.skipAuthBootstrap) return;



  const authStore = useAuthStore();

  // Tunggu pengecekan sesi ke backend selesai
  await authStore.checkAuth();


  if (to.meta.requiresAuth && authStore.shouldRedirectToLogin) {
    return "/admin/login";
  }

  const allowedRoles = Array.isArray(to.meta.roles) ? to.meta.roles as string[] : undefined;
  const adminLandingPath = "/admin/dashboard";
  if (authStore.isAuthenticated && allowedRoles && authStore.user && !allowedRoles.includes(authStore.user.role)) {
    return adminLandingPath;
  }

  if (to.path === "/admin/login" && authStore.isAuthenticated) {
    return adminLandingPath;
  }
});

export default router;
