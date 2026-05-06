/**
 * Tujuan: Helper permission terpusat untuk RBAC UI admin kas.
 * Caller: Komponen admin (KeuanganKas, KasLaporan, dll).
 * Dependensi: Tidak ada (pure function).
 * Main Functions: canDelete, canAccessKasInput, canApprove, canViewProposalTab.
 * Side Effects: Tidak ada.
 */

const DELETE_ALLOWED_ROLES = ["superadmin", "ketua", "bendahara"] as const;
const APPROVE_ALLOWED_ROLES = ["superadmin", "ketua", "bendahara"] as const;
const KAS_INPUT_ALLOWED_ROLES = ["superadmin", "ketua", "bendahara"] as const;
const PROPOSAL_TAB_ALLOWED_ROLES = [
  "superadmin",
  "ketua",
  "bendahara",
  "pengurus",
] as const;

export type AdminRole = (typeof PROPOSAL_TAB_ALLOWED_ROLES)[number];

const hasRole = (
  role: string | null | undefined,
  allowedRoles: readonly string[],
) => {
  if (!role) return false;
  return allowedRoles.includes(role);
};

export const canDelete = (role: string | null | undefined) =>
  hasRole(role, DELETE_ALLOWED_ROLES);

export const canApprove = (role: string | null | undefined) =>
  hasRole(role, APPROVE_ALLOWED_ROLES);

export const canAccessKasInput = (role: string | null | undefined) =>
  hasRole(role, KAS_INPUT_ALLOWED_ROLES);

export const canViewProposalTab = (role: string | null | undefined) =>
  hasRole(role, PROPOSAL_TAB_ALLOWED_ROLES);
