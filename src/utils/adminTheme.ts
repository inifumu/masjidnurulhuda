import { ref } from "vue"

export type AdminTheme = "light" | "dark"

export const ADMIN_THEME_STORAGE_KEY = "admin-theme"

function preferredTheme(): AdminTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function storedTheme(): AdminTheme | null {
  try {
    const value = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    return value === "dark" || value === "light" ? value : null
  } catch {
    return null
  }
}

function updateDocument(theme: AdminTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

export function resolveAdminTheme(): AdminTheme {
  return storedTheme() ?? preferredTheme()
}

const adminTheme = ref<AdminTheme>("light")

export function applyAdminTheme() {
  const theme = resolveAdminTheme()
  adminTheme.value = theme
  updateDocument(theme)
  return theme
}

export function useAdminTheme() {
  function initialize() {
    adminTheme.value = applyAdminTheme()
  }

  function setTheme(theme: AdminTheme) {
    adminTheme.value = theme
    updateDocument(theme)
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
    } catch {
      // Browser privacy settings may block storage; the active document still updates.
    }
  }

  return {
    theme: adminTheme,
    initialize,
    setTheme,
  }
}
