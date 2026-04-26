// Header Doc:
// Tujuan: Bootstrap aplikasi Vue dan registrasi styling global runtime.
// Caller: Entry point frontend Vite.
// Dependensi: Pinia, Vue Router, Tailwind global CSS, vue-sonner stylesheet.
// Main Functions: createApp(), app.use(), app.mount().
// Side Effects: Mengaktifkan provider global app dan style notifikasi toast.
import "@fontsource-variable/inter"; // Import font inter native
import "vue-sonner/style.css";
import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia"; // Tambahkan ini
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia(); // Inisiasi Pinia

app.use(pinia); // Gunakan Pinia SEBELUM router
app.use(router);
app.mount("#app");
