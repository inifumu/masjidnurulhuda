import { computed, ref } from "vue";

type AdminViewTransition = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => AdminViewTransition;
};

export type AdminShellTheme = "sanggar" | "lentera" | "gapura";
export type SanggarNavigationMode = "expanded" | "collapsed";

export const adminShellThemes: Array<{
  value: AdminShellTheme;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: "sanggar", label: "Sanggar", icon: "pi pi-th-large", description: "Sidebar penuh dan ruang kerja yang tenang." },
  { value: "lentera", label: "Lentera", icon: "pi pi-sparkles", description: "Canvas-first dengan dock navigasi mengambang." },
  { value: "gapura", label: "Gapura", icon: "pi pi-bars", description: "Kanvas lebar dengan navigasi off-canvas tersembunyi." },
];

const storageKey = "nurul-huda-admin-shell-v2";
const sanggarModeStorageKey = "nurul-huda-sanggar-navigation";
const validThemes = new Set<AdminShellTheme>(["sanggar", "lentera", "gapura"]);
const storedTheme = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
const storedSanggarMode = typeof window !== "undefined" ? window.localStorage.getItem(sanggarModeStorageKey) : null;
const activeAdminShell = ref<AdminShellTheme>(
  storedTheme && validThemes.has(storedTheme as AdminShellTheme)
    ? (storedTheme as AdminShellTheme)
    : "lentera",
);
const sanggarNavigationMode = ref<SanggarNavigationMode>(storedSanggarMode === "collapsed" ? "collapsed" : "expanded");
let fallbackThemeTransitionSequence = 0;
let fallbackThemeAnimation: Animation | null = null;

const applyTheme = (value: AdminShellTheme) => {
  if (typeof document !== "undefined") document.documentElement.dataset.adminShell = value;
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, value);
};

const applySanggarNavigationMode = (value: SanggarNavigationMode) => {
  if (typeof document !== "undefined") document.documentElement.dataset.adminSanggar = value;
  if (typeof window !== "undefined") window.localStorage.setItem(sanggarModeStorageKey, value);
};

const runFallbackThemeTransition = (commitTheme: () => void) => {
  const surface = document.querySelector<HTMLElement>(".admin-prime-root, .admin-login");
  if (!surface || typeof surface.animate !== "function") {
    commitTheme();
    return;
  }

  const sequence = ++fallbackThemeTransitionSequence;
  let themeCommitted = false;
  fallbackThemeAnimation?.cancel();
  const outgoing = surface.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.992)" },
    ],
    { duration: 120, easing: "ease-in", fill: "forwards" },
  );
  fallbackThemeAnimation = outgoing;

  void outgoing.finished.then(() => {
    if (sequence !== fallbackThemeTransitionSequence) return;
    commitTheme();
    themeCommitted = true;
    outgoing.cancel();

    const incoming = surface.animate(
      [
        { opacity: 0, transform: "scale(1.008)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    fallbackThemeAnimation = incoming;
    return incoming.finished;
  }).then(() => {
    if (sequence !== fallbackThemeTransitionSequence) return;
    fallbackThemeAnimation?.cancel();
    fallbackThemeAnimation = null;
  }).catch(() => {
    if (sequence !== fallbackThemeTransitionSequence) return;
    if (!themeCommitted) commitTheme();
    fallbackThemeAnimation?.cancel();
    fallbackThemeAnimation = null;
  });
};

applyTheme(activeAdminShell.value);
applySanggarNavigationMode(sanggarNavigationMode.value);

export const useAdminShellTheme = () => {
  const activeShellMeta = computed(
    () => adminShellThemes.find((theme) => theme.value === activeAdminShell.value) ?? adminShellThemes[1],
  );

  const setAdminShell = (value: AdminShellTheme) => {
    if (value === activeAdminShell.value) return;

    const commitTheme = () => {
      activeAdminShell.value = value;
      applyTheme(value);
    };

    if (typeof document === "undefined" || typeof window === "undefined") {
      commitTheme();
      return;
    }

    const transitionDocument = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!transitionDocument.startViewTransition || reduceMotion) {
      if (reduceMotion) commitTheme();
      else runFallbackThemeTransition(commitTheme);
      return;
    }

    const transition = transitionDocument.startViewTransition(commitTheme);
    void transition.finished.catch(() => undefined);
  };

  const setSanggarNavigationMode = (value: SanggarNavigationMode) => {
    sanggarNavigationMode.value = value;
    applySanggarNavigationMode(value);
  };

  const toggleSanggarNavigationMode = () => {
    setSanggarNavigationMode(sanggarNavigationMode.value === "expanded" ? "collapsed" : "expanded");
  };

  return {
    activeAdminShell,
    activeShellMeta,
    adminShellThemes,
    sanggarNavigationMode,
    setAdminShell,
    setSanggarNavigationMode,
    toggleSanggarNavigationMode,
  };
};
