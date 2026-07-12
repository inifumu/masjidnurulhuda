// Header Doc:
// Tujuan: Bootstrap aplikasi Vue dan registrasi provider global (Pinia, Router) + styling runtime.
// Caller: Entry point frontend Vite.
// Dependensi: Vue, Pinia, Vue Router, Tailwind global CSS, vue-sonner stylesheet, font Inter.
// Main Functions: createApp(), app.use(), app.mount().
// Side Effects: Mengaktifkan provider global app serta style global aplikasi.
import "@fontsource-variable/inter";
import "vue-sonner/style.css";
import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount("#app");
