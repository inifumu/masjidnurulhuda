import { ref, onMounted } from "vue";

export function useTheme() {
  const isDark = ref(false);

  const initTheme = () => {
    // Cek apakah sebelumnya udah milih dark mode, atau settingan laptopnya emang dark
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      isDark.value = true;
      document.documentElement.classList.add("dark");
    } else {
      isDark.value = false;
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    if (isDark.value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  onMounted(() => {
    initTheme();
  });

  return { isDark, toggleTheme };
}
