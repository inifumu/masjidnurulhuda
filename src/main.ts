import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

async function bootstrap() {
  const app = createApp(App).use(createPinia());

  if (!/^\/admin(?:\/|$)/.test(window.location.pathname)) {
    // Public zone — load public CSS only
    await import("./publicStyles");
  }
  // Admin polos zone — no CSS at all

  app.use(router).mount("#app");
}

void bootstrap();
