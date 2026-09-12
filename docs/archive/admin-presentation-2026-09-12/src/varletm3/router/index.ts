import { type RouteRecordRaw } from 'vue-router'

export const varletRoutes: RouteRecordRaw[] = [
  {
    path: '/varletm3/login',
    name: 'varletm3-login',
    component: () => import('../views/VarletLogin.vue'),
    meta: { skipAuthBootstrap: true, navTitle: 'Masuk' },
  },
  {
    path: '/varletm3',
    component: () => import('../layouts/VarletShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/varletm3/dashboard' },
      { path: 'dashboard', name: 'varletm3-dashboard', component: () => import('../views/VarletDashboard.vue'), meta: { navTitle: 'Ringkasan' } },
      { path: 'keuangan/transaksi', name: 'varletm3-transactions', component: () => import('../views/VarletTransactions.vue'), meta: { navTitle: 'Transaksi', navGroup: 'Keuangan' } },
      { path: 'keuangan/transaksi-langsung', name: 'varletm3-direct', component: () => import('../views/VarletTransactions.vue'), meta: { navTitle: 'Catat kas', navGroup: 'Keuangan' } },
      { path: 'keuangan/proposal', name: 'varletm3-proposals', component: () => import('../views/VarletTransactions.vue'), meta: { navTitle: 'Proposal', navGroup: 'Keuangan' } },
      { path: 'keuangan/persetujuan', name: 'varletm3-approvals', component: () => import('../views/VarletTransactions.vue'), meta: { navTitle: 'Persetujuan', navGroup: 'Keuangan' } },
      { path: 'media', name: 'varletm3-media', component: () => import('../views/VarletMedia.vue'), meta: { navTitle: 'Pustaka media' } },
      { path: 'publikasi', name: 'varletm3-publications', component: () => import('../views/VarletPublications.vue'), meta: { navTitle: 'Publikasi' } },
      { path: 'pengaturan', component: () => import('../views/VarletSettings.vue'), redirect: '/varletm3/pengaturan/kategori-kas', meta: { navTitle: 'Pengaturan' },
        children: [
          { path: 'kategori-kas', name: 'varletm3-categories', component: () => import('../views/VarletCategories.vue'), meta: { navTitle: 'Kategori kas' } },
          { path: 'seksi-pengurus', name: 'varletm3-sections', component: () => import('../views/VarletSections.vue'), meta: { navTitle: 'Seksi & pengurus' } },
          { path: 'akun-akses', name: 'varletm3-accounts', component: () => import('../views/VarletAccounts.vue'), meta: { navTitle: 'Akun & akses' } },
        ]
      },
    ],
  },
]
